import * as THREE from 'three';

/**
 * PetriDish class that creates a stylized petri dish for the Game of Life
 */
export class PetriDish {
  constructor(gridSize, colors) {
    this.gridSize = gridSize;
    this.colors = colors;
    
    // Create a group to hold all petri dish objects
    this.object = new THREE.Group();
    
    // Create dish elements
    this.createPetriDish();
    this.createGrid();
    this.createAgar(); // Add nutritious agar surface
    this.createPatterns(); // Add decorative patterns
    
    // Add subtle animation
    this.rotationSpeed = 0.0001;
    this.clock = new THREE.Clock();
  }
  
  createPetriDish() {
    // Calculate dish size based on grid size (add some padding)
    const dishRadius = (this.gridSize / 2) + 5; // Slightly larger dish
    const dishHeight = 1.5; // Taller dish
    
    // Create the main dish (bottom part)
    const dishGeometry = new THREE.CylinderGeometry(
      dishRadius, 
      dishRadius * 1.05, 
      dishHeight, 
      64, 
      4,
      false,
      0,
      Math.PI * 2
    );
    
    // Create material with glass-like appearance
    const dishMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xfcfcfc,
      transparent: true,
      opacity: 0.15,
      roughness: 0.05,
      metalness: 0.0,
      transmission: 0.98, // More transparency
      thickness: 0.2,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      side: THREE.DoubleSide
    });
    
    // Create the dish mesh
    const dish = new THREE.Mesh(dishGeometry, dishMaterial);
    dish.position.y = -dishHeight / 2;
    dish.receiveShadow = true;
    
    this.object.add(dish);
    
    // Create a circular rim for the dish - more pronounced and colorful
    const rimGeometry = new THREE.TorusGeometry(
      dishRadius, 
      0.8, // Thicker rim
      16, 
      120
    );
    
    // Use a playful gradient-like material for the rim
    const rimMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xf5f5f5,
      roughness: 0.2,
      metalness: 0.1,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1
    });
    
    const rim = new THREE.Mesh(rimGeometry, rimMaterial);
    rim.rotation.x = Math.PI / 2; // Rotate to horizontal
    rim.position.y = 0.1;
    rim.receiveShadow = true;
    rim.castShadow = true;
    
    // Add subtle color to the rim to match the reference image's aesthetic
    const rimColors = [
      new THREE.Color(this.colors.primary).multiplyScalar(0.7),
      new THREE.Color(this.colors.secondary).multiplyScalar(0.7),
      new THREE.Color(this.colors.accent).multiplyScalar(0.7),
    ];
    
    // Create rim color segments
    const segments = 6;
    const segmentSize = Math.PI * 2 / segments;
    
    for (let i = 0; i < segments; i++) {
      const segmentGeometry = new THREE.TorusGeometry(
        dishRadius,
        0.8,
        16,
        20, 
        segmentSize
      );
      
      // Offset the segment
      segmentGeometry.rotateZ(i * segmentSize);
      
      // Create colorful segment
      const colorIndex = i % rimColors.length;
      const segmentMaterial = rimMaterial.clone();
      segmentMaterial.color = rimColors[colorIndex];
      
      const segment = new THREE.Mesh(segmentGeometry, segmentMaterial);
      segment.rotation.x = Math.PI / 2;
      segment.position.y = 0.1;
      segment.receiveShadow = true;
      segment.castShadow = true;
      
      this.object.add(segment);
    }
    
    // Add condensation droplets on the inside of the lid
    this.addCondensation(dishRadius);
    
    // Add a subtle floor beneath the dish
    const floorGeometry = new THREE.CircleGeometry(dishRadius * 1.5, 64);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0xf8f8f8,
      roughness: 0.8,
      metalness: 0.1,
    });
    
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2; // Rotate to horizontal
    floor.position.y = -dishHeight - 0.01; // Just below the dish
    floor.receiveShadow = true;
    
    this.object.add(floor);
    
    // Add a subtle shadow under the dish
    const shadowGeometry = new THREE.CircleGeometry(dishRadius * 1.1, 32);
    const shadowMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.1,
      side: THREE.DoubleSide
    });
    
    const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -dishHeight + 0.01;
    
    this.object.add(shadow);
  }
  
  addCondensation(radius) {
    // Create small water droplets on the "lid" of the petri dish
    const dropletCount = 60;
    const droplets = new THREE.Group();
    
    for (let i = 0; i < dropletCount; i++) {
      // Random position in polar coordinates
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * radius * 0.9; // Keep within dish
      
      // Convert to Cartesian
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;
      const y = 1.0 + Math.random() * 0.5; // Position above the dish, as if on the lid
      
      // Random droplet size
      const dropletSize = Math.random() * 0.1 + 0.05;
      
      // Create droplet geometry
      const dropletGeometry = new THREE.SphereGeometry(dropletSize, 8, 8);
      
      // Water-like material
      const dropletMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.6,
        roughness: 0.0,
        metalness: 0.0,
        transmission: 0.9,
        thickness: 0.5,
        clearcoat: 1.0,
        clearcoatRoughness: 0.0
      });
      
      const droplet = new THREE.Mesh(dropletGeometry, dropletMaterial);
      droplet.position.set(x, y, z);
      
      // Store original position for animation
      droplet.userData.originalY = y;
      droplet.userData.phase = Math.random() * Math.PI * 2;
      
      droplets.add(droplet);
    }
    
    this.object.add(droplets);
    this.condensationDroplets = droplets;
  }
  
  createAgar() {
    // Create a surface that looks like agar (nutritious jelly for growing cultures)
    const agarRadius = (this.gridSize / 2) + 4.8; // Slightly smaller than the dish
    const agarGeometry = new THREE.CylinderGeometry(
      agarRadius, 
      agarRadius, 
      0.4, // Height of agar
      64, 
      1,
      false,
      0,
      Math.PI * 2
    );
    
    // Pastel-colored agar material with a subtle tint matching the reference image
    const agarMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xfffaf0, // Very light cream
      transparent: true,
      opacity: 0.6,
      roughness: 0.4,
      metalness: 0.0,
      transmission: 0.5,
      thickness: 0.8,
      clearcoat: 0.3,
      clearcoatRoughness: 0.3
    });
    
    const agar = new THREE.Mesh(agarGeometry, agarMaterial);
    agar.position.y = -0.65; // Just above the bottom of the dish
    agar.receiveShadow = true;
    
    // Add some texture to the agar surface using a displacement map
    this.addAgarTexture(agar, agarRadius);
    
    this.object.add(agar);
    this.agar = agar;
  }
  
  addAgarTexture(agar, radius) {
    // Create subtle bumps and irregularities on the agar surface
    const positions = agar.geometry.attributes.position;
    const normals = agar.geometry.attributes.normal;
    const vertex = new THREE.Vector3();
    const normal = new THREE.Vector3();
    
    // Only modify the top vertices
    for (let i = 0; i < positions.count; i++) {
      vertex.fromBufferAttribute(positions, i);
      normal.fromBufferAttribute(normals, i);
      
      // If this is a vertex on the top surface
      if (normal.y > 0.5) {
        // Add subtle random displacement
        const noise = (Math.random() - 0.5) * 0.05; // Small bumps
        vertex.y += noise;
        
        positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
      }
    }
    
    // Update the geometry
    agar.geometry.computeVertexNormals();
  }
  
  createPatterns() {
    // Create decorative patterns inspired by the reference image
    const dishRadius = (this.gridSize / 2) + 4;
    
    // Create subtle circular patterns in the dish
    // Add concentric circles with more colors that match the reference image
    const circleColors = [
      this.colors.primary,
      this.colors.secondary,
      this.colors.accent,
      0xc88fff, // Purple
      0x98ff8f  // Green
    ];
    
    for (let i = 1; i <= 5; i++) {
      const circleRadius = dishRadius * (i / 6);
      const circleGeometry = new THREE.RingGeometry(
        circleRadius - 0.03, 
        circleRadius, 
        64
      );
      
      const colorIndex = (i - 1) % circleColors.length;
      const circleMaterial = new THREE.MeshBasicMaterial({
        color: circleColors[colorIndex],
        transparent: true,
        opacity: 0.05,
        side: THREE.DoubleSide
      });
      
      const circle = new THREE.Mesh(circleGeometry, circleMaterial);
      circle.rotation.x = -Math.PI / 2; // Lay flat
      circle.position.y = -0.45; // Just above the bottom
      
      this.object.add(circle);
    }
    
    // Add some subtle "nutrient" specks with more colorful variation
    const particleCount = 180; // More particles
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSizes = new Float32Array(particleCount);
    const particleColors = new Float32Array(particleCount * 3);
    
    // Define available colors for specks, using colors from the reference image
    const speckColors = [
      new THREE.Color(this.colors.primary),
      new THREE.Color(this.colors.secondary),
      new THREE.Color(this.colors.accent),
      new THREE.Color(0xc88fff), // Purple
      new THREE.Color(0x98ff8f), // Green
      new THREE.Color(0xe6c19c), // Light brown/tan
      new THREE.Color(0xffffff)  // White
    ];
    
    // Fill in random positions within the dish
    for (let i = 0; i < particleCount; i++) {
      // Random position in polar coordinates
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * dishRadius * 0.9; // Keep within dish
      
      // Convert to Cartesian
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;
      const y = -0.45 + Math.random() * 0.05; // Just above dish bottom with variation
      
      particlePositions[i * 3] = x;
      particlePositions[i * 3 + 1] = y;
      particlePositions[i * 3 + 2] = z;
      
      // Random size
      particleSizes[i] = Math.random() * 0.2 + 0.05;
      
      // Random color from palette
      const color = speckColors[Math.floor(Math.random() * speckColors.length)];
      particleColors[i * 3] = color.r;
      particleColors[i * 3 + 1] = color.g;
      particleColors[i * 3 + 2] = color.b;
    }
    
    particleGeometry.setAttribute('position', 
      new THREE.BufferAttribute(particlePositions, 3));
    particleGeometry.setAttribute('size', 
      new THREE.BufferAttribute(particleSizes, 1));
    particleGeometry.setAttribute('color', 
      new THREE.BufferAttribute(particleColors, 3));
    
    // Create shader material for the particles
    const particleMaterial = new THREE.PointsMaterial({
      size: 0.2,
      transparent: true,
      opacity: 0.6,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });
    
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    this.object.add(particles);
    
    // Store particles for animation
    this.particles = particles;
  }
  
  createGrid() {
    // Create a grid to visualize the Game of Life cells
    const gridWidth = this.gridSize;
    const gridHeight = this.gridSize;
    const cellSize = 1;
    
    // Create grid lines material
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0xaaaaaa,
      transparent: true,
      opacity: 0.1 // Very subtle grid
    });
    
    // Create horizontal lines
    const horizontalLines = new THREE.Group();
    
    for (let i = 0; i <= gridHeight; i++) {
      const y = i * cellSize - (gridHeight * cellSize) / 2;
      
      const points = [
        new THREE.Vector3(-(gridWidth * cellSize) / 2, 0, y),
        new THREE.Vector3((gridWidth * cellSize) / 2, 0, y)
      ];
      
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, lineMaterial);
      
      horizontalLines.add(line);
    }
    
    // Create vertical lines
    const verticalLines = new THREE.Group();
    
    for (let i = 0; i <= gridWidth; i++) {
      const x = i * cellSize - (gridWidth * cellSize) / 2;
      
      const points = [
        new THREE.Vector3(x, 0, -(gridHeight * cellSize) / 2),
        new THREE.Vector3(x, 0, (gridHeight * cellSize) / 2)
      ];
      
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, lineMaterial);
      
      verticalLines.add(line);
    }
    
    // Group all grid lines
    this.grid = new THREE.Group();
    this.grid.add(horizontalLines);
    this.grid.add(verticalLines);
    
    // Position the grid just above the dish surface
    this.grid.position.y = 0.01;
    
    // Initialize hidden
    this.grid.visible = false;
    
    this.object.add(this.grid);
  }
  
  toggleGrid(visible) {
    this.grid.visible = visible;
  }
  
  update() {
    const time = this.clock.getElapsedTime();
    
    // Subtle rotation of the entire dish
    this.object.rotation.y = Math.sin(time * 0.1) * 0.01;
    
    // Subtle animation for condensation droplets
    if (this.condensationDroplets) {
      this.condensationDroplets.children.forEach((droplet, i) => {
        const offset = Math.sin(time * 0.1 + droplet.userData.phase) * 0.03;
        droplet.position.y = droplet.userData.originalY + offset;
      });
    }
    
    // Subtle animation for agar
    if (this.agar) {
      this.agar.rotation.y = Math.sin(time * 0.05) * 0.01;
    }
    
    // Subtle animation for particles
    if (this.particles) {
      const positions = this.particles.geometry.attributes.position.array;
      
      for (let i = 0; i < positions.length; i += 3) {
        // Get the current position
        const x = positions[i];
        const y = positions[i + 1];
        const z = positions[i + 2];
        
        // Calculate distance from center
        const distance = Math.sqrt(x * x + z * z);
        
        // Only move if not at edges
        if (distance < (this.gridSize / 2) * 0.8) {
          // Add a tiny random movement to Y position
          positions[i + 1] = y + Math.sin(time + i) * 0.0002;
        }
      }
      
      this.particles.geometry.attributes.position.needsUpdate = true;
    }
  }
} 