// Move shared code here (types, interfaces, game logic)
export type TerrainType = '🌿' | '⛰️' | '🌲' | '🌊';

export interface Tile {
    type: TerrainType;
    symbol: string;
}

export interface Animal {
    x: number;
    y: number;
    symbol: string;
    behavior: 'random' | 'chase';
    health: number;
    damage: number;
    isBoss?: boolean;
}

export interface Food {
    x: number;
    y: number;
    symbol: string;
    healAmount: number;
}

export const TERRAIN_TYPES: Record<TerrainType, Tile> = {
    '🌿': { type: '🌿', symbol: '🌿' },
    '⛰️': { type: '⛰️', symbol: '⛰️' },
    '🌲': { type: '🌲', symbol: '🌲' },
    '🌊': { type: '🌊', symbol: '🌊' }
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
    id: number;  // Add unique ID
    type: 'sword';
    x: number;
    y: number;
    duration: number;
    startTime: number;
    symbol: string;
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
    SPRINT_COST: 20,      // Cost per move while sprinting
    REGEN_RATE: 5,        // Amount regenerated per frame when not sprinting
    MAX_STAMINA: 100
};

// Add health configuration
export const HEALTH_CONFIG = {
    BASE_HEALTH: 100,
    HEALTH_PER_LEVEL: 25,  // +25 HP per level
};

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

export function moveAnimals(world: TerrainType[][], playerX: number, playerY: number) {
    for (const animal of animals) {
        if (animal.behavior === 'random' && Math.random() < 0.5) {
            const direction = Math.floor(Math.random() * 4);
            let newX = animal.x;
            let newY = animal.y;

            switch (direction) {
                case 0: newY--; break;
                case 1: newY++; break;
                case 2: newX--; break;
                case 3: newX++; break;
            }

            if (newX >= 0 && newX < world[0].length &&
                newY >= 0 && newY < world.length &&
                world[newY][newX] !== '🌊' &&
                world[newY][newX] !== '⛰️') {
                animal.x = newX;
                animal.y = newY;
            }
        } else if (animal.behavior === 'chase') {
            const dx = playerX - animal.x;
            const dy = playerY - animal.y;
            
            let newX = animal.x;
            let newY = animal.y;
            
            if (Math.abs(dx) > Math.abs(dy)) {
                newX += dx > 0 ? 1 : -1;
            } else {
                newY += dy > 0 ? 1 : -1;
            }

            if (newX >= 0 && newX < world[0].length &&
                newY >= 0 && newY < world.length &&
                world[newY][newX] !== '🌊' &&
                world[newY][newX] !== '⛰️') {
                animal.x = newX;
                animal.y = newY;
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

// Update swordAttack to include level bonus and grant XP
export function swordAttack(world: TerrainType[][], playerX: number, playerY: number) {
    const totalDamage = SWORD_DAMAGE + (playerLevel - 1) * XP_CONFIG.DAMAGE_PER_LEVEL;

    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            const targetX = playerX + dx;
            const targetY = playerY + dy;
            
            const targetIndex = animals.findIndex(a => 
                a.x === targetX && a.y === targetY
            );
            
            if (targetIndex !== -1) {
                const target = animals[targetIndex];
                target.health -= totalDamage;
                
                if (target.health <= 0) {
                    // Find the enemy type to get XP value
                    const enemyType = Object.values(ENEMY_TYPES).find(
                        type => type.symbol === target.symbol
                    );
                    if (enemyType) {
                        gainXP(enemyType.xp, target.isBoss);
                    }
                    animals.splice(targetIndex, 1);
                }
            }
        }
    }
}

export function damagePlayer(amount: number): boolean {
    const newHealth = Math.max(0, playerHealth - amount);
    playerHealth = newHealth;  // Ensure we set a valid number
    return playerHealth === 0;
}

export function healPlayer(amount: number) {
    const maxHealth = getMaxHealth();
    const newHealth = Math.min(maxHealth, playerHealth + amount);
    playerHealth = newHealth;
}

// Add a function to check for enemy collisions consistently
export function checkEnemyCollision(playerX: number, playerY: number): boolean {
    const collidingAnimal = animals.find(a => 
        a.x === playerX && a.y === playerY
    );
    
    if (collidingAnimal) {
        return damagePlayer(collidingAnimal.damage);
    }
    return false;
}

// Add these functions to manage player health
export function setPlayerHealth(health: number) {
    playerHealth = health;
}

// Add respawn functions
export function handleRespawns(world: TerrainType[][]) {
    const now = Date.now();

    // Handle food respawning
    if (now - lastFoodSpawn > RESPAWN_CONFIG.FOOD_INTERVAL) {  // Remove the length check
        if (foods.length < RESPAWN_CONFIG.FOOD_MAX) {
            createFood(world, 1);  // Add one food item
            console.log('Spawned food, total:', foods.length); // Debug log
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
            console.log('Spawned ogre, total monsters:', monsterCount + 1); // Debug log
        }
        
        if (foxCount < RESPAWN_CONFIG.FOX_MAX) {
            createAnimals(world, 1);
            spawned = true;
            console.log('Spawned fox, total foxes:', foxCount + 1); // Debug log
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
}

// Update startSwordAnimation to use level-based effects
export function startSwordAnimation(x: number, y: number, direction: 'up' | 'down' | 'left' | 'right' | 'all') {
    // Get animation based on player level (1-based index)
    const animationSymbol = ATTACK_ANIMATIONS[Math.min(playerLevel - 1, ATTACK_ANIMATIONS.length - 1)];
    
    // Make animations last longer at higher levels
    const baseDuration = 250;
    const levelDurationBonus = (playerLevel - 1) * 25; // +25ms per level
    
    currentAnimations.push({
        id: nextAnimationId++,
        type: 'sword',
        x,
        y,
        duration: baseDuration + levelDurationBonus,
        startTime: Date.now(),
        symbol: animationSymbol
    });
}

// Update clearAnimation to remove finished animations
export function clearAnimation() {
    const now = Date.now();
    currentAnimations = currentAnimations.filter(anim => 
        now - anim.startTime < anim.duration
    );
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