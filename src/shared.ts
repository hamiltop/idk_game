// Move shared code here (types, interfaces, game logic)
export type TerrainType = '🌿' | '⛰️' | '🌲' | '🌊';

export interface Tile {
    type: TerrainType;
    symbol: string;
    backgroundColor: string;
}

export interface Animal {
    x: number;
    y: number;
    symbol: string;
    behavior: 'random' | 'chase';
    health: number;
    damage: number;
    isBoss?: boolean;
    direction?: number;  // Add direction for random movement
}

export interface Food {
    x: number;
    y: number;
    symbol: string;
    healAmount: number;
}

export const TERRAIN_TYPES: Record<TerrainType, Tile> = {
    '🌿': { type: '🌿', symbol: '🌿', backgroundColor: '#3B7A23' },  // Natural grass green
    '⛰️': { type: '⛰️', symbol: '⛰️', backgroundColor: '#A0522D' },  // Brown
    '🌲': { type: '🌲', symbol: '🌲', backgroundColor: '#1B4D1B' },  // Darker forest green
    '🌊': { type: '🌊', symbol: '🌊', backgroundColor: '#4169E1' }   // Royal blue
};

export const MONSTER_DAMAGE = 20;
export const SWORD_DAMAGE = 35;

// Shared state
export let animals: Animal[] = [];
export let foods: Food[] = [];
export let playerHealth = 100;
export let playerStamina = 100;

// Add respawn configuration
export const RESPAWN_CONFIG = {
    FOOD_INTERVAL: 3000,    // Every 3 seconds
    FOOD_MAX: 15,
    MONSTER_INTERVAL: 5000, // Every 5 seconds
    MONSTER_MAX: 3,
    FOX_MAX: 10
};

// Add last spawn time tracking
let lastFoodSpawn = Date.now();
let lastMonsterSpawn = Date.now();

// Add XP and level configuration
export const XP_CONFIG = {
    FOX_XP: 10,
    OGRE_XP: 25,
    XP_PER_LEVEL: 100,
    DAMAGE_PER_LEVEL: 5,
    MAX_LEVEL: 10,
    LEVEL_NAMES: [
        'Novice',        // Level 1
        'Apprentice',    // Level 2
        'Fighter',       // Level 3
        'Warrior',       // Level 4
        'Veteran',       // Level 5
        'Elite',         // Level 6
        'Master',        // Level 7
        'Champion',      // Level 8
        'Hero',          // Level 9
        'Legend'         // Level 10
    ]
};

// Add XP to shared state
export let playerXP = 0;
export let playerLevel = 1;

// Add animation state
export interface AnimationState {
    id: number;
    type: 'sword' | 'damage' | 'playerDamage';  // Add new animation types
    x: number;
    y: number;
    duration: number;
    startTime: number;
    symbol: string;
    rotation?: number;
    scale?: number;
    color?: string;  // Add color for damage effects
}

// Change to array of animations
export let currentAnimations: AnimationState[] = [];
let nextAnimationId = 0;

// Add level-based animation symbols
const ATTACK_ANIMATIONS = [
    '💢',  // Level 1: Impact
    '💥',  // Level 2: Explosion
    '⚡',  // Level 3: Lightning
    '🔥',  // Level 4: Fire
    '✨',  // Level 5: Sparkles
    '💫',  // Level 6: Dizzy
    '🌟',  // Level 7: Star
    '☄️',  // Level 8: Comet
    '🌈',  // Level 9: Rainbow
    '⭐'   // Level 10: Gold Star
];

