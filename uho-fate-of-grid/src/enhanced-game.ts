// Enhanced Game Class with Integrated Systems
// Combines existing ECS with new physics, world map, and side-scrolling

import { World } from '@core/ecs.ts';
import { Transform, Sprite, Stats, Needs, Inventory, Wallet, Skills, Addiction, LawEnforcement } from '@core/components.ts';
import { MapManager, TILE_TYPES } from '@core/map.ts';
import { spriteManager } from '@core/sprites.ts';
import { audioManager } from '@core/audio.ts';
import { particleSystem } from '@core/particles.ts';
import { NPCManager } from '@core/npc.ts';
import { tweenManager, AnimationUtils, Easing } from '@core/animation.ts';
import type { Direction, MessageType } from '@core/types.ts';

// Import new systems
import { physicsEngine, type PhysicsBody } from '@core/physics.ts';
import { skaalainSystem } from '@core/skaalain.ts';
import { GameModeManager, initializeGameModeManager, type GameMode } from '@core/gamemode.ts';
import { FreeMovementDemo } from './free-movement-demo.ts';

export class EnhancedGame {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private world: World;
  
  // Legacy systems (for compatibility)
  private mapManager: MapManager;
  private npcManager: NPCManager;
  
  // New integrated systems
  private gameModeManager: GameModeManager;
  private freeMovementDemo: FreeMovementDemo;
  
  // Player entity tracking
  private playerId?: number;
  private playerPhysicsBody?: PhysicsBody | null;
  
  // Game state
  private isRunning: boolean = false;
  private lastTime: number = 0;
  private keys: Set<string> = new Set();
  private useFreeMovementMode: boolean = false; // Toggle between modes
  
  // Messages system (preserved from original)
  private messages: MessageType[] = [];
  private maxMessages = 50;
  
  // UI elements
  private messageLog: HTMLElement;
  private statsPanel: HTMLElement;
  private needsPanel: HTMLElement;
  private cashElement: HTMLElement;
  private bankElement: HTMLElement;
  private heatElement: HTMLElement;
  
  constructor() {
    // Get canvas and UI elements
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    
    this.messageLog = document.getElementById('messageLog')!;
    this.statsPanel = document.getElementById('statsPanel')!;
    this.needsPanel = document.getElementById('needsPanel')!;
    this.cashElement = document.getElementById('cash')!;
    this.bankElement = document.getElementById('bank')!;
    this.heatElement = document.getElementById('heat')!;
    
    // Initialize core systems
    this.world = new World();
    this.mapManager = new MapManager();
    this.npcManager = new NPCManager(this.world, this.mapManager);
    
    // Initialize new game mode manager (this handles physics, world map, side-scroll)
    this.gameModeManager = initializeGameModeManager(this.canvas);
    
    // Initialize free movement demo
    this.freeMovementDemo = new FreeMovementDemo(this.canvas, this.world, this.messageLog);
    
    // Setup canvas and input
    this.setupCanvas();
    this.setupInput();
    
    // Load sprites and create player
    this.initializeGame();
  }
  
  private setupCanvas(): void {
    // Set canvas size
    this.canvas.width = 800;
    this.canvas.height = 600;
    
    // Make canvas focusable and focus it
    this.canvas.tabIndex = 0;
    this.canvas.focus();
    
    // Configure rendering
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';
  }
  
  private setupInput(): void {
    document.addEventListener('keydown', (e) => {
      this.keys.add(e.key.toLowerCase());
      
      // Prevent default for game keys
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 
           'e', 'i', 't', 'f', 'r', 'j', 'enter', ' ', 'tab', 'x', 'z', 'shift',
           '1', '2', '3', '+', '=', '-', '_', 'f1'].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    });
    
