/**
 * 🎮 GAME UI SYSTEM 🎮
 * 
 * Complete user interface system with:
 * - Inventory management
 * - Dialogue system
 * - Quest journal
 * - Minimap
 * - Status bars (health, mana, exp)
 * - Shop interface
 * - Main menu
 * - Settings panel
 * - Context menus
 * 
 * ULTIMATE UI EXPERIENCE! ⚡🎨
 */

import { EntityId, Vector2 } from '../core/types.ts';
import { VillageBuilding, VillageNPC, ShopItem, Quest } from './top-down-village.ts';

export interface UIPanel {
  id: string;
  name: string;
  visible: boolean;
  position: Vector2;
  size: Vector2;
  zIndex: number;
  draggable: boolean;
  closable: boolean;
  content: UIElement[];
}

export interface UIElement {
  id: string;
  type: 'button' | 'label' | 'image' | 'textbox' | 'progressbar' | 'list' | 'grid' | 'divider';
  position: Vector2;
  size: Vector2;
  text?: string;
  image?: string;
  onClick?: () => void;
  onChange?: (value: any) => void;
  style?: UIStyle;
  children?: UIElement[];
}

export interface UIStyle {
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  fontSize?: number;
  fontFamily?: string;
  borderWidth?: number;
  borderRadius?: number;
  opacity?: number;
  padding?: number;
  margin?: number;
}

export interface PlayerStats {
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  experience: number;
  level: number;
  gold: number;
  strength: number;
  dexterity: number;
  intelligence: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  sprite: string;
  quantity: number;
  description: string;
  type: 'weapon' | 'armor' | 'potion' | 'tool' | 'food' | 'misc';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  equipped?: boolean;
  stackable: boolean;
}

export interface DialogueData {
  npc: VillageNPC;
  currentLine: number;
  options: DialogueOption[];
}

export interface DialogueOption {
  text: string;
  response: string;
  action?: () => void;
}

export class GameUISystem {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private panels: Map<string, UIPanel> = new Map();
  private activePanel: string | null = null;
  
  // Game state
  private playerStats: PlayerStats;
  private inventory: InventoryItem[] = [];
  private activeQuests: Quest[] = [];
  private currentDialogue: DialogueData | null = null;
  private shopData: { building: VillageBuilding; items: ShopItem[] } | null = null;
  
  // UI Assets
  private uiAssets: Map<string, HTMLImageElement> = new Map();
  
  // Event handlers
  private clickHandlers: Map<string, () => void> = new Map();
  private hoverElements: Set<string> = new Set();

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    
    // Initialize player stats
    this.playerStats = {
      health: 100,
      maxHealth: 100,
      mana: 50,
      maxMana: 50,
      experience: 250,
      level: 3,
      gold: 150,
      strength: 12,
      dexterity: 8,
      intelligence: 10
    };
    
    this.initializeUIAssets();
    this.createUIElements();
    this.setupEventListeners();
    
