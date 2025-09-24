/**
 * 🏘️  TOP-DOWN VILLAGE GENERATOR 🏘️
 * 
 * Creates a beautiful top-down village with:
 * - Interactive buildings (shops, homes, tavern, etc.)
 * - NPCs with dialogue and quests
 * - Environmental decorations
 * - Roads, bridges, and paths
 * - Special locations (temples, guilds, portals)
 * 
 * ULTIMATE VILLAGE EXPERIENCE! ⚡🏡
 */

import { EntityId, Vector2 } from '../core/types.ts';
import { ComponentManager } from '../core/ecs.ts';
import { Transform, Sprite } from '../core/components.ts';
import { GameStyle, UniversalSpriteEngine } from './universal-sprite-engine.ts';

export interface VillageLayout {
  size: Vector2;
  buildings: VillageBuilding[];
  npcs: VillageNPC[];
  decorations: VillageDecoration[];
  roads: VillageRoad[];
  specialLocations: SpecialLocation[];
}

export interface VillageBuilding {
  id: string;
  name: string;
  type: 'house' | 'shop' | 'tavern' | 'temple' | 'guild' | 'blacksmith' | 'library' | 'inn';
  position: Vector2;
  size: Vector2;
  entrance: Vector2;
  interior?: string;
  shopItems?: ShopItem[];
  description: string;
}

export interface VillageNPC {
  id: string;
  name: string;
  position: Vector2;
  sprite: string;
  role: 'merchant' | 'guard' | 'villager' | 'blacksmith' | 'healer' | 'mayor' | 'priest' | 'librarian';
  dialogue: string[];
  quests?: Quest[];
  patrol?: Vector2[];
  schedule?: NPCSchedule;
}

export interface VillageDecoration {
  id: string;
  type: 'tree' | 'bush' | 'rock' | 'fountain' | 'statue' | 'fence' | 'flower' | 'well' | 'sign';
  position: Vector2;
  sprite: string;
  interactive?: boolean;
  description?: string;
}

export interface VillageRoad {
  start: Vector2;
  end: Vector2;
  type: 'stone' | 'dirt' | 'wooden' | 'brick';
  width: number;
}

export interface SpecialLocation {
  id: string;
  name: string;
  type: 'portal' | 'dungeon_entrance' | 'ancient_tree' | 'monument' | 'cemetery' | 'shrine';
  position: Vector2;
  sprite: string;
  description: string;
  action?: string; // What happens when interacted with
}

export interface ShopItem {
  name: string;
  sprite: string;
  price: number;
  description: string;
  type: 'weapon' | 'armor' | 'potion' | 'tool' | 'food' | 'misc';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  objectives: string[];
  rewards: ShopItem[];
  completed: boolean;
}

export interface NPCSchedule {
  morning: Vector2;
  afternoon: Vector2;
  evening: Vector2;
  night: Vector2;
}

export class TopDownVillageGenerator {
  private componentManager: ComponentManager;
  private spriteEngine: UniversalSpriteEngine;
  private villageEntities: EntityId[] = [];
  private currentLayout: VillageLayout | null = null;