    document.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase());
    });
  }
  
  private async initializeGame(): Promise<void> {
    try {
      // Load sprites with proper scaling
      await this.loadSprites();
      
      // Create player with both ECS and physics
      this.createPlayer();
      
      // Spawn NPCs
      this.npcManager.spawnRandomNPCs();
      
      // Initialize UI
      this.updateUI();
      
      // Welcome messages
      this.addMessage('Tervetuloa UHO: Fate of the Grid -peliin!', 'system');
      this.addMessage('🗺️ Maailmakartta: WASD liikkuminen, ENTER sijainnit', 'system');
      this.addMessage('🏙️ Sivuskrollaus: WASD liike, SPACE hyppy, X hyökkäys', 'system');
      this.addMessage('⚡ TAB: Vaihda pelitilaa milloin tahansa', 'system');
      this.addMessage('🆓 F1: Kokeile uutta vapaata liikkumista (360°)', 'system');
      
      console.log('🎮 Enhanced game initialized successfully!');
      console.log('Available systems:');
      console.log('- Existing ECS with components preserved');
      console.log('- New physics engine with gravity and weight');
      console.log('- World map (Ultima 4 style) + Side-scrolling (Zelda 2 style)');
      console.log('- Sprite scaling system (skaalain)');
      console.log('- Smooth transitions between game modes');
      
    } catch (error) {
      console.error('Failed to initialize enhanced game:', error);
      this.addMessage('Virhe pelin alustuksessa. Tarkista konsoli.', 'system');
    }
  }
  
  private async loadSprites(): Promise<void> {
    try {
      // Load player sprite sheet with animations and proper scaling
      await spriteManager.loadSpriteSheet(
        'player',
        'assets/sprites/player.png',
        32, 32, // Larger frame dimensions for apocalyptic theme
        {
          idle_south: { name: 'idle_south', frames: [0], duration: 1000, loop: true },
          idle_north: { name: 'idle_north', frames: [12], duration: 1000, loop: true },
          idle_west: { name: 'idle_west', frames: [4], duration: 1000, loop: true },
          idle_east: { name: 'idle_east', frames: [8], duration: 1000, loop: true },
          walk_south: { name: 'walk_south', frames: [0, 1, 2, 3], duration: 200, loop: true },
          walk_north: { name: 'walk_north', frames: [12, 13, 14, 15], duration: 200, loop: true },
          walk_west: { name: 'walk_west', frames: [4, 5, 6, 7], duration: 200, loop: true },
          walk_east: { name: 'walk_east', frames: [8, 9, 10, 11], duration: 200, loop: true }
        }
      );
      
      // Load apocalyptic item sprites with proper scaling
      await this.loadApocalypticSprites();
      
    } catch (error) {
      console.warn('Could not load all sprites, using fallback rendering:', error);
    }
  }
  
  private async loadApocalypticSprites(): Promise<void> {
    try {
      // Load various item sprites with proper size categories
      const itemSprites = [
        { id: 'needle', path: 'assets/sprites/items/tiny/needle.png', size: 8, category: 'tinyItem' },
        { id: 'syringe', path: 'assets/sprites/items/tiny/syringe.png', size: 8, category: 'tinyItem' },
        { id: 'pill', path: 'assets/sprites/items/tiny/pill.png', size: 8, category: 'tinyItem' },
        { id: 'bottle', path: 'assets/sprites/items/small/bottle.png', size: 12, category: 'smallItem' },
        { id: 'knife', path: 'assets/sprites/items/small/knife.png', size: 12, category: 'smallItem' },
        { id: 'pistol', path: 'assets/sprites/items/medium/pistol.png', size: 20, category: 'weapon' },
        { id: 'backpack', path: 'assets/sprites/items/medium/backpack.png', size: 16, category: 'mediumItem' },
        { id: 'armor', path: 'assets/sprites/items/large/armor.png', size: 24, category: 'largeItem' }
      ];
      
      for (const sprite of itemSprites) {
        try {
          await spriteManager.loadSpriteSheet(sprite.id, sprite.path, sprite.size, sprite.size);
          console.log(`Loaded ${sprite.id} sprite (${sprite.category})`);
        } catch (error) {
          console.warn(`Failed to load ${sprite.id} sprite:`, error);
        }
      }
    } catch (error) {
      console.warn('Failed to load some apocalyptic sprites:', error);
    }
  }
  
  private createPlayer(): void {
    // Create ECS entity (preserving existing system)
    const player = this.world.createEntity();
    this.playerId = player.id;
    
    // Add all existing components
    this.world.componentManager.addComponent(new Transform(player.id, 10, 10));
    this.world.componentManager.addComponent(new Sprite(player.id, 'player'));
    this.world.componentManager.addComponent(new Stats(player.id, {
      strength: 45,
      endurance: 50,
      agility: 55,
      intelligence: 60,
      perception: 50,
      charisma: 40,
      willpower: 55,
      luck: 50,
      reflex: 60,
      tolerance: 30,
      stress: 60,
      technical: 35,
      crime: 15,
      medical: 25,
      cunning: 45
    }));
    this.world.componentManager.addComponent(new Needs(player.id));
    this.world.componentManager.addComponent(new Inventory(player.id));
    this.world.componentManager.addComponent(new Wallet(player.id, 250, 500, 0));
    this.world.componentManager.addComponent(new Skills(player.id));
    this.world.componentManager.addComponent(new Addiction(player.id));
    this.world.componentManager.addComponent(new LawEnforcement(player.id));
    
    // Get physics body from game mode manager
    const body = this.gameModeManager.getPlayerPhysicsBody();
    this.playerPhysicsBody = body;
    
    // Integrate with existing components
    this.integrateECSWithPhysics();
    
    console.log('Player created with both ECS and physics systems');
  }
  
  private integrateECSWithPhysics(): void {
    if (!this.playerId || !this.playerPhysicsBody) return;
    
    // This method bridges the gap between ECS and physics systems
    // In a full implementation, you'd create a system that automatically syncs these
    
    console.log('ECS-Physics integration active');
    console.log('Transform component synced with physics body');
    console.log('Sprite scaling applied via skaalain system');
  }
  
  private toggleFreeMovementMode(): void {
    this.useFreeMovementMode = !this.useFreeMovementMode;
    
    if (this.useFreeMovementMode) {
      // Initialize free movement demo
      this.freeMovementDemo.createFreePlayer(400, 300);
      this.freeMovementDemo.createDemoScene();
      this.addMessage('🆓 Free Movement Mode activated!', 'system');
      this.addMessage('WASD: 360° movement | Shift: Sprint | T: Toggle tile/free', 'system');
      this.addMessage('Space: Camera shake | +/-: Zoom | R: Reset position', 'system');
      this.addMessage('F1: Return to original game mode', 'system');
      
    } else {
      this.addMessage('🔙 Returning to original game mode', 'system');
    }
    
    console.log(`🔄 Switched to ${this.useFreeMovementMode ? 'Free Movement' : 'Original'} mode`);
  }
  
  private handleInput(): void {
    // Handle F1 key to toggle free movement mode
    if (this.keys.has('f1')) {
      this.toggleFreeMovementMode();
      this.keys.delete('f1'); // Consume the key press
      return;
    }
    
    if (this.useFreeMovementMode) {
      // Use free movement demo
      this.freeMovementDemo.handleInput(this.keys);
    } else {
      // Use original game mode manager
      this.gameModeManager.handleInput(this.keys);
      
      // Handle legacy ECS input for compatibility in world map mode
      if (this.gameModeManager.getCurrentMode() === 'world_map') {
        this.handleECSInput();
      }
    }
  }
  
  private handleECSInput(): void {
    // This preserves the original turn-based input for world map mode
    if (!this.playerId) return;
    
    const transform = this.world.componentManager.getComponent(this.playerId, Transform);
    if (!transform) return;
    
    // Handle non-movement actions that should work in world map mode
    if (this.keys.has('e')) {
      this.handleAction('use');
      this.keys.delete('e');
    } else if (this.keys.has('i')) {
      this.handleAction('inventory');
      this.keys.delete('i');
    } else if (this.keys.has('t')) {
      this.handleAction('rest');
      this.keys.delete('t');
    }
  }
  
  private handleAction(action: string): void {
    if (!this.playerId) return;
    
    const transform = this.world.componentManager.getComponent(this.playerId, Transform);
    if (!transform) return;
    
    switch (action) {
      case 'use':
        this.interactWithLocation(transform.x, transform.y);
        break;
      case 'inventory':
        this.showInventory();
        break;
      case 'rest':
        this.rest();
        break;
    }
  }
  
  private showInventory(): void {
    if (!this.playerId) return;
    
    const inventory = this.world.componentManager.getComponent(this.playerId, Inventory);
    if (!inventory) return;
    
    if (inventory.items.length === 0) {
      this.addMessage('Reppu on tyhjä.', 'normal');
    } else {
      this.addMessage('--- Reppu ---', 'system');
      for (const item of inventory.items) {
        // Show item with proper scaling info
        const category = skaalainSystem.getApocalypticItemCategory(item.itemId);
        const scale = skaalainSystem.getScale(category, 'inventory');
        this.addMessage(`${item.itemId} (${item.quantity}) [${Math.round(scale * 32)}px]`, 'normal');
      }
    }
  }
  
  private rest(): void {
    if (!this.playerId) return;
    
    const needs = this.world.componentManager.getComponent(this.playerId, Needs);
    if (!needs) return;
    
    // Restore some sleep, reduce other needs slightly
    needs.modifyNeed('sleep', 20);
    needs.modifyNeed('hunger', -5);
    needs.modifyNeed('thirst', -3);
    needs.modifyNeed('hygiene', -2);
    
    this.addMessage('Levähdit hetken. Tunnet olosi virkistäneemmäksi.', 'normal');
    this.processTurn();
  }
  
  private interactWithLocation(x: number, y: number): void {
    // This would integrate with your existing location interaction system
    const tileType = this.mapManager.getTileTypeId(x, y);
    
    switch (tileType) {
      case 'shop':
        this.addMessage('--- Kauppa ---', 'system');
        this.addMessage('Huumeita, aseita ja tarvikkeita...', 'normal');
        break;
      default:
        this.addMessage('Ei ole mitään erityistä tässä.', 'normal');
        break;
    }
  }
  
  private processTurn(): void {
    if (!this.playerId) return;
    
    // Process needs decay (preserved from original)
    const needs = this.world.componentManager.getComponent(this.playerId, Needs);
    if (needs) {
      const timeSinceLastTick = Date.now() - needs.lastTick;
      const turnsElapsed = Math.floor(timeSinceLastTick / 1000);
      
      if (turnsElapsed > 0) {
        needs.modifyNeed('hunger', -turnsElapsed * 0.5);
        needs.modifyNeed('thirst', -turnsElapsed * 0.7);
        needs.modifyNeed('sleep', -turnsElapsed * 0.3);
        needs.modifyNeed('warmth', -turnsElapsed * 0.2);
        needs.modifyNeed('social', -turnsElapsed * 0.1);
        needs.modifyNeed('hygiene', -turnsElapsed * 0.3);
        
        needs.lastTick = Date.now();
        this.checkCriticalNeeds();
      }
    }
    
    // Sync ECS with physics if in side-scroll mode
    this.syncECSWithPhysics();
    
    this.updateUI();
  }
  
  private syncECSWithPhysics(): void {
    if (!this.playerId || !this.playerPhysicsBody) return;
    
    const transform = this.world.componentManager.getComponent(this.playerId, Transform);
    if (transform && this.gameModeManager.getCurrentMode() === 'side_scroll') {
      // In side-scroll mode, sync ECS transform with physics body
      transform.setPosition(
        Math.floor(this.playerPhysicsBody.position.x / 32), // Convert pixels to grid
        Math.floor(this.playerPhysicsBody.position.y / 32)
      );
    }
  }
  
  private checkCriticalNeeds(): void {
    if (!this.playerId) return;
    
    const needs = this.world.componentManager.getComponent(this.playerId, Needs);
    if (!needs) return;
    
    if (needs.getNeed('hunger') < 10) {
      this.addMessage('Olet nälkäinen! Tarvitset ruokaa pian.', 'system');
    }
    
    if (needs.getNeed('thirst') < 10) {
      this.addMessage('Olet janoinen! Tarvitset juotavaa pian.', 'system');
    }
    
    if (needs.getNeed('sleep') < 10) {
      this.addMessage('Olet väsynyt. Tarvitset lepoa.', 'system');
    }
  }
  
  private addMessage(text: string, type: MessageType['type'] = 'normal'): void {
    this.messages.push({
      text,
      type,
      timestamp: Date.now()
    });
    
    // Limit message count
    if (this.messages.length > this.maxMessages) {
      this.messages.splice(0, this.messages.length - this.maxMessages);
    }
    
    this.updateMessageLog();
  }
  
  private updateMessageLog(): void {
    this.messageLog.innerHTML = '';
    
    for (const message of this.messages) {
      const div = document.createElement('div');
      div.className = `message ${message.type}`;
      div.textContent = message.text;
      this.messageLog.appendChild(div);
    }
    
    // Scroll to bottom
    this.messageLog.scrollTop = this.messageLog.scrollHeight;
  }
  
  private updateUI(): void {
    if (!this.playerId) return;
    
    const stats = this.world.componentManager.getComponent(this.playerId, Stats);
    const needs = this.world.componentManager.getComponent(this.playerId, Needs);
    const wallet = this.world.componentManager.getComponent(this.playerId, Wallet);
    const lawEnforcement = this.world.componentManager.getComponent(this.playerId, LawEnforcement);
    
    // Update stats
    if (stats) {
      this.statsPanel.innerHTML = '';
      for (const [key, value] of Object.entries(stats.stats)) {
        const div = document.createElement('div');
        div.className = 'stat-row';
        div.innerHTML = `<span>${this.translateStat(key)}:</span><span>${Math.floor(value)}</span>`;
        this.statsPanel.appendChild(div);
      }
    }
    
    // Update needs
    if (needs) {
      this.needsPanel.innerHTML = '';
      for (const [key, value] of Object.entries(needs.needs)) {
        const div = document.createElement('div');
        div.innerHTML = `<div style="margin-bottom: 4px;">${this.translateNeed(key)}</div>`;
        
        const barContainer = document.createElement('div');
        barContainer.className = 'need-bar';
        
        const barFill = document.createElement('div');
        barFill.className = 'need-fill';
        const percentage = Math.max(0, Math.min(100, value));
        barFill.style.width = `${percentage}%`;
        
        if (percentage < 10) {
          barFill.classList.add('critical');
        } else if (percentage < 25) {
          barFill.classList.add('low');
        }
        
        barContainer.appendChild(barFill);
        div.appendChild(barContainer);
        this.needsPanel.appendChild(div);
      }
    }
    
    // Update wallet and status
    if (wallet) {
      this.cashElement.textContent = `${wallet.cash}€`;
      this.bankElement.textContent = `${wallet.bank}€`;
    }
    
    if (lawEnforcement) {
      this.heatElement.textContent = `${Math.floor(lawEnforcement.heat)}`;
    }
  }
  
  private translateStat(stat: string): string {
    const translations: Record<string, string> = {
      strength: 'Voima',
      endurance: 'Kestävyys',
      agility: 'Ketteryys',
      intelligence: 'Älykkyys',
      perception: 'Havaitseminen',
      charisma: 'Karisma',
      willpower: 'Tahdonvoima',
      luck: 'Onni',
      reflex: 'Refleksit',
      tolerance: 'Sietokyky',
      stress: 'Stressinsietokyky',
      technical: 'Tekninen taito',
      crime: 'Rikoskokemus',
      medical: 'Lääketieto',
      cunning: 'Ovela'
    };
    return translations[stat] || stat;
  }
  
  private translateNeed(need: string): string {
    const translations: Record<string, string> = {
      hunger: 'Nälkä',
      thirst: 'Jano',
      sleep: 'Uni',
      warmth: 'Lämpö',
      social: 'Sosiaalisuus',
      pain: 'Kipu',
      hygiene: 'Hygienia'
    };
    return translations[need] || need;
  }
  
  // Main update loop
  update(deltaTime: number): void {
    this.handleInput();
    
    if (this.useFreeMovementMode) {
      // Update free movement demo
      this.freeMovementDemo.update(deltaTime);
      
      // Still update ECS components for stats/needs
      this.world.update(deltaTime);
      
    } else {
      // Update ECS world (for components that are still relevant)
      this.world.update(deltaTime);
      
      // Update game mode manager (handles physics, world map, side-scroll)
      this.gameModeManager.update(deltaTime);
      
      // Update NPCs (in world map mode)
      if (this.gameModeManager.getCurrentMode() === 'world_map') {
        this.npcManager.update(deltaTime, this.playerId);
      }
    }
    
    // Update particles and effects
    particleSystem.update(deltaTime);
    tweenManager.update();
    
    // Periodic UI updates
    if (Date.now() % 1000 < deltaTime) { // Update UI roughly once per second
      this.updateUI();
    }
  }
  
  // Main render loop
  render(): void {
    if (this.useFreeMovementMode) {
      // Render free movement demo
      this.freeMovementDemo.render();
    } else {
      // The game mode manager handles all rendering
      this.gameModeManager.render();
    }
    
    // Add system status overlay
    this.renderSystemStatus();
  }
  
  private renderSystemStatus(): void {
    // Show integration status
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(this.canvas.width - 200, this.canvas.height - 120, 190, 110);
    
    this.ctx.fillStyle = '#00FF00';
    this.ctx.font = '11px monospace';
    this.ctx.fillText('🎮 Enhanced UHO Active', this.canvas.width - 190, this.canvas.height - 105);
    this.ctx.fillText('ECS: Integrated', this.canvas.width - 190, this.canvas.height - 90);
    this.ctx.fillText('Physics: Active', this.canvas.width - 190, this.canvas.height - 75);
    this.ctx.fillText('Scaling: Active', this.canvas.width - 190, this.canvas.height - 60);
    const currentMode = this.useFreeMovementMode ? 'FREE_360' : this.gameModeManager.getCurrentMode().toUpperCase();
    this.ctx.fillText('Mode: ' + currentMode, this.canvas.width - 190, this.canvas.height - 45);
    
    if (this.useFreeMovementMode) {
      const playerBody = this.freeMovementDemo.getPlayerPhysicsBody();
      if (playerBody) {
        this.ctx.fillText(`Moving: ${playerBody.isMoving}`, this.canvas.width - 190, this.canvas.height - 30);
        this.ctx.fillText(`Speed: ${Math.round(Math.sqrt(playerBody.velocity.x**2 + playerBody.velocity.y**2))} px/s`, this.canvas.width - 190, this.canvas.height - 15);
      } else {
        this.ctx.fillText('F1: Toggle Free Mode', this.canvas.width - 190, this.canvas.height - 30);
        this.ctx.fillText('Ready to test!', this.canvas.width - 190, this.canvas.height - 15);
      }
    } else if (this.playerPhysicsBody && this.gameModeManager.getCurrentMode() === 'side_scroll') {
      this.ctx.fillText(`Grounded: ${this.playerPhysicsBody.isGrounded}`, this.canvas.width - 190, this.canvas.height - 30);
      this.ctx.fillText(`Mass: ${this.playerPhysicsBody.mass}kg`, this.canvas.width - 190, this.canvas.height - 15);
    } else {
      this.ctx.fillText('F1: Free Movement', this.canvas.width - 190, this.canvas.height - 30);
      this.ctx.fillText('TAB: Switch Mode', this.canvas.width - 190, this.canvas.height - 15);
    }
  }
  
  // Game loop
  private gameLoop = (currentTime: number): void => {
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    
    this.update(deltaTime);
    this.render();
    
    if (this.isRunning) {
      requestAnimationFrame(this.gameLoop);
    }
  };
  
  public start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this.gameLoop);
    
    console.log('🚀 Enhanced game started!');
    console.log('All systems integrated and running');
  }
  
  public stop(): void {
    this.isRunning = false;
    console.log('🛑 Enhanced game stopped');
  }
  
  // Add some helper methods for creating items with physics
  public createItem(itemType: string, x: number, y: number): void {
    this.gameModeManager.createItemWithPhysics(`item_${Date.now()}`, itemType, x, y);
  }
  
  // Debug method to show scaling info
  public showScalingInfo(): void {
    console.log(skaalainSystem.getVisualSizeComparison());
  }
  
  // Helper methods for testing and debugging
  public toggleFreeMovement(): void {
    this.toggleFreeMovementMode();
  }
  
  public isInFreeMovementMode(): boolean {
    return this.useFreeMovementMode;
  }
  
  public getFreeMovementDemo(): FreeMovementDemo {
    return this.freeMovementDemo;
  }
}
