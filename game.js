// The Tales of Fjordivik - Complete Game Engine

const TILE_SIZE = 32;
const MAP_WIDTH = 25;
const MAP_HEIGHT = 19;
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const VIEW_WIDTH = CANVAS_WIDTH / TILE_SIZE;
const VIEW_HEIGHT = CANVAS_HEIGHT / TILE_SIZE;

let canvas, ctx, minimapCanvas, minimapCtx;
let gameState = 'menu';
let musicEnabled = true;
let currentLocation = 'townSquare';
let gameRunning = false;
let keys = {};
let lastMoveTime = 0;
const MOVE_SPEED = 150;

const player = {
    x: 12,
    y: 10,
    width: 1,
    height: 1,
    health: 100,
    maxHealth: 100,
    exhaustion: 0,
    inventory: [],
    onMount: false,
    direction: 0,
    interacting: false,
    dialogueIndex: 0,
    currentDialogue: null,
    storyline: 'start',
    hasVisitedCouncil: false,
    questLog: []
};

const vaka = {
    x: 12,
    y: 11,
    stabled: true,
    health: 100,
    maxHealth: 100
};

const TILES = {
    GRASS: 0,
    WATER: 1,
    STONE: 2,
    FOREST: 3,
    MOUNTAIN: 4,
    BUILDING: 5,
    WALL: 6,
    SAND: 7,
    BRIDGE: 8,
    ROAD: 9
};

let worldMap = createWorldMap();

const NPCs = {
    benedict: {
        id: 'benedict',
        name: 'Benedict',
        x: 15,
        y: 12,
        location: 'townSquare',
        sprite: 'npc_elder',
        interiorX: 5,
        interiorY: 5,
        dialogue: {
            start: [
                "Cyprian! I've been looking for you. Have you heard the news about the messengers?",
                "We must be cautious. Something doesn't feel right about this situation.",
                "The Council is meeting tonight. You should attend and hear what they have to say."
            ],
            after_council: [
                "What you witnessed... that was truly terrible.",
                "An Elder, murdered in cold blood. This changes everything."
            ]
        },
        hasMetPlayer: false
    },
    tove: {
        id: 'tove',
        name: 'Tove',
        x: 8,
        y: 8,
        location: 'townSquare',
        sprite: 'npc_woman',
        interiorX: 5,
        interiorY: 5,
        dialogue: {
            start: [
                "Have you heard anything about the messengers? My son Cadmus was supposed to return.",
                "I'm so worried. Please, if you find out anything, let me know.",
                "He's a good boy. Brave and kind."
            ],
            after_murder: [
                "I heard terrible news. One of the messengers attacked the Council?",
                "Was it Cadmus? I cannot bear this uncertainty."
            ]
        },
        hasMetPlayer: false
    },
    operan: {
        id: 'operan',
        name: 'Operan',
        x: 5,
        y: 14,
        location: 'townSquare',
        sprite: 'npc_noble',
        dialogue: {
            start: [
                "Greetings, citizen. The Council is in session.",
                "Strange times are upon us. The disappearance of the High Echelon troubles many."
            ]
        },
        hasMetPlayer: false
    },
    viggo: {
        id: 'viggo',
        name: 'Viggo',
        x: 6,
        y: 12,
        location: 'townSquare',
        sprite: 'npc_vendor',
        dialogue: {
            start: [
                "Fresh fish! Get your fresh fish here!",
                "The marketplace is where all the best gossip happens, friend.",
                "I heard wild stories about those missing messengers!"
            ]
        },
        hasMetPlayer: false
    }
};

const buildings = {
    forge: {
        x: 20,
        y: 9,
        width: 2,
        height: 2,
        name: "Benedict's Forge",
        interior: 'forge',
        npc: 'benedict',
        entryX: 20,
        entryY: 11
    },
    council: {
        x: 1,
        y: 1,
        width: 3,
        height: 3,
        name: 'Council Chambers',
        interior: 'council',
        entryX: 2,
        entryY: 4
    },
    library: {
        x: 10,
        y: 2,
        width: 2,
        height: 2,
        name: 'Library',
        interior: 'library',
        entryX: 10,
        entryY: 4
    },
    stable: {
        x: 23,
        y: 16,
        width: 2,
        height: 2,
        name: 'Stable',
        interior: 'stable',
        entryX: 23,
        entryY: 18
    }
};