  // Predefined building templates
  private readonly BUILDING_TEMPLATES: { [key: string]: Omit<VillageBuilding, 'id' | 'position'> } = {
    blacksmith: {
      name: 'Village Blacksmith',
      type: 'blacksmith',
      size: { x: 3, y: 3 },
      entrance: { x: 1, y: 2 },
      description: 'The sound of hammer on anvil echoes from within. A skilled blacksmith crafts weapons and tools.',
      shopItems: [
        { name: 'Iron Sword', sprite: 'sword_iron.png', price: 100, description: 'A sturdy iron sword', type: 'weapon', rarity: 'common' },
        { name: 'Steel Axe', sprite: 'axe_steel.png', price: 150, description: 'Sharp steel axe for combat or woodcutting', type: 'weapon', rarity: 'common' },
        { name: 'Chain Mail', sprite: 'armor_chain.png', price: 200, description: 'Flexible chain mail armor', type: 'armor', rarity: 'common' }
      ]
    },
    shop: {
      name: 'General Store',
      type: 'shop',
      size: { x: 4, y: 3 },
      entrance: { x: 2, y: 2 },
      description: 'A cozy general store with all the essentials a traveler might need.',
      shopItems: [
        { name: 'Health Potion', sprite: 'potion_red.png', price: 50, description: 'Restores health when consumed', type: 'potion', rarity: 'common' },
        { name: 'Bread Loaf', sprite: 'bread.png', price: 10, description: 'Fresh baked bread', type: 'food', rarity: 'common' },
        { name: 'Rope', sprite: 'rope.png', price: 25, description: 'Strong rope for climbing', type: 'tool', rarity: 'common' }
      ]
    },
    tavern: {
      name: 'The Prancing Pony',
      type: 'tavern',
      size: { x: 5, y: 4 },
      entrance: { x: 2, y: 3 },
      description: 'A lively tavern where adventurers gather to share tales and enjoy a good meal.',
      shopItems: [
        { name: 'Ale', sprite: 'ale.png', price: 15, description: 'Refreshing local ale', type: 'food', rarity: 'common' },
        { name: 'Hot Stew', sprite: 'stew.png', price: 30, description: 'Hearty stew that restores stamina', type: 'food', rarity: 'common' }
      ]
    },
    temple: {
      name: 'Temple of Light',
      type: 'temple',
      size: { x: 6, y: 5 },
      entrance: { x: 3, y: 4 },
      description: 'A sacred temple where the faithful come to pray and seek healing.',
      shopItems: [
        { name: 'Blessing Scroll', sprite: 'scroll_holy.png', price: 75, description: 'Provides temporary protection', type: 'misc', rarity: 'rare' },
        { name: 'Holy Water', sprite: 'potion_holy.png', price: 40, description: 'Blessed water with healing properties', type: 'potion', rarity: 'common' }
      ]
    },
    guild: {
      name: 'Adventurers Guild',
      type: 'guild',
      size: { x: 4, y: 4 },
      entrance: { x: 2, y: 3 },
      description: 'The local guild where adventurers register for quests and bounties.',
      shopItems: []
    },
    library: {
      name: 'Ancient Library',
      type: 'library',
      size: { x: 4, y: 5 },
      entrance: { x: 2, y: 4 },
      description: 'A repository of knowledge where scholars study ancient texts.',
      shopItems: [
        { name: 'Spell Scroll', sprite: 'scroll_magic.png', price: 120, description: 'Contains a magical spell', type: 'misc', rarity: 'rare' },
        { name: 'Ancient Map', sprite: 'map.png', price: 200, description: 'Shows hidden locations', type: 'misc', rarity: 'epic' }
      ]
    },
    house: {
      name: 'Village House',
      type: 'house',
      size: { x: 3, y: 3 },
      entrance: { x: 1, y: 2 },
      description: 'A modest village home where a family lives.',
      shopItems: []
    },
    inn: {
      name: 'Weary Traveler Inn',
      type: 'inn',
      size: { x: 4, y: 4 },
      entrance: { x: 2, y: 3 },
      description: 'A comfortable inn where travelers can rest and recover.',
      shopItems: [
        { name: 'Room Key', sprite: 'key.png', price: 50, description: 'Grants access to a room for the night', type: 'misc', rarity: 'common' }
      ]
    }
  };

