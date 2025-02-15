import { 
    TerrainType, 
    TERRAIN_TYPES, 
    generateWorld, 
    createAnimals, 
    createMonsters,
    createFood,
    moveAnimals,
    swordAttack,
    animals,
    foods,
    playerHealth,
    damagePlayer,
    healPlayer,
    checkEnemyCollision,
    setPlayerHealth,
    resetGame,
    handleRespawns,
    RESPAWN_CONFIG,
    playerXP,
    playerLevel,
    XP_CONFIG,
    currentAnimation,
    startSwordAnimation,
    clearAnimation,
    currentAnimations,
    SWORD_DAMAGE,
    playerStamina,
    STAMINA_CONFIG,
    useStamina,
    regenStamina,
    getMaxHealth
} from './shared';

class Game {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private tileSize = 48;
    private world: TerrainType[][];
    private currentX: number;
    private currentY: number;
    private isGameOver = false;
    private isSprinting = false;
    
    constructor() {
        this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d')!;
        
        this.canvas.width = 20 * this.tileSize;
        this.canvas.height = 20 * this.tileSize;
        
        // Set font size based on tile size
        this.ctx.font = `${this.tileSize}px Arial`;
        
        this.setupKeyboardHandlers();
        this.init();
    }
    
    private init() {
        this.world = generateWorld(100, 100);
        createAnimals(this.world, RESPAWN_CONFIG.FOX_MAX);
        createMonsters(this.world, RESPAWN_CONFIG.MONSTER_MAX);
        createFood(this.world, RESPAWN_CONFIG.FOOD_MAX);
        
        const startPos = this.findSafeStartPosition();
        this.currentX = startPos.x;
        this.currentY = startPos.y;
        this.startGameLoop();
    }
    
    private setupKeyboardHandlers() {
        document.addEventListener('keydown', (event) => {
            if (this.isGameOver) {
                if (event.key === 'r' || event.key === 'R') {
                    this.restart();
                }
                return;
            }

            // Add shift key for sprint
            if (event.key === 'Shift') {
                this.isSprinting = true;
            }

            switch(event.key) {
                case 'ArrowUp':
                case 'ArrowDown':
                case 'ArrowLeft':
                case 'ArrowRight':
                case 'f':
                case ' ':
                    event.preventDefault();
                    this.handleInput(event.key);
                    break;
            }
        });

        // Add keyup handler for shift
        document.addEventListener('keyup', (event) => {
            if (event.key === 'Shift') {
                this.isSprinting = false;
            }
        });
    }
    
    private render() {
        if (this.isGameOver) return;  // Don't render if game is over
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.font = `${this.tileSize}px Arial`;  // Ensure font size is set
        
        // Draw terrain
        for (let y = this.currentY; y < this.currentY + 20; y++) {
            for (let x = this.currentX; x < this.currentX + 20; x++) {
                const screenX = (x - this.currentX) * this.tileSize;
                const screenY = (y - this.currentY) * this.tileSize;
                
                if (y >= 0 && y < this.world.length && x >= 0 && x < this.world[0].length) {
                    // Draw terrain
                    this.ctx.fillText(
                        TERRAIN_TYPES[this.world[y][x]].symbol,
                        screenX,
                        screenY + this.tileSize
                    );
                    
                    // Draw food
                    const food = foods.find(f => f.x === x && f.y === y);
                    if (food) {
                        this.ctx.fillText(food.symbol, screenX, screenY + this.tileSize);
                    }
                    
                    // Draw animals
                    const animal = animals.find(a => a.x === x && a.y === y);
                    if (animal) {
                        this.ctx.fillText(animal.symbol, screenX, screenY + this.tileSize);
                    }
                }
            }
        }
        
        // Draw player
        const playerScreenX = Math.floor(20 / 2) * this.tileSize;
        const playerScreenY = Math.floor(20 / 2) * this.tileSize;
        this.ctx.fillText('👤', playerScreenX, playerScreenY + this.tileSize);
        
        // Draw current animations
        for (const animation of currentAnimations) {
            // Convert world coordinates to screen coordinates
            const screenX = (animation.x - this.currentX) * this.tileSize;
            const screenY = (animation.y - this.currentY) * this.tileSize;
            
            // Only draw if the animation is within the viewport
            if (screenX >= 0 && screenX < this.canvas.width && 
                screenY >= 0 && screenY < this.canvas.height) {
                this.ctx.fillText(animation.symbol, screenX, screenY + this.tileSize);
            }
        }
        clearAnimation();  // Clean up finished animations
        
        // Update UI elements
        const healthElement = document.getElementById('healthValue');
        const levelElement = document.getElementById('levelValue');
        const rankElement = document.getElementById('rankValue');
        const xpElement = document.getElementById('xpValue');
        const xpNeededElement = document.getElementById('xpNeeded');
        const damageElement = document.getElementById('damageValue');
        const staminaElement = document.getElementById('staminaValue');

        if (healthElement) {
            const maxHealth = getMaxHealth();
            const healthPercent = Math.floor((playerHealth / maxHealth) * 100);
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
    }
    
    private startGameLoop() {
        const gameLoop = () => {
            if (!this.isGameOver) {
                handleRespawns(this.world);
                this.render();
            }
            requestAnimationFrame(gameLoop);
        };
        
        gameLoop();
    }
    
    private handleInput(key: string) {
        if (this.isGameOver) return;

        let newX = this.currentX;
        let newY = this.currentY;
        const playerX = this.currentX + Math.floor(20 / 2);
        const playerY = this.currentY + Math.floor(20 / 2);

        // Calculate movement speed
        let moveCount = 1;
        if (this.isSprinting && useStamina(STAMINA_CONFIG.SPRINT_COST)) {
            moveCount = 2;  // Move 2 tiles when sprinting
        } else if (!this.isSprinting) {
            regenStamina();  // Only regenerate stamina when not sprinting and monsters are moving
        }

        switch(key) {
            case 'ArrowUp':
                if (playerY > 0) newY -= moveCount;
                break;
            case 'ArrowDown':
                if (playerY < this.world.length - 1) newY += moveCount;
                break;
            case 'ArrowLeft':
                if (playerX > 0) newX -= moveCount;
                break;
            case 'ArrowRight':
                if (playerX < this.world[0].length - 1) newX += moveCount;
                break;
            case 'f':
                // Show sword animations in all 8 directions around player
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        if (dx === 0 && dy === 0) continue; // Skip player's position
                        startSwordAnimation(
                            playerX + dx,
                            playerY + dy,
                            'all'  // New direction type for multi-directional attack
                        );
                    }
                }
                
                swordAttack(this.world, playerX, playerY);
                moveAnimals(this.world, playerX, playerY);
                if (checkEnemyCollision(playerX, playerY)) {
                    this.handleGameOver();
                }
                break;
            case ' ':
                moveAnimals(this.world, playerX, playerY);
                if (checkEnemyCollision(playerX, playerY)) {
                    this.handleGameOver();
                }
                break;
        }