const interiors = {
    forge: {
        width: 20,
        height: 15,
        tiles: createInteriorMap('forge'),
        npcs: ['benedict'],
        exitX: 0,
        exitY: 10
    },
    council: {
        width: 20,
        height: 15,
        tiles: createInteriorMap('council'),
        npcs: [],
        exitX: 10,
        exitY: 15
    },
    library: {
        width: 20,
        height: 15,
        tiles: createInteriorMap('library'),
        npcs: [],
        exitX: 0,
        exitY: 5
    },
    stable: {
        width: 20,
        height: 15,
        tiles: createInteriorMap('stable'),
        npcs: [],
        exitX: 0,
        exitY: 5
    }
};

window.onload = function() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    minimapCanvas = document.getElementById('minimap');
    minimapCtx = minimapCanvas.getContext('2d');
    
    setupEventListeners();
    renderStartMenu();
};

function setupEventListeners() {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('keypress', handleKeyPress);
}

function handleKeyDown(e) {
    if (gameState !== 'playing') return;
    
    keys[e.key.toLowerCase()] = true;
    
    const now = Date.now();
    if (now - lastMoveTime < MOVE_SPEED) return;
    
    switch(e.key.toLowerCase()) {
        case 'arrowup':
        case 'w':
            movePlayer(0, -1);
            player.direction = 0;
            lastMoveTime = now;
            e.preventDefault();
            break;
        case 'arrowdown':
        case 's':
            movePlayer(0, 1);
            player.direction = 2;
            lastMoveTime = now;
            e.preventDefault();
            break;
        case 'arrowleft':
        case 'a':
            movePlayer(-1, 0);
            player.direction = 3;
            lastMoveTime = now;
            e.preventDefault();
            break;
        case 'arrowright':
        case 'd':
            movePlayer(1, 0);
            player.direction = 1;
            lastMoveTime = now;
            e.preventDefault();
            break;
    }
}

function handleKeyUp(e) {
    keys[e.key.toLowerCase()] = false;
}

function handleKeyPress(e) {
    if (gameState !== 'playing') return;
    
    switch(e.key.toLowerCase()) {
        case 'e':
            if (player.currentDialogue) {
                advanceDialogue();
            } else {
                interact();
            }
            e.preventDefault();
            break;
        case 'm':
            toggleMount();
            e.preventDefault();
            break;
    }
}

function movePlayer(dx, dy) {
    if (player.interacting && player.currentDialogue) return;
    
    if (currentLocation === 'townSquare') {
        const newX = player.x + dx;
        const newY = player.y + dy;
        
        if (isWalkable(newX, newY, worldMap)) {
            player.x = newX;
            player.y = newY;
            
            if (player.onMount) {
                player.exhaustion = Math.max(0, player.exhaustion - 0.5);
            } else {
                player.exhaustion = Math.min(100, player.exhaustion + 0.3);
            }
            
            if (player.exhaustion > 80) {
                player.health = Math.max(0, player.health - 0.1);
            }
        }
    } else {
        const interior = interiors[currentLocation];
        if (interior) {
            const newX = player.x + dx;
            const newY = player.y + dy;
            
            if (newX >= 0 && newX < interior.width && newY >= 0 && newY < interior.height) {
                const tile = interior.tiles[Math.floor(newY)][Math.floor(newX)];
                if (tile !== TILES.WALL) {
                    player.x = newX;
                    player.y = newY;
                    
                    if (newX <= 1 && newY >= interior.exitY - 1 && newY <= interior.exitY + 1) {
                        exitBuilding();
                    }
                }
            }
        }
    }
}

