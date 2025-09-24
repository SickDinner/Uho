// Free Movement Demo Integration
// Integrates the new 360° free physics with existing ECS systems

import { World } from '@core/ecs.ts';
import { Transform, Sprite, Stats, Needs, Inventory, Wallet, Skills, Addiction, LawEnforcement } from '@core/components.ts';
import { spriteManager } from '@core/sprites.ts';
import { skaalainSystem } from '@core/skaalain.ts';
import type { MessageType, Vector2 } from '@core/types.ts';

// Import new systems
import { freePhysicsEngine, type FreePhysicsBody } from '@core/free-physics.ts';
import { smoothCamera } from '@core/smooth-camera.ts';

export interface FreeMovementConfig {
  useFreMovement: boolean;
  debugMode: boolean;
  pixelScale: number; // How many pixels per grid tile (for conversion)
}

export class FreeMovementDemo {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private world: World;
  
  // Player tracking
  private playerId?: number;
  private playerPhysicsBody?: FreePhysicsBody;
  
  // Input tracking
  private keys: Set<string> = new Set();
  private lastInputTime: number = 0;
  private inputDelay: number = 100;
  
  // Config
  public config: FreeMovementConfig = {
    useFreMovement: true,
    debugMode: true,
    pixelScale: 32 // 32 pixels = 1 grid tile
  };
  
  // Messages
  private messages: MessageType[] = [];
  private messageLog: HTMLElement;
  
  // Demo scene items
  private sceneItems: FreePhysicsBody[] = [];
  
  constructor(canvas: HTMLCanvasElement, world: World, messageLog: HTMLElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.world = world;
    this.messageLog = messageLog;
    
    // Configure camera for this canvas size
    smoothCamera.resize(canvas.width, canvas.height);
    smoothCamera.settings.followSmoothing = 0.08;
    smoothCamera.settings.lookAheadDistance = 80;
    
    console.log('🆓 Free Movement Demo initialized');
  }

  // Create the player with free physics
  createFreePlayer(startX: number = 400, startY: number = 300): void {
    // Create ECS entity (preserve existing system)
    const player = this.world.createEntity();
    this.playerId = player.id;
    
    // Add ECS components
    this.world.componentManager.addComponent(new Transform(player.id, 
      Math.floor(startX / this.config.pixelScale), 
      Math.floor(startY / this.config.pixelScale)
    ));
    this.world.componentManager.addComponent(new Sprite(player.id, 'player'));
    this.world.componentManager.addComponent(new Stats(player.id, {
      strength: 50, endurance: 55, agility: 60, intelligence: 60,
      perception: 55, charisma: 45, willpower: 55, luck: 50,
      reflex: 65, tolerance: 30, stress: 60, technical: 40,
      crime: 20, medical: 30, cunning: 50
    }));
    this.world.componentManager.addComponent(new Needs(player.id));
    this.world.componentManager.addComponent(new Inventory(player.id));
    this.world.componentManager.addComponent(new Wallet(player.id, 300, 600, 0));
    this.world.componentManager.addComponent(new Skills(player.id));
    this.world.componentManager.addComponent(new Addiction(player.id));
    this.world.componentManager.addComponent(new LawEnforcement(player.id));
    
    // Create physics body for free movement
    this.playerPhysicsBody = freePhysicsEngine.createPlayer(1, startX, startY);
    
    // Set camera to follow the physics body
    smoothCamera.setFollowBody(this.playerPhysicsBody);
    smoothCamera.snapTo(startX, startY, 1.2); // Start with slight zoom
    
    this.addMessage('🆓 Free movement active! Use WASD/arrows for 360° movement', 'system');
    this.addMessage('🎮 T: Toggle tile/free movement | R: Reset position', 'system');
    this.addMessage('🔍 +/-: Zoom in/out | Space: Camera shake', 'system');
    
    console.log('Free physics player created at', startX, startY);
  }

