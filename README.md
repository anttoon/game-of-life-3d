# 🦠 Cute Game of Life 3D

A colorful and cute 3D visualization of Conway's Game of Life using Three.js. This interactive simulation represents cells as adorable 3D blobs that merge with nearby cells, creating fun and dynamic shapes in a petri dish-like environment.

## 🎮 Features

- **Cute 3D Blob Visualization**: Cells are represented as colorful, bouncy 3D blobs
- **Surface Tension Effect**: Nearby blobs connect with organic-looking tendrils
- **Petri Dish Environment**: The simulation takes place in a stylized petri dish
- **Animated Transitions**: Smooth animations between generations
- **Interactive Camera**: Orbit around the dish to view from different angles
- **Configurable Settings**: Control simulation speed, blob appearance, and more

## 🚀 How to Run

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm run dev
   ```
4. Open your browser at the URL shown in the terminal (typically http://localhost:5173)

## 🕹️ Controls

- **Play/Pause**: Toggle the simulation
- **Step Forward**: Advance one generation at a time
- **Reset**: Restart with a new random configuration
- **Mouse Controls**:
  - **Rotate**: Click and drag to orbit the camera
  - **Zoom**: Scroll to zoom in/out

## ⚙️ Configuration Options

The GUI panel provides various configuration options:

### Game Controls:
- **Play/Pause**: Toggle automatic simulation
- **Step Forward**: Manually advance one generation
- **Reset Game**: Generate a new random initial state
- **Step Interval**: Time between generations (ms)
- **Initial Density**: Starting population density

### Visual Settings:
- **Min/Max Blob Size**: Adjust blob dimensions
- **Animation Speed**: Control transition speed
- **Show Grid**: Toggle grid visibility

## 🧬 About Conway's Game of Life

Conway's Game of Life is a cellular automaton devised by mathematician John Conway in 1970. It follows simple rules:

1. Any live cell with fewer than two live neighbors dies (underpopulation)
2. Any live cell with two or three live neighbors survives
3. Any live cell with more than three live neighbors dies (overpopulation)
4. Any dead cell with exactly three live neighbors becomes alive (reproduction)

Despite these simple rules, complex patterns can emerge, making it a fascinating example of emergent complexity.

## 🛠️ Technology

- **Three.js**: 3D rendering
- **dat.GUI**: Configuration interface
- **GSAP**: Animation library
- **Vite**: Build tool and development server

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details. 