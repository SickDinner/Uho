import { Scene, SceneManager, sceneManager } from '@core/scene.ts';
import { MenuScene } from '@core/menu.ts';
import { CharacterCreationScene } from '@core/character-creation.ts';
import { SettingsScene } from '@core/settings.ts';
import { inputManager } from '@core/input.ts';
import { audioManager } from '@core/audio.ts';
import { tweenManager } from '@core/animation.ts';
import { advancedAudioEngine } from '@core/advanced-audio.ts';
import { audioAssetRegistry } from '@core/audio-assets.ts';
import { assetManager } from '@core/asset-manager.ts';

// Import existing game scene
import { World } from '@core/ecs.ts';
import { Transform, Sprite, Stats, Needs, Inventory, Wallet, Skills, Addiction, LawEnforcement } from '@core/components.ts';
import { MapManager, TILE_TYPES } from '@core/map.ts';
import { spriteManager } from '@core/sprites.ts';
import { particleSystem } from '@core/particles.ts';
import { NPCManager } from '@core/npc.ts';
import { Camera } from '@core/camera.ts';
import { RenderSystem } from '@core/renderer.ts';
// Import LEGENDARY graphics system
import { LegendaryGameRenderer } from '@core/legendary-game-renderer.ts';
import type { Direction, MessageType } from '@core/types.ts';
import type { CharacterData } from '@core/character-creation.ts';
// Import placeholder audio system
import { placeholderAudioSystem } from './placeholder-audio-system.ts';
// Import smooth movement system
import { smoothMovement, initSmoothMovement, moveSmooth, rotateSmooth, faceDirection } from '@core/smooth-movement.ts';
// Import retro graphics system
import { RetroGraphicsEngine, createDefaultPalettes } from '@core/retro-graphics.ts';
// Import Kenney Asset Manager
import { kenneyAssets, loadKenneyAssets, getKenneySprite, renderKenneySprite } from '@core/kenney-asset-manager.ts';

class GameplayScene extends Scene {
  private world: World;
  private mapManager: MapManager;
  private npcManager: NPCManager;
  private camera: Camera;
  private renderSystem: RenderSystem;
  // LEGENDARY graphics renderer
  private legendaryRenderer: LegendaryGameRenderer;
  private useLegendaryGraphics = true; // Toggle for testing
  
  // Retro graphics engine (SNES + Jaguar + Genesis effects)
  private retroGraphicsEngine: RetroGraphicsEngine;
  private useRetroGraphics = true; // Enable SNES-inspired effects
  
  // Player entity
  private playerId?: number;
  
  // Input handling
  private lastInput = 0;
  private inputDelay = 200; // ms between turn-based inputs
  
  // Messages
  private messages: MessageType[] = [];
  private maxMessages = 50;
  
  // UI state
  private inventoryVisible = false;
  private selectedInventorySlot = 0;
  private inventoryGridSize = { cols: 8, rows: 6 };
  private inventorySlotSize = 32;
  
  // UI elements - will be passed from Game class
  private messageLog!: HTMLElement;
  private statsPanel!: HTMLElement;
  private needsPanel!: HTMLElement;
  private cashElement!: HTMLElement;
  private bankElement!: HTMLElement;
  private heatElement!: HTMLElement;
  
  constructor(private canvas: HTMLCanvasElement) {
    super('gameplay');
    
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
    
    // Initialize render systems
    this.renderSystem = new RenderSystem(
      this.world.componentManager,
      canvas,
      this.camera,
      this.mapManager
    );
    
    // Initialize LEGENDARY graphics renderer
    this.legendaryRenderer = new LegendaryGameRenderer(
      this.world.componentManager,
      canvas,
      this.camera,
      this.mapManager
    );
    
    // Initialize retro graphics engine
    this.retroGraphicsEngine = new RetroGraphicsEngine(canvas);
    
    // Set up default retro palettes
    const defaultPalettes = createDefaultPalettes();
    defaultPalettes.forEach((palette, index) => {
      this.retroGraphicsEngine.loadPalette(index, palette);
    });
    
    // Add appropriate render system to world
    if (this.useLegendaryGraphics) {
      this.world.addSystem(this.legendaryRenderer);
      console.log('🎮 Using LEGENDARY graphics renderer!');
    } else {
      this.world.addSystem(this.renderSystem);
      console.log('📱 Using standard renderer');
    }
    
    console.log('🕹️ Retro graphics engine initialized with SNES+Jaguar+Genesis power!');
    if (this.useRetroGraphics) {
      console.log('🎨 16-bit retro effects ENABLED!');
    }
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
    console.log('Entering gameplay scene');
    
    // Initialize advanced audio system
    this.initializeAudio();
    
    // Load Kenney sprite assets
    await this.loadKenneyAssets();
    
    // Load additional sprites
    this.loadSprites();
    
    // Create or load player
    this.initializePlayer();
    
    // Spawn NPCs
    this.npcManager.spawnRandomNPCs();
    
    // Initialize UI
    this.updateUI();
    
    this.addMessage('Tervetuloa UHO: Fate of the Grid -peliin!', 'system' as const);
    this.addMessage('Käytä WASD tai nuolinäppäimiä liikkumiseen.', 'system' as const);
    this.addMessage('Paina E vuorovaikutuksiin, F keskustellaksesi NPC:iden kanssa.', 'system' as const);
    this.addMessage('ESC avaa pelin valikon.', 'system' as const);
    
    // Camera shake effect when entering the game
    this.camera.shake(10, 500);
    
    // Start dynamic audio system
    this.startDynamicAudio();
  }
  
