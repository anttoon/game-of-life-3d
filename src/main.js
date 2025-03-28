import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GUI } from 'dat.gui'
import { gsap } from 'gsap'
import { GameOfLife } from './gameOfLife.js'
import { BlobVisualizer } from './blobVisualizer.js'
import { PetriDish } from './petriDish.js'
import { MarchingCubes } from 'three/examples/jsm/objects/MarchingCubes.js'

// Main app class
class GameOfLife3DApp {
  constructor() {
    this.canvas = document.getElementById('game-canvas')
    this.loadingScreen = document.getElementById('loading-screen')
    
    // Configuration
    this.config = {
      gridSize: 40,
      initialDensity: 0.2, // Lower initial density for calmer start
      stepInterval: 800, // Slower step interval for more calming effect
      colors: {
        primary: 0xff8fe8, // Pink
        secondary: 0x8fe3ff, // Blue
        accent: 0xffe38f, // Yellow
        background: 0xf0f8ff // Light blue
      },
      blobs: {
        minRadius: 0.35, // Larger minimum radius for better slime shapes
        maxRadius: 0.7,  // Larger max radius for more visible organisms
        segmentation: 16,
        interactionRadius: 1.8, // Larger interaction radius for better connections
        morphSpeed: 0.7  // Slower morphing for smoother transitions
      },
      autoplay: true,
      showGrid: false
    }
    
    // Initialize components
    this.init()
    this.setupGUI()
    this.animate()
    
    // Handle window resize
    window.addEventListener('resize', this.onWindowResize.bind(this))
  }
  
  init() {
    // Setup scene
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(this.config.colors.background)
    
    // Setup camera - use a slightly different angle to better see the slime shapes
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    this.camera.position.set(15, 25, 25) // More angled view
    
    // Setup renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true
    })
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    
    // Setup controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.05
    this.controls.maxPolarAngle = Math.PI / 2.1 // Limit to not go below the dish
    
    // Setup lights
    this.addLights()
    
    // Setup game
    this.game = new GameOfLife(this.config.gridSize, this.config.initialDensity)
    
    // Setup petri dish
    this.petriDish = new PetriDish(this.config.gridSize, this.config.colors)
    this.scene.add(this.petriDish.object)
    
    // Setup blob visualizer
    this.blobVisualizer = new BlobVisualizer(
      this.game,
      this.config.blobs,
      this.config.colors
    )
    this.scene.add(this.blobVisualizer.object)
    
    // Setup animation timer
    this.lastStepTime = 0
    this.isPaused = !this.config.autoplay
  }
  
  addLights() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6) // Brighter ambient light
    this.scene.add(ambientLight)
    
    // Main directional light (sun-like)
    const mainLight = new THREE.DirectionalLight(0xffffff, 1)
    mainLight.position.set(10, 20, 10)
    mainLight.castShadow = true
    
    // Configure shadow
    mainLight.shadow.mapSize.width = 2048
    mainLight.shadow.mapSize.height = 2048
    mainLight.shadow.camera.near = 0.5
    mainLight.shadow.camera.far = 50
    mainLight.shadow.camera.left = -25
    mainLight.shadow.camera.right = 25
    mainLight.shadow.camera.top = 25
    mainLight.shadow.camera.bottom = -25
    
    this.scene.add(mainLight)
    
    // Additional colored lights for candy-like appearance
    const pinkLight = new THREE.PointLight(this.config.colors.primary, 0.8, 30)
    pinkLight.position.set(15, 10, -10)
    this.scene.add(pinkLight)
    
    const blueLight = new THREE.PointLight(this.config.colors.secondary, 0.8, 30)
    blueLight.position.set(-15, 10, 10)
    this.scene.add(blueLight)
    
    // Add a subtle rim light from behind
    const rimLight = new THREE.PointLight(0xffffff, 0.5, 40)
    rimLight.position.set(0, 15, -20)
    this.scene.add(rimLight)
  }
  
  setupGUI() {
    this.gui = new GUI()
    this.gui.width = 300
    
    // Game controls folder
    const gameFolder = this.gui.addFolder('Game Controls')
    
    gameFolder.add(this, 'togglePlay').name('Play/Pause')
    gameFolder.add(this, 'step').name('Step Forward')
    gameFolder.add(this, 'reset').name('Reset Game')
    
    gameFolder.add(this.config, 'stepInterval', 100, 2000).name('Step Interval (ms)')
    gameFolder.add(this.config, 'initialDensity', 0.1, 0.5, 0.05) // Lower max density
      .name('Initial Density')
      .onChange(() => {
        this.reset()
      })
    
    // Visual controls folder
    const visualFolder = this.gui.addFolder('Slime Settings')
    
    visualFolder.add(this.config.blobs, 'minRadius', 0.1, 0.5, 0.05)
      .name('Min Slime Size')
      .onChange(() => {
        this.blobVisualizer.updateBlobSettings(this.config.blobs)
      })
    
    visualFolder.add(this.config.blobs, 'maxRadius', 0.3, 1.0, 0.05)
      .name('Max Slime Size')
      .onChange(() => {
        this.blobVisualizer.updateBlobSettings(this.config.blobs)
      })
    
    visualFolder.add(this.config.blobs, 'morphSpeed', 0.2, 1.5, 0.1)
      .name('Animation Speed')
      .onChange(() => {
        this.blobVisualizer.updateBlobSettings(this.config.blobs)
      })
    
    visualFolder.add(this.config, 'showGrid')
      .name('Show Grid')
      .onChange((value) => {
        this.petriDish.toggleGrid(value)
      })
    
    // Camera controls
    const cameraFolder = this.gui.addFolder('Camera')
    
    cameraFolder.add(this, 'resetCamera').name('Reset Camera View')
    
    // Set default open state
    gameFolder.open()
    
    // Start with GUI hidden on mobile
    if (window.innerWidth < 768) {
      this.gui.close()
    }
  }
  
  resetCamera() {
    gsap.to(this.camera.position, {
      x: 15,
      y: 25,
      z: 25,
      duration: 1,
      ease: "power2.inOut",
      onUpdate: () => {
        this.camera.lookAt(0, 0, 0)
      }
    })
  }
  
  // Game control methods
  togglePlay() {
    this.isPaused = !this.isPaused
  }
  
  step() {
    const nextGrid = this.game.computeNextGeneration()
    
    // Update blobs with the new grid
    this.blobVisualizer.updateBlobs(this.game.grid, nextGrid)
    
    // Update the game grid immediately, even though the visualization update happens gradually
    this.game.grid = nextGrid
  }
  
  reset() {
    this.game.reset(this.config.initialDensity)
    this.blobVisualizer.resetBlobs(this.game.grid)
  }
  
  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }
  
  animate() {
    requestAnimationFrame(this.animate.bind(this))
    
    const currentTime = performance.now()
    
    // Update controls
    this.controls.update()
    
    // Process game step if not paused and not currently animating
    if (!this.isPaused && 
        !this.blobVisualizer.isAnimating &&
        currentTime - this.lastStepTime > this.config.stepInterval) {
      this.step()
      this.lastStepTime = currentTime
    }
    
    // Update animations
    this.blobVisualizer.update()
    this.petriDish.update()
    
    // Render
    this.renderer.render(this.scene, this.camera)
    
    // Hide loading screen after first render
    if (this.loadingScreen.style.opacity !== '0') {
      gsap.to(this.loadingScreen, {
        opacity: 0,
        duration: 1,
        onComplete: () => {
          this.loadingScreen.style.display = 'none'
        }
      })
    }
  }
}

// Start the application when the DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  const app = new GameOfLife3DApp()
})
