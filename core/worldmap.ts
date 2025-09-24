// Ultima 4-Style Top-Down World Map System
// For overworld navigation between cities and locations

import type { Vector2, Direction } from './types.ts';

export interface WorldLocation {
  id: string;
  name: string;
  type: 'city' | 'dungeon' | 'special' | 'shop' | 'safe_house';
  position: Vector2;
  
  // Visual representation
  sprite: string;         // Sprite ID for map icon
  color: string;          // Fallback color if no sprite
  size: number;           // Size multiplier for icon
  
  // Interaction
  canEnter: boolean;
  requiresKey?: string;   // Key item needed to enter
  description: string;
  
  // Connection to other systems
  sideScrollArea?: string; // ID of associated side-scroll area
  shopInventory?: string[];
  
  // Dynamic state
  discovered: boolean;    // Has player found this location?
  visited: boolean;       // Has player been here?
  threat: number;         // Danger level (0-10)
}

export interface WorldTerrain {
  id: string;
  name: string;
  walkable: boolean;
  sprite: string;
  color: string;
  
  // Movement costs (higher = slower)
  movementCost: number;
  
  // Environmental effects
  damagePerTurn?: number; // Environmental damage
  specialEffect?: string; // Special terrain effect
}

export interface WorldMap {
  id: string;
  name: string;
  width: number;
  height: number;
  
  // Terrain grid
  terrain: number[][]; // 2D array of terrain IDs
  
  // Locations on the map
  locations: WorldLocation[];
  
  // Player spawn point
  playerSpawn: Vector2;
  
  // Visual settings
  tileSize: number;
  backgroundColor: string;
}

export interface WorldMapCamera {
  position: Vector2;
  zoom: number;
  targetZoom: number;
  smoothing: number;
  
  // View constraints
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
}

export class WorldMapSystem {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private currentMap: WorldMap | null = null;
  private camera: WorldMapCamera;
  
  // Terrain types registry
  private terrainTypes: Map<number, WorldTerrain> = new Map();
  
  // Player state
  private playerPosition: Vector2 = { x: 0, y: 0 };
  private playerFacing: Direction = 'south';
  private isMoving: boolean = false;
  private moveAnimationTime: number = 0;
  private moveDuration: number = 200; // ms per tile movement
  
  // Input handling
  private keys: Set<string> = new Set();
  private lastMoveTime: number = 0;
  private moveDelay: number = 150; // Minimum time between moves
  
  // UI state
  private selectedLocation: WorldLocation | null = null;
  private showLocationInfo: boolean = false;
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    
    // Initialize camera
    this.camera = {
      position: { x: 0, y: 0 },
      zoom: 2.0,
      targetZoom: 2.0,
      smoothing: 0.1,
      bounds: {
        minX: 0,
        maxX: 1000,
        minY: 0,
        maxY: 1000
      }
    };
    
