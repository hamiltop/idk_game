#!/usr/bin/env node
import * as readline from 'readline';

type TerrainType = '🌿' | '⛄' | '🌲' | '🌊';

interface Tile {
    type: TerrainType;
    symbol: string;
}

const TERRAIN_TYPES: Record<TerrainType, Tile> = {
    '🌿': { type: '🌿', symbol: '🌿' },  // grass
    '⛄': { type: '⛄', symbol: '⛄' },  // snowman
    '🌲': { type: '🌲', symbol: '🌲' },  // forest
    '🌊': { type: '🌊', symbol: '🌊' }   // water
};

const FORCE_MONOSPACE = '\u001b[0m';  // ANSI reset code to force monospace

// Add damage values as constants at the top
const MONSTER_DAMAGE = 20;
const SWORD_DAMAGE = 35;

function generateWorld(width: number, height: number): TerrainType[][] {
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
                // Calculate distance from center
                const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
                // Add some noise to the edge
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
        const x = Math.floor(Math.random() * width);
        const y = Math.floor(Math.random() * height);
        const size = 5 + Math.floor(Math.random() * 8);
        createBlob(x, y, size, '🌊');
    }

    // Create forests
    const numForests = 4 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numForests; i++) {
        const x = Math.floor(Math.random() * width);
        const y = Math.floor(Math.random() * height);
        const size = 8 + Math.floor(Math.random() * 7);
        createBlob(x, y, size, '🌲');
    }

    // Create snowman areas
    const numSnowAreas = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < numSnowAreas; i++) {
        let x = Math.floor(Math.random() * width);
        let y = Math.floor(Math.random() * height);
        const size = 6 + Math.floor(Math.random() * 8);
        createBlob(x, y, size, '⛄');
    }

    return world;
}

// Modify the Animal interface to include behavior type and health
interface Animal {
    x: number;
    y: number;
    symbol: string;
    behavior: 'random' | 'chase';  // Add behavior type
    health: number;  // Add health property
}

// Add animals array to track all animals
let animals: Animal[] = [];

// Add function to create monsters specifically
function createMonsters(world: TerrainType[][], count: number) {
    for (let i = 0; i < count; i++) {
        while (true) {
            const x = Math.floor(Math.random() * world[0].length);
            const y = Math.floor(Math.random() * world.length);
            if (world[y][x] !== '🌊' && world[y][x] !== '⛄') {
                animals.push({ 
                    x, 
                    y, 
                    symbol: '👹',
                    behavior: 'chase',
                    health: 100  // Ogres have 100 health
                });
                break;
            }
        }
    }
}

// Modify createAnimals to specify random behavior for foxes and include health
function createAnimals(world: TerrainType[][], count: number) {
    animals = [];
    for (let i = 0; i < count; i++) {
        while (true) {
            const x = Math.floor(Math.random() * world[0].length);
            const y = Math.floor(Math.random() * world.length);
            if (world[y][x] !== '🌊' && world[y][x] !== '⛄') {
                animals.push({ 
                    x, 
                    y, 
                    symbol: '🦊',
                    behavior: 'random',
                    health: 50  // Foxes have 50 health
                });
                break;
            }
        }
    }
}

// Modify moveAnimals to handle different behaviors
function moveAnimals(world: TerrainType[][], playerX: number, playerY: number) {
    for (const animal of animals) {
        if (animal.behavior === 'random' && Math.random() < 0.5) {
            // Random movement for foxes (existing logic)
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
                world[newY][newX] !== '⛄') {
                animal.x = newX;
                animal.y = newY;
            }
        } else if (animal.behavior === 'chase') {
            // Chase behavior for monsters
            const dx = playerX - animal.x;
            const dy = playerY - animal.y;
            
            // Move towards player
            let newX = animal.x;
            let newY = animal.y;
            
            // Move in the direction of the player
            if (Math.abs(dx) > Math.abs(dy)) {
                newX += dx > 0 ? 1 : -1;
            } else {
                newY += dy > 0 ? 1 : -1;
            }

            // Check if new position is valid
            if (newX >= 0 && newX < world[0].length &&
                newY >= 0 && newY < world.length &&
                world[newY][newX] !== '🌊' &&
                world[newY][newX] !== '⛄') {
                animal.x = newX;
                animal.y = newY;
            }
        }
    }
}

// Add health to the top with other globals
let playerHealth = 100;

// Add function to handle player damage
function damagePlayer(amount: number) {
    playerHealth = Math.max(0, playerHealth - amount);
    if (playerHealth === 0) {
        console.clear();
        console.log('Game Over! You died.');
        process.exit();
    }
}

