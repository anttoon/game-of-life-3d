import * as THREE from 'three';
import { gsap } from 'gsap';
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js';
import { MarchingCubes } from 'three/examples/jsm/objects/MarchingCubes.js';

/**
 * BlobVisualizer class that renders Game of Life cells as cute 3D blobs
 */
export class BlobVisualizer {
  constructor(game, blobSettings, colors) {
    this.game = game;
    this.blobSettings = blobSettings;
    this.colors = colors;
    
    this.object = new THREE.Group();
    this.object.position.y = 0.5; // Slightly above the petri dish
    
    this.blobs = [];
    this.blobsMap = {}; // For quick lookup
    this.organismGroups = []; // Track groups of connected cells
    this.pendingChanges = null; // For storing next generation changes
    this.isAnimating = false; // Track if animation is in progress
    
    this.metaballsMap = new Map(); // Map to track metaballs for each organism
    
    this.noise = new SimplexNoise();
    this.clock = new THREE.Clock();
    
    this.initMaterials();
    this.createBlobs();
  }
  
  initMaterials() {
    // Create a cute blob material with subsurface scattering-like effect
    this.blobMaterial = new THREE.MeshPhysicalMaterial({
      color: this.colors.primary,
      roughness: 0.2,
      metalness: 0.0,
      transmission: 0.95, // Glass-like transparency
      thickness: 0.5,     // Controls how much the material refracts light
      clearcoat: 1.0,     // Add a clear coat for a candy-like shine
      clearcoatRoughness: 0.1
    });
    
    // Create a color array for variation
    this.blobColors = [
      this.colors.primary,
      this.colors.secondary, 
      this.colors.accent,
      0xc88fff, // Purple
      0x98ff8f, // Green
      0xe6c19c  // Light brown/tan like in the example
    ];
    
    // Create a pool of materials for different organism groups
    this.materialPool = this.blobColors.map(color => {
      const material = this.blobMaterial.clone();
      material.color = new THREE.Color(color);
      return material;
    });
  }
  
