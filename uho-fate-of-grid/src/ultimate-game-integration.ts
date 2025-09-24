// 🌟 ULTIMATE GAME INTEGRATION
// Yhdistää kaikki järjestelmät optimoidusti yhdeksi täydelliseksi kokonaisuudeksi

import { spriteAnimationSystem } from './sprite-animation-system.ts';
import { completeSpriteRegistry } from './complete-sprite-registry.ts';
import { placeholderAudioSystem } from './placeholder-audio-system.ts';
import { completeGameMechanics } from './complete-game-mechanics.ts';

// Performance optimization imports
export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage: number;
  activeSprites: number;
  activeAnimations: number;
  activeSounds: number;
}

export interface GameConfig {
  targetFPS: number;
  enableVSync: boolean;
  enableAudio: boolean;
  maxActiveSprites: number;
  maxActiveAnimations: number;
  spritePreloadCount: number;
  debugMode: boolean;
}

export class UltimateGameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private config: GameConfig;
  private isRunning: boolean = false;
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private fpsHistory: number[] = [];
  
  // Performance optimization
  private spriteCache: Map<string, ImageBitmap> = new Map();
  private offscreenCanvas: OffscreenCanvas | null = null;
  private offscreenCtx: OffscreenCanvasRenderingContext2D | null = null;
  
  // Game state
  private gameObjects: Map<number, GameObject> = new Map();
  private nextObjectId: number = 1;
  private playerGold: number = 1000;
  
  constructor(canvas: HTMLCanvasElement, config: Partial<GameConfig> = {}) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not get 2D context from canvas');
    }
    this.ctx = context;
    
    this.config = {
      targetFPS: 60,
      enableVSync: true,
      enableAudio: true,
      maxActiveSprites: 500,
      maxActiveAnimations: 100,
      spritePreloadCount: 50,
      debugMode: false,
      ...config
    };
    
    this.initialize();
  }
  
  private async initialize(): Promise<void> {
    console.log('🌟 Initializing Ultimate Game Engine...');
    
    // Initialize offscreen canvas for better performance
    this.initializeOffscreenCanvas();
    
    // Preload essential sprites
    await this.preloadSprites();
    
    // Initialize audio if enabled
    if (this.config.enableAudio) {
      await this.initializeAudio();
    }
    
    // Setup collision detection for game world
    this.setupCollisionWorld();
    
    // Create sample game world
    this.createSampleWorld();
    
    console.log('✅ Ultimate Game Engine initialized!');
    this.logSystemStatus();
  }
  
  private initializeOffscreenCanvas(): void {
    try {
      this.offscreenCanvas = new OffscreenCanvas(this.canvas.width, this.canvas.height);
      this.offscreenCtx = this.offscreenCanvas.getContext('2d');
      console.log('✅ Offscreen canvas initialized for better performance');
    } catch (error) {
      console.warn('Offscreen canvas not supported, using main canvas');
    }
  }
  
  private async preloadSprites(): Promise<void> {
    console.log('🚀 Preloading essential sprites...');
    
    const essentialSprites = [
      'roguelike_characters_main',
      'roguelike_cities_tilemap',
      'tiny_town_sample',
      'ui_large_tiles_thick_outline_0000'
    ];
    
    let loadedCount = 0;
    for (const spriteId of essentialSprites) {
      try {
        const image = await completeSpriteRegistry.loadSprite(spriteId);
        
        // Convert to ImageBitmap for better performance
        if ('createImageBitmap' in window) {
          const bitmap = await createImageBitmap(image);
          this.spriteCache.set(spriteId, bitmap);
        }
        
        loadedCount++;
      } catch (error) {
        console.warn(`Failed to preload sprite ${spriteId}:`, error);
      }
    }
    
    console.log(`✅ Preloaded ${loadedCount}/${essentialSprites.length} sprites`);
  }
  
  private async initializeAudio(): Promise<void> {
    // Audio is handled by the placeholderAudioSystem
    const status = placeholderAudioSystem.getAudioStatus();
    console.log('🎵 Audio system status:', status);
    
    // Play a subtle startup sound
    setTimeout(() => {
      placeholderAudioSystem.playUISound('success');
    }, 500);
  }
  
  private setupCollisionWorld(): void {
    // Add world boundaries
    const worldBounds = [
      { x: -10, y: -10, width: 10, height: this.canvas.height + 20, solid: true, trigger: false, id: 'left_wall' },
      { x: this.canvas.width, y: -10, width: 10, height: this.canvas.height + 20, solid: true, trigger: false, id: 'right_wall' },
      { x: -10, y: -10, width: this.canvas.width + 20, height: 10, solid: true, trigger: false, id: 'top_wall' },
      { x: -10, y: this.canvas.height, width: this.canvas.width + 20, height: 10, solid: true, trigger: false, id: 'bottom_wall' }
    ];
    
    for (const bound of worldBounds) {
      completeGameMechanics.collision.addStaticCollider(bound);
    }
    
    console.log('🏗️ World collision boundaries set up');
  }
  
  private createSampleWorld(): void {
    // Create player
    const playerId = this.createGameObject({
      x: this.canvas.width / 2,
      y: this.canvas.height / 2,
      width: 32,
      height: 32,
      spriteId: 'roguelike_characters_main',
      animationId: 'player_warrior_idle_down',
      type: 'player',
      health: 100,
      maxHealth: 100
    });
    
    // Create some NPCs
    this.createGameObject({
      x: 200,
      y: 300,
      width: 24,
      height: 24,
      spriteId: 'roguelike_characters_main',
      animationId: 'npc_merchant_idle_down',
      type: 'npc',
      npcType: 'merchant',
      health: 50,
      maxHealth: 50
    });
    
    this.createGameObject({
      x: 500,
      y: 400,
      width: 24,
      height: 24,
      spriteId: 'roguelike_characters_main',
      animationId: 'npc_guard_idle_down',
      type: 'npc',
      npcType: 'guard',
      health: 80,
      maxHealth: 80
    });
    
    // Add some collectible items
    for (let i = 0; i < 5; i++) {
      this.createGameObject({
        x: Math.random() * (this.canvas.width - 100) + 50,
        y: Math.random() * (this.canvas.height - 100) + 50,
        width: 16,
        height: 16,
        spriteId: 'sidescroller_gems',
        animationId: 'gem_spin',
        type: 'item',
        itemId: 'gem',
        value: 10
      });
    }
    
    console.log(`🌍 Created sample world with ${this.gameObjects.size} objects`);
  }
  
  private createGameObject(config: any): number {
    const id = this.nextObjectId++;
    const gameObject: GameObject = {
      id: id,
      x: config.x || 0,
      y: config.y || 0,
      width: config.width || 32,
      height: config.height || 32,
      spriteId: config.spriteId,
      animationId: config.animationId,
      type: config.type || 'object',
      active: true,
      ...config
    };
    
    this.gameObjects.set(id, gameObject);
    
    // Add collision box
    completeGameMechanics.collision.addDynamicCollider(id, {
      x: gameObject.x,
      y: gameObject.y,
      width: gameObject.width,
      height: gameObject.height,
      solid: config.type !== 'item', // Items are not solid
      trigger: config.type === 'item', // Items are triggers
      id: `object_${id}`
    });
    
    // Start animation if specified
    if (gameObject.animationId) {
      spriteAnimationSystem.startAnimation(id, gameObject.animationId);
    }
    
    return id;
  }
  
  public start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    
    console.log('🚀 Starting Ultimate Game Engine...');
    placeholderAudioSystem.playMusic('city_theme', { volume: 0.3 });
    
    this.gameLoop();
  }
  
  public stop(): void {
    this.isRunning = false;
    placeholderAudioSystem.stopMusic();
    console.log('⏹️ Ultimate Game Engine stopped');
  }
  
  private gameLoop(): void {
    if (!this.isRunning) return;
    
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;
    
    // Update
    this.update(deltaTime);
    
    // Render
    this.render();
    
    // Performance tracking
    this.updatePerformanceMetrics(deltaTime);
    
    // Schedule next frame
    if (this.config.enableVSync) {
      requestAnimationFrame(() => this.gameLoop());
    } else {
      setTimeout(() => this.gameLoop(), 1000 / this.config.targetFPS);
    }
  }
  
  private update(deltaTime: number): void {
    // Update animation system
    spriteAnimationSystem.update(deltaTime);
    
    // Update game mechanics
    completeGameMechanics.update(deltaTime);
    
    // Update game objects
    for (const gameObject of this.gameObjects.values()) {
      if (!gameObject.active) continue;
      
      this.updateGameObject(gameObject, deltaTime);
    }
    
    // Handle input (simplified)
    this.handleInput();
  }
  
  private updateGameObject(obj: GameObject, deltaTime: number): void {
    // Update object-specific logic
    switch (obj.type) {
      case 'player':
        this.updatePlayer(obj, deltaTime);
        break;
      case 'npc':
        this.updateNPC(obj, deltaTime);
        break;
      case 'item':
        this.updateItem(obj, deltaTime);
        break;
    }
    
    // Update collision position
    completeGameMechanics.collision.updateEntityPosition(obj.id, obj.x, obj.y);
  }
  
  private updatePlayer(player: GameObject, deltaTime: number): void {
    // Simple AI movement for demo
    if (Math.random() < 0.01) {
      const direction = Math.floor(Math.random() * 4);
      const speed = 50; // pixels per second
      const distance = (speed * deltaTime) / 1000;
      
      let newX = player.x;
      let newY = player.y;
      
      switch (direction) {
        case 0: newY -= distance; break; // Up
        case 1: newY += distance; break; // Down
        case 2: newX -= distance; break; // Left
        case 3: newX += distance; break; // Right
      }
      
      if (completeGameMechanics.collision.canMoveTo(player.id, newX, newY)) {
        player.x = newX;
        player.y = newY;
        placeholderAudioSystem.playFootstepSound('grass');
      }
    }
  }
  
  private updateNPC(npc: GameObject, deltaTime: number): void {
    // NPCs occasionally move around
    if (Math.random() < 0.005) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 20;
      const newX = npc.x + Math.cos(angle) * distance;
      const newY = npc.y + Math.sin(angle) * distance;
      
      if (completeGameMechanics.collision.canMoveTo(npc.id, newX, newY)) {
        npc.x = newX;
        npc.y = newY;
      }
    }
  }
  
  private updateItem(item: GameObject, deltaTime: number): void {
    // Items have a subtle floating animation
    item.y += Math.sin(Date.now() * 0.003) * 0.5;
    
    // Check if player is near item
    const player = Array.from(this.gameObjects.values()).find(obj => obj.type === 'player');
    if (player) {
      const distance = Math.sqrt(
        Math.pow(item.x - player.x, 2) + Math.pow(item.y - player.y, 2)
      );
      
      if (distance < 30) {
        // Player is near, collect the item
        this.collectItem(player, item);
      }
    }
  }
  
  private collectItem(player: GameObject, item: GameObject): void {
    if (!item.active) return;
    
    // Add item to inventory
    const inventoryItem = {
      id: item.itemId || 'unknown',
      name: item.itemId === 'gem' ? 'Precious Gem' : 'Unknown Item',
      description: 'A valuable item',
      iconSprite: 'ui_icon_gem',
      stackSize: 10,
      rarity: 'common' as const,
      type: 'misc' as const,
      value: item.value || 1
    };
    
    if (completeGameMechanics.inventory.addItem(inventoryItem)) {
      this.playerGold += item.value || 0;
      item.active = false;
      this.gameObjects.delete(item.id);
      completeGameMechanics.collision.removeDynamicCollider(item.id);
      spriteAnimationSystem.stopAnimation(item.id, item.animationId || '');
      
      placeholderAudioSystem.playItemSound('pickup');
      console.log(`💎 Collected ${inventoryItem.name}! Gold: ${this.playerGold}`);
    }
  }
  
  private handleInput(): void {
    // Input handling would go here
    // For now, this is just a placeholder
  }
  
  private render(): void {
    const renderCtx = this.offscreenCtx || this.ctx;
    
    // Clear canvas
    renderCtx.fillStyle = '#2a4d3a'; // Forest green background
    renderCtx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Render game objects
    const sortedObjects = Array.from(this.gameObjects.values())
      .filter(obj => obj.active)
      .sort((a, b) => a.y - b.y); // Sort by Y for proper depth
    
    for (const obj of sortedObjects) {
      this.renderGameObject(renderCtx, obj);
    }
    
    // Render UI
    this.renderUI(renderCtx);
    
    // Copy offscreen canvas to main canvas if using offscreen rendering
    if (this.offscreenCanvas && this.offscreenCtx) {
      this.ctx.drawImage(this.offscreenCanvas, 0, 0);
    }
    
    // Debug info
    if (this.config.debugMode) {
      this.renderDebugInfo(this.ctx);
    }
  }
  
  private renderGameObject(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, obj: GameObject): void {
    // Get current animation frame
    const animFrame = spriteAnimationSystem.getCurrentFrame(obj.id, obj.animationId || '');
    
    if (animFrame) {
      const cachedSprite = this.spriteCache.get(obj.spriteId);
      if (cachedSprite) {
        // Use cached ImageBitmap for better performance
        ctx.drawImage(
          cachedSprite,
          animFrame.x, animFrame.y, animFrame.width, animFrame.height,
          obj.x, obj.y, obj.width, obj.height
        );
      }
    } else {
      // Fallback rendering
      this.renderFallback(ctx, obj);
    }
    
    // Render health bar for living entities
    if (obj.health !== undefined && obj.maxHealth !== undefined) {
      this.renderHealthBar(ctx, obj);
    }
  }
  
  private renderFallback(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, obj: GameObject): void {
    // Simple colored rectangle as fallback
    const colors = {
      player: '#00ff00',
      npc: '#ffff00',
      item: '#ff00ff',
      object: '#888888'
    };
    
    ctx.fillStyle = colors[obj.type as keyof typeof colors] || '#888888';
    ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
  }
  
  private renderHealthBar(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, obj: GameObject): void {
    if (obj.health === obj.maxHealth) return; // Don't show full health bars
    
    const barWidth = obj.width;
    const barHeight = 4;
    const barY = obj.y - 8;
    
    // Background
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(obj.x, barY, barWidth, barHeight);
    
    // Health
    const healthPercent = (obj.health || 0) / (obj.maxHealth || 1);
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(obj.x, barY, barWidth * healthPercent, barHeight);
  }
  
  private renderUI(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D): void {
    // Simple UI overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 200, 80);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px monospace';
    ctx.fillText(`Gold: ${this.playerGold}`, 20, 30);
    ctx.fillText(`Objects: ${this.gameObjects.size}`, 20, 50);
    
    const inventory = completeGameMechanics.inventory.getSlots().filter(slot => slot.item);
    ctx.fillText(`Inventory: ${inventory.length}/48`, 20, 70);
  }
  
  private renderDebugInfo(ctx: CanvasRenderingContext2D): void {
    const metrics = this.getPerformanceMetrics();
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(this.canvas.width - 220, 10, 200, 120);
    
    ctx.fillStyle = '#00ff00';
    ctx.font = '12px monospace';
    
    const debugInfo = [
      `FPS: ${metrics.fps.toFixed(1)}`,
      `Frame: ${metrics.frameTime.toFixed(2)}ms`,
      `Sprites: ${metrics.activeSprites}`,
      `Animations: ${metrics.activeAnimations}`,
      `Sounds: ${metrics.activeSounds}`,
      `Memory: ${(metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB`
    ];
    
    debugInfo.forEach((info, index) => {
      ctx.fillText(info, this.canvas.width - 210, 30 + index * 15);
    });
  }
  
  private updatePerformanceMetrics(deltaTime: number): void {
    this.frameCount++;
    this.fpsHistory.push(1000 / deltaTime);
    
    if (this.fpsHistory.length > 60) {
      this.fpsHistory.shift();
    }
  }
  
  public getPerformanceMetrics(): PerformanceMetrics {
    const avgFPS = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length || 0;
    
    return {
      fps: avgFPS,
      frameTime: 1000 / avgFPS,
      memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
      activeSprites: this.gameObjects.size,
      activeAnimations: spriteAnimationSystem.getAllAnimations().length,
      activeSounds: placeholderAudioSystem.getAudioStatus().activeSounds
    };
  }
  
  private logSystemStatus(): void {
    console.log('\n🌟 ULTIMATE GAME ENGINE STATUS:');
    console.log(`  🎨 Sprite Registry: ${completeSpriteRegistry.getTotalSpriteCount()} sprites`);
    console.log(`  🎬 Animation System: ${spriteAnimationSystem.getAllAnimations().length} animations`);
    console.log(`  🎵 Audio System: ${placeholderAudioSystem.listAvailableSounds().length} sounds`);
    console.log(`  💥 Game Mechanics: ${Object.keys(completeGameMechanics.getSystemStatus()).length} systems`);
    console.log(`  🎮 Game Objects: ${this.gameObjects.size} objects`);
    console.log(`  💰 Player Gold: ${this.playerGold}`);
  }
  
  // Public API methods
  public addGameObject(config: any): number {
    return this.createGameObject(config);
  }
  
  public removeGameObject(id: number): void {
    this.gameObjects.delete(id);
    completeGameMechanics.collision.removeDynamicCollider(id);
  }
  
  public getGameObject(id: number): GameObject | undefined {
    return this.gameObjects.get(id);
  }
  
  public getAllGameObjects(): GameObject[] {
    return Array.from(this.gameObjects.values());
  }
  
  public getPlayerGold(): number {
    return this.playerGold;
  }
  
  public addGold(amount: number): void {
    this.playerGold += amount;
    placeholderAudioSystem.playItemSound('pickup');
    console.log(`💰 Added ${amount} gold! Total: ${this.playerGold}`);
  }
  
  public enableDebugMode(enabled: boolean): void {
    this.config.debugMode = enabled;
    console.log(`🐛 Debug mode ${enabled ? 'enabled' : 'disabled'}`);
  }
  
  public setTargetFPS(fps: number): void {
    this.config.targetFPS = Math.max(30, Math.min(144, fps));
    console.log(`🎯 Target FPS set to ${this.config.targetFPS}`);
  }
}