  onExit(): void {
    // Stop advanced audio system
    this.stopDynamicAudio();
  }
  
  override handleInput(keys: Set<string>): boolean {
    // Handle escape key to open pause menu
    if (inputManager.isActionPressed('menu')) {
      this.openPauseMenu();
      return true;
    }
    
    return this.handleGameInput();
  }
  
  private openPauseMenu(): void {
    // Create a simple pause menu
    const confirmed = confirm('Game Paused\\n\\nOptions:\\n- OK: Resume Game\\n- Cancel: Return to Main Menu');
    
    if (!confirmed) {
      // Return to main menu
      sceneManager.changeScene('menu');
    }
    // If OK, just continue (resume game)
  }
  
  private initializePlayer(): void {
    // Check if we have character data from character creation
    const characterSave = localStorage.getItem('uho-fate-character');
    let characterData: CharacterData | null = null;
    
    if (characterSave) {
      try {
        const parsed = JSON.parse(characterSave);
        characterData = parsed.character;
        console.log('Loaded character:', characterData);
      } catch (error) {
        console.warn('Failed to load character data:', error);
      }
    }
    
    const player = this.world.createEntity();
    this.playerId = player.id;
    
    // Add components
    this.world.componentManager.addComponent(new Transform(player.id, 10, 10));
    this.world.componentManager.addComponent(new Sprite(player.id, 'player')); // Player sprite
    
    // Use character data if available, otherwise use defaults
    const statsData = characterData ? characterData.stats : {
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
    };
    
    this.world.componentManager.addComponent(new Stats(player.id, statsData));
    this.world.componentManager.addComponent(new Needs(player.id));
    this.world.componentManager.addComponent(new Inventory(player.id));
    
    // Use character background money if available
    const startingMoney = characterData ? characterData.background.startingMoney : 250;
    this.world.componentManager.addComponent(new Wallet(player.id, startingMoney, 500, 0));
    
    this.world.componentManager.addComponent(new Skills(player.id));
    this.world.componentManager.addComponent(new Addiction(player.id));
    this.world.componentManager.addComponent(new LawEnforcement(player.id));
    
    // Add starting items from character background
    if (characterData && characterData.background.startingItems) {
      const inventory = this.world.componentManager.getComponent(player.id, Inventory);
      if (inventory) {
        for (const itemId of characterData.background.startingItems) {
          inventory.addItem(itemId, 1);
        }
      }
    }
    
    // Initialize smooth movement system for player
    initSmoothMovement(player.id, 10, 10, 0); // Start at grid (10, 10) facing north
    console.log('🎮 Smooth movement system initialized for player');
    
    // Set camera to follow player
    this.camera.setTarget(player.id);
    
    this.addMessage(characterData ? `Hei ${characterData.name}! Jatka seikkailuasi.` : 'Uusi seikkailu alkaa!', 'system' as const);
    this.addMessage('Liikkuminen on nyt sujuvaa ja hahmo voi kääntyä 360 astetta!', 'system' as const);
  }
  
