"use strict";
(() => {
  // src/index.ts
  var TERRAIN_TYPES = {
    "\u{1F33F}": { type: "\u{1F33F}", symbol: "\u{1F33F}" },
    // grass
    "\u26C4": { type: "\u26C4", symbol: "\u26C4" },
    // snowman
    "\u{1F332}": { type: "\u{1F332}", symbol: "\u{1F332}" },
    // forest
    "\u{1F30A}": { type: "\u{1F30A}", symbol: "\u{1F30A}" }
    // water
  };
  var MONSTER_DAMAGE = 20;
  var SWORD_DAMAGE = 35;
  function generateWorld(width, height) {
    const world = [];
    for (let y = 0; y < height; y++) {
      world[y] = [];
      for (let x = 0; x < width; x++) {
        world[y][x] = "\u{1F33F}";
      }
    }
    function createBlob(centerX, centerY, radius, type) {
      for (let y = Math.max(0, Math.floor(centerY - radius)); y < Math.min(height, Math.floor(centerY + radius)); y++) {
        for (let x = Math.max(0, Math.floor(centerX - radius)); x < Math.min(width, Math.floor(centerX + radius)); x++) {
          const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
          const noiseEdge = Math.random() * (radius * 0.3);
          if (distance < radius - noiseEdge) {
            world[Math.floor(y)][Math.floor(x)] = type;
          }
        }
      }
    }
    const numLakes = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numLakes; i++) {
      const x = Math.floor(Math.random() * width);
      const y = Math.floor(Math.random() * height);
      const size = 5 + Math.floor(Math.random() * 8);
      createBlob(x, y, size, "\u{1F30A}");
    }
    const numForests = 4 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numForests; i++) {
      const x = Math.floor(Math.random() * width);
      const y = Math.floor(Math.random() * height);
      const size = 8 + Math.floor(Math.random() * 7);
      createBlob(x, y, size, "\u{1F332}");
    }
    const numSnowAreas = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < numSnowAreas; i++) {
      let x = Math.floor(Math.random() * width);
      let y = Math.floor(Math.random() * height);
      const size = 6 + Math.floor(Math.random() * 8);
      createBlob(x, y, size, "\u26C4");
    }
    return world;
  }
  var animals = [];
  function createMonsters(world, count) {
    for (let i = 0; i < count; i++) {
      while (true) {
        const x = Math.floor(Math.random() * world[0].length);
        const y = Math.floor(Math.random() * world.length);
        if (world[y][x] !== "\u{1F30A}" && world[y][x] !== "\u26C4") {
          animals.push({
            x,
            y,
            symbol: "\u{1F479}",
            behavior: "chase",
            health: 100
            // Ogres have 100 health
          });
          break;
        }
      }
    }
  }
  function createAnimals(world, count) {
    animals = [];
    for (let i = 0; i < count; i++) {
      while (true) {
        const x = Math.floor(Math.random() * world[0].length);
        const y = Math.floor(Math.random() * world.length);
        if (world[y][x] !== "\u{1F30A}" && world[y][x] !== "\u26C4") {
          animals.push({
            x,
            y,
            symbol: "\u{1F98A}",
            behavior: "random",
            health: 50
            // Foxes have 50 health
          });
          break;
        }
      }
    }
  }
  function moveAnimals(world, playerX, playerY) {
    for (const animal of animals) {
      if (animal.behavior === "random" && Math.random() < 0.5) {
        const direction = Math.floor(Math.random() * 4);
        let newX = animal.x;
        let newY = animal.y;
        switch (direction) {
          case 0:
            newY--;
            break;
          case 1:
            newY++;
            break;
          case 2:
            newX--;
            break;
          case 3:
            newX++;
            break;
        }
        if (newX >= 0 && newX < world[0].length && newY >= 0 && newY < world.length && world[newY][newX] !== "\u{1F30A}" && world[newY][newX] !== "\u26C4") {
          animal.x = newX;
          animal.y = newY;
        }
      } else if (animal.behavior === "chase") {
        const dx = playerX - animal.x;
        const dy = playerY - animal.y;
        let newX = animal.x;
        let newY = animal.y;
        if (Math.abs(dx) > Math.abs(dy)) {
          newX += dx > 0 ? 1 : -1;
        } else {
          newY += dy > 0 ? 1 : -1;
        }
        if (newX >= 0 && newX < world[0].length && newY >= 0 && newY < world.length && world[newY][newX] !== "\u{1F30A}" && world[newY][newX] !== "\u26C4") {
          animal.x = newX;
          animal.y = newY;
        }
      }
    }
  }
  var playerHealth = 100;
  function damagePlayer(amount) {
    playerHealth = Math.max(0, playerHealth - amount);
    if (playerHealth === 0) {
      console.clear();
      console.log("Game Over! You died.");
      process.exit();
    }
  }
  var foods = [];
  function createFood(world, count) {
    foods = [];
    for (let i = 0; i < count; i++) {
      while (true) {
        const x = Math.floor(Math.random() * world[0].length);
        const y = Math.floor(Math.random() * world.length);
        if (world[y][x] !== "\u{1F30A}" && world[y][x] !== "\u26C4") {
          foods.push({
            x,
            y,
            symbol: "\u{1F34E}",
            healAmount: 25
            // Heals 25 HP
          });
          break;
        }
      }
    }
  }
  function healPlayer(amount) {
    playerHealth = Math.min(100, playerHealth + amount);
  }
  function swordAttack(world, playerX, playerY) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const targetX = playerX + dx;
        const targetY = playerY + dy;
        const targetIndex = animals.findIndex(
          (a) => a.x === targetX && a.y === targetY
        );
        if (targetIndex !== -1) {
          animals[targetIndex].health -= SWORD_DAMAGE;
          if (animals[targetIndex].health <= 0) {
            animals.splice(targetIndex, 1);
          }
        }
      }
    }
  }
  function displayWorld(world, viewportX, viewportY) {
    console.clear();
    const VIEWPORT_SIZE = 20;
    const PERSON_POS = Math.floor(VIEWPORT_SIZE / 2);
    console.log("\u2501".repeat(VIEWPORT_SIZE + 2));
    for (let y = viewportY; y < viewportY + VIEWPORT_SIZE; y++) {
      let line = "\u2503";
      for (let x = viewportX; x < viewportX + VIEWPORT_SIZE; x++) {
        if (y >= 0 && y < world.length && x >= 0 && x < world[0].length) {
          const animal = animals.find((a) => a.x === x && a.y === y);
          const food = foods.find((f) => f.x === x && f.y === y);
          if (x - viewportX === PERSON_POS && y - viewportY === PERSON_POS) {
            line += "\u{1F464}";
          } else if (animal) {
            line += animal.symbol;
          } else if (food) {
            line += food.symbol;
          } else {
            line += TERRAIN_TYPES[world[y][x]].symbol;
          }
        } else {
          line += " ";
        }
      }
      line += "\u2503";
      console.log(line);
    }
    console.log("\u2501".repeat(VIEWPORT_SIZE + 2));
    console.log("\nLegend:");
    console.log("\u{1F33F} - Grass");
    console.log("\u26C4 - Snow");
    console.log("\u{1F332} - Forest");
    console.log("\u{1F30A} - Water");
    console.log("\u{1F464} - You");
    console.log("\u{1F98A} - Fox (50 HP, wanders randomly)");
    console.log("\u{1F479} - Ogre (100 HP, chases you!)");
    console.log("\u{1F34E} - Apple (+25 HP)");
    console.log("\u2694\uFE0F  - Press F to attack");
    console.log("\nHealth:");
    const healthBarLength = 20;
    const filledHealth = Math.floor(playerHealth / 100 * healthBarLength);
    const healthBar = "\u2665\uFE0F".repeat(filledHealth) + "\u2661".repeat(healthBarLength - filledHealth);
    console.log(healthBar);
    console.log(`${playerHealth}%`);
    console.log(`
Viewing position: (${viewportX}, ${viewportY})`);
    console.log(`Viewport: 20x20 of 100x100 world`);
  }
  function setupKeyboardInput(world, viewportX, viewportY) {
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);
    let currentX = viewportX;
    let currentY = viewportY;
    displayWorld(world, currentX, currentY);
    process.stdin.on("keypress", (str, key) => {
      if (key.ctrl && key.name === "c") {
        process.exit();
      } else if (key.name === "f") {
        const playerX = currentX + Math.floor(20 / 2);
        const playerY = currentY + Math.floor(20 / 2);
        swordAttack(world, playerX, playerY);
        moveAnimals(world, playerX, playerY);
        const collidingAnimal = animals.find(
          (a) => a.x === playerX && a.y === playerY
        );
        if (collidingAnimal) {
          damagePlayer(MONSTER_DAMAGE);
        }
        displayWorld(world, currentX, currentY);
      } else if (key.name === "space") {
        moveAnimals(world, currentX + Math.floor(20 / 2), currentY + Math.floor(20 / 2));
        const personWorldX = currentX + Math.floor(20 / 2);
        const personWorldY = currentY + Math.floor(20 / 2);
        const collidingFox = animals.find(
          (a) => a.x === personWorldX && a.y === personWorldY
        );
        if (collidingFox) {
          damagePlayer(MONSTER_DAMAGE);
        }
        displayWorld(world, currentX, currentY);
      } else {
        let newX = currentX;
        let newY = currentY;
        const playerX = currentX + Math.floor(20 / 2);
        const playerY = currentY + Math.floor(20 / 2);
        switch (key.name) {
          case "up":
            if (playerY > 0) {
              newY--;
            }
            break;
          case "down":
            if (playerY < world.length - 1) {
              newY++;
            }
            break;
          case "left":
            if (playerX > 0) {
              newX--;
            }
            break;
          case "right":
            if (playerX < world[0].length - 1) {
              newX++;
            }
            break;
        }
        const personWorldX = newX + Math.floor(20 / 2);
        const personWorldY = newY + Math.floor(20 / 2);
        if (world[personWorldY][personWorldX] !== "\u{1F30A}" && world[personWorldY][personWorldX] !== "\u26C4") {
          currentX = newX;
          currentY = newY;
          const foodIndex = foods.findIndex(
            (f) => f.x === personWorldX && f.y === personWorldY
          );
          if (foodIndex !== -1) {
            const food = foods[foodIndex];
            healPlayer(food.healAmount);
            foods.splice(foodIndex, 1);
          }
          const collidingFox = animals.find(
            (a) => a.x === personWorldX && a.y === personWorldY
          );
          if (collidingFox) {
            damagePlayer(MONSTER_DAMAGE);
          }
          moveAnimals(world, personWorldX, personWorldY);
          displayWorld(world, currentX, currentY);
        }
      }
    });
  }
  function findSafeStartPosition(world) {
    while (true) {
      const x = Math.floor(Math.random() * (world[0].length - 20)) + 10;
      const y = Math.floor(Math.random() * (world.length - 20)) + 10;
      if (world[y][x] !== "\u{1F30A}" && world[y][x] !== "\u26C4") {
        const adjacentSafe = [
          [y - 1, x],
          // up
          [y + 1, x],
          // down
          [y, x - 1],
          // left
          [y, x + 1]
          // right
        ].some(
          ([ny, nx]) => ny >= 0 && ny < world.length && nx >= 0 && nx < world[0].length && world[ny][nx] !== "\u{1F30A}" && world[ny][nx] !== "\u26C4"
        );
        if (adjacentSafe) {
          return {
            x: x - Math.floor(20 / 2),
            y: y - Math.floor(20 / 2)
          };
        }
      }
    }
  }
  function main() {
    playerHealth = 100;
    const world = generateWorld(100, 100);
    createAnimals(world, 10);
    createMonsters(world, 3);
    createFood(world, 15);
    const startPos = findSafeStartPosition(world);
    setupKeyboardInput(world, startPos.x, startPos.y);
    console.log("\nControls:");
    console.log("Arrow keys - Move viewport");
    console.log("F - Attack with sword");
    console.log("Space - Wait (animals move)");
    console.log("Ctrl+C - Exit");
  }
  main();
  var Game = class {
    // Size of each tile in pixels
    constructor() {
      this.tileSize = 32;
      this.canvas = document.getElementById("gameCanvas");
      this.ctx = this.canvas.getContext("2d");
      this.canvas.width = 20 * this.tileSize;
      this.canvas.height = 20 * this.tileSize;
      this.setupKeyboardHandlers();
      this.init();
    }
    init() {
      playerHealth = 100;
      const world = generateWorld(100, 100);
      createAnimals(world, 10);
      createMonsters(world, 3);
      createFood(world, 15);
      const startPos = findSafeStartPosition(world);
      this.startGameLoop(world, startPos.x, startPos.y);
    }
    setupKeyboardHandlers() {
      document.addEventListener("keydown", (event) => {
        switch (event.key) {
          case "ArrowUp":
          case "ArrowDown":
          case "ArrowLeft":
          case "ArrowRight":
          case "f":
          case " ":
            event.preventDefault();
            this.handleInput(event.key);
            break;
        }
      });
    }
    render(world, viewportX, viewportY) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      for (let y = viewportY; y < viewportY + 20; y++) {
        for (let x = viewportX; x < viewportX + 20; x++) {
          const screenX = (x - viewportX) * this.tileSize;
          const screenY = (y - viewportY) * this.tileSize;
          if (y >= 0 && y < world.length && x >= 0 && x < world[0].length) {
            this.ctx.fillText(
              TERRAIN_TYPES[world[y][x]].symbol,
              screenX,
              screenY + this.tileSize
            );
            const food = foods.find((f) => f.x === x && f.y === y);
            if (food) {
              this.ctx.fillText(food.symbol, screenX, screenY + this.tileSize);
            }
            const animal = animals.find((a) => a.x === x && a.y === y);
            if (animal) {
              this.ctx.fillText(animal.symbol, screenX, screenY + this.tileSize);
            }
          }
        }
      }
      const playerScreenX = Math.floor(20 / 2) * this.tileSize;
      const playerScreenY = Math.floor(20 / 2) * this.tileSize;
      this.ctx.fillText("\u{1F464}", playerScreenX, playerScreenY + this.tileSize);
      const healthElement = document.getElementById("healthValue");
      if (healthElement) {
        healthElement.textContent = playerHealth.toString();
      }
    }
    startGameLoop(world, startX, startY) {
      let currentX = startX;
      let currentY = startY;
      const gameLoop = () => {
        this.render(world, currentX, currentY);
        requestAnimationFrame(gameLoop);
      };
      gameLoop();
    }
    handleInput(key) {
    }
  };
  document.addEventListener("DOMContentLoaded", () => {
    new Game();
  });
})();
