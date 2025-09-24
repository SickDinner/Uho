import { World } from '@core/ecs.ts';
import { Transform, Sprite, Stats, Needs, Inventory, Wallet, Skills, Addiction, LawEnforcement } from '@core/components.ts';
import { MapManager, TILE_TYPES } from '@core/map.ts';
import { spriteManager } from '@core/sprites.ts';
import { audioManager } from '@core/audio.ts';
import { particleSystem } from '@core/particles.ts';
import { NPCManager } from '@core/npc.ts';
import { Camera } from '@core/camera.ts';
import { RenderSystem } from '@core/renderer.ts';
import { Scene, SceneManager, sceneManager } from '@core/scene.ts';
import { tweenManager, AnimationUtils, Easing, Tween } from '@core/animation.ts';
import type { Direction, MessageType } from '@core/types.ts';

// Import new systems
import { physicsEngine, type PhysicsBody } from '@core/physics.ts';
import { skaalainSystem } from '@core/skaalain.ts';
import { GameModeManager, initializeGameModeManager } from '@core/gamemode.ts';
import { WorldMapSystem } from '@core/worldmap.ts';
import { SideScrollSystem } from '@core/sidescroller.ts';

class GameScene extends Scene {
  private world: World;
  private mapManager: MapManager;
  private npcManager: NPCManager;
  private camera: Camera;
  private renderSystem: RenderSystem;
  
  // Player entity
  private playerId?: number;
  
  // Input handling
  private keys: Set<string> = new Set();
  private lastInput = 0;
  private lastMovement = 0;
  private inputDelay = 100; // ms between turn-based inputs
  private movementDelay = 80; // ms between movement inputs
  
  // Messages
  private messages: MessageType[] = [];
  private maxMessages = 50;
  
  // Drug influence effects
  private drugEffects = {
    swayIntensity: 0,
    swaySpeed: 0,
    zoomDrift: 0,
    colorShift: { r: 0, g: 0, b: 0 },
    perception: 0
  };
  private drugEffectTime = 0;
  
  // UI elements - will be passed from Game class
  private messageLog!: HTMLElement;
  private statsPanel!: HTMLElement;
  private needsPanel!: HTMLElement;
  private cashElement!: HTMLElement;
  private bankElement!: HTMLElement;
  private heatElement!: HTMLElement;
  
  constructor(canvas: HTMLCanvasElement) {
    super('game');
    
    this.world = new World();
    this.mapManager = new MapManager();
    this.npcManager = new NPCManager(this.world, this.mapManager);
    
    // Initialize camera
    this.camera = new Camera({
      width: canvas.width,
      height: canvas.height,
      tileSize: 10,
      smoothing: 0.15,
      deadZone: { x: 100, y: 100 },
      maxDistance: { x: 300, y: 300 }
    });
    
    // Initialize render system
    this.renderSystem = new RenderSystem(
      this.world.componentManager,
      canvas,
      this.camera,
      this.mapManager
    );
    
    // Add render system to world
    this.world.addSystem(this.renderSystem);
  }
  
  setUIElements(
    messageLog: HTMLElement,
    statsPanel: HTMLElement,
    needsPanel: HTMLElement,
    cashElement: HTMLElement,
    bankElement: HTMLElement,
    heatElement: HTMLElement
  ) {
    this.messageLog = messageLog;
    this.statsPanel = statsPanel;
    this.needsPanel = needsPanel;
    this.cashElement = cashElement;
    this.bankElement = bankElement;
    this.heatElement = heatElement;
  }
  
  onEnter(): void {
    // Load sprites
    this.loadSprites();
    
    // Create player
    this.createPlayer();
    
    // Spawn NPCs
    this.npcManager.spawnRandomNPCs();
    
    // Initialize UI
    this.updateUI();
    
    this.addMessage('Tervetuloa UHO: Fate of the Grid -peliin!', 'system');
    this.addMessage('Käytä WASD tai nuolinäppäimiä liikkumiseen.', 'system');
    this.addMessage('Paina E vuorovaikutuksiin, F keskustellaksesi NPC:iden kanssa.', 'system');
    
    // Camera shake effect when entering the game
    this.camera.shake(10, 500);
  }
  
  onExit(): void {
    // Cleanup if needed
  }
  
  override handleInput(keys: Set<string>): boolean {
    this.keys = keys;
    return true; // Always consume input in game scene
  }
  