function interact() {
    if (currentLocation === 'townSquare') {
        for (let npcKey in NPCs) {
            const npc = NPCs[npcKey];
            if (npc.location === 'townSquare' &&
                Math.abs(npc.x - player.x) <= 1 &&
                Math.abs(npc.y - player.y) <= 1) {
                startDialogue(npc);
                return;
            }
        }
        
        for (let buildingKey in buildings) {
            const building = buildings[buildingKey];
            if (player.x >= building.x && player.x < building.x + building.width &&
                player.y >= building.y && player.y < building.y + building.height) {
                enterBuilding(buildingKey);
                return;
            }
        }
    } else {
        const interior = interiors[currentLocation];
        if (interior) {
            for (let npcKey of interior.npcs) {
                const npc = NPCs[npcKey];
                if (npc && 
                    Math.abs(npc.interiorX - player.x) <= 1 &&
                    Math.abs(npc.interiorY - player.y) <= 1) {
                    startDialogue(npc);
                    return;
                }
            }
        }
    }
}

function startDialogue(npc) {
    let dialogueSet;
    
    if (player.hasVisitedCouncil && npc.dialogue.after_council) {
        dialogueSet = npc.dialogue.after_council;
    } else if (npc.hasMetPlayer && npc.dialogue.talked_once) {
        dialogueSet = npc.dialogue.talked_once;
    } else if (npc.dialogue.start) {
        dialogueSet = npc.dialogue.start;
    } else {
        dialogueSet = ['...'];
    }
    
    player.currentDialogue = {
        npc: npc,
        lines: dialogueSet,
        currentLine: 0
    };
    
    player.interacting = true;
    npc.hasMetPlayer = true;
    
    displayDialogue();
}

function displayDialogue() {
    if (!player.currentDialogue) return;
    
    const dialogue = player.currentDialogue;
    const line = dialogue.lines[dialogue.currentLine];
    const dialogueBox = document.getElementById('dialogueBox');
    
    let html = `<h4>${dialogue.npc.name}</h4><div class="dialogue-text">${line}</div>`;
    
    if (dialogue.currentLine < dialogue.lines.length - 1) {
        html += '<div class="dialogue-continue">Press E for more</div>';
    } else {
        html += '<div class="dialogue-continue">Press E to close</div>';
    }
    
    dialogueBox.innerHTML = html;
    dialogueBox.classList.add('active');
}

function advanceDialogue() {
    if (!player.currentDialogue) return;
    
    player.currentDialogue.currentLine++;
    
    if (player.currentDialogue.currentLine >= player.currentDialogue.lines.length) {
        closeDialogue();
    } else {
        displayDialogue();
    }
}

function closeDialogue() {
    document.getElementById('dialogueBox').classList.remove('active');
    player.currentDialogue = null;
    player.interacting = false;
}

function enterBuilding(buildingKey) {
    const building = buildings[buildingKey];
    currentLocation = buildingKey;
    
    player.x = 2;
    player.y = 7;
    
    updateLocationName(building.name);
    
    if (buildingKey === 'council' && !player.hasVisitedCouncil) {
        player.hasVisitedCouncil = true;
    }
}

function exitBuilding() {
    for (let buildingKey in buildings) {
        if (currentLocation === buildingKey) {
            const building = buildings[buildingKey];
            currentLocation = 'townSquare';
            player.x = building.entryX;
            player.y = building.entryY;
            updateLocationName('Fjordivik - Town Square');
            return;
        }
    }
}

function toggleMount() {
    if (currentLocation !== 'townSquare') return;
    
    if (!player.onMount && vaka.stabled) {
        player.onMount = true;
        vaka.stabled = false;
        vaka.x = player.x;
        vaka.y = player.y;
    } else if (player.onMount) {
        player.onMount = false;
        vaka.stabled = true;
    }
}

function isWalkable(x, y, map) {
    if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) return false;
    
    const tile = map[Math.floor(y)][Math.floor(x)];
    const walkableTiles = [TILES.GRASS, TILES.STONE, TILES.ROAD, TILES.BRIDGE];
    if (!walkableTiles.includes(tile)) return false;
    
    for (let buildingKey in buildings) {
        const building = buildings[buildingKey];
        if (currentLocation === 'townSquare' &&
            x >= building.x && x < building.x + building.width &&
            y >= building.y && y < building.y + building.height) {
            return false;
        }
    }
    
    return true;
}

