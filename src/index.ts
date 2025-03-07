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
    private world!: TerrainType[][];  // Use definite assignment assertion
    private currentX!: number;
    private currentY!: number;
    private isGameOver = false;
    private isSprinting = false;
    private keyStates: { [key: string]: boolean } = {};
    private lastFrameTime: number = 0;
    private lastPlayerGridX: number = 0;
    private lastPlayerGridY: number = 0;
    private viewportX: number = 0;  // Smooth viewport position
    private viewportY: number = 0;
    private lastMoveDirection: { dx: number; dy: number } = { dx: 1, dy: 0 };  // Default facing right
    private isMobile: boolean;
    private touchStartPos: { x: number, y: number } | null = null;
    private joystickPos: { x: number, y: number } | null = null;
    private attackButton!: HTMLButtonElement; // Use definite assignment assertion
    
    constructor() {
        this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d')!;
        
        // Update canvas sizing for mobile
        const updateCanvasSize = () => {
            const container = document.getElementById('gameContainer')!;
            const maxSize = Math.min(container.clientWidth, container.clientHeight - 200);
            this.canvas.width = maxSize;
            this.canvas.height = maxSize;
            this.tileSize = maxSize / 20; // Adjust tile size based on canvas size
            this.ctx.font = `${this.tileSize}px Arial`;
        };

        // Initial size
        updateCanvasSize();
        
        // Update size on resize
        window.addEventListener('resize', updateCanvasSize);
        
        this.isMobile = ('ontouchstart' in window) || 
            (navigator.maxTouchPoints > 0) || 
            /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (this.isMobile) {
            this.setupMobileControls();
        }
        
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
                moveAnimals(this.world, playerPosition.x, playerPosition.y, 16.67); // Use default frame time
            }
        });

        document.addEventListener('keyup', (event) => {
            if (event.key === 'Shift') {
                this.isSprinting = false;
            }
            this.keyStates[event.key] = false;
        });
    }
    
    private setupMobileControls() {
        // Create mobile controls container
        const controlsContainer = document.createElement('div');
        controlsContainer.id = 'mobileControls';
        document.body.appendChild(controlsContainer);

        // Create left side controls (just joystick)
        const leftControls = document.createElement('div');
        leftControls.id = 'leftControls';
        controlsContainer.appendChild(leftControls);

        // Create virtual joystick area
        const joystickArea = document.createElement('canvas');
        joystickArea.id = 'joystickArea';
        joystickArea.width = 150;
        joystickArea.height = 150;
        leftControls.appendChild(joystickArea);

        // Create right side controls (attack, sprint, and help)
        const rightControls = document.createElement('div');
        rightControls.id = 'rightControls';
        controlsContainer.appendChild(rightControls);

        // Create action buttons container
        const actionButtons = document.createElement('div');
        actionButtons.id = 'actionButtons';
        rightControls.appendChild(actionButtons);

        // Create attack button
        this.attackButton = document.createElement('button');
        this.attackButton.id = 'attackButton';
        this.attackButton.textContent = '⚔️';
        actionButtons.appendChild(this.attackButton);

        // Create sprint button
        const sprintButton = document.createElement('button');
        sprintButton.id = 'sprintButton';
        sprintButton.textContent = '🏃';
        actionButtons.appendChild(sprintButton);

        // Create help button
        const helpButton = document.createElement('button');
        helpButton.id = 'helpButton';
        helpButton.textContent = '❔';
        rightControls.appendChild(helpButton);

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            #mobileControls {
                position: fixed;
                bottom: 20px;
                left: 0;
                right: 0;
                height: 150px;
                display: flex;
                justify-content: space-between;
                align-items: flex-end;
                padding: 0 20px;
                pointer-events: none;
                z-index: 1000;
            }

            #leftControls {
                pointer-events: auto;
            }

            #rightControls {
                display: flex;
                flex-direction: column;
                gap: 10px;
                pointer-events: auto;
            }

            #actionButtons {
                display: flex;
                gap: 10px;
                margin-bottom: 10px;
            }

            #joystickArea {
                width: 150px;
                height: 150px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 50%;
                touch-action: none;
            }

            .mobile-button {
                width: 60px;
                height: 60px;
                border-radius: 50%;
                font-size: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                -webkit-tap-highlight-color: transparent;
                transition: all 0.2s;
                border: 2px solid rgba(255, 255, 255, 0.5);
            }

            #attackButton {
                background: rgba(255, 0, 0, 0.3);
                border-color: rgba(255, 0, 0, 0.5);
            }

            #sprintButton {
                background: rgba(255, 255, 0, 0.3);
                border-color: rgba(255, 255, 0, 0.5);
            }

            #helpButton {
                width: 40px;
                height: 40px;
                font-size: 18px;
                background: rgba(100, 149, 237, 0.3);
                border-color: rgba(100, 149, 237, 0.5);
                align-self: flex-end;
            }

            .mobile-button:active {
                transform: scale(0.9);
            }

            .mobile-button.active {
                background-color: rgba(255, 255, 255, 0.4);
            }

            #helpOverlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.9);
                display: flex;
                flex-direction: column;
                align-items: center;
                z-index: 3000;
                color: white;
                font-family: Arial, sans-serif;
                overflow: hidden;  /* Prevent body scroll */
            }

            #helpContent {
                flex: 1;
                width: 100%;
                max-width: 600px;
                text-align: center;
                padding: 20px;
                overflow-y: auto;  /* Enable scrolling */
                -webkit-overflow-scrolling: touch;  /* Smooth scroll on iOS */
            }

            #helpContent h2 {
                font-size: 32px;
                margin-bottom: 20px;
                color: #ffd700;
            }

            #helpContent h3 {
                font-size: 24px;
                margin: 15px 0;
                color: #ffd700;
            }

            #helpContent p {
                margin: 10px 0;
                font-size: 18px;
            }

            #closeHelp {
                margin: 20px;  /* Add margin instead of margin-top */
                padding: 10px 20px;
                background: rgba(255, 255, 255, 0.2);
                border: 2px solid white;
                color: white;
                border-radius: 5px;
                font-size: 18px;
                cursor: pointer;
                transition: all 0.2s;
            }

            #closeHelp:active {
                background: rgba(255, 255, 255, 0.4);
                transform: scale(0.95);
            }
        `;
        document.head.appendChild(style);

        // Add common button class
        [this.attackButton, sprintButton, helpButton].forEach(btn => {
            btn.classList.add('mobile-button');
        });

        // Add sprint handlers
        sprintButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.isSprinting = true;
            sprintButton.classList.add('active');
        });

        sprintButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.isSprinting = false;
            sprintButton.classList.remove('active');
        });

        // Add help handler
        helpButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.showHelp();
        });

        // Also add click handler for better compatibility
        helpButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.showHelp();
        });

        // Add touch event listeners
        joystickArea.addEventListener('touchstart', this.handleTouchStart.bind(this));
        joystickArea.addEventListener('touchmove', this.handleTouchMove.bind(this));
        joystickArea.addEventListener('touchend', this.handleTouchEnd.bind(this));
        
        this.attackButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleAttack();
        });
    }

    private handleTouchStart(e: TouchEvent) {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        this.touchStartPos = {
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top
        };
        this.joystickPos = { ...this.touchStartPos };
    }

    private handleTouchMove(e: TouchEvent) {
        e.preventDefault();
        if (!this.touchStartPos) return;

        const touch = e.touches[0];
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        const currentPos = {
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top
        };

        // Calculate direction and magnitude
        const dx = currentPos.x - this.touchStartPos.x;
        const dy = currentPos.y - this.touchStartPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = 50;  // Maximum joystick movement

        if (distance > maxDistance) {
            const angle = Math.atan2(dy, dx);
            currentPos.x = this.touchStartPos.x + Math.cos(angle) * maxDistance;
            currentPos.y = this.touchStartPos.y + Math.sin(angle) * maxDistance;
        }

        this.joystickPos = currentPos;

        // Update movement
        const normalizedDx = (this.joystickPos.x - this.touchStartPos.x) / maxDistance;
        const normalizedDy = (this.joystickPos.y - this.touchStartPos.y) / maxDistance;
        
        this.keyStates['ArrowRight'] = normalizedDx > 0.3;
        this.keyStates['ArrowLeft'] = normalizedDx < -0.3;
        this.keyStates['ArrowDown'] = normalizedDy > 0.3;
        this.keyStates['ArrowUp'] = normalizedDy < -0.3;
    }

    private handleTouchEnd(e: TouchEvent) {
        e.preventDefault();
        this.touchStartPos = null;
        this.joystickPos = null;
        this.keyStates['ArrowRight'] = false;
        this.keyStates['ArrowLeft'] = false;
        this.keyStates['ArrowDown'] = false;
        this.keyStates['ArrowUp'] = false;
    }
    
    private render() {
        if (this.isGameOver) return;  // Don't render if game is over
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.font = `${this.tileSize}px Arial`;  // Ensure font size is set
        
        // Calculate target viewport position (centered on player)
        const targetViewportX = playerPosition.x - 10;  // Center on player (20/2 = 10)
        const targetViewportY = playerPosition.y - 10;

        // Smoothly interpolate viewport position
        const lerpFactor = 0.2;
        this.viewportX = this.viewportX + (targetViewportX - this.viewportX) * lerpFactor;
        this.viewportY = this.viewportY + (targetViewportY - this.viewportY) * lerpFactor;

        // Calculate pixel positions with floating point viewport
        for (let y = Math.floor(this.viewportY); y < Math.floor(this.viewportY) + 21; y++) {
            for (let x = Math.floor(this.viewportX); x < Math.floor(this.viewportX) + 21; x++) {
                // Use floating point math for smooth scrolling
                const screenX = Math.round((x - this.viewportX) * this.tileSize);
                const screenY = Math.round((y - this.viewportY) * this.tileSize);
                
                if (y >= 0 && y < this.world.length && x >= 0 && x < this.world[0].length) {
                    const terrain = TERRAIN_TYPES[this.world[y][x]];
                    
                    // Fill background with exact pixel boundaries
                    this.ctx.fillStyle = terrain.backgroundColor;
                    this.ctx.fillRect(
                        screenX,
                        screenY,
                        Math.ceil(this.tileSize),
                        Math.ceil(this.tileSize)
                    );
                    
                    // Draw terrain emoji
                    this.ctx.fillStyle = 'black';
                    this.ctx.fillText(
                        terrain.symbol,
                        screenX,
                        screenY + this.tileSize * 0.9
                    );
                    
                    // Draw food with same positioning
                    const food = foods.find(f => f.x === x && f.y === y);
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

        // Draw entities with floating point positions
        for (const animal of animals) {
            const screenX = Math.round((animal.x - this.viewportX) * this.tileSize);
            const screenY = Math.round((animal.y - this.viewportY) * this.tileSize);
            
            if (screenX >= -this.tileSize && screenX <= this.canvas.width + this.tileSize &&
                screenY >= -this.tileSize && screenY <= this.canvas.height + this.tileSize) {
                this.ctx.fillText(
                    animal.symbol,
                    screenX,
                    screenY + this.tileSize * 0.9
                );
            }
        }

        // Draw player with floating point position
        const playerScreenX = Math.round((playerPosition.x - this.viewportX) * this.tileSize);
        const playerScreenY = Math.round((playerPosition.y - this.viewportY) * this.tileSize);
        
        // Draw player sprite with outline
        const PLAYER_SPRITE = '🧙';  // Change to wizard/mage character
        const OUTLINE_COLOR = 'white';
        const OUTLINE_WIDTH = 2;

        // Draw outline
        this.ctx.save();
        this.ctx.strokeStyle = OUTLINE_COLOR;
        this.ctx.lineWidth = OUTLINE_WIDTH;
        this.ctx.strokeText(
            PLAYER_SPRITE,
            playerScreenX,
            playerScreenY + this.tileSize * 0.9
        );
        
        // Draw player sprite
        this.ctx.fillText(
            PLAYER_SPRITE,
            playerScreenX,
            playerScreenY + this.tileSize * 0.9
        );
        this.ctx.restore();
        
        // Draw current animations
        for (const animation of currentAnimations) {
            const screenX = Math.round((animation.x - this.viewportX) * this.tileSize);
            const screenY = Math.round((animation.y - this.viewportY) * this.tileSize);
            
            if (screenX >= 0 && screenX < this.canvas.width && 
                screenY >= 0 && screenY < this.canvas.height) {
                this.ctx.save();
                
                if (animation.type === 'sword') {
                    // Existing sword animation code
                    this.ctx.translate(screenX + this.tileSize/2, screenY + this.tileSize/2);
                    if (animation.rotation !== undefined) {
                        this.ctx.rotate(animation.rotation);
                    }
                    if (animation.scale !== undefined) {
                        this.ctx.scale(animation.scale, animation.scale);
                    }
                    this.ctx.fillText(
                        animation.symbol,
                        -this.tileSize/2,
                        -this.tileSize/2 + this.tileSize * 0.9
                    );
                } else if (animation.type === 'damage' || animation.type === 'playerDamage') {
                    // Draw damage effect
                    const progress = (Date.now() - animation.startTime) / animation.duration;
                    const alpha = 1 - progress;  // Fade out
                    const scale = 1 + progress;  // Grow while fading
                    
                    this.ctx.globalAlpha = alpha;
                    if (animation.color) {
                        this.ctx.fillStyle = animation.color;
                    }
                    
                    this.ctx.translate(screenX + this.tileSize/2, screenY + this.tileSize/2);
                    this.ctx.scale(scale, scale);
                    this.ctx.fillText(
                        animation.symbol,
                        -this.tileSize/2,
                        -this.tileSize/2 + this.tileSize * 0.9
                    );

                    // Add flash effect for player damage
                    if (animation.type === 'playerDamage' && animation.color) {
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

        // Draw joystick if active
        if (this.isMobile && this.touchStartPos && this.joystickPos) {
            const joystickArea = document.getElementById('joystickArea') as HTMLCanvasElement; // Add type assertion
            const ctx = joystickArea.getContext('2d')!;
            ctx.clearRect(0, 0, joystickArea.width, joystickArea.height);
            
            ctx.beginPath();
            ctx.arc(this.joystickPos.x, this.joystickPos.y, 20, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.fill();
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

        // Calculate base speed (remove 60fps normalization)
        let speed = MOVEMENT_CONFIG.BASE_SPEED;
        
        // Only try to sprint if shift is held and we're actually moving
        const isMoving = Object.values(this.keyStates).some(state => state);
        if (this.isSprinting && isMoving) {
            if (useStamina(STAMINA_CONFIG.SPRINT_COST * (deltaTime / 1000))) {
                speed *= MOVEMENT_CONFIG.SPRINT_MULTIPLIER;
            }
        } else if (!this.isSprinting && (isMoving || this.keyStates[' '])) {
            regenStamina();
        }

        let dx = 0;
        let dy = 0;

        // Apply movement based on keys
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

        // Apply deltaTime after all calculations
        dx *= deltaTime;
        dy *= deltaTime;

        // Track movement direction when moving
        if (dx !== 0 || dy !== 0) {
            this.lastMoveDirection = {
                dx: dx === 0 ? 0 : Math.sign(dx),
                dy: dy === 0 ? 0 : Math.sign(dy)
            };
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

            // Update grid position tracking (but don't move monsters here)
            const currentGridX = Math.floor(playerPosition.x);
            const currentGridY = Math.floor(playerPosition.y);
            
            if (currentGridX !== this.lastPlayerGridX || currentGridY !== this.lastPlayerGridY) {
                this.lastPlayerGridX = currentGridX;
                this.lastPlayerGridY = currentGridY;
            }

            // Check for food with radius-based collision
            const PICKUP_RADIUS = 0.5;
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
        // Calculate attack points in a smooth arc
        const FRAME_COUNT = 12;
        const BASE_RADIUS = 1.2;
        // Scale radius with level (20% increase per level)
        const ARC_RADIUS = BASE_RADIUS * (1 + (playerLevel - 1) * 0.2);
        const ARC_ANGLE = Math.PI * 0.8;
        const ANIMATION_DURATION = 200;
        const FRAME_DURATION = ANIMATION_DURATION / FRAME_COUNT;

        // Calculate base angle from movement direction
        const baseAngle = Math.atan2(this.lastMoveDirection.dy, this.lastMoveDirection.dx);
        
        // Create sequential animation frames
        for (let i = 0; i < FRAME_COUNT; i++) {
            const progress = i / (FRAME_COUNT - 1);
            const angle = baseAngle - (ARC_ANGLE / 2) + (ARC_ANGLE * progress);
            
            const point = {
                x: playerPosition.x + Math.cos(angle) * ARC_RADIUS,
                y: playerPosition.y + Math.sin(angle) * ARC_RADIUS,
                delay: i * FRAME_DURATION
            };

            // Schedule each frame
            setTimeout(() => {
                startSwordAnimation(point.x, point.y, FRAME_DURATION, ARC_RADIUS);
            }, point.delay);
        }

        // Apply damage in the entire arc area
        swordAttack(this.world, playerPosition.x, playerPosition.y, baseAngle, ARC_RADIUS);
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
        
        // Create game over container
        const gameOverContainer = document.createElement('div');
        gameOverContainer.id = 'gameOverContainer';
        document.body.appendChild(gameOverContainer);

        // Create game over message
        const gameOverMessage = document.createElement('div');
        gameOverMessage.id = 'gameOverMessage';
        gameOverMessage.textContent = 'Game Over!';
        gameOverContainer.appendChild(gameOverMessage);

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            #gameOverContainer {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 20px;
                background: rgba(0, 0, 0, 0.8);
                z-index: 2000;
            }

            #gameOverMessage {
                font-size: 48px;
                color: white;
                text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
                font-family: Arial, sans-serif;
            }

            #restartButton {
                padding: 15px 30px;
                font-size: 24px;
                background: rgba(255, 255, 255, 0.2);
                border: 2px solid white;
                border-radius: 10px;
                color: white;
                cursor: pointer;
                -webkit-tap-highlight-color: transparent;
                transition: all 0.2s;
            }

            #restartButton:active {
                background: rgba(255, 255, 255, 0.4);
                transform: scale(0.95);
            }
        `;
        document.head.appendChild(style);

        if (this.isMobile) {
            // Create restart button for mobile
            const restartButton = document.createElement('button');
            restartButton.id = 'restartButton';
            restartButton.textContent = '🔄 Restart';
            gameOverContainer.appendChild(restartButton);

            // Add touch handler with click fallback
            restartButton.addEventListener('touchstart', (e) => {
                e.preventDefault();
                gameOverContainer.remove();
                this.restart();
            });
            
            // Add click handler as fallback
            restartButton.addEventListener('click', (e) => {
                e.preventDefault();
                gameOverContainer.remove();
                this.restart();
            });
        } else {
            const keyboardInstructions = document.createElement('div');
            keyboardInstructions.textContent = 'Press R to restart';
            keyboardInstructions.style.cssText = 'color: white; font-size: 24px;';
            gameOverContainer.appendChild(keyboardInstructions);

            const restartHandler = (event: KeyboardEvent) => {
                if (event.key === 'r' || event.key === 'R') {
                    document.removeEventListener('keydown', restartHandler);
                    gameOverContainer.remove();
                    this.restart();
                }
            };
            document.addEventListener('keydown', restartHandler);
        }
    }

    private restart() {
        // Remove game over container if it exists
        const gameOverContainer = document.getElementById('gameOverContainer');
        if (gameOverContainer) {
            gameOverContainer.remove();
        }
        
        this.isGameOver = false;
        resetGame();
        this.init();
    }

    private showHelp() {
        const helpOverlay = document.createElement('div');
        helpOverlay.id = 'helpOverlay';

        const helpContent = document.createElement('div');
        helpContent.id = 'helpContent';
        helpContent.innerHTML = `
            <h2>How to Play</h2>
            <p>🧙 You are a wizard in a dangerous world!</p>
            <p>⚔️ Attack monsters to gain XP and level up</p>
            <p>🍎 Collect apples to heal</p>
            <p>🏃 Hold sprint to move faster (uses stamina)</p>
            <br>
            <h3>Controls</h3>
            <p>Left side: Virtual joystick for movement</p>
            <p>Right side: Attack (⚔️) and Sprint (🏃) buttons</p>
            <br>
            <h3>Enemies:</h3>
            <p>🦊 Fox (50 HP, 15 DMG) = 10 XP</p>
            <p>🐺 Wolf (75 HP, 25 DMG) = 20 XP</p>
            <p>👹 Ogre (100 HP, 30 DMG) = 25 XP</p>
            <p>🐉 Dragon (200 HP, 40 DMG) = 50 XP</p>
            <p>👿 Demon (300 HP, 50 DMG) = 75 XP</p>
            <p>💀 Boss (500 HP, 75 DMG) = 150 XP</p>
        `;

        const closeButton = document.createElement('button');
        closeButton.id = 'closeHelp';
        closeButton.textContent = 'Close';

        // Add both touch and click handlers for the close button
        closeButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            helpOverlay.remove();
        });
        closeButton.addEventListener('click', () => helpOverlay.remove());

        helpOverlay.appendChild(helpContent);
        helpOverlay.appendChild(closeButton);
        document.body.appendChild(helpOverlay);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Game();
}); 