  // NPC templates
  private readonly NPC_TEMPLATES: { [key: string]: Omit<VillageNPC, 'id' | 'position'> } = {
    blacksmith: {
      name: 'Gareth the Smith',
      sprite: 'npc_blacksmith.png',
      role: 'blacksmith',
      dialogue: [
        'Welcome to my forge! Need something crafted?',
        'These weapons are made with the finest steel.',
        'I learned my trade from the best smiths in the capital.'
      ],
      quests: [
        {
          id: 'gather_iron',
          title: 'Iron Ore Collection',
          description: 'Bring me 10 iron ore from the nearby mines',
          objectives: ['Find the iron mine', 'Collect 10 iron ore', 'Return to Gareth'],
          rewards: [{ name: 'Steel Hammer', sprite: 'hammer_steel.png', price: 0, description: 'A masterwork hammer', type: 'weapon', rarity: 'rare' }],
          completed: false
        }
      ]
    },
    merchant: {
      name: 'Elena the Trader',
      sprite: 'npc_merchant.png',
      role: 'merchant',
      dialogue: [
        'Welcome to my shop! Best prices in town!',
        'Fresh goods arrive every week from the capital.',
        'Is there anything specific you\\'re looking for?'
      ],
      quests: [
        {
          id: 'delivery_task',
          title: 'Package Delivery',
          description: 'Deliver this package to the inn keeper',
          objectives: ['Take package to inn', 'Speak with inn keeper', 'Return confirmation'],
          rewards: [{ name: 'Gold Coins', sprite: 'coins.png', price: 0, description: '50 gold pieces', type: 'misc', rarity: 'common' }],
          completed: false
        }
      ]
    },
    guard: {
      name: 'Captain Marcus',
      sprite: 'npc_guard.png',
      role: 'guard',
      dialogue: [
        'Stay alert, citizen. Dangerous times ahead.',
        'I\\'ve been guarding this village for 15 years.',
        'Report any suspicious activity to me immediately.'
      ],
      patrol: [
        { x: 10, y: 10 }, { x: 20, y: 10 }, { x: 20, y: 20 }, { x: 10, y: 20 }
      ],
      quests: [
        {
          id: 'bandit_problem',
          title: 'Bandit Troubles',
          description: 'Clear the bandits from the forest road',
          objectives: ['Find bandit camp', 'Defeat bandit leader', 'Secure the road'],
          rewards: [{ name: 'Guard Badge', sprite: 'badge.png', price: 0, description: 'Honorary guard status', type: 'misc', rarity: 'rare' }],
          completed: false
        }
      ]
    },
    priest: {
      name: 'Father Benedict',
      sprite: 'npc_priest.png',
      role: 'priest',
      dialogue: [
        'May the light bless your journey, child.',
        'The temple is always open to those in need.',
        'Pray for guidance and you shall receive it.'
      ],
      quests: [
        {
          id: 'holy_relic',
          title: 'The Lost Relic',
          description: 'Recover the sacred amulet from the ancient ruins',
          objectives: ['Locate ancient ruins', 'Find sacred amulet', 'Return to temple'],
          rewards: [{ name: 'Holy Amulet', sprite: 'amulet_holy.png', price: 0, description: 'Blessed protection amulet', type: 'misc', rarity: 'legendary' }],
          completed: false
        }
      ]
    },
    mayor: {
      name: 'Mayor Thompson',
      sprite: 'npc_mayor.png',
      role: 'mayor',
      dialogue: [
        'Welcome to our peaceful village!',
        'We could always use brave souls like yourself.',
        'The village prospers thanks to adventurers like you.'
      ],
      quests: [
        {
          id: 'village_festival',
          title: 'Harvest Festival',
          description: 'Help organize the annual harvest festival',
          objectives: ['Collect decorations', 'Set up festival area', 'Invite neighboring villages'],
          rewards: [{ name: 'Festival Crown', sprite: 'crown.png', price: 0, description: 'Honorary festival crown', type: 'misc', rarity: 'epic' }],
          completed: false
        }
      ]
    },
    librarian: {
      name: 'Scholar Meridia',
      sprite: 'npc_librarian.png',
      role: 'librarian',
      dialogue: [
        'Knowledge is the greatest treasure of all.',
        'These books contain wisdom from ages past.',
        'Seek and you shall find the answers you need.'
      ],
      quests: [
        {
          id: 'ancient_knowledge',
          title: 'Lost Tome',
          description: 'Find the missing volume of ancient history',
          objectives: ['Search old ruins', 'Decode ancient text', 'Return tome to library'],
          rewards: [{ name: 'Wisdom Scroll', sprite: 'scroll_wisdom.png', price: 0, description: 'Increases knowledge permanently', type: 'misc', rarity: 'legendary' }],
          completed: false
        }
      ]
    }
  };

