// src/shared.ts
var TERRAIN_TYPES = {
  "\u{1F33F}": { type: "\u{1F33F}", symbol: "\u{1F33F}", backgroundColor: "#3B7A23" },
  // Natural grass green
  "\u26F0\uFE0F": { type: "\u26F0\uFE0F", symbol: "\u26F0\uFE0F", backgroundColor: "#A0522D" },
  // Brown
  "\u{1F332}": { type: "\u{1F332}", symbol: "\u{1F332}", backgroundColor: "#1B4D1B" },
  // Darker forest green
  "\u{1F30A}": { type: "\u{1F30A}", symbol: "\u{1F30A}", backgroundColor: "#4169E1" }
  // Royal blue
};
var SWORD_DAMAGE = 35;
var animals = [];
var foods = [];
var playerHealth = 100;
var playerStamina = 100;
var RESPAWN_CONFIG = {
  FOOD_INTERVAL: 3e3,
  // Every 3 seconds
  FOOD_MAX: 15,
  MONSTER_INTERVAL: 5e3,
  // Every 5 seconds
  MONSTER_MAX: 3,
  FOX_MAX: 10
};
var lastFoodSpawn = Date.now();
var lastMonsterSpawn = Date.now();
var XP_CONFIG = {
  FOX_XP: 10,
  OGRE_XP: 25,
  XP_PER_LEVEL: 100,
  DAMAGE_PER_LEVEL: 5,
  MAX_LEVEL: 10,
  LEVEL_NAMES: [
    "Novice",
    // Level 1
    "Apprentice",
    // Level 2
    "Fighter",
    // Level 3
    "Warrior",
    // Level 4
    "Veteran",
    // Level 5
    "Elite",
    // Level 6
    "Master",
    // Level 7
    "Champion",
    // Level 8
    "Hero",
    // Level 9
    "Legend"
    // Level 10
  ]
};
var playerXP = 0;
var playerLevel = 1;
var currentAnimations = [];
var nextAnimationId = 0;
var ENEMY_TYPES = {
  FOX: {
    symbol: "\u{1F98A}",
    health: 50,
    damage: 15,
    xp: 10,
    behavior: "random",
    minLevel: 1
  },
  WOLF: {
    symbol: "\u{1F43A}",
    health: 75,
    damage: 25,
    xp: 20,
    behavior: "chase",
    minLevel: 3
  },
  OGRE: {
    symbol: "\u{1F479}",
    health: 100,
    damage: 30,
    xp: 25,
    behavior: "chase",
    minLevel: 1
  },
  DRAGON: {
    symbol: "\u{1F409}",
    health: 200,
    damage: 40,
    xp: 50,
    behavior: "chase",
    minLevel: 5
  },
  DEMON: {
    symbol: "\u{1F47F}",
    health: 300,
    damage: 50,
    xp: 75,
    behavior: "chase",
    minLevel: 7
  },
  BOSS: {
    symbol: "\u{1F480}",
    health: 500,
    damage: 75,
    xp: 150,
    behavior: "chase",
    minLevel: 9
  }
};
var STAMINA_CONFIG = {
  SPRINT_COST: 30,
  // Reduced from 40 to 30 per second
  REGEN_RATE: 0.8,
  // Increased from 0.5 to 0.8 per frame
  MAX_STAMINA: 100
};
var HEALTH_CONFIG = {
  BASE_HEALTH: 100,
  HEALTH_PER_LEVEL: 25
  // +25 HP per level
};
var MOVEMENT_CONFIG = {
  BASE_SPEED: 4e-3,
  // Adjusted for deltaTime
  SPRINT_MULTIPLIER: 3.5,
  // Unchanged
  GRID_SIZE: 1
};
var playerPosition = {
  x: 0,
  y: 0
};
function setPlayerPosition(x, y) {
  playerPosition.x = x;
  playerPosition.y = y;
}
function movePlayer(dx, dy) {
  playerPosition.x += dx;
  playerPosition.y += dy;
}
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
    createBlob(
      Math.floor(Math.random() * width),
      Math.floor(Math.random() * height),
      5 + Math.floor(Math.random() * 8),
      "\u{1F30A}"
    );
  }
  const numMountainRanges = 2 + Math.floor(Math.random() * 2);
  for (let i = 0; i < numMountainRanges; i++) {
    createBlob(
      Math.floor(Math.random() * width),
      Math.floor(Math.random() * height),
      6 + Math.floor(Math.random() * 8),
      "\u26F0\uFE0F"
    );
  }
  const numForests = 4 + Math.floor(Math.random() * 3);
  for (let i = 0; i < numForests; i++) {
    createBlob(
      Math.floor(Math.random() * width),
      Math.floor(Math.random() * height),
      8 + Math.floor(Math.random() * 7),
      "\u{1F332}"
    );
  }
  return world;
}
function createAnimals(world, count) {
  for (let i = 0; i < count; i++) {
    while (true) {
      const x = Math.floor(Math.random() * world[0].length);
      const y = Math.floor(Math.random() * world.length);
      if (world[y][x] !== "\u{1F30A}" && world[y][x] !== "\u26F0\uFE0F") {
        animals.push({
          x,
          y,
          symbol: "\u{1F98A}",
          behavior: "random",
          health: 50,
          damage: 15
        });
        break;
      }
    }
  }
}
function createMonsters(world, count) {
  const availableTypes = Object.values(ENEMY_TYPES).filter(
    (type) => type.minLevel <= playerLevel
  );
  const canSpawnBoss = playerLevel >= ENEMY_TYPES.BOSS.minLevel;
  const shouldSpawnBoss = canSpawnBoss && Math.random() < 0.1;
  if (shouldSpawnBoss) {
    spawnEnemy(world, ENEMY_TYPES.BOSS, true);
    return;
  }
  for (let i = 0; i < count; i++) {
    const enemyType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
    spawnEnemy(world, enemyType);
  }
}
function spawnEnemy(world, enemyType, isBoss = false) {
  while (true) {
    const x = Math.floor(Math.random() * world[0].length);
    const y = Math.floor(Math.random() * world.length);
    if (world[y][x] !== "\u{1F30A}" && world[y][x] !== "\u26F0\uFE0F") {
      animals.push({
        x,
        y,
        symbol: enemyType.symbol,
        behavior: enemyType.behavior,
        health: isBoss ? enemyType.health * 2 : enemyType.health,
        damage: isBoss ? enemyType.damage * 1.5 : enemyType.damage,
        isBoss
      });
      break;
    }
  }
}
function createFood(world, count) {
  for (let i = 0; i < count; i++) {
    while (true) {
      const x = Math.floor(Math.random() * world[0].length);
      const y = Math.floor(Math.random() * world.length);
      if (world[y][x] !== "\u{1F30A}" && world[y][x] !== "\u26F0\uFE0F") {
        foods.push({
          x,
          y,
          symbol: "\u{1F34E}",
          healAmount: 25
        });
        break;
      }
    }
  }
}
var MONSTER_SPEED = {
  RANDOM: 0.03,
  // Very slow wandering
  CHASE: 0.06,
  // Regular chase speed
  BOSS: 0.04
  // Slower but relentless
};
var monsterStates = /* @__PURE__ */ new Map();
var RECOIL_CONFIG = {
  DURATION: 200,
  // Recoil effect duration in ms
  STRENGTH: 0.5
  // How far they get pushed back
};
var COLLISION_CONFIG = {
  RADIUS: 0.4
  // Collision radius (in grid units)
};
var DAMAGE_CONFIG = {
  COOLDOWN: 500,
  // Milliseconds between damage hits
  LAST_HIT: 0
  // Track last damage time
};
function checkEnemyCollision(playerX, playerY) {
  const now = Date.now();
  if (now - DAMAGE_CONFIG.LAST_HIT < DAMAGE_CONFIG.COOLDOWN) {
    return false;
  }
  const collidingAnimal = animals.find((animal) => {
    const dx = animal.x - playerX;
    const dy = animal.y - playerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < COLLISION_CONFIG.RADIUS;
  });
  if (collidingAnimal) {
    DAMAGE_CONFIG.LAST_HIT = now;
    return damagePlayer(collidingAnimal.damage);
  }
  return false;
}
var MONSTER_CONFIG = {
  MIN_DISTANCE: 0.6,
  // Minimum distance monsters must keep from player
  ATTACK_RANGE: COLLISION_CONFIG.RADIUS
  // Keep existing attack range
};
function moveAnimals(world, playerX, playerY, deltaTime) {
  const timeScale = deltaTime / 16.67;
  const now = Date.now();
  for (const animal of animals) {
    if (!monsterStates.has(animal)) {
      monsterStates.set(animal, { targetX: animal.x, targetY: animal.y, isMoving: false });
    }
    const state = monsterStates.get(animal);
    if (state.recoilEndTime && now < state.recoilEndTime && state.recoilDx && state.recoilDy) {
      const progress = (state.recoilEndTime - now) / RECOIL_CONFIG.DURATION;
      const newX = animal.x + state.recoilDx * progress * timeScale;
      const newY = animal.y + state.recoilDy * progress * timeScale;
      const gridX = Math.floor(newX);
      const gridY = Math.floor(newY);
      if (gridX >= 0 && gridX < world[0].length && gridY >= 0 && gridY < world.length && world[gridY][gridX] !== "\u{1F30A}" && world[gridY][gridX] !== "\u26F0\uFE0F") {
        animal.x = newX;
        animal.y = newY;
      }
      continue;
    }
    let speed = MONSTER_SPEED.CHASE;
    if (animal.behavior === "random") {
      speed = MONSTER_SPEED.RANDOM;
      if (!animal.direction) {
        animal.direction = Math.random() * Math.PI * 2;
      }
      if (Math.random() < 0.02) {
        animal.direction = Math.random() * Math.PI * 2;
      }
      const dx = Math.cos(animal.direction);
      const dy = Math.sin(animal.direction);
      const newX = animal.x + dx * speed * timeScale;
      const newY = animal.y + dy * speed * timeScale;
      const gridX = Math.floor(newX);
      const gridY = Math.floor(newY);
      if (gridX >= 0 && gridX < world[0].length && gridY >= 0 && gridY < world.length && world[gridY][gridX] !== "\u{1F30A}" && world[gridY][gridX] !== "\u26F0\uFE0F") {
        animal.x = newX;
        animal.y = newY;
      } else {
        animal.direction = animal.direction + Math.PI;
      }
    } else {
      if (animal.isBoss) {
        speed = MONSTER_SPEED.BOSS;
      }
      const dx = playerX - animal.x;
      const dy = playerY - animal.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance > MONSTER_CONFIG.MIN_DISTANCE) {
        const moveX = dx / distance * speed * timeScale;
        const moveY = dy / distance * speed * timeScale;
        const newX = animal.x + moveX;
        const newY = animal.y + moveY;
        const newDx = playerX - newX;
        const newDy = playerY - newY;
        const newDistance = Math.sqrt(newDx * newDx + newDy * newDy);
        if (newDistance >= MONSTER_CONFIG.MIN_DISTANCE) {
          const gridX = Math.floor(newX);
          const gridY = Math.floor(newY);
          if (gridX >= 0 && gridX < world[0].length && gridY >= 0 && gridY < world.length && world[gridY][gridX] !== "\u{1F30A}" && world[gridY][gridX] !== "\u26F0\uFE0F") {
            animal.x = newX;
            animal.y = newY;
          }
        }
      }
    }
  }
}
function gainXP(amount, fromBoss = false) {
  playerXP += fromBoss ? amount * 2 : amount;
  const newLevel = Math.min(Math.floor(playerXP / XP_CONFIG.XP_PER_LEVEL) + 1, XP_CONFIG.MAX_LEVEL);
  if (newLevel > playerLevel) {
    playerLevel = newLevel;
    playerHealth = getMaxHealth();
  }
}
function swordAttack(world, playerX, playerY, angle, attackRadius) {
  const totalDamage = SWORD_DAMAGE + (playerLevel - 1) * XP_CONFIG.DAMAGE_PER_LEVEL;
  const ATTACK_ARC = Math.PI / 2;
  for (let i = animals.length - 1; i >= 0; i--) {
    const target = animals[i];
    const dx = target.x - playerX;
    const dy = target.y - playerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance <= attackRadius) {
      const targetAngle = Math.atan2(dy, dx);
      const angleDiff = Math.abs(normalizeAngle(targetAngle - angle));
      if (angleDiff <= ATTACK_ARC / 2) {
        target.health -= totalDamage;
        currentAnimations.push({
          id: nextAnimationId++,
          type: "damage",
          x: target.x,
          y: target.y,
          duration: DAMAGE_ANIMATION.DURATION,
          startTime: Date.now(),
          symbol: DAMAGE_ANIMATION.SYMBOL,
          color: DAMAGE_ANIMATION.MONSTER_COLOR
        });
        if (!monsterStates.has(target)) {
          monsterStates.set(target, { targetX: target.x, targetY: target.y, isMoving: false });
        }
        const state = monsterStates.get(target);
        const recoilStrength = RECOIL_CONFIG.STRENGTH * (1 + (playerLevel - 1) * 0.1);
        state.recoilDx = dx / distance * recoilStrength;
        state.recoilDy = dy / distance * recoilStrength;
        state.recoilEndTime = Date.now() + RECOIL_CONFIG.DURATION;
        if (target.health <= 0) {
          const enemyType = Object.values(ENEMY_TYPES).find(
            (type) => type.symbol === target.symbol
          );
          if (enemyType) {
            gainXP(enemyType.xp, target.isBoss);
          }
          animals.splice(i, 1);
          monsterStates.delete(target);
        }
      }
    }
  }
}
function normalizeAngle(angle) {
  while (angle > Math.PI)
    angle -= 2 * Math.PI;
  while (angle < -Math.PI)
    angle += 2 * Math.PI;
  return angle;
}
function startSwordAnimation(x, y, duration, radius) {
  currentAnimations = currentAnimations.filter((anim) => anim.type !== "sword");
  const scale = 1 + (playerLevel - 1) * 0.2;
  currentAnimations.push({
    id: nextAnimationId++,
    type: "sword",
    x,
    y,
    duration,
    startTime: Date.now(),
    symbol: "\u2694\uFE0F",
    rotation: Math.atan2(y - playerPosition.y, x - playerPosition.x),
    scale
    // Add scale to animation state
  });
}
var DAMAGE_ANIMATION = {
  MONSTER_COLOR: "#ff0000",
  PLAYER_COLOR: "#ff6666",
  DURATION: 200,
  SYMBOL: "\u{1F4A5}"
};
function damagePlayer(amount) {
  const newHealth = Math.max(0, playerHealth - amount);
  playerHealth = newHealth;
  currentAnimations.push({
    id: nextAnimationId++,
    type: "playerDamage",
    x: playerPosition.x,
    y: playerPosition.y,
    duration: DAMAGE_ANIMATION.DURATION,
    startTime: Date.now(),
    symbol: DAMAGE_ANIMATION.SYMBOL,
    color: DAMAGE_ANIMATION.PLAYER_COLOR
  });
  return playerHealth === 0;
}
function healPlayer(amount) {
  const maxHealth = getMaxHealth();
  const newHealth = Math.min(maxHealth, playerHealth + amount);
  playerHealth = newHealth;
}
function handleRespawns(world) {
  const now = Date.now();
  if (now - lastFoodSpawn > RESPAWN_CONFIG.FOOD_INTERVAL) {
    if (foods.length < RESPAWN_CONFIG.FOOD_MAX) {
      createFood(world, 1);
    }
    lastFoodSpawn = now;
  }
  if (now - lastMonsterSpawn > RESPAWN_CONFIG.MONSTER_INTERVAL) {
    const monsterCount = animals.filter((a) => a.behavior === "chase").length;
    const foxCount = animals.filter((a) => a.behavior === "random").length;
    let spawned = false;
    if (monsterCount < RESPAWN_CONFIG.MONSTER_MAX) {
      createMonsters(world, 1);
      spawned = true;
    }
    if (foxCount < RESPAWN_CONFIG.FOX_MAX) {
      createAnimals(world, 1);
      spawned = true;
    }
    if (spawned) {
      lastMonsterSpawn = now;
    }
  }
}
function resetGame() {
  playerHealth = HEALTH_CONFIG.BASE_HEALTH;
  playerStamina = STAMINA_CONFIG.MAX_STAMINA;
  playerXP = 0;
  playerLevel = 1;
  animals = [];
  foods = [];
  lastFoodSpawn = Date.now();
  lastMonsterSpawn = Date.now();
  currentAnimations = [];
  nextAnimationId = 0;
  monsterStates.clear();
}
function clearAnimation() {
  const now = Date.now();
  currentAnimations = currentAnimations.filter((anim) => {
    const elapsed = now - anim.startTime;
    return elapsed < anim.duration;
  });
}
function useStamina(amount) {
  if (playerStamina >= amount) {
    playerStamina = Math.max(0, playerStamina - amount);
    return true;
  }
  return false;
}
function regenStamina() {
  playerStamina = Math.min(STAMINA_CONFIG.MAX_STAMINA, playerStamina + STAMINA_CONFIG.REGEN_RATE);
}
function getMaxHealth() {
  return HEALTH_CONFIG.BASE_HEALTH + (playerLevel - 1) * HEALTH_CONFIG.HEALTH_PER_LEVEL;
}