  update(deltaTime: number): void {
    // Handle input
    this.handleGameInput();
    
    // Update world systems
    this.world.update(deltaTime);
    
    // Update camera
    this.camera.update(deltaTime, this.world.componentManager);
    
    // Update particles
    particleSystem.update(deltaTime);
    
    // Update NPCs
    this.npcManager.update(deltaTime, this.playerId);
    
    // Update animations
    tweenManager.update();
    
    // Update drug effects
    this.updateDrugEffects(deltaTime);
  }
  
  render(ctx: CanvasRenderingContext2D): void {
    // The RenderSystem handles all rendering through the world update
    // This method is called by SceneManager but actual rendering is done by RenderSystem
  }

  private async loadSprites(): Promise<void> {
    try {
      // Load player sprite sheet with animations
      await spriteManager.loadSpriteSheet(
        'player',
        'assets/sprites/player.png',
        16, 16, // Frame dimensions
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
    } catch (error) {
      console.warn('Could not load sprites, using fallback rendering:', error);
    }
  }
  
  private createPlayer(): void {
    const player = this.world.createEntity();
    this.playerId = player.id;
    
    // Add components
    this.world.componentManager.addComponent(new Transform(player.id, 10, 10));
    this.world.componentManager.addComponent(new Sprite(player.id, 'player')); // Player sprite
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
    
    // Set camera to follow player
    this.camera.setTarget(player.id);
  }
  
  private handleGameInput(): void {
    if (!this.playerId) {
      return;
    }
    
    // Check input delays
    const inputDelayPassed = Date.now() - this.lastInput >= this.inputDelay;
    const movementDelayPassed = Date.now() - this.lastMovement >= this.movementDelay;
    
    const transform = this.world.componentManager.getComponent(this.playerId, Transform);
    if (!transform) return;
    
    let moved = false;
    let newX = transform.x;
    let newY = transform.y;
    let newFacing = transform.facing;
    
    // Movement (with separate shorter delay)
    if (movementDelayPassed) {
      if (this.keys.has('w') || this.keys.has('arrowup')) {
        newY--;
        newFacing = 'north';
        moved = true;
      } else if (this.keys.has('s') || this.keys.has('arrowdown')) {
        newY++;
        newFacing = 'south';
        moved = true;
      } else if (this.keys.has('a') || this.keys.has('arrowleft')) {
        newX--;
        newFacing = 'west';
        moved = true;
      } else if (this.keys.has('d') || this.keys.has('arrowright')) {
        newX++;
        newFacing = 'east';
        moved = true;
      }
    }
    
    // Actions (respect input delay)
    if (inputDelayPassed) {
      if (this.keys.has('e')) {
        this.handleAction('use');
        this.lastInput = Date.now();
        return;
      }
      
      if (this.keys.has('i')) {
        this.handleAction('inventory');
        this.lastInput = Date.now();
        return;
      }
      
      if (this.keys.has('t')) {
        this.handleAction('rest');
        this.lastInput = Date.now();
        return;
      }
      
      if (this.keys.has('r')) {
        this.handleAction('buy_food');
        this.lastInput = Date.now();
        return;
      }
      
      if (this.keys.has('j')) {
        this.handleAction('buy_drink');
        this.lastInput = Date.now();
        return;
      }
      
      if (this.keys.has('f')) {
        this.handleAction('talk');
        this.lastInput = Date.now();
        return;
      }
    }
    
  // Special camera controls (for debugging/testing)
    if (inputDelayPassed) {
      if (this.keys.has('1')) {
        this.animateZoom(0.5, 800);
        this.addMessage('Camera: Zoom Out (0.5x)', 'system');
        this.lastInput = Date.now();
      } else if (this.keys.has('2')) {
        this.animateZoom(1, 800);
        this.addMessage('Camera: Normal Zoom (1x)', 'system');
        this.lastInput = Date.now();
      } else if (this.keys.has('3')) {
        this.animateZoom(2, 800);
        this.addMessage('Camera: Zoom In (2x)', 'system');
        this.lastInput = Date.now();
      }
    }
    
    if (inputDelayPassed && this.keys.has('c')) {
      this.camera.setMode(this.camera.mode === 'smooth_follow' ? 'follow' : 'smooth_follow');
      this.addMessage(`Camera mode: ${this.camera.mode}`, 'system');
      this.lastInput = Date.now();
    }
    
    if (moved) {
      // Check map bounds and walkability
      const map = this.mapManager.getCurrentMap();
      newX = Math.max(0, Math.min(map.width - 1, newX));
      newY = Math.max(0, Math.min(map.height - 1, newY));
      
      if (this.mapManager.isWalkable(newX, newY)) {
        transform.setPosition(newX, newY);
        transform.facing = newFacing;
        
        // Update sprite animation for walking
        const sprite = this.world.componentManager.getComponent(this.playerId, Sprite);
        if (sprite) {
          sprite.setAnimation(`walk_${newFacing}`);
        }
        
        // Add movement feedback
        this.addMovementFeedback(newX, newY);
        
        // Check for location interactions
        this.checkLocationInteractions(newX, newY);
        
        this.processTurn();
        this.lastMovement = Date.now();
      } else {
        // Can't move there, but still update facing
        transform.facing = newFacing;
        
        // Update sprite to idle animation facing the blocked direction
        const sprite = this.world.componentManager.getComponent(this.playerId, Sprite);
        if (sprite) {
          sprite.setAnimation(`idle_${newFacing}`);
        }
        
        const tileType = this.mapManager.getTileTypeId(newX, newY);
        const tile = TILE_TYPES[tileType];
        if (tile) {
          this.addMessage(`${tile.description}`, 'normal');
        }
      }
    } else {
      // No movement - set to idle animation
      const sprite = this.world.componentManager.getComponent(this.playerId, Sprite);
      if (sprite && sprite.currentAnimation.startsWith('walk_')) {
        sprite.setAnimation(`idle_${transform.facing}`);
      }
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
      case 'buy_food':
        this.buyFood();
        break;
      case 'buy_drink':
        this.buyDrink();
        break;
      case 'talk':
        this.talkToNPC();
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
        this.addMessage(`${item.itemId} (${item.quantity})`, 'normal');
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
  
  private addMovementFeedback(x: number, y: number): void {
    const tileSize = 10;
    const pixelX = x * tileSize + tileSize / 2;
    const pixelY = y * tileSize + tileSize / 2;
    
    // Play footstep sound
    audioManager.createFootstepSound();
    
    // Create dust particles
    particleSystem.createFootstepDust(pixelX, pixelY);
    
    // Small camera shake on movement
    this.camera.shake(1, 50);
  }
  
  private checkLocationInteractions(x: number, y: number): void {
    const tileType = this.mapManager.getTileTypeId(x, y);
    
    if (tileType === 'dealer_spot') {
      this.addMessage('Huomaat epäilyttäviä hahmojas kulkemassa lähellä...', 'normal');
    }
    
    // Check for nearby NPCs
    const nearbyNPCs = this.npcManager.getNearbyNPCs(x, y, 1);
    if (nearbyNPCs.length > 0) {
      const npc = nearbyNPCs[0];
      if (npc.def.type === 'dealer' && npc.ai.state === 'ready_to_deal') {
        this.addMessage(`${npc.def.name} katsoo sinua kiinnostuneena...`, 'normal');
      } else if (npc.def.type === 'police' && npc.ai.suspicion > 20) {
        this.addMessage(`${npc.def.name} seuraa liikkeitäsi...`, 'system');
      }
    }
  }
  
  private talkToNPC(): void {
    if (!this.playerId) return;
    
    const transform = this.world.componentManager.getComponent(this.playerId, Transform);
    if (!transform) return;
    
    const nearbyNPCs = this.npcManager.getNearbyNPCs(transform.x, transform.y, 2);
    
    if (nearbyNPCs.length === 0) {
      this.addMessage('Ei ole ketään lähellä kenelle puhua.', 'normal');
      return;
    }
    
    // Talk to the closest NPC
    const npc = nearbyNPCs[0];
    const messages = this.npcManager.interactWithNPC(npc.id, this.playerId!);
    
    for (const message of messages) {
      this.addMessage(message, 'normal');
    }
  }
  
  private buyFood(): void {
    if (!this.playerId) return;
    
    const wallet = this.world.componentManager.getComponent(this.playerId, Wallet);
    const needs = this.world.componentManager.getComponent(this.playerId, Needs);
    
    if (wallet && needs) {
      const cost = 10;
      if (wallet.canAfford(cost)) {
        wallet.spend(cost);
        needs.modifyNeed('hunger', 30);
        this.addMessage(`Ostit ruokaa ${cost}€:lla. Tunnet olosi kylläisemmäksi.`, 'normal');
        
        // Add scale animation to show satisfaction
        const sprite = this.world.componentManager.getComponent(this.playerId, Sprite);
        if (sprite) {
          AnimationUtils.pulse(sprite, 0.2, 400);
        }
      } else {
        this.addMessage('Sinulla ei ole tarpeeksi rahaa ruokaan.', 'normal');
        this.camera.shake(3, 200);
      }
    }
  }
  
  private buyDrink(): void {
    if (!this.playerId) return;
    
    const wallet = this.world.componentManager.getComponent(this.playerId, Wallet);
    const needs = this.world.componentManager.getComponent(this.playerId, Needs);
    
    if (wallet && needs) {
      const cost = 5;
      if (wallet.canAfford(cost)) {
        wallet.spend(cost);
        needs.modifyNeed('thirst', 25);
        this.addMessage(`Ostit juoman ${cost}€:lla. Janosi helpottaa.`, 'normal');
      } else {
        this.addMessage('Sinulla ei ole tarpeeksi rahaa juomaan.', 'normal');
        this.camera.shake(3, 200);
      }
    }
  }
  
  private interactWithLocation(x: number, y: number): void {
    if (!this.playerId) return;
    
    const tileType = this.mapManager.getTileTypeId(x, y);
    const wallet = this.world.componentManager.getComponent(this.playerId, Wallet);
    const needs = this.world.componentManager.getComponent(this.playerId, Needs);
    const lawEnforcement = this.world.componentManager.getComponent(this.playerId, LawEnforcement);
    
    switch (tileType) {
      case 'shop':
        this.addMessage('--- Kauppa ---', 'system');
        this.addMessage('Ruoka: 10€ (R)', 'normal');
        this.addMessage('Juoma: 5€ (J)', 'normal');
        this.addMessage('Paina R tai J ostaaksesi.', 'normal');
        break;
        
      case 'hospital':
        if (needs && wallet) {
          const cost = 50;
          if (wallet.canAfford(cost)) {
            wallet.spend(cost);
            needs.modifyNeed('pain', -50);
            needs.modifyNeed('sleep', 30);
            this.addMessage(`Sait hoitoa sairaalassa. Maksat ${cost}€.`, 'system');
            
            // Healing effect
            this.camera.shake(2, 100);
            const sprite = this.world.componentManager.getComponent(this.playerId, Sprite);
            if (sprite) {
              AnimationUtils.pulse(sprite, 0.3, 600);
            }
          } else {
            this.addMessage('Sinulla ei ole varaa hoitoon.', 'system');
          }
        }
        break;
        
      case 'bank':
        if (wallet) {
          this.addMessage('--- Pankki ---', 'system');
          this.addMessage(`Käteinen: ${wallet.cash}€`, 'normal');
          this.addMessage(`Tili: ${wallet.bank}€`, 'normal');
          this.addMessage('Pankkipalvelut: Tulossa pian...', 'normal');
        }
        break;
        
      case 'safe_house':
        if (needs && lawEnforcement) {
          needs.modifyNeed('sleep', 40);
          needs.modifyNeed('hygiene', 30);
          lawEnforcement.reduceHeat(10);
          this.addMessage('Levähdyt turvapaikassa. Tunnet olosi paremmaksi ja turvallisemmaksi.', 'system');
          this.processTurn();
        }
        break;
        
      case 'dealer_spot':
        if (Math.random() < 0.3) {
          this.addMessage('Katukauppias lähestyy sinua hiljaa...', 'system');
          this.addMessage('"Tarvitsetko jotain erityistä?"', 'normal');
          this.addMessage('Huumekauppa: Tulossa pian...', 'normal');
        } else {
          this.addMessage('Paikka näyttää autiolle juuri nyt.', 'normal');
        }
        break;
        
      case 'police_station':
        if (lawEnforcement && lawEnforcement.wanted) {
          this.addMessage('Poliisit huomaavat sinut! Parempi pysytellä poissa.', 'system');
          lawEnforcement.addHeat(5);
          this.camera.shake(8, 400);
        } else {
          this.addMessage('Poliisiasema. Kaikki näyttää normaalilta.', 'normal');
        }
        break;
        
      default:
        this.addMessage('Ei ole mitään käytettävää tässä.', 'normal');
        break;
    }
  }
  
  private processTurn(): void {
    if (!this.playerId) return;
    
    // Process needs decay
    const needs = this.world.componentManager.getComponent(this.playerId, Needs);
    if (needs) {
      const timeSinceLastTick = Date.now() - needs.lastTick;
      const turnsElapsed = Math.floor(timeSinceLastTick / 1000); // 1 turn per second base rate
      
      if (turnsElapsed > 0) {
        needs.modifyNeed('hunger', -turnsElapsed * 0.5);
        needs.modifyNeed('thirst', -turnsElapsed * 0.7);
        needs.modifyNeed('sleep', -turnsElapsed * 0.3);
        needs.modifyNeed('warmth', -turnsElapsed * 0.2);
        needs.modifyNeed('social', -turnsElapsed * 0.1);
        needs.modifyNeed('hygiene', -turnsElapsed * 0.3);
        
        needs.lastTick = Date.now();
        
        // Check for critical needs
        this.checkCriticalNeeds();
      }
    }
    
    // Process addiction effects
    const addiction = this.world.componentManager.getComponent(this.playerId, Addiction);
    if (addiction) {
      addiction.updateEffects(1); // 1 second per turn
      
      // Check for withdrawal
      for (const [drugId, level] of Object.entries(addiction.addictions)) {
        if (level > 10 && Math.random() < 0.1) {
          this.addMessage(`Kaipaat ${drugId}:a...`, 'drug');
        }
      }
    }
    
    this.updateUI();
  }
  
  private checkCriticalNeeds(): void {
    if (!this.playerId) return;
    
    const needs = this.world.componentManager.getComponent(this.playerId, Needs);
    if (!needs) return;
    
    if (needs.getNeed('hunger') < 10) {
      this.addMessage('Olet nälkäinen! Tarvitset ruokaa pian.', 'system');
      this.camera.shake(2, 100);
    }
    
    if (needs.getNeed('thirst') < 10) {
      this.addMessage('Olet janoinen! Tarvitset juotavaa pian.', 'system');
      this.camera.shake(2, 100);
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
    if (!this.messageLog) return;
    
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
    if (stats && this.statsPanel) {
      this.statsPanel.innerHTML = '';
      for (const [key, value] of Object.entries(stats.stats)) {
        const div = document.createElement('div');
        div.className = 'stat-row';
        div.innerHTML = `<span>${this.translateStat(key)}:</span><span>${Math.floor(value)}</span>`;
        this.statsPanel.appendChild(div);
      }
    }
    
    // Update needs
    if (needs && this.needsPanel) {
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
      if (this.cashElement) this.cashElement.textContent = `${wallet.cash}€`;
      if (this.bankElement) this.bankElement.textContent = `${wallet.bank}€`;
    }
    
    if (lawEnforcement && this.heatElement) {
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
  
  // Public method to get camera for external access
  getCamera(): Camera {
    return this.camera;
  }
  
  // Public method to get render system for debugging
  getRenderSystem(): RenderSystem {
    return this.renderSystem;
  }
  
  // Smooth zoom animation
  private animateZoom(targetZoom: number, duration: number = 800): void {
    const currentZoom = this.camera.zoom;
    const zoomTween = tweenManager.add(new Tween({
      from: currentZoom,
      to: targetZoom,
      duration,
      easing: Easing.quadInOut,
      onUpdate: (value: number) => {
        this.camera.setZoom(value, true);
      }
    }));
    (zoomTween as Tween).start();
  }
  
  // Update drug-influenced camera effects
  private updateDrugEffects(deltaTime: number): void {
    if (!this.playerId) return;
    
    const addiction = this.world.componentManager.getComponent(this.playerId, Addiction);
    const stats = this.world.componentManager.getComponent(this.playerId, Stats);
    
    if (!addiction || !stats) return;
    
    this.drugEffectTime += deltaTime;
    
    // Calculate combined drug effects
    let totalSwayIntensity = 0;
    let totalZoomDrift = 0;
    let colorShiftR = 0, colorShiftG = 0, colorShiftB = 0;
    let perceptionEffect = 0;
    
    // Alcohol effects - swaying and perception issues
    const alcoholLevel = addiction.getActiveEffectLevel('alkoholi');
    if (alcoholLevel > 0) {
      totalSwayIntensity += alcoholLevel * 3;
      totalZoomDrift += Math.sin(this.drugEffectTime * 0.001) * alcoholLevel * 0.1;
      perceptionEffect += alcoholLevel * -2;
    }
    
    // Cannabis effects - slow swaying, muted colors
    const cannabisLevel = addiction.getActiveEffectLevel('kannabis');
    if (cannabisLevel > 0) {
      totalSwayIntensity += cannabisLevel * 1.5;
      colorShiftG += cannabisLevel * 10;
      this.camera.config.smoothing = 0.05; // Slower camera
    }
    
    // Amphetamine effects - jittery, fast zoom changes
    const amphetamineLevel = addiction.getActiveEffectLevel('amfetamiini');
    if (amphetamineLevel > 0) {
      totalSwayIntensity += amphetamineLevel * 0.5;
      totalZoomDrift += Math.sin(this.drugEffectTime * 0.01) * amphetamineLevel * 0.05;
      this.camera.config.smoothing = 0.25; // Faster camera
      
      // Random jittery camera shake
      if (Math.random() < 0.01) {
        this.camera.shake(amphetamineLevel, 100);
      }
    }
    
    // Psychedelic effects (LSD, Psilocybin) - color shifts and perception warping
    const lsdLevel = addiction.getActiveEffectLevel('lsd');
    const psilocybinLevel = addiction.getActiveEffectLevel('psilosybiini');
    const psychedelicLevel = lsdLevel + psilocybinLevel;
    
    if (psychedelicLevel > 0) {
      colorShiftR += Math.sin(this.drugEffectTime * 0.002) * psychedelicLevel * 20;
      colorShiftG += Math.sin(this.drugEffectTime * 0.003) * psychedelicLevel * 15;
      colorShiftB += Math.sin(this.drugEffectTime * 0.0025) * psychedelicLevel * 25;
      
      totalZoomDrift += Math.sin(this.drugEffectTime * 0.001) * psychedelicLevel * 0.2;
      totalSwayIntensity += Math.sin(this.drugEffectTime * 0.002) * psychedelicLevel * 2;
      
      // Occasional perception 'pops'
      if (Math.random() < 0.005) {
        this.animateZoom(this.camera.zoom + (Math.random() - 0.5) * 0.5, 300);
      }
    }
    
    // Opioid effects - slow, dreamy movement
    const opioidLevel = addiction.getActiveEffectLevel('opioidi');
    if (opioidLevel > 0) {
      totalSwayIntensity += Math.sin(this.drugEffectTime * 0.0005) * opioidLevel * 1;
      this.camera.config.smoothing = 0.05; // Very slow camera
    }
    
    // Apply effects
    this.drugEffects.swayIntensity = totalSwayIntensity;
    this.drugEffects.swaySpeed = 0.001 + (amphetamineLevel * 0.005);
    this.drugEffects.zoomDrift = totalZoomDrift;
    this.drugEffects.colorShift = { r: colorShiftR, g: colorShiftG, b: colorShiftB };
    this.drugEffects.perception = perceptionEffect;
    
    // Apply camera sway
    if (this.drugEffects.swayIntensity > 0) {
      const swayX = Math.sin(this.drugEffectTime * this.drugEffects.swaySpeed) * this.drugEffects.swayIntensity;
      const swayY = Math.cos(this.drugEffectTime * this.drugEffects.swaySpeed * 0.7) * this.drugEffects.swayIntensity * 0.5;
      
      this.camera.visualX += swayX;
      this.camera.visualY += swayY;
    }
    
    // Apply zoom drift
    if (Math.abs(this.drugEffects.zoomDrift) > 0.01) {
      const targetZoom = Math.max(0.3, Math.min(3, 1 + this.drugEffects.zoomDrift));
      this.camera.setZoom(targetZoom);
    }
    
    // Reset camera smoothing when not under influence
    if (totalSwayIntensity === 0 && amphetamineLevel === 0 && cannabisLevel === 0 && opioidLevel === 0) {
      this.camera.config.smoothing = 0.15; // Default smoothing
    }
  }
}

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private gameScene: GameScene;
  private lastTime = 0;
  private isRunning = false;
  
  // Input handling
  private keys: Set<string> = new Set();
  
  // UI elements
  private messageLog: HTMLElement;
  private statsPanel: HTMLElement;
  private needsPanel: HTMLElement;
  private cashElement: HTMLElement;
  private bankElement: HTMLElement;
  private heatElement: HTMLElement;
  
  constructor() {
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    
    // Get UI elements
    this.messageLog = document.getElementById('messageLog')!;
    this.statsPanel = document.getElementById('statsPanel')!;
    this.needsPanel = document.getElementById('needsPanel')!;
    this.cashElement = document.getElementById('cash')!;
    this.bankElement = document.getElementById('bank')!;
    this.heatElement = document.getElementById('heat')!;
    
    // Setup canvas
    this.setupCanvas();
    this.setupInput();
    
    // Create game scene
    this.gameScene = new GameScene(this.canvas);
    this.gameScene.setUIElements(
      this.messageLog,
      this.statsPanel,
      this.needsPanel,
      this.cashElement,
      this.bankElement,
      this.heatElement
    );
    
    // Add scene to manager
    sceneManager.addScene(this.gameScene);
    
    // Start with the game scene
    sceneManager.changeScene('game', 
      { type: 'none', duration: 0 },
      { type: 'fade', duration: 500, easing: Easing.quadOut }
    );
    
    // Expose for debugging
    (window as any).game = this;
    (window as any).camera = this.gameScene.getCamera();
    (window as any).sceneManager = sceneManager;
    (window as any).tweenManager = tweenManager;
  }
  
  private setupCanvas(): void {
    // Set canvas size
    this.canvas.width = 800;
    this.canvas.height = 600;
    
    // Configure rendering
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';
  }
  
  private setupInput(): void {
    document.addEventListener('keydown', (e) => {
      this.keys.add(e.key.toLowerCase());
      
      // Prevent default for game keys
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'e', 'i', 't', 'f', 'l', 'c', '1', '2', '3', ' '].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    });
    
    document.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase());
    });
    
    // Mouse wheel for zooming
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const camera = this.gameScene.getCamera();
      const zoomFactor = 1.1;
      let newZoom = camera.zoom;
      
      if (e.deltaY < 0) {
        // Zoom in
        newZoom = Math.min(3, camera.zoom * zoomFactor);
      } else {
        // Zoom out
        newZoom = Math.max(0.3, camera.zoom / zoomFactor);
      }
      
      // Smooth zoom animation
      this.gameScene['animateZoom'](newZoom, 200);
    });
  }
  
  private gameLoop = (currentTime: number): void => {
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    
    // Handle input through scene manager
    sceneManager.handleInput(this.keys);
    
    // Update scene manager (which updates active scenes)
    sceneManager.update(deltaTime);
    
    // Update global animation manager
    tweenManager.update(currentTime);
    
    // Render through scene manager
    sceneManager.render(this.ctx);
    
    // Debug: Show camera info if debug key is pressed
    if (this.keys.has('\\')) {
      this.gameScene.getRenderSystem().renderDebugInfo();
    }
    
    if (this.isRunning) {
      requestAnimationFrame(this.gameLoop);
    }
  };
  
  public start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this.gameLoop);
  }
  
  public stop(): void {
    this.isRunning = false;
  }
  
  // Utility methods for testing scene transitions
  public fadeCamera(duration: number = 1000): void {
    const camera = this.gameScene.getCamera();
    const renderSystem = this.gameScene.getRenderSystem();
    
    renderSystem.setLayerOpacity('background', 0);
    renderSystem.setLayerOpacity('terrain', 0);
    renderSystem.setLayerOpacity('buildings', 0);
    renderSystem.setLayerOpacity('npcs', 0);
    renderSystem.setLayerOpacity('player', 0);
    
    AnimationUtils.fadeIn(renderSystem.getLayer('background')!, duration / 5, Easing.quadOut);
    AnimationUtils.fadeIn(renderSystem.getLayer('terrain')!, duration / 4, Easing.quadOut);
    AnimationUtils.fadeIn(renderSystem.getLayer('buildings')!, duration / 3, Easing.quadOut);
    AnimationUtils.fadeIn(renderSystem.getLayer('npcs')!, duration / 2, Easing.quadOut);
    AnimationUtils.fadeIn(renderSystem.getLayer('player')!, duration, Easing.quadOut);
  }
  
  public shakeScreen(intensity: number = 10, duration: number = 500): void {
    this.gameScene.getCamera().shake(intensity, duration);
  }
  
  public zoomTo(zoom: number, duration: number = 1000): void {
    const camera = this.gameScene.getCamera();
    const zoomTween = tweenManager.add(new Tween({
      from: camera.zoom,
      to: zoom,
      duration,
      easing: Easing.quadInOut,
      onUpdate: (value: number) => {
        camera.setZoom(value, true);
      }
    }));
    (zoomTween as Tween).start();
  }
}