// Game Mode Manager - Handles transitions between different game modes
// World Map <-> Side-scrolling <-> Physics integration

import type { Vector2 } from './types.ts';
import { physicsEngine, type PhysicsBody } from './physics.ts';
import { skaalainSystem } from './skaalain.ts';
import { spriteManager } from './sprites.ts';
import { worldMapSystem, type WorldLocation, WorldMapSystem } from './worldmap.ts';
import { sideScrollSystem, type SideScrollArea, SideScrollSystem } from './sidescroller.ts';

export type GameMode = 'world_map' | 'side_scroll' | 'inventory' | 'combat' | 'dialogue';

export interface GameState {
  currentMode: GameMode;
  previousMode: GameMode | null;
  isTransitioning: boolean;
  transitionProgress: number;
  transitionDuration: number;
  
  // Player state that persists across modes
  playerData: {
    worldPosition: Vector2;
    sideScrollPosition: Vector2;
    currentArea?: string;
    health: number;
    inventory: any[];
  };
}

export interface ModeTransition {
  from: GameMode;
  to: GameMode;
  duration: number;
  effect: 'fade' | 'slide' | 'zoom' | 'instant';
  onStart?: () => void;
  onComplete?: () => void;
}

export class GameModeManager {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private gameState: GameState;
  
  // System references
  private worldMap: WorldMapSystem | null = null;
  private sideScroll: SideScrollSystem | null = null;
  
  // Player entity tracking
  private playerId: number = 1;
  private playerPhysicsBody: PhysicsBody | null = null;
  
  // Transition effects
  private transitionCanvas: HTMLCanvasElement | null = null;
  private transitionCtx: CanvasRenderingContext2D | null = null;
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    
    // Initialize game state
    this.gameState = {
      currentMode: 'world_map',
      previousMode: null,
      isTransitioning: false,
      transitionProgress: 0,
      transitionDuration: 1000,
      playerData: {
        worldPosition: { x: 5, y: 12 },
        sideScrollPosition: { x: 100, y: 500 },
        health: 100,
        inventory: []
      }
    };
    