// Game object interface
export interface GameObject {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  spriteId: string;
  animationId?: string;
  type: string;
  active: boolean;
  health?: number;
  maxHealth?: number;
  npcType?: string;
  itemId?: string;
  value?: number;
}

// 🌟 GLOBAL ULTIMATE GAME ENGINE INSTANCE FACTORY
export function createUltimateGame(canvas: HTMLCanvasElement, config?: Partial<GameConfig>): UltimateGameEngine {
  return new UltimateGameEngine(canvas, config);
}

// 🎮 CONVENIENCE FUNCTIONS FOR DEMO
export function startUltimateDemo(canvas: HTMLCanvasElement): UltimateGameEngine {
  console.log('🚀 Starting Ultimate Game Demo...');
  
  const engine = new UltimateGameEngine(canvas, {
    debugMode: true,
    enableAudio: true,
    targetFPS: 60
  });
  
  // Add demo-specific features
  setTimeout(() => {
    engine.start();
    console.log('✅ Ultimate demo started! Check console for updates.');
    
    // Demo interactions
    setTimeout(() => {
      engine.addGold(100);
      console.log('💎 Demo: Added bonus gold!');
    }, 3000);
    
    setTimeout(() => {
      const mechanics = completeGameMechanics;
      mechanics.quest.acceptQuest('collect_herbs');
      console.log('📜 Demo: Accepted herb collection quest!');
    }, 5000);
    
  }, 1000);
  
  // Make engine accessible globally for demo purposes
  (window as any).ultimateGame = engine;
  (window as any).gameMechanics = completeGameMechanics;
  (window as any).audioSystem = placeholderAudioSystem;
  (window as any).spriteRegistry = completeSpriteRegistry;
  
  return engine;
}