  createBlobs() {
    // Clear existing blobs
    while(this.object.children.length > 0) { 
      this.object.remove(this.object.children[0]); 
    }
    
    this.blobs = [];
    this.blobsMap = {};
    this.metaballsMap.clear();
    
    const gridSize = this.game.size;
    const cellSize = 1;  // Size of each cell in world units
    const halfGrid = (gridSize * cellSize) / 2;
    
    const grid = this.game.grid;
    
    // First, create all blobs without connections
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        if (grid[y][x] === 1) {
          const blob = this.createBlob(x, y, gridSize, cellSize, halfGrid);
          this.blobs.push(blob);
          this.blobsMap[`${x},${y}`] = blob;
          this.object.add(blob.group);
        }
      }
    }
    
    // Then identify organism groups and assign colors
    this.identifyOrganismGroups();
    
    // Create a metaball representation for each organism
    this.createMetaballOrganisms();
  }
  
  createBlob(x, y, gridSize, cellSize, halfGrid, visible = true) {
    // Position in world space
    const worldX = (x * cellSize) - halfGrid + cellSize/2;
    const worldZ = (y * cellSize) - halfGrid + cellSize/2;
    
    // Create a group to hold the blob
    const group = new THREE.Group();
    group.position.set(worldX, 0, worldZ);
    
    // Randomize blob properties for variety
    const radius = THREE.MathUtils.randFloat(
      this.blobSettings.minRadius, 
      this.blobSettings.maxRadius
    );
    
    // Use a simple small sphere for position tracking
    // (The actual rendering will be done by metaballs)
    const trackerGeometry = new THREE.SphereGeometry(0.1, 4, 4);
    const trackerMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xffffff,
      transparent: true,
      opacity: 0.0 // Invisible tracker
    });
    
    const mesh = new THREE.Mesh(trackerGeometry, trackerMaterial);
    mesh.visible = visible;
    
    // Add wobble animation data
    mesh.userData.wobbleSpeed = THREE.MathUtils.randFloat(1, 3);
    mesh.userData.wobbleAmplitude = THREE.MathUtils.randFloat(0.05, 0.1);
    mesh.userData.originalScale = radius;
    mesh.userData.phase = Math.random() * Math.PI * 2;
    
    group.add(mesh);
    
    // If creating an invisible blob for pending changes,
    // start with a tiny scale
    if (!visible) {
      mesh.scale.set(0.01, 0.01, 0.01);
    }
    
    // Store grid coordinates and metadata for later use
    return {
      group,
      mesh,
      x,
      y,
      radius,
      worldX,
      worldZ,
      organismId: -1,
      isNew: !visible
    };
  }
  
  identifyOrganismGroups() {
    // Reset organism groups
    this.organismGroups = [];
    let currentOrganismId = 0;
    
    // Create a temporary map to keep track of visited cells
    const visited = {};
    
    // For each blob
    this.blobs.forEach(blob => {
      const key = `${blob.x},${blob.y}`;
      
      // Skip if already visited
      if (visited[key]) return;
      
      // This is a new organism, do a breadth-first search to find all connected cells
      const organism = {
        id: currentOrganismId,
        blobs: [],
        // Assign a random color from our palette
        color: this.blobColors[currentOrganismId % this.blobColors.length]
      };
      
      // BFS queue
      const queue = [blob];
      visited[key] = true;
      
      while (queue.length > 0) {
        const currentBlob = queue.shift();
        
        // Add to current organism
        organism.blobs.push(currentBlob);
        currentBlob.organismId = currentOrganismId;
        
        // Check neighbors
        const { x, y } = currentBlob;
        
        // Check 8 surrounding cells
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue; // Skip self
            
            const nx = (x + dx + this.game.size) % this.game.size;
            const ny = (y + dy + this.game.size) % this.game.size;
            const neighborKey = `${nx},${ny}`;
            
            // If neighbor exists and hasn't been visited
            if (this.blobsMap[neighborKey] && !visited[neighborKey]) {
              queue.push(this.blobsMap[neighborKey]);
              visited[neighborKey] = true;
            }
          }
        }
      }
      
      // Add organism to collection
      this.organismGroups.push(organism);
      currentOrganismId++;
    });
  }
  
  createMetaballOrganisms() {
    // Clear existing metaballs
    this.metaballsMap.forEach((metaball) => {
      if (metaball.object && metaball.object.parent) {
        metaball.object.parent.remove(metaball.object);
      }
    });
    this.metaballsMap.clear();
    
    // Create a metaball object for each organism
    this.organismGroups.forEach(organism => {
      if (organism.blobs.length === 0) return;
      
      // Create a new MarchingCubes object for this organism
      const resolution = 48; // Higher for smoother
      const isolation = 1.5;
      
      const metaball = new MarchingCubes(
        resolution,
        new THREE.MeshPhysicalMaterial({
          color: new THREE.Color(organism.color),
          roughness: 0.1,
          metalness: 0.0,
          transmission: 0.85,
          thickness: 0.5,
          clearcoat: 1.0, 
          clearcoatRoughness: 0.1,
          side: THREE.DoubleSide
        }),
        true, // useColors
        true, // withLight
        false // withHelper
      );
      
      // Position at the center of the grid
      const gridSize = this.game.size;
      metaball.position.set(0, 0, 0);
      
      // Set a medium-size influence radius for smooth connections
      const influenceRadius = 1.6;
      
      // Add each blob's position as a metaball influence point
      organism.blobs.forEach(blob => {
        const strength = blob.radius * 3;
        metaball.addBall(
          blob.group.position.x,
          blob.group.position.y,
          blob.group.position.z,
          strength, 
          influenceRadius
        );
      });
      
      // Store the metaball reference and data
      this.metaballsMap.set(organism.id, {
        object: metaball,
        organism: organism,
        influenceRadius: influenceRadius
      });
      
      // Add to scene
      this.object.add(metaball);
    });
  }
  
  updateMetaballPositions() {
    // Update metaball positions based on current blob positions
    this.metaballsMap.forEach((metaball, organismId) => {
      const organism = this.organismGroups.find(org => org.id === organismId);
      
      if (!organism || organism.blobs.length === 0) {
        // If organism no longer exists, remove the metaball
        if (metaball.object && metaball.object.parent) {
          metaball.object.parent.remove(metaball.object);
        }
        this.metaballsMap.delete(organismId);
        return;
      }
      
      // Reset the metaball
      metaball.object.reset();
      
      // Add each blob's current position as a metaball influence point
      organism.blobs.forEach(blob => {
        const strength = blob.radius * 3;
        metaball.object.addBall(
          blob.group.position.x,
          blob.group.position.y,
          blob.group.position.z,
          strength,
          metaball.influenceRadius
        );
      });
    });
  }
  
  // Prepare the next generation blobs but don't show them yet
  prepareNextGeneration(currentGrid, nextGrid) {
    if (this.isAnimating) return false; // Don't prepare if still animating
    
    // Create a structure to hold information about pending changes
    const changes = {
      appearingCells: [], // Cells that will appear in the next generation
      disappearingCells: [], // Cells that will disappear in the next generation
      persistentCells: [], // Cells that stay the same
      newBlobs: [],       // New blob objects for appearing cells
      blobsToRemove: []   // Blob objects for disappearing cells
    };
    
    // Find cells that change state
    for (let y = 0; y < this.game.size; y++) {
      for (let x = 0; x < this.game.size; x++) {
        const key = `${x},${y}`;
        
        if (currentGrid[y][x] === 0 && nextGrid[y][x] === 1) {
          // Cell becomes alive
          changes.appearingCells.push({ x, y });
          
          // Create new blob (invisible) for this position
          const newBlob = this.createBlob(
            x, y, 
            this.game.size, 
            1, 
            this.game.size / 2,
            false // Start invisible
          );
          
          changes.newBlobs.push(newBlob);
          
          // Add to the scene but keep invisible
          this.object.add(newBlob.group);
        } 
        else if (currentGrid[y][x] === 1 && nextGrid[y][x] === 0) {
          // Cell dies
          changes.disappearingCells.push({ x, y });
          
          // Store reference to the blob that will be removed
          const blobToRemove = this.blobsMap[key];
          if (blobToRemove) {
            changes.blobsToRemove.push(blobToRemove);
          }
        }
        else if (currentGrid[y][x] === 1 && nextGrid[y][x] === 1) {
          // Cell stays alive
          changes.persistentCells.push({ x, y });
        }
      }
    }
    
    // Store the changes to be applied during animation
    this.pendingChanges = changes;
    return true;
  }
  
  // Animate the transition to the next generation
  animateNextGeneration() {
    if (!this.pendingChanges || this.isAnimating) return false;
    
    this.isAnimating = true;
    const changes = this.pendingChanges;
    
    // 1. First make the dying blobs shrink but don't remove them yet
    const shrinkPromises = changes.blobsToRemove.map(blob => {
      return new Promise(resolve => {
        // Shrink the blob
        gsap.to(blob.mesh.scale, {
          x: 0.01, 
          y: 0.01, 
          z: 0.01, 
          duration: this.blobSettings.morphSpeed * 0.8,
          ease: "back.in(1.5)",
          onComplete: resolve
        });
      });
    });
    
    // 2. After shrinking, update the blobsMap with the new blobs (still invisible)
    Promise.all(shrinkPromises).then(() => {
      // Remove the dying blobs
      changes.blobsToRemove.forEach(blob => {
        const key = `${blob.x},${blob.y}`;
        delete this.blobsMap[key];
        this.blobs = this.blobs.filter(b => b !== blob);
        this.object.remove(blob.group);
      });
      
      // Add the new blobs to our collections
      changes.newBlobs.forEach(blob => {
        const key = `${blob.x},${blob.y}`;
        this.blobsMap[key] = blob;
        this.blobs.push(blob);
      });
      
      // 3. Identify new organism groups with the updated blob collection
      this.identifyOrganismGroups();
      
      // 4. Update metaball representations for organisms
      this.createMetaballOrganisms();
      
      // 5. Now make new blobs visible and grow them
      const growPromises = changes.newBlobs.map(blob => {
        return new Promise(resolve => {
          // Make the blob visible
          blob.mesh.visible = true;
          
          // Grow the blob
          gsap.to(blob.mesh.scale, {
            x: 1, 
            y: 1, 
            z: 1, 
            duration: this.blobSettings.morphSpeed,
            ease: "elastic.out(1, 0.3)",
            onComplete: resolve
          });
        });
      });
      
      // 6. After all growth is complete, finish the animation
      Promise.all(growPromises).then(() => {
        // Reset the "isNew" flag on all blobs
        this.blobs.forEach(blob => {
          blob.isNew = false;
        });
        
        // Update metaball positions one final time
        this.updateMetaballPositions();
        
        // Clear pending changes
        this.pendingChanges = null;
        this.isAnimating = false;
      });
    });
    
    return true;
  }
  
  // This replaces the old updateBlobs method
  updateBlobs(currentGrid, nextGrid) {
    // First prepare the next generation
    if (this.prepareNextGeneration(currentGrid, nextGrid)) {
      // Then animate the transition
      this.animateNextGeneration();
      return true;
    }
    return false;
  }
  
  findNearbyOrganisms(x, y) {
    const nearbyOrganisms = [];
    const seenIds = {};
    
    // Check all 8 surrounding cells
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue; // Skip self
        
        const nx = (x + dx + this.game.size) % this.game.size;
        const ny = (y + dy + this.game.size) % this.game.size;
        const neighborKey = `${nx},${ny}`;
        
        if (this.blobsMap[neighborKey]) {
          const neighbor = this.blobsMap[neighborKey];
          
          // If neighbor has an organism ID and we haven't seen it yet
          if (neighbor.organismId >= 0 && !seenIds[neighbor.organismId]) {
            seenIds[neighbor.organismId] = true;
            
            // Find the organism
            const organism = this.organismGroups.find(org => org.id === neighbor.organismId);
            if (organism) {
              nearbyOrganisms.push(organism);
            }
          }
        }
      }
    }
    
    return nearbyOrganisms;
  }
  
  resetBlobs(grid) {
    // Remove all blobs
    while(this.object.children.length > 0) { 
      this.object.remove(this.object.children[0]); 
    }
    
    this.blobs = [];
    this.blobsMap = {};
    this.organismGroups = [];
    this.pendingChanges = null;
    this.isAnimating = false;
    this.metaballsMap.clear();
    
    // Create new blobs based on current grid
    this.createBlobs();
  }
  
  updateBlobSettings(newSettings) {
    this.blobSettings = newSettings;
    
    // Update existing blobs
    this.blobs.forEach(blob => {
      const scaleFactor = THREE.MathUtils.randFloat(
        this.blobSettings.minRadius / blob.radius,
        this.blobSettings.maxRadius / blob.radius
      );
      
      gsap.to(blob.mesh.scale, {
        x: scaleFactor,
        y: scaleFactor,
        z: scaleFactor,
        duration: this.blobSettings.morphSpeed,
        ease: "elastic.out(1, 0.3)"
      });
    });
    
    // Update metaball organisms
    setTimeout(() => {
      this.createMetaballOrganisms();
    }, this.blobSettings.morphSpeed * 1000);
  }
  
  update() {
    const time = this.clock.getElapsedTime();
    
    // Update blob animations
    this.blobs.forEach(blob => {
      const { mesh } = blob;
      
      // Skip invisible blobs
      if (!mesh.visible) return;
      
      // Apply wobble effect using sin waves
      const wobble = Math.sin(
        time * mesh.userData.wobbleSpeed + mesh.userData.phase
      ) * mesh.userData.wobbleAmplitude;
      
      const scale = mesh.userData.originalScale + wobble;
      
      // Apply the wobble only if not currently being animated by GSAP
      if (!gsap.isTweening(mesh.scale)) {
        mesh.scale.set(scale, scale, scale);
      }
    });
    
    // Update metaball positions
    if (!this.isAnimating) {
      this.updateMetaballPositions();
    }
  }
} 