// src/index.ts
var Game = class {
  // Use definite assignment assertion
  constructor() {
    this.tileSize = 48;
    this.isGameOver = false;
    this.isSprinting = false;
    this.keyStates = {};
    this.lastFrameTime = 0;
    this.lastPlayerGridX = 0;
    this.lastPlayerGridY = 0;
    this.viewportX = 0;
    // Smooth viewport position
    this.viewportY = 0;
    this.lastMoveDirection = { dx: 1, dy: 0 };
    this.touchStartPos = null;
    this.joystickPos = null;
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");
    const updateCanvasSize = () => {
      const container = document.getElementById("gameContainer");
      const maxSize = Math.min(container.clientWidth, container.clientHeight - 200);
      this.canvas.width = maxSize;
      this.canvas.height = maxSize;
      this.tileSize = maxSize / 20;
      this.ctx.font = `${this.tileSize}px Arial`;
    };
    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (this.isMobile) {
      this.setupMobileControls();
    }
    this.setupKeyboardHandlers();
    this.init();
    this.lastFrameTime = performance.now();
  }
  init() {
    this.world = generateWorld(100, 100);
    createAnimals(this.world, RESPAWN_CONFIG.FOX_MAX);
    createMonsters(this.world, RESPAWN_CONFIG.MONSTER_MAX);
    createFood(this.world, RESPAWN_CONFIG.FOOD_MAX);
    const startPos = this.findSafeStartPosition();
    this.currentX = startPos.x;
    this.currentY = startPos.y;
    this.viewportX = this.currentX;
    this.viewportY = this.currentY;
    setPlayerPosition(this.currentX + 10, this.currentY + 10);
    this.lastPlayerGridX = Math.floor(playerPosition.x);
    this.lastPlayerGridY = Math.floor(playerPosition.y);
    this.startGameLoop();
  }
  setupKeyboardHandlers() {
    document.addEventListener("keydown", (event) => {
      if (this.isGameOver) {
        if (event.key === "r" || event.key === "R") {
          this.restart();
        }
        return;
      }
      if (event.key === "Shift") {
        this.isSprinting = true;
      }
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
        event.preventDefault();
        this.keyStates[event.key] = true;
      }
      if (event.key === "f") {
        event.preventDefault();
        this.handleAttack();
      }
      if (event.key === " ") {
        event.preventDefault();
        this.keyStates[" "] = true;
        moveAnimals(this.world, playerPosition.x, playerPosition.y, 16.67);
      }
    });
    document.addEventListener("keyup", (event) => {
      if (event.key === "Shift") {
        this.isSprinting = false;
      }
      this.keyStates[event.key] = false;
    });
  }
  setupMobileControls() {
    const controlsContainer = document.createElement("div");
    controlsContainer.id = "mobileControls";
    document.body.appendChild(controlsContainer);
    const joystickArea = document.createElement("canvas");
    joystickArea.id = "joystickArea";
    joystickArea.width = 150;
    joystickArea.height = 150;
    controlsContainer.appendChild(joystickArea);
    this.attackButton = document.createElement("button");
    this.attackButton.id = "attackButton";
    this.attackButton.textContent = "\u2694\uFE0F";
    controlsContainer.appendChild(this.attackButton);
    const style = document.createElement("style");
    style.textContent = `
            #mobileControls {
                position: fixed;
                bottom: 20px;
                left: 0;
                right: 0;
                height: 150px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0 20px;
                pointer-events: none;
                z-index: 1000;
            }

            #joystickArea {
                width: 150px;
                height: 150px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 50%;
                pointer-events: auto;
                touch-action: none;
            }

            #attackButton {
                width: 80px;
                height: 80px;
                background: rgba(255, 0, 0, 0.3);
                border: 2px solid rgba(255, 0, 0, 0.5);
                border-radius: 50%;
                font-size: 32px;
                pointer-events: auto;
                padding: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                -webkit-tap-highlight-color: transparent;
            }
        `;
    document.head.appendChild(style);
    joystickArea.addEventListener("touchstart", this.handleTouchStart.bind(this));
    joystickArea.addEventListener("touchmove", this.handleTouchMove.bind(this));
    joystickArea.addEventListener("touchend", this.handleTouchEnd.bind(this));
    this.attackButton.addEventListener("touchstart", (e) => {
      e.preventDefault();
      this.handleAttack();
    });
  }
  handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = e.target.getBoundingClientRect();
    this.touchStartPos = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    };
    this.joystickPos = { ...this.touchStartPos };
  }
  handleTouchMove(e) {
    e.preventDefault();
    if (!this.touchStartPos)
      return;
    const touch = e.touches[0];
    const rect = e.target.getBoundingClientRect();
    const currentPos = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    };
    const dx = currentPos.x - this.touchStartPos.x;
    const dy = currentPos.y - this.touchStartPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDistance = 50;
    if (distance > maxDistance) {
      const angle = Math.atan2(dy, dx);
      currentPos.x = this.touchStartPos.x + Math.cos(angle) * maxDistance;
      currentPos.y = this.touchStartPos.y + Math.sin(angle) * maxDistance;
    }
    this.joystickPos = currentPos;
    const normalizedDx = (this.joystickPos.x - this.touchStartPos.x) / maxDistance;
    const normalizedDy = (this.joystickPos.y - this.touchStartPos.y) / maxDistance;
    this.keyStates["ArrowRight"] = normalizedDx > 0.3;
    this.keyStates["ArrowLeft"] = normalizedDx < -0.3;
    this.keyStates["ArrowDown"] = normalizedDy > 0.3;
    this.keyStates["ArrowUp"] = normalizedDy < -0.3;
  }
  handleTouchEnd(e) {
    e.preventDefault();
    this.touchStartPos = null;
    this.joystickPos = null;
    this.keyStates["ArrowRight"] = false;
    this.keyStates["ArrowLeft"] = false;
    this.keyStates["ArrowDown"] = false;
    this.keyStates["ArrowUp"] = false;
  }
  render() {
    if (this.isGameOver)
      return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.font = `${this.tileSize}px Arial`;
    const targetViewportX = playerPosition.x - 10;
    const targetViewportY = playerPosition.y - 10;
    const lerpFactor = 0.2;
    this.viewportX = this.viewportX + (targetViewportX - this.viewportX) * lerpFactor;
    this.viewportY = this.viewportY + (targetViewportY - this.viewportY) * lerpFactor;
    for (let y = Math.floor(this.viewportY); y < Math.floor(this.viewportY) + 21; y++) {
      for (let x = Math.floor(this.viewportX); x < Math.floor(this.viewportX) + 21; x++) {
        const screenX = Math.round((x - this.viewportX) * this.tileSize);
        const screenY = Math.round((y - this.viewportY) * this.tileSize);
        if (y >= 0 && y < this.world.length && x >= 0 && x < this.world[0].length) {
          const terrain = TERRAIN_TYPES[this.world[y][x]];
          this.ctx.fillStyle = terrain.backgroundColor;
          this.ctx.fillRect(
            screenX,
            screenY,
            Math.ceil(this.tileSize),
            Math.ceil(this.tileSize)
          );
          this.ctx.fillStyle = "black";
          this.ctx.fillText(
            terrain.symbol,
            screenX,
            screenY + this.tileSize * 0.9
          );
          const food = foods.find((f) => f.x === x && f.y === y);
          if (food) {
            this.ctx.fillText(
              food.symbol,
              screenX,
              screenY + this.tileSize * 0.9
            );
          }
        }
      }
    }
    for (const animal of animals) {
      const screenX = Math.round((animal.x - this.viewportX) * this.tileSize);
      const screenY = Math.round((animal.y - this.viewportY) * this.tileSize);
      if (screenX >= -this.tileSize && screenX <= this.canvas.width + this.tileSize && screenY >= -this.tileSize && screenY <= this.canvas.height + this.tileSize) {
        this.ctx.fillText(
          animal.symbol,
          screenX,
          screenY + this.tileSize * 0.9
        );
      }
    }
    const playerScreenX = Math.round((playerPosition.x - this.viewportX) * this.tileSize);
    const playerScreenY = Math.round((playerPosition.y - this.viewportY) * this.tileSize);
    const PLAYER_SPRITE = "\u{1F9D9}";
    const OUTLINE_COLOR = "white";
    const OUTLINE_WIDTH = 2;
    this.ctx.save();
    this.ctx.strokeStyle = OUTLINE_COLOR;
    this.ctx.lineWidth = OUTLINE_WIDTH;
    this.ctx.strokeText(
      PLAYER_SPRITE,
      playerScreenX,
      playerScreenY + this.tileSize * 0.9
    );
    this.ctx.fillText(
      PLAYER_SPRITE,
      playerScreenX,
      playerScreenY + this.tileSize * 0.9
    );
    this.ctx.restore();
    for (const animation of currentAnimations) {
      const screenX = Math.round((animation.x - this.viewportX) * this.tileSize);
      const screenY = Math.round((animation.y - this.viewportY) * this.tileSize);
      if (screenX >= 0 && screenX < this.canvas.width && screenY >= 0 && screenY < this.canvas.height) {
        this.ctx.save();
        if (animation.type === "sword") {
          this.ctx.translate(screenX + this.tileSize / 2, screenY + this.tileSize / 2);
          if (animation.rotation !== void 0) {
            this.ctx.rotate(animation.rotation);
          }
          if (animation.scale !== void 0) {
            this.ctx.scale(animation.scale, animation.scale);
          }
          this.ctx.fillText(
            animation.symbol,
            -this.tileSize / 2,
            -this.tileSize / 2 + this.tileSize * 0.9
          );
        } else if (animation.type === "damage" || animation.type === "playerDamage") {
          const progress = (Date.now() - animation.startTime) / animation.duration;
          const alpha = 1 - progress;
          const scale = 1 + progress;
          this.ctx.globalAlpha = alpha;
          if (animation.color) {
            this.ctx.fillStyle = animation.color;
          }
          this.ctx.translate(screenX + this.tileSize / 2, screenY + this.tileSize / 2);
          this.ctx.scale(scale, scale);
          this.ctx.fillText(
            animation.symbol,
            -this.tileSize / 2,
            -this.tileSize / 2 + this.tileSize * 0.9
          );
          if (animation.type === "playerDamage" && animation.color) {
            this.ctx.fillStyle = animation.color;
            this.ctx.globalAlpha = alpha * 0.3;
            this.ctx.fillRect(
              -this.tileSize,
              -this.tileSize,
              this.tileSize * 2,
              this.tileSize * 2
            );
          }
        }
        this.ctx.restore();
      }
    }
    clearAnimation();
    const healthElement = document.getElementById("healthValue");
    const levelElement = document.getElementById("levelValue");
    const rankElement = document.getElementById("rankValue");
    const xpElement = document.getElementById("xpValue");
    const xpNeededElement = document.getElementById("xpNeeded");
    const damageElement = document.getElementById("damageValue");
    const staminaElement = document.getElementById("staminaValue");
    if (healthElement) {
      const maxHealth = getMaxHealth();
      const healthPercent = Math.floor(playerHealth / maxHealth * 100);
      healthElement.textContent = `${healthPercent}% (${Math.floor(playerHealth)}/${maxHealth})`;
    }
    if (levelElement) {
      levelElement.textContent = playerLevel.toString();
    }
    if (rankElement) {
      rankElement.textContent = XP_CONFIG.LEVEL_NAMES[playerLevel - 1];
    }
    if (xpElement) {
      xpElement.textContent = playerXP.toString();
    }
    if (xpNeededElement) {
      xpNeededElement.textContent = (XP_CONFIG.XP_PER_LEVEL * playerLevel).toString();
    }
    if (damageElement) {
      const totalDamage = SWORD_DAMAGE + (playerLevel - 1) * XP_CONFIG.DAMAGE_PER_LEVEL;
      damageElement.textContent = totalDamage.toString();
    }
    if (staminaElement) {
      staminaElement.textContent = Math.floor(playerStamina).toString();
    }
    if (this.isMobile && this.touchStartPos && this.joystickPos) {
      const joystickArea = document.getElementById("joystickArea");
      const ctx = joystickArea.getContext("2d");
      ctx.clearRect(0, 0, joystickArea.width, joystickArea.height);
      ctx.beginPath();
      ctx.arc(this.joystickPos.x, this.joystickPos.y, 20, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.fill();
    }
  }
  startGameLoop() {
    const gameLoop = (currentTime) => {
      if (!this.isGameOver) {
        const deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;
        this.updateMovement(deltaTime);
        moveAnimals(this.world, playerPosition.x, playerPosition.y, deltaTime);
        handleRespawns(this.world);
        this.render();
      }
      requestAnimationFrame(gameLoop);
    };
    requestAnimationFrame(gameLoop);
  }
  updateMovement(deltaTime) {
    if (this.isGameOver)
      return;
    let speed = MOVEMENT_CONFIG.BASE_SPEED;
    const isMoving = Object.values(this.keyStates).some((state) => state);
    if (this.isSprinting && isMoving) {
      if (useStamina(STAMINA_CONFIG.SPRINT_COST * (deltaTime / 1e3))) {
        speed *= MOVEMENT_CONFIG.SPRINT_MULTIPLIER;
      }
    } else if (!this.isSprinting && (isMoving || this.keyStates[" "])) {
      regenStamina();
    }
    let dx = 0;
    let dy = 0;
    if (this.keyStates["ArrowUp"])
      dy -= speed;
    if (this.keyStates["ArrowDown"])
      dy += speed;
    if (this.keyStates["ArrowLeft"])
      dx -= speed;
    if (this.keyStates["ArrowRight"])
      dx += speed;
    if (dx !== 0 && dy !== 0) {
      const factor = 1 / Math.sqrt(2);
      dx *= factor;
      dy *= factor;
    }
    dx *= deltaTime;
    dy *= deltaTime;
    if (dx !== 0 || dy !== 0) {
      this.lastMoveDirection = {
        dx: dx === 0 ? 0 : Math.sign(dx),
        dy: dy === 0 ? 0 : Math.sign(dy)
      };
    }
    const newX = playerPosition.x + dx;
    const newY = playerPosition.y + dy;
    const gridX = Math.floor(newX);
    const gridY = Math.floor(newY);
    if (gridX >= 0 && gridX < this.world[0].length && gridY >= 0 && gridY < this.world.length && this.world[gridY][gridX] !== "\u{1F30A}" && this.world[gridY][gridX] !== "\u26F0\uFE0F") {
      movePlayer(dx, dy);
      if (checkEnemyCollision(playerPosition.x, playerPosition.y)) {
        this.handleGameOver();
        return;
      }
      const currentGridX = Math.floor(playerPosition.x);
      const currentGridY = Math.floor(playerPosition.y);
      if (currentGridX !== this.lastPlayerGridX || currentGridY !== this.lastPlayerGridY) {
        this.lastPlayerGridX = currentGridX;
        this.lastPlayerGridY = currentGridY;
      }
      const PICKUP_RADIUS = 0.5;
      const foodIndex = foods.findIndex((f) => {
        const foodDx = f.x - playerPosition.x;
        const foodDy = f.y - playerPosition.y;
        const distance = Math.sqrt(foodDx * foodDx + foodDy * foodDy);
        return distance < PICKUP_RADIUS;
      });
      if (foodIndex !== -1) {
        healPlayer(foods[foodIndex].healAmount);
        foods.splice(foodIndex, 1);
      }
      this.currentX = Math.floor(playerPosition.x) - Math.floor(20 / 2);
      this.currentY = Math.floor(playerPosition.y) - Math.floor(20 / 2);
    }
  }
  handleAttack() {
    const FRAME_COUNT = 12;
    const BASE_RADIUS = 1.2;
    const ARC_RADIUS = BASE_RADIUS * (1 + (playerLevel - 1) * 0.2);
    const ARC_ANGLE = Math.PI * 0.8;
    const ANIMATION_DURATION = 200;
    const FRAME_DURATION = ANIMATION_DURATION / FRAME_COUNT;
    const baseAngle = Math.atan2(this.lastMoveDirection.dy, this.lastMoveDirection.dx);
    for (let i = 0; i < FRAME_COUNT; i++) {
      const progress = i / (FRAME_COUNT - 1);
      const angle = baseAngle - ARC_ANGLE / 2 + ARC_ANGLE * progress;
      const point = {
        x: playerPosition.x + Math.cos(angle) * ARC_RADIUS,
        y: playerPosition.y + Math.sin(angle) * ARC_RADIUS,
        delay: i * FRAME_DURATION
      };
      setTimeout(() => {
        startSwordAnimation(point.x, point.y, FRAME_DURATION, ARC_RADIUS);
      }, point.delay);
    }
    swordAttack(this.world, playerPosition.x, playerPosition.y, baseAngle, ARC_RADIUS);
  }
  findSafeStartPosition() {
    while (true) {
      const x = Math.floor(Math.random() * (this.world[0].length - 20)) + 10;
      const y = Math.floor(Math.random() * (this.world.length - 20)) + 10;
      if (this.world[y][x] !== "\u{1F30A}" && this.world[y][x] !== "\u26F0\uFE0F") {
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
          ([ny, nx]) => ny >= 0 && ny < this.world.length && nx >= 0 && nx < this.world[0].length && this.world[ny][nx] !== "\u{1F30A}" && this.world[ny][nx] !== "\u26F0\uFE0F"
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
  handleGameOver() {
    this.isGameOver = true;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = "white";
    this.ctx.font = "48px Arial";
    this.ctx.textAlign = "center";
    this.ctx.fillText("Game Over!", this.canvas.width / 2, this.canvas.height / 2);
    this.ctx.font = "24px Arial";
    this.ctx.fillText("Press R to restart", this.canvas.width / 2, this.canvas.height / 2 + 40);
    const restartHandler = (event) => {
      if (event.key === "r" || event.key === "R") {
        document.removeEventListener("keydown", restartHandler);
        this.restart();
      }
    };
    document.addEventListener("keydown", restartHandler);
  }
  restart() {
    this.isGameOver = false;
    resetGame();
    this.init();
  }
};
document.addEventListener("DOMContentLoaded", () => {
  new Game();
});