// Add food interface and array
interface Food {
    x: number;
    y: number;
    symbol: string;
    healAmount: number;
}

let foods: Food[] = [];

// Add function to create food
function createFood(world: TerrainType[][], count: number) {
    foods = [];
    for (let i = 0; i < count; i++) {
        // Keep trying until we find a valid position (not water or snowman)
        while (true) {
            const x = Math.floor(Math.random() * world[0].length);
            const y = Math.floor(Math.random() * world.length);
            if (world[y][x] !== '🌊' && world[y][x] !== '⛄') {
                foods.push({ 
                    x, 
                    y, 
                    symbol: '🍎',
                    healAmount: 25  // Heals 25 HP
                });
                break;
            }
        }
    }
}

// Add healing function
function healPlayer(amount: number) {
    playerHealth = Math.min(100, playerHealth + amount);
}

// Add sword attack function
function swordAttack(world: TerrainType[][], playerX: number, playerY: number) {
    // Check all adjacent tiles (including diagonals)
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            const targetX = playerX + dx;
            const targetY = playerY + dy;
            
            // Find any animal at this position
            const targetIndex = animals.findIndex(a => 
                a.x === targetX && a.y === targetY
            );
            
            if (targetIndex !== -1) {
                // Deal damage to the enemy
                animals[targetIndex].health -= SWORD_DAMAGE;
                
                // If enemy is defeated, remove them
                if (animals[targetIndex].health <= 0) {
                    animals.splice(targetIndex, 1);
                }
            }
        }
    }
}

// Modify displayWorld to show health bar and food
function displayWorld(world: TerrainType[][], viewportX: number, viewportY: number) {
    // Clear console
    console.clear();
    
    const VIEWPORT_SIZE = 20;
    const PERSON_POS = Math.floor(VIEWPORT_SIZE / 2);
    
    // Print top border
    console.log('━'.repeat(VIEWPORT_SIZE + 2));
    
    // Print world with side borders
    for (let y = viewportY; y < viewportY + VIEWPORT_SIZE; y++) {
        let line = '┃';
        for (let x = viewportX; x < viewportX + VIEWPORT_SIZE; x++) {
            // Check if position is within world bounds
            if (y >= 0 && y < world.length && x >= 0 && x < world[0].length) {
                // Check if there's an animal at this position
                const animal = animals.find(a => a.x === x && a.y === y);
                const food = foods.find(f => f.x === x && f.y === y);
                if (x - viewportX === PERSON_POS && y - viewportY === PERSON_POS) {
                    line += '👤';
                } else if (animal) {
                    line += animal.symbol;
                } else if (food) {
                    line += food.symbol;
                } else {
                    line += TERRAIN_TYPES[world[y][x]].symbol;
                }
            } else {
                // Show empty space for out of bounds
                line += ' ';
            }
        }
        line += '┃';
        console.log(line);
    }
    
    // Print bottom border
    console.log('━'.repeat(VIEWPORT_SIZE + 2));
    
    // Print legend and viewport info
    console.log('\nLegend:');
    console.log('🌿 - Grass');
    console.log('⛄ - Snow');
    console.log('🌲 - Forest');
    console.log('🌊 - Water');
    console.log('👤 - You');
    console.log('🦊 - Fox (50 HP, wanders randomly)');
    console.log('👹 - Ogre (100 HP, chases you!)');
    console.log('🍎 - Apple (+25 HP)');
    console.log('⚔️  - Press F to attack');
    
    // After the legend, add health bar
    console.log('\nHealth:');
    const healthBarLength = 20;
    const filledHealth = Math.floor((playerHealth / 100) * healthBarLength);
    const healthBar = '♥️'.repeat(filledHealth) + '♡'.repeat(healthBarLength - filledHealth);
    console.log(healthBar);
    console.log(`${playerHealth}%`);
    
    console.log(`\nViewing position: (${viewportX}, ${viewportY})`);
    console.log(`Viewport: 20x20 of 100x100 world`);
}

