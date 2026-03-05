/**
 * Top-down village data and helper utilities.
 *
 * The previous version of this module attempted to drive the entire ECS directly
 * from here which no longer matched the simplified engine available in the
 * repository. That mismatch caused TypeScript compilation errors (missing
 * systems, invalid ComponentManager usage and broken imports).  This file now
 * focuses on delivering structured village content that other systems (such as
 * the UI) can consume without any engine side-effects.
 */

import type { Vector2 } from '../core/types.ts';

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
  role:
    | 'merchant'
    | 'guard'
    | 'villager'
    | 'blacksmith'
    | 'healer'
    | 'mayor'
    | 'priest'
    | 'librarian';
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
  action?: string;
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

const DEFAULT_BUILDINGS: VillageBuilding[] = [
  {
    id: 'blacksmith_1',
    name: 'Village Blacksmith',
    type: 'blacksmith',
    position: { x: 18, y: 22 },
    size: { x: 3, y: 3 },
    entrance: { x: 1, y: 2 },
    description:
      'The sound of hammer on anvil echoes from within. A skilled blacksmith crafts weapons and tools.',
    shopItems: [
      {
        name: 'Iron Sword',
        sprite: 'sword_iron.png',
        price: 100,
        description: 'A sturdy iron sword',
        type: 'weapon',
        rarity: 'common',
      },
      {
        name: 'Steel Axe',
        sprite: 'axe_steel.png',
        price: 150,
        description: 'Sharp steel axe for combat or woodcutting',
        type: 'weapon',
        rarity: 'common',
      },
      {
        name: 'Chain Mail',
        sprite: 'armor_chain.png',
        price: 200,
        description: 'Flexible chain mail armor',
        type: 'armor',
        rarity: 'common',
      },
    ],
  },
  {
    id: 'general_store',
    name: 'General Store',
    type: 'shop',
    position: { x: 30, y: 20 },
    size: { x: 3, y: 3 },
    entrance: { x: 1, y: 2 },
    description: 'A cozy general store with all the essentials a traveler might need.',
    shopItems: [
      {
        name: 'Health Potion',
        sprite: 'potion_red.png',
        price: 50,
        description: 'Restores health when consumed',
        type: 'potion',
        rarity: 'common',
      },
      {
        name: 'Bread Loaf',
        sprite: 'bread.png',
        price: 10,
        description: 'Fresh baked bread',
        type: 'food',
        rarity: 'common',
      },
      {
        name: 'Rope',
        sprite: 'rope.png',
        price: 25,
        description: 'Strong rope for climbing',
        type: 'tool',
        rarity: 'common',
      },
    ],
  },
  {
    id: 'tavern_1',
    name: 'The Prancing Pony',
    type: 'tavern',
    position: { x: 25, y: 30 },
    size: { x: 4, y: 3 },
    entrance: { x: 2, y: 2 },
    description: 'A lively tavern where adventurers gather to share tales and enjoy a good meal.',
    shopItems: [
      {
        name: 'Ale',
        sprite: 'ale.png',
        price: 15,
        description: 'Refreshing local ale',
        type: 'food',
        rarity: 'common',
      },
      {
        name: 'Hot Stew',
        sprite: 'stew.png',
        price: 30,
        description: 'Hearty stew that restores stamina',
        type: 'food',
        rarity: 'common',
      },
    ],
  },
  {
    id: 'temple_light',
    name: 'Temple of Light',
    type: 'temple',
    position: { x: 35, y: 12 },
    size: { x: 6, y: 5 },
    entrance: { x: 3, y: 4 },
    description: 'A sacred temple where the faithful come to pray and seek healing.',
    shopItems: [
      {
        name: 'Blessing Scroll',
        sprite: 'scroll_holy.png',
        price: 75,
        description: 'Provides temporary protection',
        type: 'misc',
        rarity: 'rare',
      },
      {
        name: 'Holy Water',
        sprite: 'potion_holy.png',
        price: 40,
        description: 'Blessed water with healing properties',
        type: 'potion',
        rarity: 'common',
      },
    ],
  },
  {
    id: 'guildhall',
    name: 'Adventurers Guild',
    type: 'guild',
    position: { x: 12, y: 26 },
    size: { x: 4, y: 4 },
    entrance: { x: 2, y: 3 },
    description: 'The local guild where adventurers register for quests and bounties.',
  },
  {
    id: 'library_ancient',
    name: 'Ancient Library',
    type: 'library',
    position: { x: 40, y: 18 },
    size: { x: 4, y: 5 },
    entrance: { x: 2, y: 4 },
    description: 'A repository of knowledge where scholars study ancient texts.',
    shopItems: [
      {
        name: 'Spell Scroll',
        sprite: 'scroll_magic.png',
        price: 120,
        description: 'Contains a magical spell',
        type: 'misc',
        rarity: 'rare',
      },
      {
        name: 'Ancient Map',
        sprite: 'map.png',
        price: 200,
        description: 'Shows hidden locations',
        type: 'misc',
        rarity: 'epic',
      },
    ],
  },
  {
    id: 'inn_traveler',
    name: 'Weary Traveler Inn',
    type: 'inn',
    position: { x: 22, y: 36 },
    size: { x: 4, y: 4 },
    entrance: { x: 2, y: 3 },
    description: 'A comfortable inn where travelers can rest and recover.',
    shopItems: [
      {
        name: 'Room Key',
        sprite: 'key.png',
        price: 50,
        description: 'Grants access to a room for the night',
        type: 'misc',
        rarity: 'common',
      },
    ],
  },
  {
    id: 'house_family',
    name: 'Village House',
    type: 'house',
    position: { x: 28, y: 12 },
    size: { x: 3, y: 3 },
    entrance: { x: 1, y: 2 },
    description: 'A modest village home where a family lives.',
  },
];