// Add new enemy types with level requirements
export const ENEMY_TYPES = {
    FOX: {
        symbol: '🦊',
        health: 50,
        damage: 15,
        xp: 10,
        behavior: 'random' as const,
        minLevel: 1
    },
    WOLF: {
        symbol: '🐺',
        health: 75,
        damage: 25,
        xp: 20,
        behavior: 'chase' as const,
        minLevel: 3
    },
    OGRE: {
        symbol: '👹',
        health: 100,
        damage: 30,
        xp: 25,
        behavior: 'chase' as const,
        minLevel: 1
    },
    DRAGON: {
        symbol: '🐉',
        health: 200,
        damage: 40,
        xp: 50,
        behavior: 'chase' as const,
        minLevel: 5
    },
    DEMON: {
        symbol: '👿',
        health: 300,
        damage: 50,
        xp: 75,
        behavior: 'chase' as const,
        minLevel: 7
    },
    BOSS: {
        symbol: '💀',
        health: 500,
        damage: 75,
        xp: 150,
        behavior: 'chase' as const,
        minLevel: 9
    }
};

export const STAMINA_CONFIG = {
    SPRINT_COST: 30,          // Reduced from 40 to 30 per second
    REGEN_RATE: 0.8,          // Increased from 0.5 to 0.8 per frame
    MAX_STAMINA: 100
};

// Add health configuration
export const HEALTH_CONFIG = {
    BASE_HEALTH: 100,
    HEALTH_PER_LEVEL: 25,  // +25 HP per level
};

// Add movement configuration
export const MOVEMENT_CONFIG = {
    BASE_SPEED: 0.004,        // Adjusted for deltaTime
    SPRINT_MULTIPLIER: 3.5,   // Unchanged
    GRID_SIZE: 1
};

// Add player position with sub-grid precision
export interface PlayerPosition {
    x: number;
    y: number;
}

export let playerPosition: PlayerPosition = {
    x: 0,
    y: 0
};

// Add setter for player position
export function setPlayerPosition(x: number, y: number) {
    playerPosition.x = x;
    playerPosition.y = y;
}

// Add function to update player position with deltas
export function movePlayer(dx: number, dy: number) {
    playerPosition.x += dx;
    playerPosition.y += dy;
}

export function generateWorld(width: number, height: number): TerrainType[][] {
    const world: TerrainType[][] = [];
    
    // Initialize with grass
    for (let y = 0; y < height; y++) {
        world[y] = [];
        for (let x = 0; x < width; x++) {
            world[y][x] = '🌿';
        }
    }

    // Helper to create a blob of terrain
    function createBlob(centerX: number, centerY: number, radius: number, type: TerrainType) {
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

    // Create several water bodies
    const numLakes = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numLakes; i++) {
        createBlob(
            Math.floor(Math.random() * width),
            Math.floor(Math.random() * height),
            5 + Math.floor(Math.random() * 8),
            '🌊'
        );
    }

    // Create mountain ranges (instead of snow areas)
    const numMountainRanges = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < numMountainRanges; i++) {
        createBlob(
            Math.floor(Math.random() * width),
            Math.floor(Math.random() * height),
            6 + Math.floor(Math.random() * 8),
            '⛰️'
        );
    }

    // Create forests
    const numForests = 4 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numForests; i++) {
        createBlob(
            Math.floor(Math.random() * width),
            Math.floor(Math.random() * height),
            8 + Math.floor(Math.random() * 7),
            '🌲'
        );
    }

    return world;
}

export function createAnimals(world: TerrainType[][], count: number) {
    for (let i = 0; i < count; i++) {
        while (true) {
            const x = Math.floor(Math.random() * world[0].length);
            const y = Math.floor(Math.random() * world.length);
            if (world[y][x] !== '🌊' && world[y][x] !== '⛰️') {
                animals.push({ 
                    x, 
                    y, 
                    symbol: '🦊',
                    behavior: 'random',
                    health: 50,
                    damage: 15
                });
                break;
            }
        }
    }
}

export function createMonsters(world: TerrainType[][], count: number) {
    // Get available enemy types based on player level
    const availableTypes = Object.values(ENEMY_TYPES).filter(
        type => type.minLevel <= playerLevel
    );

    // Chance to spawn a boss (10% chance if level is high enough)
    const canSpawnBoss = playerLevel >= ENEMY_TYPES.BOSS.minLevel;
    const shouldSpawnBoss = canSpawnBoss && Math.random() < 0.1;

    if (shouldSpawnBoss) {
        spawnEnemy(world, ENEMY_TYPES.BOSS, true);
        return;
    }

    for (let i = 0; i < count; i++) {
        // Pick random enemy type from available ones
        const enemyType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        spawnEnemy(world, enemyType);
    }
}