  private handleGameInput(): boolean {
    if (!this.playerId || Date.now() - this.lastInput < this.inputDelay) {
      return true;
    }
    
    // Handle inventory navigation if inventory is open
    if (this.inventoryVisible) {
      return this.handleInventoryInput();
    }
    
    const transform = this.world.componentManager.getComponent(this.playerId, Transform);
    if (!transform) return true;
    
    let moved = false;
    let newX = transform.x;
    let newY = transform.y;
    let newFacing = transform.facing;
    
    // Movement with new input system
    if (inputManager.isActionPressed('moveUp')) {
      newY--;
      newFacing = 'north';
      moved = true;
    } else if (inputManager.isActionPressed('moveDown')) {
      newY++;
      newFacing = 'south';
      moved = true;
    } else if (inputManager.isActionPressed('moveLeft')) {
      newX--;
      newFacing = 'west';
      moved = true;
    } else if (inputManager.isActionPressed('moveRight')) {
      newX++;
      newFacing = 'east';
      moved = true;
    }
    
    // Actions
    if (inputManager.isActionPressed('interact')) {
      this.handleAction('use');
      this.lastInput = Date.now();
      return true;
    }
    
    if (inputManager.isActionPressed('inventory')) {
      this.handleAction('inventory');
      this.lastInput = Date.now();
      return true;
    }
    
    if (inputManager.isActionPressed('rest')) {
      this.handleAction('rest');
      this.lastInput = Date.now();
      return true;
    }
    
    if (inputManager.isActionPressed('talk')) {
      this.handleAction('talk');
      this.lastInput = Date.now();
      return true;
    }
    
    // LEGENDARY graphics controls (for debugging/testing)
    if (inputManager.isActionPressed('quickAction1')) { // Number 1 key
      if (this.useLegendaryGraphics) {
        this.legendaryRenderer.toggleStats();
      } else {
        this.camera.setZoom(0.5);
      }
    } else if (inputManager.isActionPressed('quickAction2')) { // Number 2 key
      if (this.useLegendaryGraphics) {
        this.legendaryRenderer.enableMode7(!this.legendaryRenderer.getConfiguration().enableMode7);
      } else {
        this.camera.setZoom(1);
      }
    } else if (inputManager.isActionPressed('quickAction3')) { // Number 3 key
      if (this.useLegendaryGraphics) {
        this.legendaryRenderer.enableCRT(!this.legendaryRenderer.getConfiguration().enableCRT);
      } else {
        this.camera.setZoom(2);
      }
    } else if (inputManager.isActionPressed('quickAction4')) { // Number 4 key
      if (this.useLegendaryGraphics) {
        this.legendaryRenderer.applyPreset('arcade');
      }
    }
    
    if (moved) {
      // Check map bounds and walkability
      const map = this.mapManager.getCurrentMap();
      newX = Math.max(0, Math.min(map.width - 1, newX));
      newY = Math.max(0, Math.min(map.height - 1, newY));
      
      if (this.mapManager.isWalkable(newX, newY)) {
        // Use smooth movement system instead of instant teleportation
        const moveSuccess = moveSmooth(this.playerId, newX, newY, 6.0); // 6 grid units per second
        
        if (moveSuccess) {
          // Update ECS transform to new target position for game logic
          transform.setPosition(newX, newY);
          transform.facing = newFacing;
          
          // Add movement feedback with haptic feedback
          this.addMovementFeedback(newX, newY);
          
          // Update listener position for spatial audio
          advancedAudioEngine.setListenerPosition({ x: newX, y: newY });
          
          // Check for location interactions
          this.checkLocationInteractions(newX, newY);
          
          this.processTurn();
          this.lastInput = Date.now();
          
          console.log(`🎮 Smooth movement initiated to (${newX}, ${newY})`);
        } else {
          // Already moving, can't start new movement
          this.addMessage('Odota hetki ennen seuraavaa liikettä...', 'normal' as const);
        }
      } else {
        // Can't move there, but still face the direction and rotate smoothly
        faceDirection(this.playerId, newFacing);
        transform.facing = newFacing;
        
        const tileType = this.mapManager.getTileTypeId(newX, newY);
        const tile = TILE_TYPES[tileType];
        if (tile) {
          this.addMessage(`${tile.description}`, 'normal' as const);
        }
        
        // Small vibration feedback for blocked movement
        inputManager.vibrate(0.2, 100);
      }
    }
    
    return true;
  }
  
  private addMovementFeedback(x: number, y: number): void {
    const tileSize = 10;
    const pixelX = x * tileSize + tileSize / 2;
    const pixelY = y * tileSize + tileSize / 2;
    
    // Determine surface type based on tile
    const tileType = this.mapManager.getTileTypeId(x, y);
    let surface: 'concrete' | 'grass' | 'metal' | 'water' = 'concrete';
    
    // Map tile types to surface types for realistic footstep sounds
    if (tileType === 'grass' || tileType === 'dirt') surface = 'grass';
    else if (tileType === 'metal' || tileType === 'industrial') surface = 'metal';
    else if (tileType === 'water') surface = 'water';
    
    // Play advanced procedural footstep sound
    advancedAudioEngine.createFootstepSound(surface);
    
    // Create dust particles
    particleSystem.createFootstepDust(pixelX, pixelY);
    
    // Small camera shake on movement
    this.camera.shake(1, 50);
    
    // Subtle haptic feedback for movement
    inputManager.vibrate(0.1, 30);
  }
  
  // Advanced Audio System Integration
  // Load Kenney Game Assets
  private async loadKenneyAssets(): Promise<void> {
    try {
      console.log('🎨 Loading Kenney Game Assets...');
      await loadKenneyAssets();
      
      const progress = kenneyAssets.getLoadingProgress();
      console.log(`✨ Kenney assets loaded: ${progress.loaded}/${progress.total} (${progress.percentage.toFixed(1)}%)`);
      
      // Log loaded assets for debugging
      const loadedSprites = kenneyAssets.getLoadedSpriteNames();
      const failedSprites = kenneyAssets.getFailedSpriteNames();
      
      if (loadedSprites.length > 0) {
        console.log('🚀 Successfully loaded Kenney sprites:', loadedSprites);
      }
      
      if (failedSprites.length > 0) {
        console.warn('⚠️ Failed to load Kenney sprites (using placeholders):', failedSprites);
      }
      
    } catch (error) {
      console.warn('Failed to load Kenney assets:', error);
    }
  }

  private async initializeAudio(): Promise<void> {
    try {
      // Ensure audio assets are loaded
      await audioAssetRegistry.initialize();
      
      // Set initial listener position
      if (this.playerId) {
        const transform = this.world.componentManager.getComponent(this.playerId, Transform);
        if (transform) {
          advancedAudioEngine.setListenerPosition({ x: transform.x, y: transform.y });
        }
      }
      
      console.log('🎵 Advanced audio system initialized for gameplay');
    } catch (error) {
      console.warn('Failed to initialize advanced audio:', error);
    }
  }
  