    console.log('🎮 Game UI System initialized!');
  }

  private async initializeUIAssets(): Promise<void> {
    // Load UI sprite assets
    const uiAssetPaths = [
      'ui/panel_bg.png',
      'ui/button_normal.png',
      'ui/button_hover.png',
      'ui/button_pressed.png',
      'ui/health_bar_bg.png',
      'ui/health_bar_fill.png',
      'ui/mana_bar_bg.png',
      'ui/mana_bar_fill.png',
      'ui/exp_bar_bg.png',
      'ui/exp_bar_fill.png',
      'ui/inventory_slot.png',
      'ui/dialogue_box.png',
      'ui/minimap_bg.png',
      'ui/quest_journal.png'
    ];
    
    for (const path of uiAssetPaths) {
      const img = new Image();
      img.src = `assets/sprites/${path}`;
      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve; // Continue even if image fails to load
      });
      this.uiAssets.set(path, img);
    }
  }

  private createUIElements(): void {
    // Main HUD Panel
    this.createMainHUD();
    
    // Inventory Panel
    this.createInventoryPanel();
    
    // Quest Journal Panel
    this.createQuestJournal();
    
    // Dialogue Panel
    this.createDialoguePanel();
    
    // Shop Panel
    this.createShopPanel();
    
    // Main Menu Panel
    this.createMainMenu();
    
    // Settings Panel
    this.createSettingsPanel();
    
    // Minimap Panel
    this.createMinimapPanel();
  }

  private createMainHUD(): void {
    const hudPanel: UIPanel = {
      id: 'main_hud',
      name: 'Main HUD',
      visible: true,
      position: { x: 0, y: 0 },
      size: { x: this.canvas.width, y: 100 },
      zIndex: 100,
      draggable: false,
      closable: false,
      content: [
        // Health Bar
        {
          id: 'health_bar_bg',
          type: 'image',
          position: { x: 20, y: 20 },
          size: { x: 200, y: 20 },
          image: 'ui/health_bar_bg.png'
        },
        {
          id: 'health_bar_fill',
          type: 'progressbar',
          position: { x: 22, y: 22 },
          size: { x: 196, y: 16 },
          style: { backgroundColor: '#ff4444' }
        },
        {
          id: 'health_text',
          type: 'label',
          position: { x: 120, y: 32 },
          size: { x: 0, y: 0 },
          text: '100/100',
          style: { textColor: '#ffffff', fontSize: 12, fontFamily: 'Arial' }
        },
        
        // Mana Bar
        {
          id: 'mana_bar_bg',
          type: 'image',
          position: { x: 20, y: 45 },
          size: { x: 200, y: 20 },
          image: 'ui/mana_bar_bg.png'
        },
        {
          id: 'mana_bar_fill',
          type: 'progressbar',
          position: { x: 22, y: 47 },
          size: { x: 196, y: 16 },
          style: { backgroundColor: '#4444ff' }
        },
        {
          id: 'mana_text',
          type: 'label',
          position: { x: 120, y: 57 },
          size: { x: 0, y: 0 },
          text: '50/50',
          style: { textColor: '#ffffff', fontSize: 12, fontFamily: 'Arial' }
        },
        
        // Experience Bar
        {
          id: 'exp_bar_bg',
          type: 'image',
          position: { x: 20, y: 70 },
          size: { x: 200, y: 15 },
          image: 'ui/exp_bar_bg.png'
        },
        {
          id: 'exp_bar_fill',
          type: 'progressbar',
          position: { x: 22, y: 72 },
          size: { x: 196, y: 11 },
          style: { backgroundColor: '#44ff44' }
        },
        {
          id: 'level_text',
          type: 'label',
          position: { x: 240, y: 30 },
          size: { x: 0, y: 0 },
          text: 'Level 3',
          style: { textColor: '#ffffff', fontSize: 16, fontFamily: 'Arial' }
        },
        
        // Gold Counter
        {
          id: 'gold_text',
          type: 'label',
          position: { x: this.canvas.width - 120, y: 30 },
          size: { x: 0, y: 0 },
          text: '💰 150 Gold',
          style: { textColor: '#ffdd00', fontSize: 16, fontFamily: 'Arial' }
        },
        
        // Quick Action Buttons
        {
          id: 'inventory_button',
          type: 'button',
          position: { x: this.canvas.width - 200, y: 50 },
          size: { x: 40, y: 40 },
          text: '🎒',
          onClick: () => this.togglePanel('inventory')
        },
        {
          id: 'journal_button',
          type: 'button',
          position: { x: this.canvas.width - 150, y: 50 },
          size: { x: 40, y: 40 },
          text: '📋',
          onClick: () => this.togglePanel('quest_journal')
        },
        {
          id: 'menu_button',
          type: 'button',
          position: { x: this.canvas.width - 100, y: 50 },
          size: { x: 40, y: 40 },
          text: '⚙️',
          onClick: () => this.togglePanel('main_menu')
        }
      ]
    };
    
    this.panels.set('main_hud', hudPanel);
  }

  private createInventoryPanel(): void {
    const inventoryContent: UIElement[] = [];
    
    // Title
    inventoryContent.push({
      id: 'inventory_title',
      type: 'label',
      position: { x: 10, y: 30 },
      size: { x: 0, y: 0 },
      text: 'Inventory',
      style: { textColor: '#ffffff', fontSize: 18, fontFamily: 'Arial' }
    });
    
    // Inventory grid (8x6 = 48 slots)
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 8; col++) {
        const slotId = `inventory_slot_${row * 8 + col}`;
        inventoryContent.push({
          id: slotId,
          type: 'button',
          position: { x: 10 + col * 45, y: 60 + row * 45 },
          size: { x: 40, y: 40 },
          text: '',
          style: { 
            borderColor: '#666666', 
            borderWidth: 1,
            backgroundColor: '#333333'
          },
          onClick: () => this.onInventorySlotClick(row * 8 + col)
        });
      }
    }
    
    // Stats Panel
    inventoryContent.push({
      id: 'stats_title',
      type: 'label',
      position: { x: 380, y: 60 },
      size: { x: 0, y: 0 },
      text: 'Character Stats',
      style: { textColor: '#ffffff', fontSize: 16, fontFamily: 'Arial' }
    });
    
    const stats = [
      `Strength: ${this.playerStats.strength}`,
      `Dexterity: ${this.playerStats.dexterity}`,
      `Intelligence: ${this.playerStats.intelligence}`,
      `Level: ${this.playerStats.level}`,
      `Gold: ${this.playerStats.gold}`
    ];
    
    stats.forEach((stat, index) => {
      inventoryContent.push({
        id: `stat_${index}`,
        type: 'label',
        position: { x: 380, y: 90 + index * 25 },
        size: { x: 0, y: 0 },
        text: stat,
        style: { textColor: '#cccccc', fontSize: 14, fontFamily: 'Arial' }
      });
    });
    
    const inventoryPanel: UIPanel = {
      id: 'inventory',
      name: 'Inventory',
      visible: false,
      position: { x: 100, y: 120 },
      size: { x: 500, y: 350 },
      zIndex: 200,
      draggable: true,
      closable: true,
      content: inventoryContent
    };
    
    this.panels.set('inventory', inventoryPanel);
  }

  private createQuestJournal(): void {
    const questContent: UIElement[] = [];
    
    // Title
    questContent.push({
      id: 'quest_title',
      type: 'label',
      position: { x: 10, y: 30 },
      size: { x: 0, y: 0 },
      text: 'Quest Journal',
      style: { textColor: '#ffffff', fontSize: 18, fontFamily: 'Arial' }
    });
    
    // Active quests list
    this.activeQuests.forEach((quest, index) => {
      questContent.push({
        id: `quest_${quest.id}`,
        type: 'button',
        position: { x: 10, y: 60 + index * 80 },
        size: { x: 380, y: 70 },
        text: '',
        style: {
          backgroundColor: '#2a2a2a',
          borderColor: quest.completed ? '#44aa44' : '#aa4444',
          borderWidth: 2
        },
        onClick: () => this.selectQuest(quest.id),
        children: [
          {
            id: `quest_title_${quest.id}`,
            type: 'label',
            position: { x: 10, y: 15 },
            size: { x: 0, y: 0 },
            text: quest.title,
            style: { textColor: '#ffffff', fontSize: 14, fontFamily: 'Arial' }
          },
          {
            id: `quest_desc_${quest.id}`,
            type: 'label',
            position: { x: 10, y: 35 },
            size: { x: 0, y: 0 },
            text: quest.description,
            style: { textColor: '#cccccc', fontSize: 12, fontFamily: 'Arial' }
          },
          {
            id: `quest_progress_${quest.id}`,
            type: 'label',
            position: { x: 10, y: 55 },
            size: { x: 0, y: 0 },
            text: `Progress: ${quest.objectives.length} objectives`,
            style: { textColor: '#aaaaaa', fontSize: 11, fontFamily: 'Arial' }
          }
        ]
      });
    });
    
    const questPanel: UIPanel = {
      id: 'quest_journal',
      name: 'Quest Journal',
      visible: false,
      position: { x: 200, y: 100 },
      size: { x: 400, y: 500 },
      zIndex: 200,
      draggable: true,
      closable: true,
      content: questContent
    };
    
    this.panels.set('quest_journal', questPanel);
  }

  private createDialoguePanel(): void {
    const dialoguePanel: UIPanel = {
      id: 'dialogue',
      name: 'Dialogue',
      visible: false,
      position: { x: 50, y: this.canvas.height - 200 },
      size: { x: this.canvas.width - 100, y: 150 },
      zIndex: 300,
      draggable: false,
      closable: true,
      content: [
        {
          id: 'dialogue_bg',
          type: 'image',
          position: { x: 0, y: 0 },
          size: { x: this.canvas.width - 100, y: 150 },
          image: 'ui/dialogue_box.png'
        },
        {
          id: 'npc_portrait',
          type: 'image',
          position: { x: 10, y: 10 },
          size: { x: 60, y: 60 },
          image: 'placeholder_portrait.png'
        },
        {
          id: 'npc_name',
          type: 'label',
          position: { x: 80, y: 20 },
          size: { x: 0, y: 0 },
          text: 'NPC Name',
          style: { textColor: '#ffddaa', fontSize: 16, fontFamily: 'Arial' }
        },
        {
          id: 'dialogue_text',
          type: 'label',
          position: { x: 80, y: 45 },
          size: { x: this.canvas.width - 200, y: 60 },
          text: 'Dialogue text appears here...',
          style: { textColor: '#ffffff', fontSize: 14, fontFamily: 'Arial' }
        },
        {
          id: 'dialogue_continue',
          type: 'button',
          position: { x: this.canvas.width - 180, y: 110 },
          size: { x: 80, y: 30 },
          text: 'Continue',
          onClick: () => this.continueDialogue()
        }
      ]
    };
    
    this.panels.set('dialogue', dialoguePanel);
  }

  private createShopPanel(): void {
    const shopContent: UIElement[] = [];
    
    // Title
    shopContent.push({
      id: 'shop_title',
      type: 'label',
      position: { x: 10, y: 30 },
      size: { x: 0, y: 0 },
      text: 'Shop',
      style: { textColor: '#ffffff', fontSize: 18, fontFamily: 'Arial' }
    });
    
    // Shop items grid (will be populated when shop opens)
    for (let i = 0; i < 20; i++) {
      const col = i % 5;
      const row = Math.floor(i / 5);
      
      shopContent.push({
        id: `shop_item_${i}`,
        type: 'button',
        position: { x: 20 + col * 90, y: 60 + row * 90 },
        size: { x: 80, y: 80 },
        text: '',
        style: {
          backgroundColor: '#3a3a3a',
          borderColor: '#666666',
          borderWidth: 1
        },
        onClick: () => this.onShopItemClick(i)
      });
    }
    
    // Buy/Sell buttons
    shopContent.push({
      id: 'buy_button',
      type: 'button',
      position: { x: 480, y: 100 },
      size: { x: 80, y: 40 },
      text: 'Buy',
      onClick: () => this.buySelectedItem(),
      style: { backgroundColor: '#44aa44' }
    });
    
    shopContent.push({
      id: 'sell_button',
      type: 'button',
      position: { x: 480, y: 150 },
      size: { x: 80, y: 40 },
      text: 'Sell',
      onClick: () => this.sellSelectedItem(),
      style: { backgroundColor: '#aa4444' }
    });
    
    const shopPanel: UIPanel = {
      id: 'shop',
      name: 'Shop',
      visible: false,
      position: { x: 150, y: 100 },
      size: { x: 600, y: 450 },
      zIndex: 250,
      draggable: true,
      closable: true,
      content: shopContent
    };
    
    this.panels.set('shop', shopPanel);
  }

  private createMainMenu(): void {
    const menuContent: UIElement[] = [];
    
    const menuButtons = [
      { text: 'Resume Game', action: () => this.hidePanel('main_menu') },
      { text: 'Settings', action: () => this.showPanel('settings') },
      { text: 'Save Game', action: () => this.saveGame() },
      { text: 'Load Game', action: () => this.loadGame() },
      { text: 'Exit to Main Menu', action: () => this.exitToMainMenu() },
      { text: 'Quit Game', action: () => this.quitGame() }
    ];
    
    menuButtons.forEach((button, index) => {
      menuContent.push({
        id: `menu_button_${index}`,
        type: 'button',
        position: { x: 50, y: 80 + index * 60 },
        size: { x: 200, y: 50 },
        text: button.text,
        onClick: button.action,
        style: {
          backgroundColor: '#4a4a4a',
          borderColor: '#888888',
          borderWidth: 1,
          textColor: '#ffffff',
          fontSize: 16
        }
      });
    });
    
    const mainMenuPanel: UIPanel = {
      id: 'main_menu',
      name: 'Main Menu',
      visible: false,
      position: { x: this.canvas.width / 2 - 150, y: this.canvas.height / 2 - 200 },
      size: { x: 300, y: 400 },
      zIndex: 400,
      draggable: false,
      closable: true,
      content: menuContent
    };
    
    this.panels.set('main_menu', mainMenuPanel);
  }

  private createSettingsPanel(): void {
    const settingsContent: UIElement[] = [];
    
    // Title
    settingsContent.push({
      id: 'settings_title',
      type: 'label',
      position: { x: 10, y: 30 },
      size: { x: 0, y: 0 },
      text: 'Settings',
      style: { textColor: '#ffffff', fontSize: 18, fontFamily: 'Arial' }
    });
    
    // Volume controls
    settingsContent.push({
      id: 'master_volume_label',
      type: 'label',
      position: { x: 20, y: 70 },
      size: { x: 0, y: 0 },
      text: 'Master Volume:',
      style: { textColor: '#cccccc', fontSize: 14, fontFamily: 'Arial' }
    });
    
    settingsContent.push({
      id: 'master_volume_slider',
      type: 'progressbar',
      position: { x: 150, y: 70 },
      size: { x: 200, y: 20 },
      style: { backgroundColor: '#666666' }
    });
    
    // Graphics settings
    const graphicsOptions = [
      'Fullscreen',
      'VSync',
      'Show FPS',
      'Pixel Perfect Scaling'
    ];
    
    graphicsOptions.forEach((option, index) => {
      settingsContent.push({
        id: `graphics_option_${index}`,
        type: 'button',
        position: { x: 20, y: 120 + index * 40 },
        size: { x: 20, y: 20 },
        text: '☐',
        onClick: () => this.toggleGraphicsOption(index),
        style: { fontSize: 16 }
      });
      
      settingsContent.push({
        id: `graphics_label_${index}`,
        type: 'label',
        position: { x: 50, y: 125 + index * 40 },
        size: { x: 0, y: 0 },
        text: option,
        style: { textColor: '#cccccc', fontSize: 14, fontFamily: 'Arial' }
      });
    });
    
    const settingsPanel: UIPanel = {
      id: 'settings',
      name: 'Settings',
      visible: false,
      position: { x: 200, y: 150 },
      size: { x: 400, y: 350 },
      zIndex: 350,
      draggable: true,
      closable: true,
      content: settingsContent
    };
    
    this.panels.set('settings', settingsPanel);
  }

  private createMinimapPanel(): void {
    const minimapPanel: UIPanel = {
      id: 'minimap',
      name: 'Minimap',
      visible: true,
      position: { x: this.canvas.width - 220, y: 110 },
      size: { x: 200, y: 200 },
      zIndex: 150,
      draggable: false,
      closable: false,
      content: [
        {
          id: 'minimap_bg',
          type: 'image',
          position: { x: 0, y: 0 },
          size: { x: 200, y: 200 },
          image: 'ui/minimap_bg.png'
        },
        {
          id: 'minimap_title',
          type: 'label',
          position: { x: 10, y: 15 },
          size: { x: 0, y: 0 },
          text: 'Map',
          style: { textColor: '#ffffff', fontSize: 12, fontFamily: 'Arial' }
        },
        {
          id: 'player_dot',
          type: 'button',
          position: { x: 95, y: 95 },
          size: { x: 10, y: 10 },
          text: '●',
          style: { textColor: '#ff4444', fontSize: 16 }
        }
      ]
    };
    
    this.panels.set('minimap', minimapPanel);
  }

  private setupEventListeners(): void {
    this.canvas.addEventListener('click', (event) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      this.handleClick(x, y);
    });
    
    this.canvas.addEventListener('mousemove', (event) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      this.handleMouseMove(x, y);
    });
    
    window.addEventListener('keydown', (event) => {
      this.handleKeyPress(event.key);
    });
  }

  // ============ RENDERING ============

  render(): void {
    // Clear UI area (keep game rendering below)
    this.ctx.save();
    
    // Render panels in z-index order
    const sortedPanels = Array.from(this.panels.values())
      .filter(panel => panel.visible)
      .sort((a, b) => a.zIndex - b.zIndex);
    
    for (const panel of sortedPanels) {
      this.renderPanel(panel);
    }
    
    this.ctx.restore();
  }

  private renderPanel(panel: UIPanel): void {
    this.ctx.save();
    
    // Panel background
    this.ctx.fillStyle = '#2a2a2a';
    this.ctx.strokeStyle = '#666666';
    this.ctx.lineWidth = 2;
    
    this.ctx.fillRect(panel.position.x, panel.position.y, panel.size.x, panel.size.y);
    this.ctx.strokeRect(panel.position.x, panel.position.y, panel.size.x, panel.size.y);
    
    // Panel title bar
    if (panel.closable || panel.draggable) {
      this.ctx.fillStyle = '#4a4a4a';
      this.ctx.fillRect(panel.position.x, panel.position.y, panel.size.x, 25);
      
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = '14px Arial';
      this.ctx.fillText(panel.name, panel.position.x + 10, panel.position.y + 18);
      
      if (panel.closable) {
        this.ctx.fillStyle = '#ff4444';
        this.ctx.fillRect(panel.position.x + panel.size.x - 25, panel.position.y + 2, 20, 20);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('✕', panel.position.x + panel.size.x - 15, panel.position.y + 15);
        this.ctx.textAlign = 'left';
      }
    }
    
    // Render panel content
    for (const element of panel.content) {
      this.renderUIElement(element, panel.position);
    }
    
    this.ctx.restore();
  }

  private renderUIElement(element: UIElement, panelPos: Vector2): void {
    const absPos = {
      x: panelPos.x + element.position.x,
      y: panelPos.y + element.position.y
    };
    
    this.ctx.save();
    
    // Apply style
    if (element.style) {
      if (element.style.backgroundColor) {
        this.ctx.fillStyle = element.style.backgroundColor;
        this.ctx.fillRect(absPos.x, absPos.y, element.size.x, element.size.y);
      }
      
      if (element.style.borderColor && element.style.borderWidth) {
        this.ctx.strokeStyle = element.style.borderColor;
        this.ctx.lineWidth = element.style.borderWidth;
        this.ctx.strokeRect(absPos.x, absPos.y, element.size.x, element.size.y);
      }
    }
    
    switch (element.type) {
      case 'button':
        this.renderButton(element, absPos);
        break;
      case 'label':
        this.renderLabel(element, absPos);
        break;
      case 'image':
        this.renderImage(element, absPos);
        break;
      case 'progressbar':
        this.renderProgressBar(element, absPos);
        break;
    }
    
    // Render children
    if (element.children) {
      for (const child of element.children) {
        this.renderUIElement(child, absPos);
      }
    }
    
    this.ctx.restore();
  }

  private renderButton(element: UIElement, pos: Vector2): void {
    // Button background
    this.ctx.fillStyle = this.hoverElements.has(element.id) ? '#5a5a5a' : '#4a4a4a';
    this.ctx.fillRect(pos.x, pos.y, element.size.x, element.size.y);
    
    // Button border
    this.ctx.strokeStyle = '#888888';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(pos.x, pos.y, element.size.x, element.size.y);
    
    // Button text
    if (element.text) {
      this.ctx.fillStyle = element.style?.textColor || '#ffffff';
      this.ctx.font = `${element.style?.fontSize || 14}px ${element.style?.fontFamily || 'Arial'}`;
      this.ctx.textAlign = 'center';
      this.ctx.fillText(
        element.text,
        pos.x + element.size.x / 2,
        pos.y + element.size.y / 2 + 5
      );
      this.ctx.textAlign = 'left';
    }
  }

  private renderLabel(element: UIElement, pos: Vector2): void {
    if (element.text) {
      this.ctx.fillStyle = element.style?.textColor || '#ffffff';
      this.ctx.font = `${element.style?.fontSize || 14}px ${element.style?.fontFamily || 'Arial'}`;
      this.ctx.fillText(element.text, pos.x, pos.y);
    }
  }

  private renderImage(element: UIElement, pos: Vector2): void {
    if (element.image) {
      const img = this.uiAssets.get(element.image);
      if (img) {
        this.ctx.drawImage(img, pos.x, pos.y, element.size.x, element.size.y);
      }
    }
  }

  private renderProgressBar(element: UIElement, pos: Vector2): void {
    let percentage = 0;
    
    // Calculate percentage based on element ID
    if (element.id === 'health_bar_fill') {
      percentage = this.playerStats.health / this.playerStats.maxHealth;
    } else if (element.id === 'mana_bar_fill') {
      percentage = this.playerStats.mana / this.playerStats.maxMana;
    } else if (element.id === 'exp_bar_fill') {
      percentage = 0.6; // Mock XP percentage
    }
    
    const fillWidth = element.size.x * percentage;
    
    this.ctx.fillStyle = element.style?.backgroundColor || '#4444ff';
    this.ctx.fillRect(pos.x, pos.y, fillWidth, element.size.y);
  }

  // ============ EVENT HANDLING ============

  private handleClick(x: number, y: number): void {
    // Check panels from highest to lowest z-index
    const sortedPanels = Array.from(this.panels.values())
      .filter(panel => panel.visible)
      .sort((a, b) => b.zIndex - a.zIndex);
    
    for (const panel of sortedPanels) {
      if (this.isPointInPanel(x, y, panel)) {
        // Check close button
        if (panel.closable && this.isPointInCloseButton(x, y, panel)) {
          this.hidePanel(panel.id);
          return;
        }
        
        // Check panel elements
        for (const element of panel.content) {
          if (this.isPointInElement(x, y, element, panel.position)) {
            if (element.onClick) {
              element.onClick();
              return;
            }
          }
        }
        
        // Set active panel
        this.activePanel = panel.id;
        return;
      }
    }
  }

  private handleMouseMove(x: number, y: number): void {
    this.hoverElements.clear();
    
    for (const panel of this.panels.values()) {
      if (!panel.visible) continue;
      
      for (const element of panel.content) {
        if (this.isPointInElement(x, y, element, panel.position)) {
          this.hoverElements.add(element.id);
        }
      }
    }
  }

  private handleKeyPress(key: string): void {
    switch (key) {
      case 'i':
      case 'I':
        this.togglePanel('inventory');
        break;
      case 'j':
      case 'J':
        this.togglePanel('quest_journal');
        break;
      case 'm':
      case 'M':
        this.togglePanel('minimap');
        break;
      case 'Escape':
        if (this.currentDialogue) {
          this.hidePanel('dialogue');
          this.currentDialogue = null;
        } else {
          this.togglePanel('main_menu');
        }
        break;
    }
  }

  // ============ UTILITY METHODS ============

  private isPointInPanel(x: number, y: number, panel: UIPanel): boolean {
    return x >= panel.position.x && 
           x <= panel.position.x + panel.size.x &&
           y >= panel.position.y && 
           y <= panel.position.y + panel.size.y;
  }

  private isPointInCloseButton(x: number, y: number, panel: UIPanel): boolean {
    return x >= panel.position.x + panel.size.x - 25 &&
           x <= panel.position.x + panel.size.x - 5 &&
           y >= panel.position.y + 2 &&
           y <= panel.position.y + 22;
  }

  private isPointInElement(x: number, y: number, element: UIElement, panelPos: Vector2): boolean {
    const absPos = {
      x: panelPos.x + element.position.x,
      y: panelPos.y + element.position.y
    };
    
    return x >= absPos.x && 
           x <= absPos.x + element.size.x &&
           y >= absPos.y && 
           y <= absPos.y + element.size.y;
  }

  // ============ PUBLIC API ============

  showPanel(panelId: string): void {
    const panel = this.panels.get(panelId);
    if (panel) {
      panel.visible = true;
      this.activePanel = panelId;
    }
  }

  hidePanel(panelId: string): void {
    const panel = this.panels.get(panelId);
    if (panel) {
      panel.visible = false;
      if (this.activePanel === panelId) {
        this.activePanel = null;
      }
    }
  }

  togglePanel(panelId: string): void {
    const panel = this.panels.get(panelId);
    if (panel) {
      panel.visible = !panel.visible;
      this.activePanel = panel.visible ? panelId : null;
    }
  }

  updatePlayerStats(stats: Partial<PlayerStats>): void {
    Object.assign(this.playerStats, stats);
    this.updateHUDElements();
  }

  private updateHUDElements(): void {
    // Update health text
    const healthText = this.findElement('main_hud', 'health_text');
    if (healthText) {
      healthText.text = `${this.playerStats.health}/${this.playerStats.maxHealth}`;
    }
    
    // Update mana text
    const manaText = this.findElement('main_hud', 'mana_text');
    if (manaText) {
      manaText.text = `${this.playerStats.mana}/${this.playerStats.maxMana}`;
    }
    
    // Update level text
    const levelText = this.findElement('main_hud', 'level_text');
    if (levelText) {
      levelText.text = `Level ${this.playerStats.level}`;
    }
    
    // Update gold text
    const goldText = this.findElement('main_hud', 'gold_text');
    if (goldText) {
      goldText.text = `💰 ${this.playerStats.gold} Gold`;
    }
  }

  private findElement(panelId: string, elementId: string): UIElement | null {
    const panel = this.panels.get(panelId);
    if (!panel) return null;
    
    return panel.content.find(el => el.id === elementId) || null;
  }

  // Dialog system
  startDialogue(npc: VillageNPC): void {
    this.currentDialogue = {
      npc,
      currentLine: 0,
      options: [
        { text: 'Hello', response: npc.dialogue[0] },
        { text: 'Goodbye', response: 'Farewell, traveler.' }
      ]
    };
    
    this.updateDialoguePanel();
    this.showPanel('dialogue');
  }

  private updateDialoguePanel(): void {
    if (!this.currentDialogue) return;
    
    const nameElement = this.findElement('dialogue', 'npc_name');
    if (nameElement) {
      nameElement.text = this.currentDialogue.npc.name;
    }
    
    const textElement = this.findElement('dialogue', 'dialogue_text');
    if (textElement) {
      textElement.text = this.currentDialogue.npc.dialogue[this.currentDialogue.currentLine];
    }
  }

  private continueDialogue(): void {
    if (!this.currentDialogue) return;
    
    this.currentDialogue.currentLine++;
    if (this.currentDialogue.currentLine >= this.currentDialogue.npc.dialogue.length) {
      this.hidePanel('dialogue');
      this.currentDialogue = null;
    } else {
      this.updateDialoguePanel();
    }
  }

  // Shop system
  openShop(building: VillageBuilding): void {
    this.shopData = {
      building,
      items: building.shopItems || []
    };
    
    this.updateShopPanel();
    this.showPanel('shop');
  }

  private updateShopPanel(): void {
    const titleElement = this.findElement('shop', 'shop_title');
    if (titleElement && this.shopData) {
      titleElement.text = this.shopData.building.name;
    }
  }

  // Inventory management
  addInventoryItem(item: InventoryItem): void {
    const existingItem = this.inventory.find(inv => inv.id === item.id && inv.stackable);
    if (existingItem) {
      existingItem.quantity += item.quantity;
    } else {
      this.inventory.push(item);
    }
  }

  // Event handlers for buttons
  private onInventorySlotClick(slot: number): void {
    console.log(`Clicked inventory slot ${slot}`);
  }

  private onShopItemClick(index: number): void {
    console.log(`Clicked shop item ${index}`);
  }

  private buySelectedItem(): void {
    console.log('Buy item clicked');
  }

  private sellSelectedItem(): void {
    console.log('Sell item clicked');
  }

  private selectQuest(questId: string): void {
    console.log(`Selected quest: ${questId}`);
  }

  private toggleGraphicsOption(index: number): void {
    console.log(`Toggled graphics option ${index}`);
  }

  private saveGame(): void {
    console.log('Save game');
  }

  private loadGame(): void {
    console.log('Load game');
  }

  private exitToMainMenu(): void {
    console.log('Exit to main menu');
  }

  private quitGame(): void {
    console.log('Quit game');
  }
}

export default GameUISystem;