const DEFAULT_NPCS: VillageNPC[] = [
  {
    id: 'npc_blacksmith',
    name: 'Gareth the Smith',
    position: { x: 19, y: 23 },
    sprite: 'npc_blacksmith.png',
    role: 'blacksmith',
    dialogue: [
      'Welcome to my forge! Need something crafted?',
      'These weapons are made with the finest steel.',
      'I learned my trade from the best smiths in the capital.',
    ],
    quests: [
      {
        id: 'gather_iron',
        title: 'Iron Ore Collection',
        description: 'Bring me 10 iron ore from the nearby mines.',
        objectives: ['Find the iron mine', 'Collect 10 iron ore', 'Return to Gareth'],
        rewards: [
          {
            name: 'Steel Hammer',
            sprite: 'hammer_steel.png',
            price: 0,
            description: 'A masterwork hammer',
            type: 'weapon',
            rarity: 'rare',
          },
        ],
        completed: false,
      },
    ],
  },
  {
    id: 'npc_merchant',
    name: 'Elena the Trader',
    position: { x: 30, y: 22 },
    sprite: 'npc_merchant.png',
    role: 'merchant',
    dialogue: [
      'Welcome to my shop! Best prices in town!',
      'Fresh goods arrive every week from the capital.',
      "Is there anything specific you're looking for?",
    ],
    quests: [
      {
        id: 'delivery_task',
        title: 'Package Delivery',
        description: 'Deliver this package to the inn keeper.',
        objectives: ['Take package to inn', 'Speak with inn keeper', 'Return confirmation'],
        rewards: [
          {
            name: 'Gold Coins',
            sprite: 'coins.png',
            price: 0,
            description: '50 gold pieces',
            type: 'misc',
            rarity: 'common',
          },
        ],
        completed: false,
      },
    ],
  },
  {
    id: 'npc_guard',
    name: 'Captain Marcus',
    position: { x: 24, y: 24 },
    sprite: 'npc_guard.png',
    role: 'guard',
    dialogue: [
      'Stay alert, citizen. Dangerous times ahead.',
      "I've been guarding this village for 15 years.",
      'Report any suspicious activity to me immediately.',
    ],
    patrol: [
      { x: 20, y: 20 },
      { x: 28, y: 20 },
      { x: 28, y: 28 },
      { x: 20, y: 28 },
    ],
    quests: [
      {
        id: 'bandit_problem',
        title: 'Bandit Troubles',
        description: 'Clear the bandits from the forest road.',
        objectives: ['Find bandit camp', 'Defeat bandit leader', 'Secure the road'],
        rewards: [
          {
            name: 'Guard Badge',
            sprite: 'badge.png',
            price: 0,
            description: 'Honorary guard status',
            type: 'misc',
            rarity: 'rare',
          },
        ],
        completed: false,
      },
    ],
  },
  {
    id: 'npc_priest',
    name: 'Father Benedict',
    position: { x: 36, y: 14 },
    sprite: 'npc_priest.png',
    role: 'priest',
    dialogue: [
      'May the light bless your journey, child.',
      'The temple is always open to those in need.',
      'Pray for guidance and you shall receive it.',
    ],
    quests: [
      {
        id: 'holy_relic',
        title: 'The Lost Relic',
        description: 'Recover the sacred amulet from the ancient ruins.',
        objectives: ['Locate ancient ruins', 'Find sacred amulet', 'Return to temple'],
        rewards: [
          {
            name: 'Holy Amulet',
            sprite: 'amulet_holy.png',
            price: 0,
            description: 'Blessed protection amulet',
            type: 'misc',
            rarity: 'legendary',
          },
        ],
        completed: false,
      },
    ],
  },
  {
    id: 'npc_mayor',
    name: 'Mayor Thompson',
    position: { x: 26, y: 18 },
    sprite: 'npc_mayor.png',
    role: 'mayor',
    dialogue: [
      'Welcome to our peaceful village!',
      'We could always use brave souls like yourself.',
      'The village prospers thanks to adventurers like you.',
    ],
    quests: [
      {
        id: 'village_festival',
        title: 'Harvest Festival',
        description: 'Help organize the annual harvest festival.',
        objectives: ['Collect decorations', 'Set up festival area', 'Invite neighboring villages'],
        rewards: [
          {
            name: 'Festival Crown',
            sprite: 'crown.png',
            price: 0,
            description: 'Honorary festival crown',
            type: 'misc',
            rarity: 'epic',
          },
        ],
        completed: false,
      },
    ],
  },
  {
    id: 'npc_librarian',
    name: 'Scholar Meridia',
    position: { x: 41, y: 20 },
    sprite: 'npc_librarian.png',
    role: 'librarian',
    dialogue: [
      'Knowledge is the greatest treasure of all.',
      'These books contain wisdom from ages past.',
      'Seek and you shall find the answers you need.',
    ],
    quests: [
      {
        id: 'ancient_knowledge',
        title: 'Lost Tome',
        description: 'Find the missing volume of ancient history.',
        objectives: ['Search old ruins', 'Decode ancient text', 'Return tome to library'],
        rewards: [
          {
            name: 'Wisdom Scroll',
            sprite: 'scroll_wisdom.png',
            price: 0,
            description: 'Increases knowledge permanently',
            type: 'misc',
            rarity: 'legendary',
          },
        ],
        completed: false,
      },
    ],
    schedule: {
      morning: { x: 41, y: 19 },
      afternoon: { x: 41, y: 20 },
      evening: { x: 40, y: 19 },
      night: { x: 40, y: 18 },
    },
  },
];