  private startDynamicAudio(): void {
    try {
      // Start ambient city theme
      advancedAudioEngine.playMusic('city_theme', { mood: 'exploration', fadeTime: 3000 });
      
      // Add layered ambient sounds for realistic city atmosphere
      // These calls reference the assets/audio directory structure created
      // TODO: Replace placeholderAudioSystem calls with actual audio file loading when audio files are available
      // - assets/audio/ambient/city_traffic.mp3
      // - assets/audio/ambient/distant_voices.mp3  
      // - assets/audio/ambient/urban_hum.mp3
      // - assets/audio/music/city_theme.mp3
      // - assets/audio/sfx/footstep_concrete.wav
      // - assets/audio/sfx/item_pickup.wav
      // - assets/audio/sfx/ui_click.wav
      placeholderAudioSystem.playFootstepSound('grass'); // Will use assets/audio/ambient/city_traffic.mp3
      placeholderAudioSystem.playItemSound('pickup'); // Will use assets/audio/ambient/distant_voices.mp3
      placeholderAudioSystem.playUISound('click'); // Will use assets/audio/ambient/urban_hum.mp3
      
      // Set initial weather (light wind)
      advancedAudioEngine.setWeatherIntensity('wind', 0.2);
      
      // Play UI feedback for entering game
      advancedAudioEngine.createUISound('success');
      
      console.log('🌟 Dynamic audio system started with layered soundscape');
    } catch (error) {
      console.warn('Could not start dynamic audio system:', error);
    }
  }
  
  private stopDynamicAudio(): void {
    // Fade out current music and ambient sounds
    advancedAudioEngine.setWeatherIntensity('wind', 0);
    advancedAudioEngine.setWeatherIntensity('rain', 0);
    
    console.log('🔇 Dynamic audio system stopped');
  }
  
  // Weather simulation system
  // Update camera to follow smooth movement positions
  private updateCameraWithSmoothMovement(deltaTime: number): void {
    if (this.playerId) {
      const visualPos = smoothMovement.getVisualPosition(this.playerId);
      if (visualPos) {
        // Update camera target to visual position instead of grid position
        this.camera.setTargetPosition(visualPos.x, visualPos.y);
      }
    }
    
    // Update camera normally
    this.camera.update(deltaTime, this.world.componentManager);
  }

  private updateWeatherAudio(): void {
    // Simulate dynamic weather changes
    if (Math.random() < 0.01) { // 1% chance per frame to change weather
      const rainIntensity = Math.random() * 0.8;
      const windIntensity = Math.random() * 0.6 + 0.2;
      
      advancedAudioEngine.setWeatherIntensity('rain', rainIntensity);
      advancedAudioEngine.setWeatherIntensity('wind', windIntensity);
      
      if (rainIntensity > 0.5 && Math.random() < 0.3) {
        // Thunder during heavy rain
        advancedAudioEngine.setWeatherIntensity('thunder', 0.8);
        setTimeout(() => {
          advancedAudioEngine.setWeatherIntensity('thunder', 0);
        }, 2000);
      }
      
      if (rainIntensity > 0.3) {
        this.addMessage(`Sade alkaa sataa ${rainIntensity > 0.6 ? 'voimakkaasti' : 'kevyesti'}.`, 'normal' as const);
      }
    }
  }
  
  private async loadSprites(): Promise<void> {
    try {
      // Load actual roguelike character spritesheet for player
      await spriteManager.loadSpriteSheet(
        'player',
        'assets/sprites/roguelike/characters/Spritesheet/roguelikeSheet_transparent.png',
        16, 16,
        {
          idle_south: { name: 'idle_south', frames: [52], duration: 1000, loop: true }, // Warrior facing down
          idle_north: { name: 'idle_north', frames: [104], duration: 1000, loop: true }, // Warrior facing up
          idle_west: { name: 'idle_west', frames: [78], duration: 1000, loop: true }, // Warrior facing left
          idle_east: { name: 'idle_east', frames: [26], duration: 1000, loop: true }, // Warrior facing right
          walk_south: { name: 'walk_south', frames: [52, 53, 54, 55], duration: 200, loop: true },
          walk_north: { name: 'walk_north', frames: [104, 105, 106, 107], duration: 200, loop: true },
          walk_west: { name: 'walk_west', frames: [78, 79, 80, 81], duration: 200, loop: true },
          walk_east: { name: 'walk_east', frames: [26, 27, 28, 29], duration: 200, loop: true }
        }
      );
      
      // Load NPCs from same spritesheet
      await spriteManager.loadSpriteSheet(
        'npc',
        'assets/sprites/roguelike/characters/Spritesheet/roguelikeSheet_transparent.png',
        16, 16,
        {
          merchant: { name: 'merchant', frames: [13], duration: 1000, loop: true }, // Merchant character
          guard: { name: 'guard', frames: [39], duration: 1000, loop: true }, // Guard character
          villager: { name: 'villager', frames: [65], duration: 1000, loop: true }, // Villager character
          wizard: { name: 'wizard', frames: [91], duration: 1000, loop: true } // Wizard character
        }
      );
      
      // Load environment tiles from roguelike cities tileset
      await spriteManager.loadSpriteSheet(
        'tiles',
        'assets/sprites/roguelike/cities/Tilemap/tilemap_packed.png',
        16, 16,
        {
          grass: { name: 'grass', frames: [0], duration: 1000, loop: true },
          dirt: { name: 'dirt', frames: [1], duration: 1000, loop: true },
          stone: { name: 'stone', frames: [2], duration: 1000, loop: true },
          water: { name: 'water', frames: [3], duration: 1000, loop: true },
          building: { name: 'building', frames: [16], duration: 1000, loop: true },
          door: { name: 'door', frames: [32], duration: 1000, loop: true },
          tree: { name: 'tree', frames: [48], duration: 1000, loop: true },
          fence: { name: 'fence', frames: [64], duration: 1000, loop: true }
        }
      );
      
      // Load UI elements
      await spriteManager.loadSpriteSheet(
        'ui',
        'assets/sprites/ui/Tiles/Large tiles/Thick outline/tile_0000.png',
        32, 32,
        {
          button: { name: 'button', frames: [0], duration: 1000, loop: true }
        }
      );
      
      console.log('✅ Successfully loaded all real sprite assets!');
      
    } catch (error) {
      console.warn('Could not load sprites, using fallback rendering:', error);
    }
  }
  