  // Create a demo scene with obstacles and items
  createDemoScene(): void {
    // Create walls around the area
    const walls = [
      // Outer boundary
      { x: 200, y: 100, w: 10, h: 400 }, // Left wall
      { x: 600, y: 100, w: 10, h: 400 }, // Right wall
      { x: 200, y: 100, w: 410, h: 10 }, // Top wall
      { x: 200, y: 490, w: 410, h: 10 }, // Bottom wall
      
      // Inner obstacles
      { x: 300, y: 200, w: 60, h: 20 }, // Horizontal obstacle
      { x: 450, y: 300, w: 20, h: 80 }, // Vertical obstacle
      { x: 350, y: 350, w: 40, h: 40 }, // Square obstacle
    ];
    
    let obstacleId = 100;
    for (const wall of walls) {
      const obstacle = freePhysicsEngine.createStaticObstacle(
        obstacleId++, 
        wall.x + wall.w/2, 
        wall.y + wall.h/2, 
        wall.w, 
        wall.h
      );
      this.sceneItems.push(obstacle);
    }
    
    // Create some items to interact with
    const items = [
      { x: 250, y: 150, type: 'needle', category: 'tinyItem' },
      { x: 320, y: 170, type: 'bottle', category: 'smallItem' },
      { x: 500, y: 250, type: 'pistol', category: 'weapon' },
      { x: 550, y: 450, type: 'backpack', category: 'mediumItem' },
    ];
    
    let itemId = 200;
    for (const item of items) {
      const scale = skaalainSystem.getScale(item.category as any, 'world');
      const size = Math.max(8, scale * 16); // Base size with scaling
      
      const physicsItem = freePhysicsEngine.createBody(
        itemId++,
        item.x,
        item.y,
        { type: 'circle', radius: size/2 },
        {
          mass: this.getItemMass(item.type),
          spriteId: item.type,
          isSolid: false, // Items don't block movement
          layer: 3,
          scale: scale
        }
      );
      this.sceneItems.push(physicsItem);
    }
    
    this.addMessage(`🏗️ Demo scene created: ${walls.length} walls, ${items.length} items`, 'system');
  }

  private getItemMass(itemType: string): number {
    const masses: Record<string, number> = {
      'needle': 0.01,
      'syringe': 0.02,
      'pill': 0.001,
      'bottle': 0.5,
      'knife': 0.2,
      'pistol': 1.2,
      'backpack': 0.8,
      'armor': 5.0
    };
    return masses[itemType] || 1.0;
  }

  // Handle input for free movement
  handleInput(keys: Set<string>): void {
    this.keys = keys;
    
    if (!this.playerPhysicsBody) return;
    
    // Toggle movement system
    if (keys.has('t') && Date.now() - this.lastInputTime > this.inputDelay) {
      this.config.useFreMovement = !this.config.useFreMovement;
      const mode = this.config.useFreMovement ? 'Free 360°' : 'Tile-based';
      this.addMessage(`🔄 Movement: ${mode}`, 'system');
      this.lastInputTime = Date.now();
    }
    
    // Reset position
    if (keys.has('r') && Date.now() - this.lastInputTime > this.inputDelay) {
      this.playerPhysicsBody.position = { x: 400, y: 300 };
      this.playerPhysicsBody.velocity = { x: 0, y: 0 };
      this.playerPhysicsBody.rotation = 0;
      smoothCamera.snapTo(400, 300);
      this.addMessage('🔄 Position reset', 'system');
      this.lastInputTime = Date.now();
    }
    
    // Camera shake
    if (keys.has(' ') && Date.now() - this.lastInputTime > this.inputDelay) {
      smoothCamera.shake(15, 600);
      this.addMessage('📷 Camera shake!', 'system');
      this.lastInputTime = Date.now();
    }
    
    // Zoom controls
    if (keys.has('=') || keys.has('+')) {
      // Zoom in (SmoothCamera API adjustment needed)
      smoothCamera.moveTo(smoothCamera.position.x, smoothCamera.position.y, smoothCamera.zoom * 1.05);
    }
    if (keys.has('-') || keys.has('_')) {
      // Zoom out (SmoothCamera API adjustment needed)
      smoothCamera.moveTo(smoothCamera.position.x, smoothCamera.position.y, smoothCamera.zoom * 0.95);
    }

    // Movement handling
    if (this.config.useFreMovement) {
      this.handleFreeMovement(keys);
    } else {
      this.handleTileMovement(keys);
    }
  }

