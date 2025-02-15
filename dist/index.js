#!/usr/bin/env node
"use strict";
const TERRAIN_TYPES = {
    '🌿': { type: '🌿', symbol: '🌿 ' }, // grass with padding
    '⛰️': { type: '⛰️', symbol: '⛰️ ' }, // mountain with padding
    '🌲': { type: '🌲', symbol: '🌲 ' }, // forest with padding
    '🌊': { type: '🌊', symbol: '🌊 ' } // water with padding
};
function generateWorld(width, height) {
    const world = [];
    const terrainTypes = ['🌿', '⛰️', '🌲', '🌊'];
    for (let y = 0; y < height; y++) {
        world[y] = [];
        for (let x = 0; x < width; x++) {
            // Simple random generation - you could make this more sophisticated
            const randomIndex = Math.floor(Math.random() * terrainTypes.length);
            world[y][x] = terrainTypes[randomIndex];
        }
    }
    return world;
}
function displayWorld(world, viewportX, viewportY) {
    // Clear console
    console.clear();
    const VIEWPORT_SIZE = 20;
    // Print top border
    console.log('━'.repeat(VIEWPORT_SIZE * 3)); // Adjusted for padded width
    // Print world with side borders, but only the viewport section
    for (let y = viewportY; y < viewportY + VIEWPORT_SIZE && y < world.length; y++) {
        let line = '┃';
        for (let x = viewportX; x < viewportX + VIEWPORT_SIZE && x < world[0].length; x++) {
            line += TERRAIN_TYPES[world[y][x]].symbol;
        }
        // Pad the line if we're at the edge of the world
        while (line.length < VIEWPORT_SIZE * 3 - 1) { // Adjusted for padded width
            line += ' ';
        }
        line += '┃';
        console.log(line);
    }
    // Print bottom border
    console.log('━'.repeat(VIEWPORT_SIZE * 3)); // Adjusted for padded width
    // Print legend and viewport info
    console.log('\nLegend:');
    console.log('🌿  - Grass');
    console.log('⛰️  - Mountain');
    console.log('🌲  - Forest');
    console.log('🌊  - Water');
    console.log(`\nViewing position: (${viewportX}, ${viewportY})`);
    console.log(`Viewport: 20x20 of 100x100 world`);
}
function main() {
    const world = generateWorld(100, 100);
    // Start viewing from position (40, 40) - middle-ish of the world
    displayWorld(world, 40, 40);
}
main();