  constructor(componentManager: ComponentManager, spriteEngine: UniversalSpriteEngine) {
    this.componentManager = componentManager;
    this.spriteEngine = spriteEngine;
  }

  // ============ VILLAGE GENERATION ============

  async generateTopDownVillage(): Promise<VillageLayout> {
    console.log('🏘️  Generating beautiful top-down village...');
    
    // Clear existing village
    this.clearVillage();
    
    // Generate village layout
    const layout: VillageLayout = {
      size: { x: 50, y: 40 },
      buildings: [],
      npcs: [],
      decorations: [],
      roads: [],
      specialLocations: []
    };

    // 1. Generate terrain base
    await this.generateTerrain(layout);
    
    // 2. Plan road network
    await this.generateRoads(layout);
    
    // 3. Place buildings strategically
    await this.generateBuildings(layout);
    
    // 4. Add NPCs to buildings and around village
    await this.generateNPCs(layout);
    
    // 5. Add environmental decorations
    await this.generateDecorations(layout);
    
    // 6. Add special locations
    await this.generateSpecialLocations(layout);
    
    // 7. Create entities from layout
    await this.createVillageEntities(layout);
    
    this.currentLayout = layout;
    
    console.log('✅ Village generated successfully!');
    console.log(`   📊 ${layout.buildings.length} buildings`);
    console.log(`   👥 ${layout.npcs.length} NPCs`);
    console.log(`   🌳 ${layout.decorations.length} decorations`);
    console.log(`   🛤️  ${layout.roads.length} roads`);
    console.log(`   ⭐ ${layout.specialLocations.length} special locations`);
    
    return layout;
  }

  private async generateTerrain(layout: VillageLayout): Promise<void> {
    // Create grass base for the entire village area
    for (let x = 0; x < layout.size.x; x++) {
      for (let y = 0; y < layout.size.y; y++) {
        const grass = this.componentManager.createEntity();
        
        this.componentManager.addComponent(grass, 'Transform', {
          position: { x: x * 16, y: y * 16 },
          rotation: 0,
          scale: { x: 1, y: 1 }
        } as Transform);
        
        this.componentManager.addComponent(grass, 'Sprite', {
          textureId: 'roguelike_grass',
          frame: 0,
          layer: 0,
          alpha: 1
        } as Sprite);
        
        this.villageEntities.push(grass);
      }
    }
  }

  private async generateRoads(layout: VillageLayout): Promise<void> {
    // Main road through village center (horizontal)
    layout.roads.push({
      start: { x: 0, y: Math.floor(layout.size.y / 2) },
      end: { x: layout.size.x, y: Math.floor(layout.size.y / 2) },
      type: 'stone',
      width: 2
    });
    
    // Cross road (vertical)
    layout.roads.push({
      start: { x: Math.floor(layout.size.x / 2), y: 0 },
      end: { x: Math.floor(layout.size.x / 2), y: layout.size.y },
      type: 'stone',
      width: 2
    });
    
    // Village square roads
    const centerX = Math.floor(layout.size.x / 2);
    const centerY = Math.floor(layout.size.y / 2);
    
    // Square around center
    for (let i = -3; i <= 3; i++) {
      layout.roads.push({
        start: { x: centerX + i, y: centerY - 3 },
        end: { x: centerX + i, y: centerY + 3 },
        type: 'brick',
        width: 1
      });
      layout.roads.push({
        start: { x: centerX - 3, y: centerY + i },
        end: { x: centerX + 3, y: centerY + i },
        type: 'brick',
        width: 1
      });
    }
  }