        if (key !== 'f' && key !== ' ') {
            const newPlayerX = newX + Math.floor(20 / 2);
            const newPlayerY = newY + Math.floor(20 / 2);

            if (this.world[newPlayerY][newPlayerX] !== '🌊' && 
                this.world[newPlayerY][newPlayerX] !== '⛰️') {
                this.currentX = newX;
                this.currentY = newY;

                // Check for collisions at new position
                if (checkEnemyCollision(newPlayerX, newPlayerY)) {
                    this.handleGameOver();
                    return;
                }

                // Check for food
                const foodIndex = foods.findIndex(f => 
                    f.x === newPlayerX && f.y === newPlayerY
                );
                if (foodIndex !== -1) {
                    healPlayer(foods[foodIndex].healAmount);
                    foods.splice(foodIndex, 1);
                }

                // Move animals and check for collisions again
                moveAnimals(this.world, newPlayerX, newPlayerY);
                if (checkEnemyCollision(newPlayerX, newPlayerY)) {
                    this.handleGameOver();
                }
            }
        }
    }
    
    private findSafeStartPosition(): { x: number, y: number } {
        // Try to find a position that's grass or forest and has at least one adjacent safe tile
        while (true) {
            const x = Math.floor(Math.random() * (this.world[0].length - 20)) + 10;
            const y = Math.floor(Math.random() * (this.world.length - 20)) + 10;
            
            // Check if current position is safe
            if (this.world[y][x] !== '🌊' && this.world[y][x] !== '⛰️') {
                // Check if at least one adjacent tile is also safe
                const adjacentSafe = [
                    [y-1, x], // up
                    [y+1, x], // down
                    [y, x-1], // left
                    [y, x+1]  // right
                ].some(([ny, nx]) => 
                    ny >= 0 && ny < this.world.length && 
                    nx >= 0 && nx < this.world[0].length && 
                    this.world[ny][nx] !== '🌊' && 
                    this.world[ny][nx] !== '⛰️'
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

    private handleGameOver() {
        this.isGameOver = true;
        
        // Clear the canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw game over message
        this.ctx.fillStyle = 'white';
        this.ctx.font = '48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Game Over!', this.canvas.width / 2, this.canvas.height / 2);
        
        this.ctx.font = '24px Arial';
        this.ctx.fillText('Press R to restart', this.canvas.width / 2, this.canvas.height / 2 + 40);
        
        // Add restart handler
        const restartHandler = (event: KeyboardEvent) => {
            if (event.key === 'r' || event.key === 'R') {
                document.removeEventListener('keydown', restartHandler);
                this.restart();
            }
        };
        document.addEventListener('keydown', restartHandler);
    }

    private restart() {
        this.isGameOver = false;
        resetGame();  // Use the new reset function instead of directly modifying playerHealth
        this.init();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Game();
}); 