// Modify setupKeyboardInput to check for fox collisions and food collection
function setupKeyboardInput(
    world: TerrainType[][], 
    viewportX: number, 
    viewportY: number
) {
    // Configure readline
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);

    // Current viewport position
    let currentX = viewportX;
    let currentY = viewportY;

    // Display initial view
    displayWorld(world, currentX, currentY);

    // Handle keyboard input
    process.stdin.on('keypress', (str, key) => {
        if (key.ctrl && key.name === 'c') {
            process.exit();
        } else if (key.name === 'f') {  // Add sword attack on 'f' key
            const playerX = currentX + Math.floor(20 / 2);
            const playerY = currentY + Math.floor(20 / 2);
            swordAttack(world, playerX, playerY);
            
            // Animals still move after you attack
            moveAnimals(world, playerX, playerY);
            
            // Check for collisions after movement
            const collidingAnimal = animals.find(a => 
                a.x === playerX && a.y === playerY
            );
            
            if (collidingAnimal) {
                damagePlayer(MONSTER_DAMAGE);
            }
            
            displayWorld(world, currentX, currentY);
        } else if (key.name === 'space') {
            // Just move animals and redraw
            moveAnimals(world, currentX + Math.floor(20 / 2), currentY + Math.floor(20 / 2));
            
            // Check for fox collision after animals move
            const personWorldX = currentX + Math.floor(20 / 2);
            const personWorldY = currentY + Math.floor(20 / 2);
            const collidingFox = animals.find(a => 
                a.x === personWorldX && a.y === personWorldY
            );
            
            if (collidingFox) {
                damagePlayer(MONSTER_DAMAGE);
            }
            
            displayWorld(world, currentX, currentY);
        } else {
            let newX = currentX;
            let newY = currentY;
            
            // Calculate player's world position
            const playerX = currentX + Math.floor(20 / 2);
            const playerY = currentY + Math.floor(20 / 2);

            switch (key.name) {
                case 'up':
                    if (playerY > 0) {
                        newY--;
                    }
                    break;
                case 'down':
                    if (playerY < world.length - 1) {
                        newY++;
                    }
                    break;
                case 'left':
                    if (playerX > 0) {
                        newX--;
                    }
                    break;
                case 'right':
                    if (playerX < world[0].length - 1) {
                        newX++;
                    }
                    break;
            }

            // Get the new center position in the world coordinates
            const personWorldX = newX + Math.floor(20 / 2);
            const personWorldY = newY + Math.floor(20 / 2);

            // Only move if the new position is not water or snowman
            if (world[personWorldY][personWorldX] !== '🌊' && world[personWorldY][personWorldX] !== '⛄') {
                currentX = newX;
                currentY = newY;
                
                // Check for food collection at new position
                const foodIndex = foods.findIndex(f => 
                    f.x === personWorldX && f.y === personWorldY
                );
                
                if (foodIndex !== -1) {
                    const food = foods[foodIndex];
                    healPlayer(food.healAmount);
                    // Remove collected food
                    foods.splice(foodIndex, 1);
                }
                
                // Check for fox collision at new position
                const collidingFox = animals.find(a => 
                    a.x === personWorldX && a.y === personWorldY
                );
                
                if (collidingFox) {
                    damagePlayer(MONSTER_DAMAGE);  // Foxes do 20 damage on collision
                }
                
                // Update moveAnimals calls to include player position
                moveAnimals(world, personWorldX, personWorldY);
                
                displayWorld(world, currentX, currentY);
            }
        }
    });
}

// Add this new function
function findSafeStartPosition(world: TerrainType[][]): { x: number, y: number } {
    // Try to find a position that's grass or forest and has at least one adjacent safe tile
    while (true) {
        const x = Math.floor(Math.random() * (world[0].length - 20)) + 10;
        const y = Math.floor(Math.random() * (world.length - 20)) + 10;
        
        // Check if current position is safe
        if (world[y][x] !== '🌊' && world[y][x] !== '⛄') {
            // Check if at least one adjacent tile is also safe
            const adjacentSafe = [
                [y-1, x], // up
                [y+1, x], // down
                [y, x-1], // left
                [y, x+1]  // right
            ].some(([ny, nx]) => 
                ny >= 0 && ny < world.length && 
                nx >= 0 && nx < world[0].length && 
                world[ny][nx] !== '🌊' && 
                world[ny][nx] !== '⛄'
            );

            if (adjacentSafe) {
                // Convert to viewport coordinates
                return {
                    x: x - Math.floor(20 / 2),
                    y: y - Math.floor(20 / 2)
                };
            }
        }
    }
}

// Modify main to initialize health and create food
function main() {
    playerHealth = 100;  // Reset health at start
    const world = generateWorld(100, 100);
    createAnimals(world, 10);  // 10 foxes
    createMonsters(world, 3);  // 3 ogres
    createFood(world, 15);  // Add 15 apples to the world
    
    const startPos = findSafeStartPosition(world);
    setupKeyboardInput(world, startPos.x, startPos.y);
    
    // Print instructions
    console.log('\nControls:');
    console.log('Arrow keys - Move viewport');
    console.log('F - Attack with sword');
    console.log('Space - Wait (animals move)');
    console.log('Ctrl+C - Exit');
}

main(); 