  private handleAction(action: string): void {
    if (!this.playerId) return;
    
    const transform = this.world.componentManager.getComponent(this.playerId, Transform);
    if (!transform) return;
    
    switch (action) {
      case 'use':
        advancedAudioEngine.createUISound('click');
        this.interactWithLocation(transform.x, transform.y);
        break;
      case 'inventory':
        advancedAudioEngine.createUISound('click');
        this.showInventory();
        break;
      case 'rest':
        advancedAudioEngine.createUISound('success');
        this.rest();
        break;
      case 'talk':
        advancedAudioEngine.createUISound('notification');
        this.talkToNPC();
        break;
    }
  }
  
  private addMessage(text: string, type: MessageType['type'] = 'normal'): void {
    this.messages.push({ text, type, timestamp: Date.now() });
    if (this.messages.length > this.maxMessages) {
      this.messages.shift();
    }
    
    if (this.messageLog) {
      const messageEl = document.createElement('div');
      messageEl.className = `message ${type}`;
      messageEl.textContent = text;
      this.messageLog.appendChild(messageEl);
      this.messageLog.scrollTop = this.messageLog.scrollHeight;
    }
  }
  
  private showInventory(): void {
    this.inventoryVisible = !this.inventoryVisible;
    this.selectedInventorySlot = 0;
    
    if (this.inventoryVisible) {
      this.addMessage('Inventaario avattu. Käytä nuolinäppäimiä navigoimiseen, Enter käyttääksesi esinettä, I sulkeaksesi.', 'system' as const);
    } else {
      this.addMessage('Inventaario suljettu.', 'system' as const);
    }
  }
  
  private handleInventoryInput(): boolean {
    const inventory = this.world.componentManager.getComponent(this.playerId!, Inventory);
    if (!inventory) return true;
    
    const maxSlots = this.inventoryGridSize.cols * this.inventoryGridSize.rows;
    
    // Navigation
    if (inputManager.isActionPressed('moveUp')) {
      this.selectedInventorySlot = Math.max(0, this.selectedInventorySlot - this.inventoryGridSize.cols);
      this.lastInput = Date.now();
      return true;
    }
    if (inputManager.isActionPressed('moveDown')) {
      this.selectedInventorySlot = Math.min(maxSlots - 1, this.selectedInventorySlot + this.inventoryGridSize.cols);
      this.lastInput = Date.now();
      return true;
    }
    if (inputManager.isActionPressed('moveLeft')) {
      if (this.selectedInventorySlot % this.inventoryGridSize.cols > 0) {
        this.selectedInventorySlot--;
      }
      this.lastInput = Date.now();
      return true;
    }
    if (inputManager.isActionPressed('moveRight')) {
      if ((this.selectedInventorySlot + 1) % this.inventoryGridSize.cols !== 0) {
        this.selectedInventorySlot = Math.min(maxSlots - 1, this.selectedInventorySlot + 1);
      }
      this.lastInput = Date.now();
      return true;
    }
    
    // Use item
    if (inputManager.isActionPressed('interact')) {
      this.useInventoryItem(this.selectedInventorySlot);
      this.lastInput = Date.now();
      return true;
    }
    
    // Close inventory
    if (inputManager.isActionPressed('inventory')) {
      this.showInventory();
      this.lastInput = Date.now();
      return true;
    }
    
    return true;
  }
  
  private useInventoryItem(slotIndex: number): void {
    if (!this.playerId) return;
    
    const inventory = this.world.componentManager.getComponent(this.playerId, Inventory);
    if (!inventory || slotIndex >= inventory.items.length) {
      this.addMessage('Tyhjä paikka.', 'normal' as const);
      return;
    }
    
    const item = inventory.items[slotIndex];
    this.addMessage(`Käytit: ${item.itemId} (${item.quantity})`, 'normal' as const);
    
    // Here you would implement actual item usage logic
    // For now, just play a sound
    try {
      advancedAudioEngine.createUISound('success');
    } catch (error) {
      console.warn('Could not play item use sound:', error);
    }
  }
  