    this.initializeSystems();
    this.setupPhysicsIntegration();
  }

  private initializeSystems(): void {
    // Initialize world map system
    this.worldMap = new WorldMapSystem(this.canvas);
    const sampleMap = WorldMapSystem.createSampleWorldMap();
    this.worldMap.loadMap(sampleMap);
    
    // Set up location enter callback
    this.worldMap.onLocationEnter = (location: WorldLocation) => {
      this.transitionToSideScroll(location);
    };
    
    // Initialize side-scroll system
    this.sideScroll = new SideScrollSystem(this.canvas);
    const sampleArea = SideScrollSystem.createSampleCityArea();
    this.sideScroll.loadArea(sampleArea);
    
    console.log('🎮 Game mode systems initialized');
  }

  private setupPhysicsIntegration(): void {
    // Create player physics body for side-scrolling mode
    this.playerPhysicsBody = physicsEngine.createCharacter(
      this.playerId,
      this.gameState.playerData.sideScrollPosition.x,
      this.gameState.playerData.sideScrollPosition.y
    );
    
    // Set player for side-scroll system
    this.sideScroll?.setPlayer(this.playerId);
    
    console.log('⚛️ Physics integration complete');
  }

  // Transition to side-scrolling mode
  private transitionToSideScroll(location: WorldLocation): void {
    if (this.gameState.isTransitioning) return;
    
    console.log(`Transitioning to side-scroll: ${location.name}`);
    
    // Save world position
    if (this.worldMap) {
      this.gameState.playerData.worldPosition = this.worldMap.getPlayerPosition();
    }
    
    // Start transition
    this.startTransition('world_map', 'side_scroll', 800, 'fade', () => {
      // Transition start
      this.captureCurrentFrame();
    }, () => {
      // Transition complete
      if (this.sideScroll && this.playerPhysicsBody) {
        // Position player at spawn point in side-scroll area
        const spawnPoint = { x: 100, y: 500 }; // Default spawn
        this.playerPhysicsBody.position = { ...spawnPoint };
        this.playerPhysicsBody.bounds.x = spawnPoint.x;
        this.playerPhysicsBody.bounds.y = spawnPoint.y;
        this.gameState.playerData.currentArea = location.sideScrollArea || '';
      }
    });
  }

  // Transition back to world map
  public transitionToWorldMap(exitPoint?: Vector2): void {
    if (this.gameState.isTransitioning) return;
    
    console.log('Transitioning back to world map');
    
    // Save side-scroll position
    if (this.playerPhysicsBody) {
      this.gameState.playerData.sideScrollPosition = { ...this.playerPhysicsBody.position };
    }
    
    this.startTransition('side_scroll', 'world_map', 800, 'fade', () => {
      this.captureCurrentFrame();
    }, () => {
      // Set world map position
      if (this.worldMap) {
        if (exitPoint) {
          this.worldMap.setPlayerPosition(exitPoint.x, exitPoint.y);
        } else {
          this.worldMap.setPlayerPosition(
            this.gameState.playerData.worldPosition.x,
            this.gameState.playerData.worldPosition.y
          );
        }
      }
    });
  }

  private startTransition(
    from: GameMode,
    to: GameMode,
    duration: number,
    effect: 'fade' | 'slide' | 'zoom' | 'instant' = 'fade',
    onStart?: () => void,
    onComplete?: () => void
  ): void {
    this.gameState.previousMode = from;
    this.gameState.currentMode = to;
    this.gameState.isTransitioning = true;
    this.gameState.transitionProgress = 0;
    this.gameState.transitionDuration = duration;
    
    onStart?.();
    
    // Set up completion callback
    setTimeout(() => {
      this.gameState.isTransitioning = false;
      this.transitionCanvas = null;
      this.transitionCtx = null;
      onComplete?.();
    }, duration);
  }

  private captureCurrentFrame(): void {
    // Create canvas for transition effect
    this.transitionCanvas = document.createElement('canvas');
    this.transitionCanvas.width = this.canvas.width;
    this.transitionCanvas.height = this.canvas.height;
    this.transitionCtx = this.transitionCanvas.getContext('2d')!;
    
    // Capture current frame
    this.transitionCtx.drawImage(this.canvas, 0, 0);
  }

  // Handle input based on current mode
  handleInput(keys: Set<string>): void {
    if (this.gameState.isTransitioning) return;
    
    // Global input (mode switching, etc.)
    if (keys.has('tab')) {
      // Quick switch between modes for testing
      if (this.gameState.currentMode === 'world_map') {
        this.transitionToSideScroll({
          id: 'test',
          name: 'Test Area',
          type: 'city',
          position: { x: 0, y: 0 },
          sprite: '',
          color: '',
          size: 1,
          canEnter: true,
          description: '',
          discovered: true,
          visited: false,
          threat: 0,
          sideScrollArea: 'downtown'
        });
      } else if (this.gameState.currentMode === 'side_scroll') {
        this.transitionToWorldMap();
      }
    }
    
    // Mode-specific input handling
    switch (this.gameState.currentMode) {
      case 'world_map':
        // World map handles its own input
        break;
        
      case 'side_scroll':
        // Side-scroll handles its own input
        // Check for exit conditions
        if (this.playerPhysicsBody && this.checkForAreaExit()) {
          this.transitionToWorldMap();
        }
        break;
    }
  }

  private checkForAreaExit(): boolean {
    // Check if player is at an exit point in side-scroll area
    if (!this.playerPhysicsBody) return false;
    
    // Simple exit condition - reaching the right edge
    return this.playerPhysicsBody.position.x > 1900;
  }

  // Update current game mode
  update(deltaTime: number): void {
    // Update transition progress
    if (this.gameState.isTransitioning) {
      this.gameState.transitionProgress += deltaTime;
    }
    
    // Update physics (always active for consistency)
    physicsEngine.update(deltaTime);
    
    // Update skaalain system
    skaalainSystem.update(deltaTime);
    
    // Update current mode
    switch (this.gameState.currentMode) {
      case 'world_map':
        if (this.worldMap && !this.gameState.isTransitioning) {
          this.worldMap.update(deltaTime);
        }
        break;
        
      case 'side_scroll':
        if (this.sideScroll && !this.gameState.isTransitioning) {
          this.sideScroll.update(deltaTime);
        }
        break;
    }
  }

  // Render current game mode with transitions
  render(): void {
    // Clear canvas
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    if (this.gameState.isTransitioning && this.transitionCanvas) {
      this.renderTransition();
    } else {
      this.renderCurrentMode();
    }
    
    // Render UI overlays
    this.renderUI();
  }

  private renderCurrentMode(): void {
    switch (this.gameState.currentMode) {
      case 'world_map':
        this.worldMap?.render();
        break;
        
      case 'side_scroll':
        this.sideScroll?.render();
        this.renderPhysicsObjects();
        break;
    }
  }

  private renderPhysicsObjects(): void {
    if (this.gameState.currentMode !== 'side_scroll') return;
    
    // Get camera position from side-scroll system
    const cameraPos = this.sideScroll?.getCameraPosition() || { x: 0, y: 0 };
    
    this.ctx.save();
    this.ctx.translate(-cameraPos.x, -cameraPos.y);
    
    // Render all physics bodies (for debugging)
    for (const [id, body] of (physicsEngine as any).bodies.entries()) {
      if (id === this.playerId) {
        // Player is rendered by side-scroll system
        continue;
      }
      
      // Render physics body
      this.ctx.strokeStyle = body.isStatic ? '#00FF00' : '#FF0000';
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(body.bounds.x, body.bounds.y, body.bounds.width, body.bounds.height);
      
      // Show velocity vector for dynamic bodies
      if (!body.isStatic && (Math.abs(body.velocity.x) > 1 || Math.abs(body.velocity.y) > 1)) {
        this.ctx.strokeStyle = '#FFFF00';
        this.ctx.beginPath();
        const centerX = body.bounds.x + body.bounds.width / 2;
        const centerY = body.bounds.y + body.bounds.height / 2;
        this.ctx.moveTo(centerX, centerY);
        this.ctx.lineTo(centerX + body.velocity.x * 0.1, centerY + body.velocity.y * 0.1);
        this.ctx.stroke();
      }
    }
    
    this.ctx.restore();
  }

  private renderTransition(): void {
    if (!this.transitionCanvas || !this.transitionCtx) return;
    
    const progress = Math.min(1, this.gameState.transitionProgress / this.gameState.transitionDuration);
    const alpha = 1 - progress;
    
    // Render new mode first
    this.renderCurrentMode();
    
    // Overlay old frame with fading alpha
    this.ctx.save();
    this.ctx.globalAlpha = alpha;
    this.ctx.drawImage(this.transitionCanvas, 0, 0);
    this.ctx.restore();
  }

  private renderUI(): void {
    // Mode indicator
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(this.canvas.width - 150, 10, 140, 80);
    
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = '14px monospace';
    this.ctx.fillText('Mode:', this.canvas.width - 140, 30);
    this.ctx.fillText(this.gameState.currentMode.toUpperCase(), this.canvas.width - 140, 50);
    
    if (this.gameState.isTransitioning) {
      const progress = Math.round((this.gameState.transitionProgress / this.gameState.transitionDuration) * 100);
      this.ctx.fillText(`Transition: ${progress}%`, this.canvas.width - 140, 70);
    } else {
      this.ctx.fillText('Press TAB: Switch', this.canvas.width - 140, 70);
    }
    
    // Physics debug info (side-scroll mode only)
    if (this.gameState.currentMode === 'side_scroll' && this.playerPhysicsBody) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(10, this.canvas.height - 120, 300, 110);
      
      this.ctx.fillStyle = '#00FF00';
      this.ctx.font = '12px monospace';
      this.ctx.fillText('Physics Debug:', 20, this.canvas.height - 100);
      this.ctx.fillText(`Pos: (${this.playerPhysicsBody.position.x.toFixed(1)}, ${this.playerPhysicsBody.position.y.toFixed(1)})`, 20, this.canvas.height - 85);
      this.ctx.fillText(`Vel: (${this.playerPhysicsBody.velocity.x.toFixed(1)}, ${this.playerPhysicsBody.velocity.y.toFixed(1)})`, 20, this.canvas.height - 70);
      this.ctx.fillText(`Grounded: ${this.playerPhysicsBody.isGrounded}`, 20, this.canvas.height - 55);
      this.ctx.fillText(`Mass: ${this.playerPhysicsBody.mass}kg`, 20, this.canvas.height - 40);
      this.ctx.fillText('WASD: Move, Space: Jump, X: Attack', 20, this.canvas.height - 25);
    }
    
    // Sprite scaling info
    if (this.gameState.currentMode === 'side_scroll') {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      this.ctx.fillRect(this.canvas.width - 280, this.canvas.height - 100, 270, 90);
      
      this.ctx.fillStyle = '#FFD700';
      this.ctx.font = '11px monospace';
      this.ctx.fillText('Skaalain Scaling Active:', this.canvas.width - 270, this.canvas.height - 80);
      this.ctx.fillText('Characters: 32px', this.canvas.width - 270, this.canvas.height - 65);
      this.ctx.fillText('Weapons: 12px', this.canvas.width - 270, this.canvas.height - 50);
      this.ctx.fillText('Needles: 2px (tiny!)', this.canvas.width - 270, this.canvas.height - 35);
      this.ctx.fillText('Items scale by weight', this.canvas.width - 270, this.canvas.height - 20);
    }
  }

  // Get current game state
  getCurrentMode(): GameMode {
    return this.gameState.currentMode;
  }

  // Force mode change (for external systems)
  setMode(mode: GameMode): void {
    if (this.gameState.isTransitioning) return;
    
    this.startTransition(this.gameState.currentMode, mode, 500, 'fade');
  }

  // Get player physics body for external access
  getPlayerPhysicsBody(): PhysicsBody | null {
    return this.playerPhysicsBody;
  }

  // Integration with existing components
  integrateWithComponents(componentManager: any): void {
    // This method would integrate with your existing ECS component system
    console.log('Integrating with existing component system...');
    
    // Example integration:
    // - Sync physics body position with Transform component
    // - Apply sprite scaling based on component data
    // - Handle inventory items with proper physics
  }

  // Create physics bodies for items with proper scaling
  createItemWithPhysics(itemId: string, itemType: string, x: number, y: number): void {
    const category = skaalainSystem.getApocalypticItemCategory(itemType);
    const scale = skaalainSystem.getScale(category, 'world');
    
    // Calculate weight based on item type and scale
    const weight = this.getItemWeight(itemType) * scale;
    
    // Create physics body
    const physicsId = 1000 + Math.floor(Math.random() * 9000); // Random ID for items
    const body = physicsEngine.createItem(physicsId, x, y, weight);
    
    console.log(`Created ${itemType} with physics: weight=${weight}kg, scale=${scale}x`);
  }

  private getItemWeight(itemType: string): number {
    const weights: Record<string, number> = {
      'needle': 0.01,
      'syringe': 0.02,
      'pill': 0.001,
      'bottle': 0.5,
      'can': 0.3,
      'knife': 0.2,
      'pistol': 1.5,
      'rifle': 4.0,
      'backpack': 2.0,
      'armor': 5.0
    };
    
    return weights[itemType] || 0.5;
  }
}

// Global game mode manager
export let gameModeManager: GameModeManager | null = null;

export function initializeGameModeManager(canvas: HTMLCanvasElement): GameModeManager {
  gameModeManager = new GameModeManager(canvas);
  console.log('🎮 Game mode manager initialized!');
  console.log('Available systems:');
  console.log('- World Map (Ultima 4 style)');
  console.log('- Side-scrolling (Zelda 2 style)');
  console.log('- Physics Engine (gravity, weight, collision)');
  console.log('- Sprite Scaling (skaalain system)');
  console.log('- Smooth transitions between modes');
  return gameModeManager;
}

// Export for window access
if (typeof window !== 'undefined') {
  (window as any).gameMode = gameModeManager;
  console.log('Use window.gameMode for debugging');
}