const DEFAULT_DECORATIONS: VillageDecoration[] = [
  {
    id: 'oak_tree_1',
    type: 'tree',
    position: { x: 14, y: 18 },
    sprite: 'tree.png',
    description: 'A tall oak tree providing shade.',
  },
  {
    id: 'village_well',
    type: 'well',
    position: { x: 24, y: 22 },
    sprite: 'well.png',
    interactive: true,
    description: 'The village well. Fresh, clear water flows from its depths.',
  },
  {
    id: 'village_sign',
    type: 'sign',
    position: { x: 20, y: 16 },
    sprite: 'sign.png',
    description: 'Welcome to Greenwood Village - Population: 234',
  },
  {
    id: 'fountain_square',
    type: 'fountain',
    position: { x: 26, y: 24 },
    sprite: 'fountain.png',
    description: 'A blessed fountain with healing properties.',
  },
];

const DEFAULT_ROADS: VillageRoad[] = [
  {
    start: { x: 10, y: 20 },
    end: { x: 42, y: 20 },
    type: 'stone',
    width: 2,
  },
  {
    start: { x: 26, y: 12 },
    end: { x: 26, y: 38 },
    type: 'stone',
    width: 2,
  },
  {
    start: { x: 18, y: 30 },
    end: { x: 34, y: 30 },
    type: 'brick',
    width: 1,
  },
];

const DEFAULT_SPECIAL_LOCATIONS: SpecialLocation[] = [
  {
    id: 'portal_dungeon',
    name: 'Dungeon Portal',
    type: 'portal',
    position: { x: 50, y: 50 },
    sprite: 'portal.png',
    description: 'A mystical portal leading to ancient dungeons.',
    action: 'teleport_dungeon',
  },
  {
    id: 'ancient_tree',
    name: 'Ancient World Tree',
    type: 'ancient_tree',
    position: { x: 8, y: 44 },
    sprite: 'tree_ancient.png',
    description: 'An ancient tree pulsing with magical energy.',
    action: 'restore_mana',
  },
  {
    id: 'heroes_monument',
    name: 'Heroes Monument',
    type: 'monument',
    position: { x: 32, y: 16 },
    sprite: 'monument.png',
    description: 'A monument dedicated to the fallen heroes who protected the village.',
    action: 'show_history',
  },
  {
    id: 'village_cemetery',
    name: 'Peaceful Cemetery',
    type: 'cemetery',
    position: { x: 12, y: 48 },
    sprite: 'cemetery.png',
    description: 'A quiet resting place for the village ancestors.',
    action: 'pay_respects',
  },
];

const cloneVector = (vector: Vector2): Vector2 => ({ x: vector.x, y: vector.y });

const cloneShopItem = (item: ShopItem): ShopItem => ({ ...item });

const cloneQuest = (quest: Quest): Quest => ({
  ...quest,
  objectives: [...quest.objectives],
  rewards: quest.rewards.map(cloneShopItem),
});