  private async generateBuildings(layout: VillageLayout): Promise<void> {
    const buildingTypes = Object.keys(this.BUILDING_TEMPLATES);
    
    // Essential buildings positions
    const essentialBuildings = [
      { type: 'blacksmith', position: { x: 15, y: 15 } },
      { type: 'shop', position: { x: 30, y: 20 } },
      { type: 'tavern', position: { x: 25, y: 30 } },
      { type: 'temple', position: { x: 35, y: 10 } },
      { type: 'guild', position: { x: 10, y: 25 } },
      { type: 'library', position: { x: 40, y: 15 } },
      { type: 'inn', position: { x: 20, y: 35 } }
    ];
    
    // Place essential buildings
    for (const building of essentialBuildings) {
      const template = this.BUILDING_TEMPLATES[building.type];
      if (template) {
        layout.buildings.push({
          id: `building_${layout.buildings.length}`,
          position: building.position,
          ...template
        });
      }
    }
    
    // Add some random houses
    for (let i = 0; i < 8; i++) {
      const position = this.findBuildingSpot(layout, { x: 3, y: 3 });
      if (position) {
        layout.buildings.push({
          id: `house_${i}`,
          position,
          ...this.BUILDING_TEMPLATES.house
        });
      }
    }
  }

  private findBuildingSpot(layout: VillageLayout, size: Vector2): Vector2 | null {
    for (let attempt = 0; attempt < 100; attempt++) {
      const x = Math.floor(Math.random() * (layout.size.x - size.x - 4)) + 2;
      const y = Math.floor(Math.random() * (layout.size.y - size.y - 4)) + 2;
      
      // Check if spot is clear
      let clear = true;
      for (const building of layout.buildings) {
        const distance = Math.abs(building.position.x - x) + Math.abs(building.position.y - y);
        if (distance < 6) {
          clear = false;
          break;
        }
      }
      
      if (clear) {
        return { x, y };
      }
    }
    return null;
  }

  private async generateNPCs(layout: VillageLayout): Promise<void> {
    const npcTypes = Object.keys(this.NPC_TEMPLATES);
    
    // Place NPCs near their associated buildings
    for (const building of layout.buildings) {
      let npcType = '';
      switch (building.type) {
        case 'blacksmith': npcType = 'blacksmith'; break;
        case 'shop': npcType = 'merchant'; break;
        case 'temple': npcType = 'priest'; break;
        case 'library': npcType = 'librarian'; break;
        default: npcType = 'villager';
      }
      
      if (this.NPC_TEMPLATES[npcType]) {
        layout.npcs.push({
          id: `npc_${layout.npcs.length}`,
          position: {
            x: building.position.x + Math.floor(building.size.x / 2),
            y: building.position.y + building.size.y + 1
          },
          ...this.NPC_TEMPLATES[npcType]
        });
      }
    }
    
    // Add village guard
    layout.npcs.push({
      id: 'village_guard',
      position: { x: 25, y: 20 },
      ...this.NPC_TEMPLATES.guard
    });
    
    // Add mayor near village center
    layout.npcs.push({
      id: 'village_mayor',
      position: { x: 26, y: 18 },
      ...this.NPC_TEMPLATES.mayor
    });
    
    // Add some random villagers
    for (let i = 0; i < 6; i++) {
      const position = {
        x: Math.floor(Math.random() * layout.size.x),
        y: Math.floor(Math.random() * layout.size.y)
      };
      
      layout.npcs.push({
        id: `villager_${i}`,
        name: `Villager ${i + 1}`,
        position,
        sprite: 'npc_villager.png',
        role: 'villager',
        dialogue: [
          'Good day to you!',
          'Beautiful weather today.',
          'The harvest looks promising this year.'
        ]
      });
    }
  }