function createWorldMap() {
    const map = [];
    for (let y = 0; y < MAP_HEIGHT; y++) {
        const row = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
            row.push(TILES.GRASS);
        }
        map.push(row);
    }
    
    for (let x = 0; x < MAP_WIDTH; x++) {
        map[10][x] = TILES.ROAD;
    }
    for (let y = 0; y < MAP_HEIGHT; y++) {
        map[y][12] = TILES.ROAD;
    }
    
    for (let x = 0; x < 3; x++) {
        for (let y = 15; y < MAP_HEIGHT; y++) {
            map[y][x] = TILES.WATER;
        }
    }
    
    map[3][0] = TILES.FOREST;
    map[3][1] = TILES.FOREST;
    map[4][1] = TILES.FOREST;
    map[0][23] = TILES.MOUNTAIN;
    map[0][24] = TILES.MOUNTAIN;
    
    return map;
}

function createInteriorMap(buildingType) {
    const map = [];
    for (let y = 0; y < 15; y++) {
        const row = [];
        for (let x = 0; x < 20; x++) {
            if (x === 0 || x === 19 || y === 0 || y === 14) {
                row.push(TILES.WALL);
            } else {
                row.push(TILES.STONE);
            }
        }
        map.push(row);
    }
    
    for (let y = 1; y < 14; y++) {
        for (let x = 1; x < 19; x++) {
            map[y][x] = TILES.STONE;
        }
    }
    
    return map;
}

function startGame() {
    document.getElementById('startMenu').classList.add('menu-hidden');
    gameState = 'playing';
    gameRunning = true;
    gameLoop();
}

function showCredits() {
    const credits = document.getElementById('credits');
    credits.style.display = credits.style.display === 'none' ? 'block' : 'none';
}

function toggleMusic() {
    musicEnabled = !musicEnabled;
    const btn = document.getElementById('musicToggle');
    btn.textContent = musicEnabled ? '🔊 Music: ON' : '🔇 Music: OFF';
}

function updateLocationName(name) {
    document.getElementById('locationName').textContent = 'Fjordivik - ' + name;
}

function updateUI() {
    document.getElementById('healthStat').textContent = Math.floor(player.health);
    document.getElementById('exhaustionStat').textContent = Math.floor(player.exhaustion);
    document.getElementById('itemCount').textContent = player.inventory.length;
}

function gameLoop() {
    update();
    render();
    
    if (gameRunning) {
        requestAnimationFrame(gameLoop);
    }
}

function update() {
    if (player.exhaustion > 60) {
        player.health = Math.max(0, player.health - 0.02);
    }
    
    if (player.exhaustion < 20) {
        player.health = Math.min(player.maxHealth, player.health + 0.01);
    }
    
    if (player.health <= 0) {
        gameRunning = false;
        endGame(false);
    }
}

function render() {
    ctx.fillStyle = '#0f3460';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    if (currentLocation === 'townSquare') {
        renderWorldMap();
    } else {
        renderInterior();
    }
    
    renderMinimap();
    updateUI();
}