const cloneBuilding = (building: VillageBuilding): VillageBuilding => {
  const clone: VillageBuilding = {
    id: building.id,
    name: building.name,
    type: building.type,
    position: cloneVector(building.position),
    size: cloneVector(building.size),
    entrance: cloneVector(building.entrance),
    description: building.description,
  };

  if (building.interior !== undefined) {
    clone.interior = building.interior;
  }

  if (building.shopItems !== undefined) {
    clone.shopItems = building.shopItems.map(cloneShopItem);
  }

  return clone;
};

const cloneSchedule = (schedule: NPCSchedule): NPCSchedule => ({
  morning: cloneVector(schedule.morning),
  afternoon: cloneVector(schedule.afternoon),
  evening: cloneVector(schedule.evening),
  night: cloneVector(schedule.night),
});

const cloneNPC = (npc: VillageNPC): VillageNPC => {
  const clone: VillageNPC = {
    id: npc.id,
    name: npc.name,
    position: cloneVector(npc.position),
    sprite: npc.sprite,
    role: npc.role,
    dialogue: [...npc.dialogue],
  };

  if (npc.quests !== undefined) {
    clone.quests = npc.quests.map(cloneQuest);
  }

  if (npc.patrol !== undefined) {
    clone.patrol = npc.patrol.map(cloneVector);
  }

  if (npc.schedule !== undefined) {
    clone.schedule = cloneSchedule(npc.schedule);
  }

  return clone;
};

const cloneDecoration = (decoration: VillageDecoration): VillageDecoration => {
  const clone: VillageDecoration = {
    id: decoration.id,
    type: decoration.type,
    position: cloneVector(decoration.position),
    sprite: decoration.sprite,
  };

  if (decoration.interactive !== undefined) {
    clone.interactive = decoration.interactive;
  }

  if (decoration.description !== undefined) {
    clone.description = decoration.description;
  }

  return clone;
};

const cloneRoad = (road: VillageRoad): VillageRoad => ({
  start: cloneVector(road.start),
  end: cloneVector(road.end),
  type: road.type,
  width: road.width,
});

const cloneSpecialLocation = (location: SpecialLocation): SpecialLocation => {
  const clone: SpecialLocation = {
    id: location.id,
    name: location.name,
    type: location.type,
    position: cloneVector(location.position),
    sprite: location.sprite,
    description: location.description,
  };

  if (location.action !== undefined) {
    clone.action = location.action;
  }

  return clone;
};

const cloneVillageLayout = (layout: VillageLayout): VillageLayout => ({
  size: cloneVector(layout.size),
  buildings: layout.buildings.map(cloneBuilding),
  npcs: layout.npcs.map(cloneNPC),
  decorations: layout.decorations.map(cloneDecoration),
  roads: layout.roads.map(cloneRoad),
  specialLocations: layout.specialLocations.map(cloneSpecialLocation),
});

export class TopDownVillageGenerator {
  private currentLayout: VillageLayout | null = null;

  constructor(private readonly villageSize: Vector2 = { x: 64, y: 64 }) {}

  generateLayout(): VillageLayout {
    const layout: VillageLayout = {
      size: { x: this.villageSize.x, y: this.villageSize.y },
      buildings: DEFAULT_BUILDINGS.map(cloneBuilding),
      npcs: DEFAULT_NPCS.map(cloneNPC),
      decorations: DEFAULT_DECORATIONS.map(cloneDecoration),
      roads: DEFAULT_ROADS.map(cloneRoad),
      specialLocations: DEFAULT_SPECIAL_LOCATIONS.map(cloneSpecialLocation),
    };

    this.currentLayout = layout;
    return cloneVillageLayout(layout);
  }

  getCurrentLayout(): VillageLayout | null {
    if (!this.currentLayout) {
      return null;
    }

    return cloneVillageLayout(this.currentLayout);
  }

  findNPCByRole(role: VillageNPC['role']): VillageNPC | null {
    if (!this.currentLayout) {
      return null;
    }

    const npc = this.currentLayout.npcs.find((candidate) => candidate.role === role);
    return npc ? cloneNPC(npc) : null;
  }

  findBuildingByType(type: VillageBuilding['type']): VillageBuilding | null {
    if (!this.currentLayout) {
      return null;
    }

    const building = this.currentLayout.buildings.find((candidate) => candidate.type === type);
    return building ? cloneBuilding(building) : null;
  }

  listNPCs(): VillageNPC[] {
    if (!this.currentLayout) {
      return [];
    }

    return this.currentLayout.npcs.map(cloneNPC);
  }

  listBuildings(): VillageBuilding[] {
    if (!this.currentLayout) {
      return [];
    }

    return this.currentLayout.buildings.map(cloneBuilding);
  }
}

export default TopDownVillageGenerator;