function spawnEnemy(world: TerrainType[][], enemyType: typeof ENEMY_TYPES[keyof typeof ENEMY_TYPES], isBoss = false) {
    while (true) {
        const x = Math.floor(Math.random() * world[0].length);
        const y = Math.floor(Math.random() * world.length);
        if (world[y][x] !== '🌊' && world[y][x] !== '⛰️') {
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

export function createFood(world: TerrainType[][], count: number) {
    for (let i = 0; i < count; i++) {
        while (true) {
            const x = Math.floor(Math.random() * world[0].length);
            const y = Math.floor(Math.random() * world.length);
            if (world[y][x] !== '🌊' && world[y][x] !== '⛰️') {
                foods.push({ 
                    x, 
                    y, 
                    symbol: '🍎',
                    healAmount: 25
                });
                break;
            }
        }
    }
}

// Add monster speed configuration
export const MONSTER_SPEED = {
    RANDOM: 0.03,    // Very slow wandering
    CHASE: 0.06,     // Regular chase speed
    BOSS: 0.04       // Slower but relentless
};

// Update MonsterMoveState to include recoil
interface MonsterMoveState {
    targetX: number;
    targetY: number;
    isMoving: boolean;
    recoilDx?: number;  // Recoil direction and magnitude
    recoilDy?: number;
    recoilEndTime?: number;
}

const monsterStates: Map<Animal, MonsterMoveState> = new Map();

// Add recoil configuration
export const RECOIL_CONFIG = {
    DURATION: 200,    // Recoil effect duration in ms
    STRENGTH: 0.5     // How far they get pushed back
};

// Add collision configuration
export const COLLISION_CONFIG = {
    RADIUS: 0.4  // Collision radius (in grid units)
};

// Add damage cooldown configuration
export const DAMAGE_CONFIG = {
    COOLDOWN: 500,  // Milliseconds between damage hits
    LAST_HIT: 0     // Track last damage time
};

// Update collision check to respect cooldown
export function checkEnemyCollision(playerX: number, playerY: number): boolean {
    const now = Date.now();
    if (now - DAMAGE_CONFIG.LAST_HIT < DAMAGE_CONFIG.COOLDOWN) {
        return false;  // Still in cooldown
    }

    const collidingAnimal = animals.find(animal => {
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

// Add configuration for minimum distance
export const MONSTER_CONFIG = {
    MIN_DISTANCE: 0.6,  // Minimum distance monsters must keep from player
    ATTACK_RANGE: COLLISION_CONFIG.RADIUS  // Keep existing attack range
};

// Update moveAnimals to handle recoil
export function moveAnimals(world: TerrainType[][], playerX: number, playerY: number, deltaTime: number) {
    const timeScale = deltaTime / 16.67;
    const now = Date.now();

    for (const animal of animals) {
        // Initialize state if needed
        if (!monsterStates.has(animal)) {
            monsterStates.set(animal, { targetX: animal.x, targetY: animal.y, isMoving: false });
        }
        const state = monsterStates.get(animal)!;

        // Handle recoil if active
        if (state.recoilEndTime && now < state.recoilEndTime && state.recoilDx && state.recoilDy) {
            const progress = (state.recoilEndTime - now) / RECOIL_CONFIG.DURATION;
            const newX = animal.x + state.recoilDx * progress * timeScale;
            const newY = animal.y + state.recoilDy * progress * timeScale;

            // Check if new position is valid
            const gridX = Math.floor(newX);
            const gridY = Math.floor(newY);
            
            if (gridX >= 0 && gridX < world[0].length &&
                gridY >= 0 && gridY < world.length &&
                world[gridY][gridX] !== '🌊' &&
                world[gridY][gridX] !== '⛰️') {
                animal.x = newX;
                animal.y = newY;
            }
            continue;  // Skip normal movement while recoiling
        }

        let speed = MONSTER_SPEED.CHASE;
        if (animal.behavior === 'random') {
            speed = MONSTER_SPEED.RANDOM;
            
            // Always move foxes in their current direction
            if (!animal.direction) {
                animal.direction = Math.random() * Math.PI * 2;
            }
            
            // Change direction occasionally
            if (Math.random() < 0.02) {
                animal.direction = Math.random() * Math.PI * 2;
            }

            const dx = Math.cos(animal.direction);
            const dy = Math.sin(animal.direction);
            
            const newX = animal.x + dx * speed * timeScale;
            const newY = animal.y + dy * speed * timeScale;
            
            // Check if new position is valid
            const gridX = Math.floor(newX);
            const gridY = Math.floor(newY);
            
            if (gridX >= 0 && gridX < world[0].length &&
                gridY >= 0 && gridY < world.length &&
                world[gridY][gridX] !== '🌊' &&
                world[gridY][gridX] !== '⛰️') {
                animal.x = newX;
                animal.y = newY;
            } else {
                // If hitting a wall, reverse direction
                animal.direction = animal.direction + Math.PI;
            }
        } else {
            // Chase movement - move towards player but maintain minimum distance
            if (animal.isBoss) {
                speed = MONSTER_SPEED.BOSS;
            }
            
            const dx = playerX - animal.x;
            const dy = playerY - animal.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Only move if we're outside the minimum distance
            if (distance > MONSTER_CONFIG.MIN_DISTANCE) {
                // If we're moving closer, make sure we won't cross the minimum distance
                const moveX = (dx / distance) * speed * timeScale;
                const moveY = (dy / distance) * speed * timeScale;
                
                const newX = animal.x + moveX;
                const newY = animal.y + moveY;
                
                // Calculate new distance after movement
                const newDx = playerX - newX;
                const newDy = playerY - newY;
                const newDistance = Math.sqrt(newDx * newDx + newDy * newDy);
                
                // Only apply movement if it won't violate minimum distance
                if (newDistance >= MONSTER_CONFIG.MIN_DISTANCE) {
                    // Check if new position is valid
                    const gridX = Math.floor(newX);
                    const gridY = Math.floor(newY);
                    
                    if (gridX >= 0 && gridX < world[0].length &&
                        gridY >= 0 && gridY < world.length &&
                        world[gridY][gridX] !== '🌊' &&
                        world[gridY][gridX] !== '⛰️') {
                        animal.x = newX;
                        animal.y = newY;
                    }
                }
            }
        }
    }
}

// Add XP functions
export function gainXP(amount: number, fromBoss = false) {
    playerXP += fromBoss ? amount * 2 : amount;
    const newLevel = Math.min(Math.floor(playerXP / XP_CONFIG.XP_PER_LEVEL) + 1, XP_CONFIG.MAX_LEVEL);
    
    if (newLevel > playerLevel) {
        playerLevel = newLevel;
        // Heal to full on level up
        playerHealth = getMaxHealth();
    }
}

// Update swordAttack to add recoil
export function swordAttack(world: TerrainType[][], playerX: number, playerY: number, angle: number, attackRadius: number) {
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
                // Apply damage
                target.health -= totalDamage;
                
                // Add damage animation
                currentAnimations.push({
                    id: nextAnimationId++,
                    type: 'damage',
                    x: target.x,
                    y: target.y,
                    duration: DAMAGE_ANIMATION.DURATION,
                    startTime: Date.now(),
                    symbol: DAMAGE_ANIMATION.SYMBOL,
                    color: DAMAGE_ANIMATION.MONSTER_COLOR
                });

                // Add recoil effect
                if (!monsterStates.has(target)) {
                    monsterStates.set(target, { targetX: target.x, targetY: target.y, isMoving: false });
                }
                const state = monsterStates.get(target)!;
                
                // Calculate recoil direction (normalize dx/dy and scale by strength)
                const recoilStrength = RECOIL_CONFIG.STRENGTH * (1 + (playerLevel - 1) * 0.1); // Scale with level
                state.recoilDx = (dx / distance) * recoilStrength;
                state.recoilDy = (dy / distance) * recoilStrength;
                state.recoilEndTime = Date.now() + RECOIL_CONFIG.DURATION;

                if (target.health <= 0) {
                    const enemyType = Object.values(ENEMY_TYPES).find(
                        type => type.symbol === target.symbol
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

// Helper function to normalize angle to [-π, π]
function normalizeAngle(angle: number): number {
    while (angle > Math.PI) angle -= 2 * Math.PI;
    while (angle < -Math.PI) angle += 2 * Math.PI;
    return angle;
}

// Update startSwordAnimation to handle scaling
export function startSwordAnimation(x: number, y: number, duration: number, radius: number) {
    // Clear any existing sword animations
    currentAnimations = currentAnimations.filter(anim => anim.type !== 'sword');
    
    // Scale the sword emoji size with level
    const scale = 1 + (playerLevel - 1) * 0.2;  // 20% increase per level
    
    currentAnimations.push({
        id: nextAnimationId++,
        type: 'sword',
        x,
        y,
        duration: duration,
        startTime: Date.now(),
        symbol: '⚔️',
        rotation: Math.atan2(y - playerPosition.y, x - playerPosition.x),
        scale: scale  // Add scale to animation state
    });
}

// Add damage animation configuration
export const DAMAGE_ANIMATION = {
    MONSTER_COLOR: '#ff0000',
    PLAYER_COLOR: '#ff6666',
    DURATION: 200,
    SYMBOL: '💥'
};

// Update damagePlayer to add visual effect
export function damagePlayer(amount: number): boolean {
    const newHealth = Math.max(0, playerHealth - amount);
    playerHealth = newHealth;

    // Add damage animation around player
    currentAnimations.push({
        id: nextAnimationId++,
        type: 'playerDamage',
        x: playerPosition.x,
        y: playerPosition.y,
        duration: DAMAGE_ANIMATION.DURATION,
        startTime: Date.now(),
        symbol: DAMAGE_ANIMATION.SYMBOL,
        color: DAMAGE_ANIMATION.PLAYER_COLOR
    });

    return playerHealth === 0;
}

export function healPlayer(amount: number) {
    const maxHealth = getMaxHealth();
    const newHealth = Math.min(maxHealth, playerHealth + amount);
    playerHealth = newHealth;
}

// Add these functions to manage player health
export function setPlayerHealth(health: number) {
    playerHealth = health;
}

// Add respawn functions
export function handleRespawns(world: TerrainType[][]) {
    const now = Date.now();

    // Handle food respawning
    if (now - lastFoodSpawn > RESPAWN_CONFIG.FOOD_INTERVAL) {
        if (foods.length < RESPAWN_CONFIG.FOOD_MAX) {
            createFood(world, 1);
        }
        lastFoodSpawn = now;
    }

    // Handle monster respawning
    if (now - lastMonsterSpawn > RESPAWN_CONFIG.MONSTER_INTERVAL) {
        const monsterCount = animals.filter(a => a.behavior === 'chase').length;
        const foxCount = animals.filter(a => a.behavior === 'random').length;

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

// Update resetGame to reset XP and level
export function resetGame() {
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

// Update clearAnimation to be more precise with timing
export function clearAnimation() {
    const now = Date.now();
    currentAnimations = currentAnimations.filter(anim => {
        const elapsed = now - anim.startTime;
        return elapsed < anim.duration;
    });
}

// Add stamina management functions
export function useStamina(amount: number): boolean {
    if (playerStamina >= amount) {
        playerStamina = Math.max(0, playerStamina - amount);
        return true;
    }
    return false;
}

export function regenStamina() {
    playerStamina = Math.min(STAMINA_CONFIG.MAX_STAMINA, playerStamina + STAMINA_CONFIG.REGEN_RATE);
}

// Add function to get max health based on level
export function getMaxHealth(): number {
    return HEALTH_CONFIG.BASE_HEALTH + (playerLevel - 1) * HEALTH_CONFIG.HEALTH_PER_LEVEL;
}

// ... copy all the game logic functions here, but remove any console.log or process references ... 