  private async generateDecorations(layout: VillageLayout): Promise<void> {
    // Add trees around village perimeter
    for (let i = 0; i < 20; i++) {
      let position: Vector2;
      
      // Place on edges
      if (Math.random() < 0.5) {
        position = {
          x: Math.random() < 0.5 ? Math.floor(Math.random() * 5) : layout.size.x - Math.floor(Math.random() * 5),
          y: Math.floor(Math.random() * layout.size.y)
        };
      } else {
        position = {
          x: Math.floor(Math.random() * layout.size.x),
          y: Math.random() < 0.5 ? Math.floor(Math.random() * 5) : layout.size.y - Math.floor(Math.random() * 5)
        };
      }
      
      layout.decorations.push({
        id: `tree_${i}`,
        type: 'tree',
        position,
        sprite: 'tree.png',
        description: 'A tall oak tree providing shade.'
      });
    }
    
    // Add village well in center
    layout.decorations.push({
      id: 'village_well',
      type: 'well',
      position: { x: 25, y: 19 },
      sprite: 'well.png',
      interactive: true,
      description: 'The village well. Fresh, clear water flows from its depths.'
    });
    
    // Add fountain near temple
    layout.decorations.push({
      id: 'temple_fountain',
      type: 'fountain',
      position: { x: 37, y: 8 },
      sprite: 'fountain.png',
      interactive: true,
      description: 'A blessed fountain with healing properties.'
    });
    
    // Add some bushes and flowers
    for (let i = 0; i < 15; i++) {
      const position = {
        x: Math.floor(Math.random() * layout.size.x),
        y: Math.floor(Math.random() * layout.size.y)
      };
      
      layout.decorations.push({
        id: `bush_${i}`,
        type: 'bush',
        position,
        sprite: 'bush.png',
        description: 'A small decorative bush.'
      });
    }
    
    // Add village signs
    layout.decorations.push({
      id: 'village_sign',
      type: 'sign',
      position: { x: 2, y: 20 },
      sprite: 'sign.png',
      interactive: true,
      description: 'Welcome to Greenwood Village - Population: 234'
    });
  }

  private async generateSpecialLocations(layout: VillageLayout): Promise<void> {
    // Portal to other areas
    layout.specialLocations.push({
      id: 'portal_dungeon',
      name: 'Dungeon Portal',
      type: 'portal',
      position: { x: 5, y: 35 },
      sprite: 'portal.png',
      description: 'A mystical portal leading to ancient dungeons.',
      action: 'teleport_dungeon'
    });
    
    // Ancient tree with magical properties
    layout.specialLocations.push({
      id: 'ancient_tree',
      name: 'Ancient World Tree',
      type: 'ancient_tree',
      position: { x: 45, y: 35 },
      sprite: 'tree_ancient.png',
      description: 'An ancient tree pulsing with magical energy.',
      action: 'restore_mana'
    });
    
    // Village monument
    layout.specialLocations.push({
      id: 'monument',
      name: 'Heroes Monument',
      type: 'monument',
      position: { x: 24, y: 22 },
      sprite: 'monument.png',
      description: 'A monument dedicated to fallen heroes who protected the village.',
      action: 'show_history'
    });
    
    // Small cemetery
    layout.specialLocations.push({
      id: 'cemetery',
      name: 'Peaceful Cemetery',
      type: 'cemetery',
      position: { x: 42, y: 5 },
      sprite: 'cemetery.png',
      description: 'A quiet resting place for the village ancestors.',
      action: 'pay_respects'
    });
  }

  private async createVillageEntities(layout: VillageLayout): Promise<void> {
    // Create road entities
    for (const road of layout.roads) {
      this.createRoadSegment(road);
    }
    
    // Create building entities
    for (const building of layout.buildings) {
      this.createBuildingEntity(building);
    }
    
    // Create NPC entities
    for (const npc of layout.npcs) {
      this.createNPCEntity(npc);
    }
    
    // Create decoration entities
    for (const decoration of layout.decorations) {
      this.createDecorationEntity(decoration);
    }
    
    // Create special location entities
    for (const location of layout.specialLocations) {
      this.createSpecialLocationEntity(location);
    }
  }

