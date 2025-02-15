#!/usr/bin/env node
import * as readline from 'readline';
import { 
    TerrainType, 
    TERRAIN_TYPES, 
    generateWorld, 
    createAnimals, 
    createMonsters,
    createFood,
    moveAnimals,
    swordAttack
} from './shared';

// ... copy all the CLI-specific code here (displayWorld, setupKeyboardInput, main) ... 