  private handleFreeMovement(keys: Set<string>): void {
    if (!this.playerPhysicsBody) return;
    
    // Build direction vector from input
    let direction: Vector2 = { x: 0, y: 0 };
    let moving = false;
    
    if (keys.has('w') || keys.has('arrowup')) {
      direction.y = -1;
      moving = true;
    }
    if (keys.has('s') || keys.has('arrowdown')) {
      direction.y = 1;
      moving = true;
    }
    if (keys.has('a') || keys.has('arrowleft')) {
      direction.x = -1;
      moving = true;
    }
    if (keys.has('d') || keys.has('arrowright')) {
      direction.x = 1;
      moving = true;
    }
    
    // Normalize diagonal movement
    if (direction.x !== 0 && direction.y !== 0) {
      const length = Math.sqrt(direction.x ** 2 + direction.y ** 2);
      direction.x /= length;
      direction.y /= length;
    }
    
    // Variable force based on shift key (sprint)
    let force = keys.has('shift') ? 1.5 : 1.0;
    
    // Move the physics body
    if (moving) {
      freePhysicsEngine.moveBody(this.playerPhysicsBody.id, direction, force);
      
      // Sync with ECS transform
      this.syncPhysicsToECS();
      
      // Update sprite animation if available
      this.updatePlayerAnimation(direction);
    }
  }

  private handleTileMovement(keys: Set<string>): void {
    if (!this.playerId || !this.playerPhysicsBody) return;
    
    // Classic turn-based tile movement
    if (Date.now() - this.lastInputTime < this.inputDelay) return;
    
    const transform = this.world.componentManager.getComponent(this.playerId, Transform);
    if (!transform) return;
    
    let moved = false;
    let newFacing = transform.facing;
    
    if (keys.has('w') || keys.has('arrowup')) {
      transform.y--;
      newFacing = 'north';
      moved = true;
    } else if (keys.has('s') || keys.has('arrowdown')) {
      transform.y++;
      newFacing = 'south';
      moved = true;
    } else if (keys.has('a') || keys.has('arrowleft')) {
      transform.x--;
      newFacing = 'west';
      moved = true;
    } else if (keys.has('d') || keys.has('arrowright')) {
      transform.x++;
      newFacing = 'east';
      moved = true;
    }
    
    if (moved) {
      transform.facing = newFacing;
      
      // Snap physics body to ECS position
      this.playerPhysicsBody.position.x = transform.x * this.config.pixelScale;
      this.playerPhysicsBody.position.y = transform.y * this.config.pixelScale;
      this.playerPhysicsBody.velocity = { x: 0, y: 0 };
      
      // Move camera to follow
      smoothCamera.moveTo(this.playerPhysicsBody.position.x, this.playerPhysicsBody.position.y);
      
      this.lastInputTime = Date.now();
    }
  }

  private syncPhysicsToECS(): void {
    if (!this.playerId || !this.playerPhysicsBody) return;
    
    const transform = this.world.componentManager.getComponent(this.playerId, Transform);
    if (transform) {
      // Update ECS transform from physics position
      const gridX = Math.floor(this.playerPhysicsBody.position.x / this.config.pixelScale);
      const gridY = Math.floor(this.playerPhysicsBody.position.y / this.config.pixelScale);
      transform.setPosition(gridX, gridY);
      
      // Update facing based on movement direction
      if (this.playerPhysicsBody.velocity.x > 10) {
        transform.facing = 'east';
      } else if (this.playerPhysicsBody.velocity.x < -10) {
        transform.facing = 'west';
      } else if (this.playerPhysicsBody.velocity.y > 10) {
        transform.facing = 'south';
      } else if (this.playerPhysicsBody.velocity.y < -10) {
        transform.facing = 'north';
      }
    }
  }