  private createRoadSegment(road: VillageRoad): void {
    const dx = road.end.x - road.start.x;
    const dy = road.end.y - road.start.y;
    const length = Math.max(Math.abs(dx), Math.abs(dy));
    
    const stepX = dx === 0 ? 0 : dx / Math.abs(dx);
    const stepY = dy === 0 ? 0 : dy / Math.abs(dy);
    
    for (let i = 0; i < length; i++) {
      const x = road.start.x + i * stepX;
      const y = road.start.y + i * stepY;
      
      const roadEntity = this.componentManager.createEntity();
      
      this.componentManager.addComponent(roadEntity, 'Transform', {
        position: { x: x * 16, y: y * 16 },
        rotation: 0,
        scale: { x: 1, y: 1 }
      } as Transform);
      
      this.componentManager.addComponent(roadEntity, 'Sprite', {
        textureId: `roguelike_road_${road.type}`,
        frame: 0,
        layer: 1,
        alpha: 1
      } as Sprite);
      
      this.villageEntities.push(roadEntity);
    }
  }

  private createBuildingEntity(building: VillageBuilding): EntityId {
    const buildingEntity = this.componentManager.createEntity();
    
    this.componentManager.addComponent(buildingEntity, 'Transform', {
      position: { x: building.position.x * 16, y: building.position.y * 16 },
      rotation: 0,
      scale: { x: 1, y: 1 }
    } as Transform);
    
    // Choose sprite based on building type
    let spriteId = '';
    switch (building.type) {
      case 'blacksmith': spriteId = 'roguelike_building_blacksmith'; break;
      case 'shop': spriteId = 'roguelike_building_shop'; break;
      case 'tavern': spriteId = 'roguelike_building_tavern'; break;
      case 'temple': spriteId = 'roguelike_building_temple'; break;
      case 'guild': spriteId = 'roguelike_building_guild'; break;
      case 'library': spriteId = 'roguelike_building_library'; break;
      case 'house': spriteId = 'roguelike_building_house'; break;
      case 'inn': spriteId = 'roguelike_building_inn'; break;
      default: spriteId = 'roguelike_building_generic';
    }
    
    this.componentManager.addComponent(buildingEntity, 'Sprite', {
      textureId: spriteId,
      frame: 0,
      layer: 3,
      alpha: 1
    } as Sprite);
    
    // Add interaction component
    this.componentManager.addComponent(buildingEntity, 'Interactable', {
      type: 'building',
      data: building,
      onInteract: () => this.onBuildingInteract(building)
    });
    
    this.villageEntities.push(buildingEntity);
    return buildingEntity;
  }

  private createNPCEntity(npc: VillageNPC): EntityId {
    const npcEntity = this.componentManager.createEntity();
    
    this.componentManager.addComponent(npcEntity, 'Transform', {
      position: { x: npc.position.x * 16, y: npc.position.y * 16 },
      rotation: 0,
      scale: { x: 1, y: 1 }
    } as Transform);
    
    this.componentManager.addComponent(npcEntity, 'Sprite', {
      textureId: `roguelike_${npc.sprite}`,
      frame: 0,
      layer: 5,
      alpha: 1
    } as Sprite);
    
    // Add interaction component
    this.componentManager.addComponent(npcEntity, 'Interactable', {
      type: 'npc',
      data: npc,
      onInteract: () => this.onNPCInteract(npc)
    });
    
    this.villageEntities.push(npcEntity);
    return npcEntity;
  }

  private createDecorationEntity(decoration: VillageDecoration): EntityId {
    const decorEntity = this.componentManager.createEntity();
    
    this.componentManager.addComponent(decorEntity, 'Transform', {
      position: { x: decoration.position.x * 16, y: decoration.position.y * 16 },
      rotation: 0,
      scale: { x: 1, y: 1 }
    } as Transform);
    
    this.componentManager.addComponent(decorEntity, 'Sprite', {
      textureId: `roguelike_${decoration.sprite}`,
      frame: 0,
      layer: 2,
      alpha: 1
    } as Sprite);
    
    if (decoration.interactive) {
      this.componentManager.addComponent(decorEntity, 'Interactable', {
        type: 'decoration',
        data: decoration,
        onInteract: () => this.onDecorationInteract(decoration)
      });
    }
    
    this.villageEntities.push(decorEntity);
    return decorEntity;
  }