function renderWorldMap() {
    const startX = Math.max(0, Math.floor(player.x - VIEW_WIDTH / 2));
    const startY = Math.max(0, Math.floor(player.y - VIEW_HEIGHT / 2));
    const endX = Math.min(MAP_WIDTH, startX + VIEW_WIDTH + 1);
    const endY = Math.min(MAP_HEIGHT, startY + VIEW_HEIGHT + 1);
    
    for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
            const screenX = (x - startX) * TILE_SIZE;
            const screenY = (y - startY) * TILE_SIZE;
            const tile = worldMap[y][x];
            drawTile(screenX, screenY, tile);
        }
    }
    
    for (let buildingKey in buildings) {
        const building = buildings[buildingKey];
        for (let by = 0; by < building.height; by++) {
            for (let bx = 0; bx < building.width; bx++) {
                const x = building.x + bx;
                const y = building.y + by;
                if (x >= startX && x < endX && y >= startY && y < endY) {
                    const screenX = (x - startX) * TILE_SIZE;
                    const screenY = (y - startY) * TILE_SIZE;
                    drawBuilding(screenX, screenY, buildingKey, bx, by);
                }
            }
        }
    }
    
    for (let npcKey in NPCs) {
        const npc = NPCs[npcKey];
        if (npc.location === 'townSquare') {
            if (npc.x >= startX && npc.x < endX && npc.y >= startY && npc.y < endY) {
                const screenX = (npc.x - startX) * TILE_SIZE;
                const screenY = (npc.y - startY) * TILE_SIZE;
                drawNPC(screenX, screenY, npc);
            }
        }
    }
    
    if (player.x >= startX && player.x < endX && player.y >= startY && player.y < endY) {
        const screenX = (player.x - startX) * TILE_SIZE;
        const screenY = (player.y - startY) * TILE_SIZE;
        drawPlayer(screenX, screenY);
    }
    
    if (!vaka.stabled && player.onMount) {
        if (vaka.x >= startX && vaka.x < endX && vaka.y >= startY && vaka.y < endY) {
            const screenX = (vaka.x - startX) * TILE_SIZE;
            const screenY = (vaka.y - startY) * TILE_SIZE;
            drawVaka(screenX, screenY);
        }
    }
}

function renderInterior() {
    const interior = interiors[currentLocation];
    if (!interior) return;
    
    const tiles = interior.tiles;
    const startX = Math.max(0, Math.floor(player.x - VIEW_WIDTH / 2));
    const startY = Math.max(0, Math.floor(player.y - VIEW_HEIGHT / 2));
    const endX = Math.min(interior.width, startX + VIEW_WIDTH + 1);
    const endY = Math.min(interior.height, startY + VIEW_HEIGHT + 1);
    
    for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
            const screenX = (x - startX) * TILE_SIZE;
            const screenY = (y - startY) * TILE_SIZE;
            const tile = tiles[y][x];
            drawTile(screenX, screenY, tile);
        }
    }
    
    for (let npcKey of interior.npcs) {
        const npc = NPCs[npcKey];
        if (npc && npc.interiorX >= startX && npc.interiorX < endX && npc.interiorY >= startY && npc.interiorY < endY) {
            const screenX = (npc.interiorX - startX) * TILE_SIZE;
            const screenY = (npc.interiorY - startY) * TILE_SIZE;
            drawNPC(screenX, screenY, npc);
        }
    }
    
    if (player.x >= startX && player.x < endX && player.y >= startY && player.y < endY) {
        const screenX = (player.x - startX) * TILE_SIZE;
        const screenY = (player.y - startY) * TILE_SIZE;
        drawPlayer(screenX, screenY);
    }
    
    drawExitHint();
}

function drawTile(x, y, tileType) {
    ctx.fillStyle = '#0f3460';
    
    switch(tileType) {
        case TILES.GRASS:
            ctx.fillStyle = '#2d5016';
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = '#3d6b1f';
            ctx.fillRect(x + 4, y + 4, 8, 8);
            break;
        case TILES.WATER:
            ctx.fillStyle = '#0a3d66';
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = '#0d5a99';
            ctx.fillRect(x + 6, y + 6, 12, 12);
            break;
        case TILES.STONE:
            ctx.fillStyle = '#8b7355';
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            ctx.strokeStyle = '#6b5345';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
            break;
        case TILES.FOREST:
            ctx.fillStyle = '#1a3d1a';
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = '#2d5916';
            ctx.beginPath();
            ctx.moveTo(x + 16, y + 4);
            ctx.lineTo(x + 12, y + 20);
            ctx.lineTo(x + 20, y + 20);
            ctx.closePath();
            ctx.fill();
            break;
        case TILES.MOUNTAIN:
            ctx.fillStyle = '#6b6b6b';
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = '#8b8b8b';
            ctx.beginPath();
            ctx.moveTo(x + 16, y + 4);
            ctx.lineTo(x + 4, y + 28);
            ctx.lineTo(x + 28, y + 28);
            ctx.closePath();
            ctx.fill();
            break;
        case TILES.ROAD:
            ctx.fillStyle = '#a89968';
            ctx.fillRect(x, y, TILE_SIZE*