    this.initializeTerrainTypes();
    this.setupInput();
  }

  private initializeTerrainTypes(): void {
    // Register terrain types (Ultima 4 style)
    this.terrainTypes.set(0, {
      id: 'grassland',
      name: 'Grassland',
      walkable: true,
      sprite: 'grass',
      color: '#228B22',
      movementCost: 1
    });
    
    this.terrainTypes.set(1, {
      id: 'forest',
      name: 'Forest',
      walkable: true,
      sprite: 'forest',
      color: '#006400',
      movementCost: 2
    });
    
    this.terrainTypes.set(2, {
      id: 'mountain',
      name: 'Mountains',
      walkable: false,
      sprite: 'mountain',
      color: '#8B4513',
      movementCost: 999
    });
    
    this.terrainTypes.set(3, {
      id: 'desert',
      name: 'Desert',
      walkable: true,
      sprite: 'desert',
      color: '#F4A460',
      movementCost: 3,
      damagePerTurn: 1
    });
    
    this.terrainTypes.set(4, {
      id: 'swamp',
      name: 'Swamp',
      walkable: true,
      sprite: 'swamp',
      color: '#556B2F',
      movementCost: 4,
      damagePerTurn: 2
    });
    
    this.terrainTypes.set(5, {
      id: 'road',
      name: 'Road',
      walkable: true,
      sprite: 'road',
      color: '#A0522D',
      movementCost: 0.5
    });
    
    this.terrainTypes.set(6, {
      id: 'water',
      name: 'Water',
      walkable: false, // Unless player has boat
      sprite: 'water',
      color: '#4169E1',
      movementCost: 999
    });
    
    this.terrainTypes.set(7, {
      id: 'ruins',
      name: 'Ruins',
      walkable: true,
      sprite: 'ruins',
      color: '#696969',
      movementCost: 2,
      specialEffect: 'radiation'
    });
  }

  private setupInput(): void {
    document.addEventListener('keydown', (e) => {
      this.keys.add(e.key.toLowerCase());
    });
    
    document.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase());
    });
    
    // Mouse/click handling for locations
    this.canvas.addEventListener('click', (e) => {
      this.handleMapClick(e);
    });
  }

  private handleMapClick(event: MouseEvent): void {
    if (!this.currentMap) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    
    // Convert screen coordinates to world coordinates
    const worldX = (clickX / this.camera.zoom) + this.camera.position.x;
    const worldY = (clickY / this.camera.zoom) + this.camera.position.y;
    
    // Check if clicking on a location
    const clickedLocation = this.getLocationAt(worldX, worldY);
    if (clickedLocation && clickedLocation.discovered) {
      this.selectedLocation = clickedLocation;
      this.showLocationInfo = true;
    } else {
      this.showLocationInfo = false;
      this.selectedLocation = null;
    }
  }

  private getLocationAt(x: number, y: number): WorldLocation | null {
    if (!this.currentMap) return null;
    
    const tileSize = this.currentMap.tileSize;
    const tolerance = tileSize / 2;
    
    for (const location of this.currentMap.locations) {
      const locationScreenX = location.position.x * tileSize;
      const locationScreenY = location.position.y * tileSize;
      
      if (Math.abs(x - locationScreenX) < tolerance &&
          Math.abs(y - locationScreenY) < tolerance) {
        return location;
      }
    }
    
    return null;
  }

  // Load world map
  loadMap(map: WorldMap): void {
    this.currentMap = map;
    this.playerPosition = { ...map.playerSpawn };
    
    // Set camera bounds
    this.camera.bounds = {
      minX: 0,
      maxX: map.width * map.tileSize - this.canvas.width / this.camera.zoom,
      minY: 0,
      maxY: map.height * map.tileSize - this.canvas.height / this.camera.zoom
    };
    
    // Center camera on player
    this.centerCameraOnPlayer();
  }

  private centerCameraOnPlayer(): void {
    if (!this.currentMap) return;
    
    const tileSize = this.currentMap.tileSize;
    this.camera.position.x = (this.playerPosition.x * tileSize) - (this.canvas.width / this.camera.zoom) / 2;
    this.camera.position.y = (this.playerPosition.y * tileSize) - (this.canvas.height / this.camera.zoom) / 2;
    
    // Constrain to bounds
    this.constrainCamera();
  }

  private constrainCamera(): void {
    this.camera.position.x = Math.max(this.camera.bounds.minX, 
      Math.min(this.camera.bounds.maxX, this.camera.position.x));
    this.camera.position.y = Math.max(this.camera.bounds.minY, 
      Math.min(this.camera.bounds.maxY, this.camera.position.y));
  }

  // Handle input for world map movement
  handleInput(): void {
    if (!this.currentMap || this.isMoving) return;
    
    const now = Date.now();
    if (now - this.lastMoveTime < this.moveDelay) return;
    
    let targetX = this.playerPosition.x;
    let targetY = this.playerPosition.y;
    let newFacing = this.playerFacing;
    
    // Movement input
    if (this.keys.has('w') || this.keys.has('arrowup')) {
      targetY--;
      newFacing = 'north';
    } else if (this.keys.has('s') || this.keys.has('arrowdown')) {
      targetY++;
      newFacing = 'south';
    } else if (this.keys.has('a') || this.keys.has('arrowleft')) {
      targetX--;
      newFacing = 'west';
    } else if (this.keys.has('d') || this.keys.has('arrowright')) {
      targetX++;
      newFacing = 'east';
    }
    
    // Check if movement is valid
    if (targetX !== this.playerPosition.x || targetY !== this.playerPosition.y) {
      if (this.canMoveTo(targetX, targetY)) {
        this.movePlayer(targetX, targetY);
        this.playerFacing = newFacing;
        this.lastMoveTime = now;
      } else {
        // Can't move, but still update facing
        this.playerFacing = newFacing;
      }
    }
    
    // Other actions
    if (this.keys.has('enter') || this.keys.has(' ')) {
      this.tryEnterLocation();
    }
    
    // Zoom controls
    if (this.keys.has('=') || this.keys.has('+')) {
      this.camera.targetZoom = Math.min(4.0, this.camera.targetZoom * 1.1);
    } else if (this.keys.has('-') || this.keys.has('_')) {
      this.camera.targetZoom = Math.max(0.5, this.camera.targetZoom * 0.9);
    }
  }

  private canMoveTo(x: number, y: number): boolean {
    if (!this.currentMap) return false;
    
    // Check bounds
    if (x < 0 || x >= this.currentMap.width || y < 0 || y >= this.currentMap.height) {
      return false;
    }
    
    // Check terrain walkability
    const terrainId = this.currentMap.terrain[y][x];
    const terrain = this.terrainTypes.get(terrainId);
    
    return terrain ? terrain.walkable : false;
  }

  private movePlayer(x: number, y: number): void {
    if (!this.currentMap) return;
    
    this.isMoving = true;
    this.moveAnimationTime = 0;
    
    // Calculate movement cost for animation speed
    const terrainId = this.currentMap.terrain[y][x];
    const terrain = this.terrainTypes.get(terrainId);
    const movementCost = terrain ? terrain.movementCost : 1;
    
    this.moveDuration = 150 * Math.max(0.5, movementCost);
    
    this.playerPosition.x = x;
    this.playerPosition.y = y;
    
    // Check for location discovery
    this.checkLocationDiscovery();
    
    // Apply environmental effects
    this.applyEnvironmentalEffects();
  }

  private checkLocationDiscovery(): void {
    if (!this.currentMap) return;
    
    // Discover nearby locations
    for (const location of this.currentMap.locations) {
      const distance = Math.abs(location.position.x - this.playerPosition.x) +
                      Math.abs(location.position.y - this.playerPosition.y);
      
      if (distance <= 3 && !location.discovered) {
        location.discovered = true;
        console.log(`Discovered: ${location.name}`);
        // You could trigger a discovery animation/sound here
      }
    }
  }

  private applyEnvironmentalEffects(): void {
    if (!this.currentMap) return;
    
    const terrainId = this.currentMap.terrain[this.playerPosition.y][this.playerPosition.x];
    const terrain = this.terrainTypes.get(terrainId);
    
    if (terrain && terrain.damagePerTurn) {
      // Apply environmental damage
      console.log(`Environmental damage: ${terrain.damagePerTurn} from ${terrain.name}`);
      // You'd integrate this with your health/needs system
    }
    
    if (terrain && terrain.specialEffect) {
      console.log(`Special effect: ${terrain.specialEffect}`);
      // Handle special terrain effects
    }
  }

  private tryEnterLocation(): void {
    // Check if player is on a location
    const currentLocation = this.getCurrentLocation();
    if (currentLocation && currentLocation.canEnter) {
      if (currentLocation.requiresKey) {
        // Check if player has required key
        console.log(`Requires key: ${currentLocation.requiresKey}`);
        return;
      }
      
      this.enterLocation(currentLocation);
    }
  }

  private getCurrentLocation(): WorldLocation | null {
    if (!this.currentMap) return null;
    
    return this.currentMap.locations.find(location => 
      location.position.x === this.playerPosition.x &&
      location.position.y === this.playerPosition.y
    ) || null;
  }

  private enterLocation(location: WorldLocation): void {
    console.log(`Entering: ${location.name}`);
    location.visited = true;
    
    // Trigger transition to side-scroll or other system
    if (location.sideScrollArea) {
      this.onLocationEnter?.(location);
    }
  }

  // Callback for when player enters a location
  onLocationEnter?: (location: WorldLocation) => void;

  // Update world map
  update(deltaTime: number): void {
    this.handleInput();
    
    // Update movement animation
    if (this.isMoving) {
      this.moveAnimationTime += deltaTime;
      if (this.moveAnimationTime >= this.moveDuration) {
        this.isMoving = false;
        this.moveAnimationTime = 0;
      }
    }
    
    // Update camera zoom
    if (Math.abs(this.camera.targetZoom - this.camera.zoom) > 0.01) {
      this.camera.zoom += (this.camera.targetZoom - this.camera.zoom) * this.camera.smoothing;
    }
    
    // Update camera position to follow player
    this.updateCameraPosition();
  }

  private updateCameraPosition(): void {
    if (!this.currentMap) return;
    
    const tileSize = this.currentMap.tileSize;
    const targetX = (this.playerPosition.x * tileSize) - (this.canvas.width / this.camera.zoom) / 2;
    const targetY = (this.playerPosition.y * tileSize) - (this.canvas.height / this.camera.zoom) / 2;
    
    this.camera.position.x += (targetX - this.camera.position.x) * this.camera.smoothing;
    this.camera.position.y += (targetY - this.camera.position.y) * this.camera.smoothing;
    
    this.constrainCamera();
  }

  // Render world map
  render(): void {
    if (!this.currentMap) return;
    
    // Clear canvas
    this.ctx.fillStyle = this.currentMap.backgroundColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.save();
    
    // Apply camera transform
    this.ctx.scale(this.camera.zoom, this.camera.zoom);
    this.ctx.translate(-this.camera.position.x, -this.camera.position.y);
    
    // Render terrain
    this.renderTerrain();
    
    // Render locations
    this.renderLocations();
    
    // Render player
    this.renderPlayer();
    
    this.ctx.restore();
    
    // Render UI
    this.renderUI();
  }

  private renderTerrain(): void {
    if (!this.currentMap) return;
    
    const tileSize = this.currentMap.tileSize;
    const startX = Math.floor(this.camera.position.x / tileSize);
    const startY = Math.floor(this.camera.position.y / tileSize);
    const endX = Math.min(this.currentMap.width, startX + Math.ceil(this.canvas.width / (tileSize * this.camera.zoom)) + 2);
    const endY = Math.min(this.currentMap.height, startY + Math.ceil(this.canvas.height / (tileSize * this.camera.zoom)) + 2);
    
    for (let y = Math.max(0, startY); y < endY; y++) {
      for (let x = Math.max(0, startX); x < endX; x++) {
        const terrainId = this.currentMap.terrain[y][x];
        const terrain = this.terrainTypes.get(terrainId);
        
        if (terrain) {
          this.ctx.fillStyle = terrain.color;
          this.ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
          
          // Add simple texture pattern
          if (terrain.id === 'water') {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            this.ctx.fillRect(x * tileSize + 2, y * tileSize + 2, tileSize - 4, tileSize - 4);
          } else if (terrain.id === 'forest') {
            this.ctx.fillStyle = 'rgba(0, 100, 0, 0.5)';
            this.ctx.fillRect(x * tileSize + 1, y * tileSize + 1, tileSize - 2, tileSize - 2);
          }
        }
      }
    }
  }

  private renderLocations(): void {
    if (!this.currentMap) return;
    
    const tileSize = this.currentMap.tileSize;
    
    for (const location of this.currentMap.locations) {
      if (!location.discovered) continue;
      
      const x = location.position.x * tileSize;
      const y = location.position.y * tileSize;
      
      // Location background
      this.ctx.fillStyle = location.visited ? '#FFD700' : '#FFA500';
      this.ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);
      
      // Location icon based on type
      this.ctx.fillStyle = location.color;
      const centerX = x + tileSize / 2;
      const centerY = y + tileSize / 2;
      const size = (tileSize / 2) * location.size;
      
      switch (location.type) {
        case 'city':
          this.ctx.fillRect(centerX - size/2, centerY - size/2, size, size);
          break;
        case 'dungeon':
          this.ctx.beginPath();
          this.ctx.arc(centerX, centerY, size/2, 0, Math.PI * 2);
          this.ctx.fill();
          break;
        case 'shop':
          // Diamond shape
          this.ctx.beginPath();
          this.ctx.moveTo(centerX, centerY - size/2);
          this.ctx.lineTo(centerX + size/2, centerY);
          this.ctx.lineTo(centerX, centerY + size/2);
          this.ctx.lineTo(centerX - size/2, centerY);
          this.ctx.closePath();
          this.ctx.fill();
          break;
      }
      
      // Selection highlight
      if (this.selectedLocation === location) {
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, tileSize, tileSize);
      }
    }
  }

  private renderPlayer(): void {
    if (!this.currentMap) return;
    
    const tileSize = this.currentMap.tileSize;
    let x = this.playerPosition.x * tileSize;
    let y = this.playerPosition.y * tileSize;
    
    // Apply movement animation
    if (this.isMoving) {
      const progress = this.moveAnimationTime / this.moveDuration;
      const eased = 0.5 - 0.5 * Math.cos(progress * Math.PI); // Smooth ease-in-out
      
      // Animate from previous position (this is simplified)
      // In a full implementation, you'd track the previous position
    }
    
    // Player body
    this.ctx.fillStyle = '#FFFF00'; // Yellow player
    this.ctx.fillRect(x + 4, y + 4, tileSize - 8, tileSize - 8);
    
    // Player border
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x + 4, y + 4, tileSize - 8, tileSize - 8);
    
    // Direction indicator
    this.ctx.fillStyle = '#FF0000';
    const centerX = x + tileSize / 2;
    const centerY = y + tileSize / 2;
    
    switch (this.playerFacing) {
      case 'north':
        this.ctx.fillRect(centerX - 2, y + 2, 4, 4);
        break;
      case 'south':
        this.ctx.fillRect(centerX - 2, y + tileSize - 6, 4, 4);
        break;
      case 'west':
        this.ctx.fillRect(x + 2, centerY - 2, 4, 4);
        break;
      case 'east':
        this.ctx.fillRect(x + tileSize - 6, centerY - 2, 4, 4);
        break;
    }
  }

  private renderUI(): void {
    // Current location info
    const currentLocation = this.getCurrentLocation();
    if (currentLocation) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      this.ctx.fillRect(10, this.canvas.height - 60, 300, 50);
      
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = '16px monospace';
      this.ctx.fillText(currentLocation.name, 20, this.canvas.height - 40);
      this.ctx.fillText('Press ENTER to enter', 20, this.canvas.height - 20);
    }
    
    // Selected location info
    if (this.showLocationInfo && this.selectedLocation) {
      const location = this.selectedLocation;
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
      this.ctx.fillRect(this.canvas.width - 250, 10, 240, 100);
      
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = '14px monospace';
      this.ctx.fillText(location.name, this.canvas.width - 240, 30);
      this.ctx.fillText(`Type: ${location.type}`, this.canvas.width - 240, 50);
      this.ctx.fillText(`Threat: ${location.threat}/10`, this.canvas.width - 240, 70);
      this.ctx.fillText(location.visited ? 'Visited' : 'Not visited', this.canvas.width - 240, 90);
    }
    
    // Mini-map or compass could go here
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(10, 10, 100, 30);
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = '12px monospace';
    this.ctx.fillText('WORLD MAP', 15, 30);
  }

  // Create a sample world map
  static createSampleWorldMap(): WorldMap {
    const width = 32;
    const height = 24;
    
    // Generate terrain
    const terrain: number[][] = [];
    for (let y = 0; y < height; y++) {
      terrain[y] = [];
      for (let x = 0; x < width; x++) {
        // Simple terrain generation
        if (y < 3 || y > height - 4) {
          terrain[y][x] = 2; // Mountains at edges
        } else if (x < 2 || x > width - 3) {
          terrain[y][x] = 2; // Mountains at edges
        } else if (Math.random() < 0.1) {
          terrain[y][x] = 1; // Forest
        } else if (Math.random() < 0.05) {
          terrain[y][x] = 6; // Water
        } else if (Math.random() < 0.03) {
          terrain[y][x] = 7; // Ruins
        } else {
          terrain[y][x] = 0; // Grassland
        }
      }
    }
    
    // Add some roads
    for (let x = 5; x < width - 5; x++) {
      terrain[height / 2][x] = 5; // Horizontal road
    }
    for (let y = 5; y < height - 5; y++) {
      terrain[y][width / 2] = 5; // Vertical road
    }
    
    // Create locations
    const locations: WorldLocation[] = [
      {
        id: 'central_city',
        name: 'Central City',
        type: 'city',
        position: { x: 16, y: 12 },
        sprite: 'city',
        color: '#FFD700',
        size: 1.0,
        canEnter: true,
        description: 'The main hub of civilization',
        sideScrollArea: 'downtown',
        discovered: true,
        visited: false,
        threat: 3
      },
      {
        id: 'northern_outpost',
        name: 'Northern Outpost',
        type: 'safe_house',
        position: { x: 16, y: 6 },
        sprite: 'safe_house',
        color: '#4169E1',
        size: 0.8,
        canEnter: true,
        description: 'A fortified safe zone',
        discovered: false,
        visited: false,
        threat: 1
      },
      {
        id: 'eastern_ruins',
        name: 'Eastern Ruins',
        type: 'dungeon',
        position: { x: 26, y: 12 },
        sprite: 'ruins',
        color: '#8B0000',
        size: 1.2,
        canEnter: true,
        description: 'Dangerous pre-war ruins',
        discovered: false,
        visited: false,
        threat: 8
      },
      {
        id: 'traders_den',
        name: "Trader's Den",
        type: 'shop',
        position: { x: 10, y: 18 },
        sprite: 'shop',
        color: '#32CD32',
        size: 0.9,
        canEnter: true,
        description: 'Black market trading post',
        shopInventory: ['weapons', 'armor', 'supplies'],
        discovered: false,
        visited: false,
        threat: 4
      }
    ];
    
    return {
      id: 'wasteland',
      name: 'The Wasteland',
      width,
      height,
      terrain,
      locations,
      playerSpawn: { x: 5, y: 12 },
      tileSize: 24,
      backgroundColor: '#2F4F4F'
    };
  }

  // Get player position
  getPlayerPosition(): Vector2 {
    return { ...this.playerPosition };
  }

  // Set player position (for transitions from other systems)
  setPlayerPosition(x: number, y: number): void {
    this.playerPosition.x = x;
    this.playerPosition.y = y;
    this.centerCameraOnPlayer();
  }
}

// Export for global access
export let worldMapSystem: WorldMapSystem | null = null;

export function initializeWorldMapSystem(canvas: HTMLCanvasElement): WorldMapSystem {
  worldMapSystem = new WorldMapSystem(canvas);
  console.log('🗺️ World map system initialized!');
  return worldMapSystem;
}