  private createSpecialLocationEntity(location: SpecialLocation): EntityId {
    const locationEntity = this.componentManager.createEntity();
    
    this.componentManager.addComponent(locationEntity, 'Transform', {
      position: { x: location.position.x * 16, y: location.position.y * 16 },
      rotation: 0,
      scale: { x: 1, y: 1 }
    } as Transform);
    
    this.componentManager.addComponent(locationEntity, 'Sprite', {
      textureId: `roguelike_${location.sprite}`,
      frame: 0,
      layer: 4,
      alpha: 1
    } as Sprite);
    
    this.componentManager.addComponent(locationEntity, 'Interactable', {
      type: 'special',
      data: location,
      onInteract: () => this.onSpecialLocationInteract(location)
    });
    
    this.villageEntities.push(locationEntity);
    return locationEntity;
  }

  // ============ INTERACTION HANDLERS ============

  private onBuildingInteract(building: VillageBuilding): void {
    console.log(`🏠 Entering ${building.name}`);
    console.log(`📝 ${building.description}`);
    
    if (building.shopItems && building.shopItems.length > 0) {
      console.log('🛒 Shop items available:');
      building.shopItems.forEach(item => {
        console.log(`  - ${item.name}: ${item.price} gold - ${item.description}`);
      });
    }
  }

  private onNPCInteract(npc: VillageNPC): void {
    console.log(`💬 ${npc.name} says:`);
    const dialogue = npc.dialogue[Math.floor(Math.random() * npc.dialogue.length)];
    console.log(`"${dialogue}"`);
    
    if (npc.quests && npc.quests.length > 0) {
      console.log('📋 Available quests:');
      npc.quests.forEach(quest => {
        if (!quest.completed) {
          console.log(`  - ${quest.title}: ${quest.description}`);
        }
      });
    }
  }

  private onDecorationInteract(decoration: VillageDecoration): void {
    console.log(`🔍 ${decoration.description}`);
    
    // Special actions for certain decorations
    switch (decoration.type) {
      case 'well':
        console.log('💧 You draw fresh water from the well. Health restored!');
        break;
      case 'fountain':
        console.log('✨ The blessed fountain restores your mana!');
        break;
      case 'sign':
        console.log('📖 Reading the village sign...');
        break;
    }
  }

  private onSpecialLocationInteract(location: SpecialLocation): void {
    console.log(`⭐ ${location.name}: ${location.description}`);
    
    switch (location.action) {
      case 'teleport_dungeon':
        console.log('🌀 The portal swirls with magical energy... Enter to travel to the dungeon!');
        break;
      case 'restore_mana':
        console.log('🌟 The ancient tree fills you with magical energy!');
        break;
      case 'show_history':
        console.log('📜 The monument tells tales of brave heroes who once saved this village...');
        break;
      case 'pay_respects':
        console.log('🕯️  You pay your respects to the peaceful souls resting here...');
        break;
    }
  }

  // ============ UTILITY METHODS ============

  private clearVillage(): void {
    for (const entityId of this.villageEntities) {
      this.componentManager.removeEntity(entityId);
    }
    this.villageEntities = [];
  }

  getCurrentLayout(): VillageLayout | null {
    return this.currentLayout;
  }

  getVillageEntities(): EntityId[] {
    return [...this.villageEntities];
  }

  findNPCByRole(role: string): VillageNPC | null {
    if (!this.currentLayout) return null;
    
    return this.currentLayout.npcs.find(npc => npc.role === role) || null;
  }

  findBuildingByType(type: string): VillageBuilding | null {
    if (!this.currentLayout) return null;
    
    return this.currentLayout.buildings.find(building => building.type === type) || null;
  }
}

export default TopDownVillageGenerator;