  private updatePlayerAnimation(direction: Vector2): void {
    if (!this.playerId) return;
    
    const sprite = this.world.componentManager.getComponent(this.playerId, Sprite);
    if (!sprite) return;
    
    let facing = 'south';
    if (Math.abs(direction.x) > Math.abs(direction.y)) {
      facing = direction.x > 0 ? 'east' : 'west';
    } else if (direction.y !== 0) {
      facing = direction.y > 0 ? 'south' : 'north';
    }
    
    const animationName = this.playerPhysicsBody?.isMoving ? `walk_${facing}` : `idle_${facing}`;
    sprite.setAnimation(animationName);
  }

  // Update the demo
  update(deltaTime: number): void {
    // Update physics engine
    freePhysicsEngine.update(deltaTime);
    
    // Update camera
    smoothCamera.update(deltaTime);
    
    // Sync systems
    if (this.config.useFreMovement) {
      this.syncPhysicsToECS();
    }
  }

  // Render the demo
  render(): void {
    // Clear canvas
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Render grid background
    this.renderGrid();
    
    // Render scene items (walls and objects)
    this.renderSceneItems();
    
    // Render player
    this.renderPlayer();
    
    // Render UI overlays
    if (this.config.debugMode) {
      this.renderDebugInfo();
    }
    
    this.renderMovementModeIndicator();
  }

  private renderGrid(): void {
    if (!this.config.debugMode) return;
    
    const bounds = smoothCamera.getVisibleBounds();
    const gridSize = this.config.pixelScale;
    
    this.ctx.strokeStyle = 'rgba(100, 100, 120, 0.2)';
    this.ctx.lineWidth = 1;
    
    // Vertical lines
    for (let x = Math.floor(bounds.x / gridSize) * gridSize; x < bounds.x + bounds.width; x += gridSize) {
      const screenPos = smoothCamera.worldToScreen({ x, y: bounds.y });
      const screenEnd = smoothCamera.worldToScreen({ x, y: bounds.y + bounds.height });
      
      this.ctx.beginPath();
      this.ctx.moveTo(screenPos.x, screenPos.y);
      this.ctx.lineTo(screenEnd.x, screenEnd.y);
      this.ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = Math.floor(bounds.y / gridSize) * gridSize; y < bounds.y + bounds.height; y += gridSize) {
      const screenPos = smoothCamera.worldToScreen({ x: bounds.x, y });
      const screenEnd = smoothCamera.worldToScreen({ x: bounds.x + bounds.width, y });
      
      this.ctx.beginPath();
      this.ctx.moveTo(screenPos.x, screenPos.y);
      this.ctx.lineTo(screenPos.x, screenEnd.y);
      this.ctx.stroke();
    }
  }

