/**
 * Game of Life class that implements Conway's Game of Life rules
 */
export class GameOfLife {
  constructor(size = 40, initialDensity = 0.3) {
    this.size = size;
    this.initialDensity = initialDensity;
    this.grid = [];
    
    this.reset(initialDensity);
  }
  
  /**
   * Reset the game with a random initial state
   * @param {number} density - Probability of a cell being alive (0-1)
   */
  reset(density = this.initialDensity) {
    this.grid = [];
    
    // Initialize grid with random cells
    for (let y = 0; y < this.size; y++) {
      this.grid[y] = [];
      for (let x = 0; x < this.size; x++) {
        this.grid[y][x] = Math.random() < density ? 1 : 0;
      }
    }
  }
  
  /**
   * Get the state of a cell, handling edge wrapping
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {number} 1 if alive, 0 if dead
   */
  getCell(x, y) {
    // Wrap around edges (toroidal grid)
    const wrappedX = (x + this.size) % this.size;
    const wrappedY = (y + this.size) % this.size;
    return this.grid[wrappedY][wrappedX];
  }
  
  /**
   * Count the number of live neighbors around a cell
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {number} Count of live neighbors (0-8)
   */
  countNeighbors(x, y) {
    let count = 0;
    
    // Check all 8 surrounding cells
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        // Skip the cell itself
        if (dx === 0 && dy === 0) continue;
        
        count += this.getCell(x + dx, y + dy);
      }
    }
    
    return count;
  }
  
  /**
   * Compute the next generation based on Conway's Game of Life rules
   * @returns {Array<Array<number>>} The next generation grid
   */
  computeNextGeneration() {
    const nextGrid = [];
    
    for (let y = 0; y < this.size; y++) {
      nextGrid[y] = [];
      for (let x = 0; x < this.size; x++) {
        const cell = this.getCell(x, y);
        const neighbors = this.countNeighbors(x, y);
        
        // Apply Conway's Game of Life rules:
        // 1. Any live cell with fewer than two live neighbors dies (underpopulation)
        // 2. Any live cell with two or three live neighbors lives on
        // 3. Any live cell with more than three live neighbors dies (overpopulation)
        // 4. Any dead cell with exactly three live neighbors becomes a live cell (reproduction)
        
        if (cell === 1) {
          // Live cell
          nextGrid[y][x] = (neighbors === 2 || neighbors === 3) ? 1 : 0;
        } else {
          // Dead cell
          nextGrid[y][x] = (neighbors === 3) ? 1 : 0;
        }
      }
    }
    
    return nextGrid;
  }
  
  /**
   * Get a list of cells that changed state between two grids
   * @param {Array<Array<number>>} oldGrid - Previous grid state
   * @param {Array<Array<number>>} newGrid - New grid state
   * @returns {Array<Object>} List of cells that changed with their new state
   */
  getChangedCells(oldGrid, newGrid) {
    const changedCells = [];
    
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        if (oldGrid[y][x] !== newGrid[y][x]) {
          changedCells.push({
            x: x,
            y: y,
            state: newGrid[y][x]
          });
        }
      }
    }
    
    return changedCells;
  }
} 