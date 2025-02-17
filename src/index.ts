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
    getMaxHealth,
    MOVEMENT_CONFIG,
    PlayerPosition,
    playerPosition,
    setPlayerPosition,
    movePlayer
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
    private keyStates: { [key: string]: boolean } = {};
    private lastFrameTime: number = 0;
    private lastPlayerGridX: number = 0;
    private lastPlayerGridY: number = 0;
    private viewportX: number = 0;  // Smooth viewport position
    private viewportY: number = 0;
    
    constructor() {
        this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d')!;
        
        this.canvas.width = 20 * this.tileSize;
        this.canvas.height = 20 * this.tileSize;
        
        // Set font size based on tile size
        this.ctx.font = `${this.tileSize}px Arial`;
        
        this.setupKeyboardHandlers();
        this.init();
        this.lastFrameTime = performance.now();
    }
    
    private init() {
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
    
    private setupKeyboardHandlers() {
        document.addEventListener('keydown', (event) => {
            if (this.isGameOver) {
                if (event.key === 'r' || event.key === 'R') {
                    this.restart();
                }
                return;
            }

            if (event.key === 'Shift') {
                this.isSprinting = true;
            }

            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
                event.preventDefault();
                this.keyStates[event.key] = true;
            }

            if (event.key === 'f') {
                event.preventDefault();
                this.handleAttack();
            }
            if (event.key === ' ') {
                event.preventDefault();
                this.keyStates[' '] = true;  // Track spacebar state
                moveAnimals(this.world, Math.floor(playerPosition.x), Math.floor(playerPosition.y));
            }
        });

        document.addEventListener('keyup', (event) => {
            if (event.key === 'Shift') {
                this.isSprinting = false;
            }
            this.keyStates[event.key] = false;
        });
    }
    
    private render() {
        if (this.isGameOver) return;  // Don't render if game is over
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.font = `${this.tileSize}px Arial`;  // Ensure font size is set
        
        // Smoothly update viewport position
        const targetViewportX = Math.floor(playerPosition.x) - Math.floor(20 / 2);
        const targetViewportY = Math.floor(playerPosition.y) - Math.floor(20 / 2);
        
        // Lerp viewport position
        const lerpFactor = 0.1;
        this.viewportX += (targetViewportX - this.viewportX) * lerpFactor;
        this.viewportY += (targetViewportY - this.viewportY) * lerpFactor;

        // Draw terrain using smoothed viewport
        for (let y = Math.floor(this.viewportY); y < Math.floor(this.viewportY) + 21; y++) {
            for (let x = Math.floor(this.viewportX); x < Math.floor(this.viewportX) + 21; x++) {
                const screenX = (x - this.viewportX) * this.tileSize;
                const screenY = (y - this.viewportY) * this.tileSize;
                
                if (y >= 0 && y < this.world.length && x >= 0 && x < this.world[0].length) {
                    const terrain = TERRAIN_TYPES[this.world[y][x]];
                    
                    // Fill background
                    this.ctx.fillStyle = terrain.backgroundColor;
                    this.ctx.fillRect(
                        screenX, 
                        screenY, 
                        this.tileSize, 
                        this.tileSize
                    );
                    
                    // Draw terrain emoji
                    this.ctx.fillStyle = 'black';  // Reset fillStyle for text
                    this.ctx.fillText(
                        terrain.symbol,
                        screenX,
                        screenY + this.tileSize
                    );
                    
                    // Draw food
                    const food = foods.find(f => f.x === x && f.y === y);
                    if (food) {
                        this.ctx.fillText(food.symbol, screenX, screenY + this.tileSize);
                    }
                }
            }
        }

        // Draw all animals with their exact positions
        for (const animal of animals) {
            const screenX = (animal.x - this.viewportX) * this.tileSize;
            const screenY = (animal.y - this.viewportY) * this.tileSize;
            
            // Only draw if within viewport bounds
            if (screenX >= -this.tileSize && screenX <= this.canvas.width + this.tileSize &&
                screenY >= -this.tileSize && screenY <= this.canvas.height + this.tileSize) {
                this.ctx.fillText(animal.symbol, screenX, screenY + this.tileSize);
            }
        }

        // Draw player with smooth position and outline
        const screenX = (playerPosition.x - this.viewportX) * this.tileSize;
        const screenY = (playerPosition.y - this.viewportY) * this.tileSize;
        
        // Draw player sprite with outline
        const PLAYER_SPRITE = '🧙';  // Change to wizard/mage character
        const OUTLINE_COLOR = 'white';
        const OUTLINE_WIDTH = 2;

        // Draw outline
        this.ctx.save();
        this.ctx.strokeStyle = OUTLINE_COLOR;
        this.ctx.lineWidth = OUTLINE_WIDTH;
        this.ctx.strokeText(PLAYER_SPRITE, screenX, screenY + this.tileSize);
        
        // Draw player sprite
        this.ctx.fillText(PLAYER_SPRITE, screenX, screenY + this.tileSize);
        this.ctx.restore();
        
        // Draw current animations
        for (const animation of currentAnimations) {
            // Convert world coordinates to screen coordinates
            const screenX = (animation.x - this.viewportX) * this.tileSize;
            const screenY = (animation.y - this.viewportY) * this.tileSize;
            
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
        const gameLoop = (currentTime: number) => {
            if (!this.isGameOver) {
                const deltaTime = currentTime - this.lastFrameTime;
                this.lastFrameTime = currentTime;

                this.updateMovement(deltaTime);
                // Update monsters every frame with the same deltaTime
                moveAnimals(this.world, playerPosition.x, playerPosition.y, deltaTime);
                handleRespawns(this.world);
                this.render();
            }
            requestAnimationFrame(gameLoop);
        };
        
        requestAnimationFrame(gameLoop);
    }
    
    private updateMovement(deltaTime: number) {
        if (this.isGameOver) return;

        // Calculate base speed and check if we can sprint
        let speed = MOVEMENT_CONFIG.BASE_SPEED * (deltaTime / 16.67); // Normalize to 60fps
        
        // Only try to sprint if shift is held and we're actually moving
        const isMoving = Object.values(this.keyStates).some(state => state);
        if (this.isSprinting && isMoving) {
            if (useStamina(STAMINA_CONFIG.SPRINT_COST * (deltaTime / 1000))) { // Scale cost with time
                speed *= MOVEMENT_CONFIG.SPRINT_MULTIPLIER;
            }
        } else if (!this.isSprinting && (isMoving || this.keyStates[' '])) {  // Regenerate when moving or holding space
            regenStamina();
        }

        let dx = 0;
        let dy = 0;

        if (this.keyStates['ArrowUp']) dy -= speed;
        if (this.keyStates['ArrowDown']) dy += speed;
        if (this.keyStates['ArrowLeft']) dx -= speed;
        if (this.keyStates['ArrowRight']) dx += speed;

        // Normalize diagonal movement
        if (dx !== 0 && dy !== 0) {
            const factor = 1 / Math.sqrt(2);
            dx *= factor;
            dy *= factor;
        }

        // Calculate new position
        const newX = playerPosition.x + dx;
        const newY = playerPosition.y + dy;

        // Check collision with terrain
        const gridX = Math.floor(newX);
        const gridY = Math.floor(newY);

        if (gridX >= 0 && gridX < this.world[0].length &&
            gridY >= 0 && gridY < this.world.length &&
            this.world[gridY][gridX] !== '🌊' &&
            this.world[gridY][gridX] !== '⛰️') {
            
            movePlayer(dx, dy);

            // Check for collisions with current position
            if (checkEnemyCollision(playerPosition.x, playerPosition.y)) {
                this.handleGameOver();
                return;
            }

            // Check if player has moved to a new grid position
            const currentGridX = Math.floor(playerPosition.x);
            const currentGridY = Math.floor(playerPosition.y);
            
            if (currentGridX !== this.lastPlayerGridX || currentGridY !== this.lastPlayerGridY) {
                // Move monsters only when player changes grid position
                moveAnimals(this.world, playerPosition.x, playerPosition.y, deltaTime);
                if (checkEnemyCollision(currentGridX, currentGridY)) {
                    this.handleGameOver();
                    return;
                }
                
                this.lastPlayerGridX = currentGridX;
                this.lastPlayerGridY = currentGridY;
            }

            // Check for food with radius-based collision
            const PICKUP_RADIUS = 0.5;  // Half a tile radius for pickup
            const foodIndex = foods.findIndex(f => {
                const foodDx = f.x - playerPosition.x;
                const foodDy = f.y - playerPosition.y;
                const distance = Math.sqrt(foodDx * foodDx + foodDy * foodDy);
                return distance < PICKUP_RADIUS;
            });

            if (foodIndex !== -1) {
                healPlayer(foods[foodIndex].healAmount);
                foods.splice(foodIndex, 1);
            }

            // Update viewport target position
            this.currentX = Math.floor(playerPosition.x) - Math.floor(20 / 2);
            this.currentY = Math.floor(playerPosition.y) - Math.floor(20 / 2);
        }
    }

    private handleAttack() {
        // Attack at player's exact position
        startSwordAnimation(playerPosition.x, playerPosition.y);
        swordAttack(this.world, playerPosition.x, playerPosition.y);
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