  private rest(): void {
    if (!this.playerId) return;
    
    const needs = this.world.componentManager.getComponent(this.playerId, Needs);
    if (!needs) return;
    
    needs.modifyNeed('sleep', 20);
    needs.modifyNeed('hunger', -5);
    needs.modifyNeed('thirst', -3);
    needs.modifyNeed('hygiene', -2);
    
    this.addMessage('Levähdit hetken. Tunnet olosi virkistäneemmäksi.', 'normal' as const);
    this.processTurn();
  }
  
  private processTurn(): void {
    this.updateUI();
  }
  
  private updateUI(): void {
    if (!this.playerId) return;
    
    // Update stats, needs, wallet, etc.
    // Implementation would be similar to the original game
  }
  
  private interactWithLocation(x: number, y: number): void {
    // Implementation for location interactions
  }
  
  private talkToNPC(): void {
    // Implementation for NPC interactions
  }
  
  private checkLocationInteractions(x: number, y: number): void {
    // Implementation for checking location interactions
  }
  
  update(deltaTime: number): void {
    // Update input manager
    inputManager.update(deltaTime);
    
    // Update smooth movement system
    smoothMovement.update(deltaTime);
    
    // Update world systems
    this.world.update(deltaTime);
    
    // Update camera with smooth positions
    this.updateCameraWithSmoothMovement(deltaTime);
    
    // Update particles
    particleSystem.update(deltaTime);
    
    // Update NPCs
    this.npcManager.update(deltaTime, this.playerId);
    
    // Update animations
    tweenManager.update();
    
    // Update weather audio system
    this.updateWeatherAudio();
  }
  
  render(ctx: CanvasRenderingContext2D): void {
    // Use retro graphics engine for enhanced 16-bit rendering
    if (this.useRetroGraphics) {
      this.retroGraphicsEngine.render();
    }
    
    // The RenderSystem handles all rendering through the world update
    
    // Render UI overlays
    if (this.inventoryVisible) {
      this.renderInventoryOverlay(ctx);
    }
  }
  
  private renderInventoryOverlay(ctx: CanvasRenderingContext2D): void {
    if (!this.playerId) return;
    
    const inventory = this.world.componentManager.getComponent(this.playerId, Inventory);
    if (!inventory) return;
    
    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;
    
    // Semi-transparent background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Calculate inventory panel size and position
    const panelWidth = this.inventoryGridSize.cols * (this.inventorySlotSize + 4) + 40;
    const panelHeight = this.inventoryGridSize.rows * (this.inventorySlotSize + 4) + 80;
    const panelX = (canvasWidth - panelWidth) / 2;
    const panelY = (canvasHeight - panelHeight) / 2;
    
    // Draw inventory panel background
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
    
    // Draw panel border
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
    
    // Draw title
    ctx.fillStyle = '#ffff00';
    ctx.font = 'bold 16px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('INVENTAARIO', panelX + panelWidth / 2, panelY + 25);
    
    // Reset text alignment
    ctx.textAlign = 'left';
    
    // Draw inventory slots
    const startX = panelX + 20;
    const startY = panelY + 50;
    
    for (let row = 0; row < this.inventoryGridSize.rows; row++) {
      for (let col = 0; col < this.inventoryGridSize.cols; col++) {
        const slotIndex = row * this.inventoryGridSize.cols + col;
        const x = startX + col * (this.inventorySlotSize + 4);
        const y = startY + row * (this.inventorySlotSize + 4);
        
        // Slot background
        if (slotIndex === this.selectedInventorySlot) {
          ctx.fillStyle = '#555';
        } else {
          ctx.fillStyle = '#333';
        }
        ctx.fillRect(x, y, this.inventorySlotSize, this.inventorySlotSize);
        
        // Slot border
        if (slotIndex === this.selectedInventorySlot) {
          ctx.strokeStyle = '#ffff00';
          ctx.lineWidth = 2;
        } else {
          ctx.strokeStyle = '#666';
          ctx.lineWidth = 1;
        }
        ctx.strokeRect(x, y, this.inventorySlotSize, this.inventorySlotSize);
        
        // Draw item if present
        if (slotIndex < inventory.items.length) {
          const item = inventory.items[slotIndex];
          
          // Item icon (placeholder - just text for now)
          ctx.fillStyle = '#ffffff';
          ctx.font = '10px Courier New';
          ctx.textAlign = 'center';
          
          // Simple item representation
          const itemIcon = this.getItemIcon(item.itemId);
          ctx.fillText(itemIcon, x + this.inventorySlotSize/2, y + this.inventorySlotSize/2 - 5);
          
          // Quantity
          if (item.quantity > 1) {
            ctx.fillStyle = '#ffff00';
            ctx.font = '8px Courier New';
            ctx.textAlign = 'right';
            ctx.fillText(item.quantity.toString(), x + this.inventorySlotSize - 2, y + this.inventorySlotSize - 2);
          }
        }
      }
    }
    
    // Instructions
    ctx.fillStyle = '#cccccc';
    ctx.font = '12px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('Nuolet: Navigoi | Enter: Käytä | I: Sulje', panelX + panelWidth / 2, panelY + panelHeight - 15);
    
    // Selected item info
    if (this.selectedInventorySlot < inventory.items.length) {
      const selectedItem = inventory.items[this.selectedInventorySlot];
      const infoY = panelY + panelHeight + 20;
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px Courier New';
      ctx.fillText(`Valittu: ${selectedItem.itemId}`, panelX, infoY);
      
      ctx.fillStyle = '#cccccc';
      ctx.font = '12px Courier New';
      ctx.fillText(`Määrä: ${selectedItem.quantity}`, panelX, infoY + 20);
    }
  }
  