  private renderSceneItems(): void {
    for (const item of this.sceneItems) {
      if (!smoothCamera.isVisible(item.position, 50)) continue;
      
      const screenPos = smoothCamera.worldToScreen(item.position);
      
      if (item.isStatic) {
        // Render walls/obstacles
        this.ctx.fillStyle = '#4a4a4a';
        const shape = item.collisionShape;
        if (shape.type === 'rectangle') {
          const width = (shape.width || 32) * smoothCamera.zoom;
          const height = (shape.height || 32) * smoothCamera.zoom;
          this.ctx.fillRect(
            screenPos.x - width/2,
            screenPos.y - height/2,
            width,
            height
          );
        }
      } else {
        // Render items
        this.ctx.fillStyle = this.getItemColor(item.spriteId);
        const radius = ((item.collisionShape.radius || 8) * smoothCamera.zoom * item.scale);
        
        this.ctx.beginPath();
        this.ctx.arc(screenPos.x, screenPos.y, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Item label
        this.ctx.fillStyle = 'white';
        this.ctx.font = '10px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(item.spriteId, screenPos.x, screenPos.y + radius + 12);
      }
    }
  }

  private getItemColor(itemType: string): string {
    const colors: Record<string, string> = {
      'needle': '#ff4444',
      'bottle': '#44aa44',
      'pistol': '#444444',
      'backpack': '#8b4513'
    };
    return colors[itemType] || '#666666';
  }

  private renderPlayer(): void {
    if (!this.playerPhysicsBody) return;
    
    const screenPos = smoothCamera.worldToScreen(this.playerPhysicsBody.position);
    
    // Player circle
    this.ctx.fillStyle = this.playerPhysicsBody.isMoving ? '#00ff88' : '#44aaff';
    const radius = (this.playerPhysicsBody.collisionShape.radius || 12) * smoothCamera.zoom;
    
    this.ctx.beginPath();
    this.ctx.arc(screenPos.x, screenPos.y, radius, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Direction indicator
    if (this.playerPhysicsBody.isMoving) {
      const angle = this.playerPhysicsBody.rotation * (Math.PI / 180);
      const lineLength = radius + 10;
      const endX = screenPos.x + Math.cos(angle) * lineLength;
      const endY = screenPos.y + Math.sin(angle) * lineLength;
      
      this.ctx.strokeStyle = '#ffff00';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(screenPos.x, screenPos.y);
      this.ctx.lineTo(endX, endY);
      this.ctx.stroke();
    }
    
    // Velocity vector (debug)
    if (this.config.debugMode && this.playerPhysicsBody.isMoving) {
      const velScale = 0.5;
      const velX = screenPos.x + this.playerPhysicsBody.velocity.x * velScale;
      const velY = screenPos.y + this.playerPhysicsBody.velocity.y * velScale;
      
      this.ctx.strokeStyle = '#ff00ff';
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(screenPos.x, screenPos.y);
      this.ctx.lineTo(velX, velY);
      this.ctx.stroke();
    }
  }

  private renderMovementModeIndicator(): void {
    // Mode indicator
    const mode = this.config.useFreMovement ? 'FREE 360°' : 'TILE GRID';
    const color = this.config.useFreMovement ? '#00ff88' : '#ffaa44';
    
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(10, 10, 160, 40);
    
    this.ctx.fillStyle = color;
    this.ctx.font = '14px bold monospace';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Movement: ${mode}`, 20, 30);
    
    this.ctx.fillStyle = 'white';
    this.ctx.font = '10px monospace';
    this.ctx.fillText('Press T to toggle', 20, 45);
  }

  private renderDebugInfo(): void {
    if (!this.playerPhysicsBody) return;
    
    const debugInfo = freePhysicsEngine.getDebugInfo(this.playerPhysicsBody.id);
    const cameraInfo = smoothCamera.getDebugInfo();
    
    // Background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(this.canvas.width - 300, 60, 290, 200);
    
    // Text
    this.ctx.fillStyle = '#00ff00';
    this.ctx.font = '10px monospace';
    this.ctx.textAlign = 'left';
    
    const lines = [...debugInfo.split('\n'), '', ...cameraInfo.split('\n')];
    for (let i = 0; i < lines.length; i++) {
      this.ctx.fillText(lines[i], this.canvas.width - 290, 80 + i * 12);
    }
  }

  private addMessage(text: string, type: MessageType['type'] = 'normal'): void {
    this.messages.push({ text, type, timestamp: Date.now() });
    
    if (this.messages.length > 20) {
      this.messages.splice(0, this.messages.length - 20);
    }
    
    // Update message log
    this.messageLog.innerHTML = '';
    for (const message of this.messages) {
      const div = document.createElement('div');
      div.className = `message ${message.type}`;
      div.textContent = message.text;
      this.messageLog.appendChild(div);
    }
    this.messageLog.scrollTop = this.messageLog.scrollHeight;
  }

  // Public methods for external control
  public toggleDebugMode(): void {
    this.config.debugMode = !this.config.debugMode;
    this.addMessage(`🔧 Debug mode: ${this.config.debugMode ? 'ON' : 'OFF'}`, 'system');
  }

  public getCurrentMode(): string {
    return this.config.useFreMovement ? 'free' : 'tile';
  }

  public getPlayerPhysicsBody(): FreePhysicsBody | undefined {
    return this.playerPhysicsBody;
  }
}