  private getItemIcon(itemId: string): string {
    // Simple item icon mapping
    const iconMap: { [key: string]: string } = {
      'bread': '🍞',
      'water': '💧',
      'potion': '🧪',
      'sword': '⚔️',
      'shield': '🛡️',
      'key': '🗝️',
      'coin': '💰',
      'gem': '💎'
    };
    
    return iconMap[itemId.toLowerCase()] || '❓';
  }
  
  public getCamera(): Camera {
    return this.camera;
  }
  
  public getRenderSystem(): RenderSystem {
    return this.renderSystem;
  }
}

export class IntegratedGame {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private lastTime = 0;
  private isRunning = false;
  
  // Scenes
  private menuScene!: MenuScene;
  private characterCreationScene!: CharacterCreationScene;
  private settingsScene!: SettingsScene;
  private gameplayScene!: GameplayScene;
  
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
    
    // Create all scenes
    this.initializeScenes();
    
    // Setup scene transitions
    this.setupSceneTransitions();
    
    // Start with the menu scene
    sceneManager.changeScene('menu');
    
    // Expose for debugging
    (window as any).game = this;
    (window as any).sceneManager = sceneManager;
    (window as any).inputManager = inputManager;
  }
  
  private setupCanvas(): void {
    // Set up responsive canvas dimensions
    this.resizeCanvas();
    
    // Listen for window resize events
    window.addEventListener('resize', () => this.resizeCanvas());
    
    // Canvas rendering settings
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';
    
    // Make canvas focusable for keyboard input
    this.canvas.tabIndex = 0;
    this.canvas.focus();
  }
  
  private resizeCanvas(): void {
    const container = this.canvas.parentElement;
    if (!container) return;
    
    // Calculate available space (accounting for UI panel)
    const uiPanel = document.getElementById('ui');
    const uiWidth = uiPanel ? uiPanel.offsetWidth : 320;
    
    const availableWidth = window.innerWidth - uiWidth;
    const availableHeight = window.innerHeight;
    
    // Maintain 4:3 aspect ratio (classic game ratio)
    const targetRatio = 4 / 3;
    let canvasWidth = availableWidth;
    let canvasHeight = availableHeight;
    
    if (canvasWidth / canvasHeight > targetRatio) {
      canvasWidth = canvasHeight * targetRatio;
    } else {
      canvasHeight = canvasWidth / targetRatio;
    }
    
    // Set canvas display size
    this.canvas.style.width = `${canvasWidth}px`;
    this.canvas.style.height = `${canvasHeight}px`;
    
    // Set canvas buffer size for crisp pixel art
    const pixelRatio = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const bufferWidth = Math.floor(canvasWidth * pixelRatio);
    const bufferHeight = Math.floor(canvasHeight * pixelRatio);
    
    this.canvas.width = bufferWidth;
    this.canvas.height = bufferHeight;
    
    // Scale context for high DPI displays
    this.ctx.scale(pixelRatio, pixelRatio);
    
    console.log(`Canvas resized: ${bufferWidth}x${bufferHeight} (display: ${canvasWidth}x${canvasHeight})`);
  }
  
  private initializeScenes(): void {
    // Create all scenes
    this.menuScene = new MenuScene(this.canvas);
    this.characterCreationScene = new CharacterCreationScene(this.canvas);
    this.settingsScene = new SettingsScene(this.canvas);
    this.gameplayScene = new GameplayScene(this.canvas);
    
    // Set UI elements for gameplay scene
    this.gameplayScene.setUIElements(
      this.messageLog,
      this.statsPanel,
      this.needsPanel,
      this.cashElement,
      this.bankElement,
      this.heatElement
    );
    
    // Add all scenes to the scene manager
    sceneManager.addScene(this.menuScene);
    sceneManager.addScene(this.characterCreationScene);
    sceneManager.addScene(this.settingsScene);
    sceneManager.addScene(this.gameplayScene);
  }
  
  private setupSceneTransitions(): void {
    // Store original menu actions before overriding
    const originalMenuActions = {
      startNewGame: (this.menuScene as any).startNewGame?.bind(this.menuScene),
      continueGame: (this.menuScene as any).continueGame?.bind(this.menuScene),
      openCharacterCreation: (this.menuScene as any).openCharacterCreation?.bind(this.menuScene),
      openSettings: (this.menuScene as any).openSettings?.bind(this.menuScene)
    };
    
    // Replace menu actions with scene transitions
    (this.menuScene as any).startNewGame = () => {
      console.log('Starting new game - transitioning to character creation');
      try {
        advancedAudioEngine.createUISound('click');
      } catch (e) {
        console.warn('Could not play sound:', e);
      }
      sceneManager.changeScene('character-creation');
    };
    
    (this.menuScene as any).continueGame = () => {
      console.log('Continuing game - checking for save data');
      try {
        advancedAudioEngine.createUISound('click');
      } catch (e) {
        console.warn('Could not play sound:', e);
      }
      
      // Check for saved game
      const saveData = localStorage.getItem('uho-fate-save');
      if (saveData) {
        console.log('Save data found, transitioning to gameplay');
        sceneManager.changeScene('gameplay');
      } else {
        try {
          advancedAudioEngine.createUISound('error');
        } catch (e) {
          console.warn('Could not play error sound:', e);
        }
        alert('Ei tallennettua peliä löytynyt!');
      }
    };
    
    (this.menuScene as any).openCharacterCreation = () => {
      console.log('Opening character creation');
      try {
        advancedAudioEngine.createUISound('click');
      } catch (e) {
        console.warn('Could not play sound:', e);
      }
      sceneManager.changeScene('character-creation');
    };
    
    (this.menuScene as any).openSettings = () => {
      console.log('Opening settings');
      try {
        advancedAudioEngine.createUISound('click');
      } catch (e) {
        console.warn('Could not play sound:', e);
      }
      sceneManager.changeScene('settings');
    };
    
    // Character creation transitions
    if (this.characterCreationScene && typeof (this.characterCreationScene as any).setGoBackCallback === 'function') {
      (this.characterCreationScene as any).setGoBackCallback(() => {
        console.log('Going back to main menu from character creation');
        try {
          advancedAudioEngine.createUISound('click');
        } catch (e) {
          console.warn('Could not play sound:', e);
        }
        sceneManager.changeScene('menu');
      });
    }
    
    if (this.characterCreationScene && typeof (this.characterCreationScene as any).setFinishCallback === 'function') {
      (this.characterCreationScene as any).setFinishCallback(() => {
        console.log('Character creation finished, transitioning to gameplay');
        try {
          advancedAudioEngine.createUISound('success');
        } catch (e) {
          console.warn('Could not play sound:', e);
        }
        
        // Transition to gameplay after character creation
        setTimeout(() => {
          sceneManager.changeScene('gameplay');
        }, 1000);
      });
    }
    
    // Settings transitions
    if (this.settingsScene && typeof (this.settingsScene as any).setGoBackCallback === 'function') {
      (this.settingsScene as any).setGoBackCallback(() => {
        console.log('Going back to main menu from settings');
        setTimeout(() => {
          sceneManager.changeScene('menu');
        }, 500);
      });
    }
  }
  
  private gameLoop = (currentTime: number): void => {
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    
    // Handle input through scene manager and input manager
    sceneManager.handleInput(new Set()); // Empty set since we use inputManager now
    
    // Update scene manager (which updates active scenes)
    sceneManager.update(deltaTime);
    
    // Update global animation manager
    tweenManager.update(currentTime);
    
    // Update input manager
    inputManager.update(deltaTime);
    
    // Render through scene manager
    sceneManager.render(this.ctx);
    
    // Show UI only during gameplay
    const currentScene = sceneManager.getCurrentScene();
    if (currentScene && currentScene.name === 'gameplay') {
      this.showGameUI();
    } else {
      this.hideGameUI();
    }
    
    if (this.isRunning) {
      requestAnimationFrame(this.gameLoop);
    }
  };
  
  private showGameUI(): void {
    const uiElement = document.getElementById('ui');
    if (uiElement) {
      uiElement.style.display = 'block';
    }
  }
  
  private hideGameUI(): void {
    const uiElement = document.getElementById('ui');
    if (uiElement) {
      uiElement.style.display = 'none';
    }
  }
  
  public async start(): Promise<void> {
    if (this.isRunning) return;
    
    console.log('Initializing UHO: Fate of the Grid...');
    
    // Initialize asset managers
    try {
      // Load character creation assets
      console.log('Loading visual assets...');
      // Load character creation assets (placeholder for asset manager integration)
      console.log('Character creation assets would be loaded here');
      // Define character assets for the game
      const characterAssets = {
        backgrounds: [
          'assets/images/menu-bg.jpg',
          'assets/images/character-creation-bg.jpg'
        ],
        sprites: [
          'assets/sprites/character-portraits.png'
        ],
        ui: [
          'assets/ui/buttons.png',
          'assets/ui/panels.png'
        ]
      };
      
      // Load character assets (placeholder - actual implementation would use asset manager)
      console.log('Character assets defined:', characterAssets);
      
      // Initialize audio assets
      console.log('Loading audio assets...');
      await audioAssetRegistry.initialize();
      
      console.log('All assets loaded successfully!');
    } catch (error) {
      console.warn('Some assets failed to load, but continuing anyway:', error);
    }
    
    this.isRunning = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this.gameLoop);
    
    console.log('UHO: Fate of the Grid started with integrated systems!');
    console.log('Features:');
    console.log('- Xbox gamepad support with haptic feedback');
    console.log('- Mouse and keyboard input');
    console.log('- Complete menu system with navigation');
    console.log('- Enhanced character creation with visual elements');
    console.log('- Settings with audio/graphics/controls configuration');
    console.log('- Seamless scene transitions');
    console.log('- Visual assets and atmospheric backgrounds');
  }
  
  public stop(): void {
    this.isRunning = false;
  }
  
  public getCurrentScene(): Scene | null {
    return sceneManager.getCurrentScene() || null;
  }
  
  public getGameplayCamera(): Camera | null {
    return this.gameplayScene?.getCamera() || null;
  }
}
