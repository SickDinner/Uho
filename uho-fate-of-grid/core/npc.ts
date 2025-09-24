import { World, Entity } from './ecs.ts';
import { Transform, AI, Sprite, Wallet, LawEnforcement, Inventory, Personality } from './components.ts';
import { MapManager } from './map.ts';
import type { Vector2 } from './types.ts';
import { DRUGS, getDrug } from '@data/drugs.ts';
import { CRIMINAL_BACKGROUNDS, generatePersonality, generateMood, type PersonalityTraits } from './personality.ts';
import { SocialProfile } from './reputation.ts';
import { MarketParticipant } from './economy.ts';

export interface NPCDef {
  type: 'police' | 'civilian' | 'dealer' | 'patrol';
  name: string;
  sprite: number;
  behavior: string;
  inventory?: { itemId: string; quantity: number; price?: number }[];
  patrol?: Vector2[];
  suspicionThreshold?: number;
}

export const NPC_DEFS: Record<string, NPCDef> = {
  street_cop: {
    type: 'police',
    name: 'Kadun poliisi',
    sprite: 10,
    behavior: 'patrol',
    patrol: [],
    suspicionThreshold: 30
  },
  detective: {
    type: 'police', 
    name: 'Etsivä',
    sprite: 11,
    behavior: 'investigate',
    suspicionThreshold: 20
  },
  civilian_walker: {
    type: 'civilian',
    name: 'Kävelijä',
    sprite: 12,
    behavior: 'wander'
  },
  shop_keeper: {
    type: 'civilian',
    name: 'Kauppias',
    sprite: 13,
    behavior: 'stationary'
  },
  street_dealer: {
    type: 'dealer',
    name: 'Katukauppias',
    sprite: 14,
    behavior: 'deal',
    inventory: [
      { itemId: 'kannabis', quantity: 5, price: 20 },
      { itemId: 'alkoholi', quantity: 3, price: 15 },
      { itemId: 'nikotiini', quantity: 10, price: 5 }
    ]
  },
  major_dealer: {
    type: 'dealer',
    name: 'Suurkauppias',
    sprite: 15,
    behavior: 'deal',
    inventory: [
      { itemId: 'amfetamiini', quantity: 3, price: 50 },
      { itemId: 'opioidi', quantity: 2, price: 80 },
      { itemId: 'kannabis', quantity: 10, price: 18 }
    ]
  },
  patrol_car: {
    type: 'patrol',
    name: 'Partio',
    sprite: 16,
    behavior: 'vehicle_patrol',
    patrol: [],
    suspicionThreshold: 40
  }
};

export class NPCManager {
  private world: World;
  private mapManager: MapManager;
  private npcs: Map<number, NPCDef> = new Map();
  private lastAIUpdate = 0;
  private aiUpdateInterval = 2000; // Update AI every 2 seconds
  
  constructor(world: World, mapManager: MapManager) {
    this.world = world;
    this.mapManager = mapManager;
  }
  
  spawnNPC(defId: string, x: number, y: number): Entity | null {
    const def = NPC_DEFS[defId];
    if (!def) return null;
    
    const entity = this.world.createEntity();
    
    // Add base components
    this.world.componentManager.addComponent(new Transform(entity.id, x, y));
    this.world.componentManager.addComponent(new Sprite(entity.id, def.sprite.toString()));
    this.world.componentManager.addComponent(new AI(entity.id, def.type, 'idle'));
    
    // Generate personality and social profile
    const backgroundId = this.getBackgroundForNPCType(def.type);
    const personality = generatePersonality(backgroundId);
    const initialMood = generateMood(personality);
    
    this.world.componentManager.addComponent(new Personality(entity.id, personality, backgroundId, initialMood));
    this.world.componentManager.addComponent(new SocialProfile(entity.id));
    
    // Add type-specific components
    if (def.type === 'dealer') {
      const background = CRIMINAL_BACKGROUNDS[backgroundId];
      const cashAmount = background ? 
        Math.random() * (background.startingCash.max - background.startingCash.min) + background.startingCash.min :
        100;
      
      this.world.componentManager.addComponent(new Wallet(entity.id, cashAmount, 0, 0));
      this.world.componentManager.addComponent(new MarketParticipant(entity.id));
      
      const inventory = new Inventory(entity.id);
      if (def.inventory) {
        for (const item of def.inventory) {
          inventory.addItem(item.itemId, item.quantity);
        }
      }
      this.world.componentManager.addComponent(inventory);
    }
    
    if (def.type === 'police' || def.type === 'patrol') {
      this.world.componentManager.addComponent(new Wallet(entity.id, 0, 0, 0));
      this.world.componentManager.addComponent(new LawEnforcement(entity.id));
    }
    
    if (def.type === 'civilian') {
      this.world.componentManager.addComponent(new Wallet(entity.id, Math.random() * 50 + 10, 0, 0));
    }
    
    // Initialize social reputation based on background
    const socialProfile = this.world.componentManager.getComponent(entity.id, SocialProfile);
    if (socialProfile && backgroundId && CRIMINAL_BACKGROUNDS[backgroundId]) {
      const background = CRIMINAL_BACKGROUNDS[backgroundId];
      for (const [faction, rep] of Object.entries(background.startingReputation)) {
        socialProfile.modifyFactionReputation(faction, rep, 'background');
      }
    }
    
    // Store NPC definition
    this.npcs.set(entity.id, def);
    
    return entity;
  }
  
  spawnRandomNPCs(): void {
    const map = this.mapManager.getCurrentMap();
    
    // Spawn some street cops
    for (let i = 0; i < 3; i++) {
      const x = Math.floor(Math.random() * map.width);
      const y = Math.floor(Math.random() * map.height);
      if (this.mapManager.isWalkable(x, y)) {
        this.spawnNPC('street_cop', x, y);
      }
    }
    
    // Spawn civilians
    for (let i = 0; i < 8; i++) {
      const x = Math.floor(Math.random() * map.width);
      const y = Math.floor(Math.random() * map.height);
      if (this.mapManager.isWalkable(x, y)) {
        this.spawnNPC('civilian_walker', x, y);
      }
    }
    
    // Spawn dealers at dealer spots
    const dealerSpots = [];
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        if (this.mapManager.getTileTypeId(x, y) === 'dealer_spot') {
          dealerSpots.push({ x, y });
        }
      }
    }
    
    for (const spot of dealerSpots) {
      if (Math.random() < 0.6) { // 60% chance to spawn dealer
        const dealerType = Math.random() < 0.3 ? 'major_dealer' : 'street_dealer';
        this.spawnNPC(dealerType, spot.x, spot.y);
      }
    }
  }
  
  update(deltaTime: number, playerId?: number): void {
    if (Date.now() - this.lastAIUpdate < this.aiUpdateInterval) {
      return;
    }
    
    this.lastAIUpdate = Date.now();
    
    // Get all NPCs
    const npcEntities = this.world.componentManager.getComponentsOfType(AI);
    
    for (const ai of npcEntities) {
      this.updateNPCAI(ai.entityId, playerId);
    }
  }
  
  private updateNPCAI(npcId: number, playerId?: number): void {
    const ai = this.world.componentManager.getComponent(npcId, AI);
    const transform = this.world.componentManager.getComponent(npcId, Transform);
    const def = this.npcs.get(npcId);
    
    if (!ai || !transform || !def) return;
    
    // Get player position if available
    let playerPos: Vector2 | null = null;
    if (playerId) {
      const playerTransform = this.world.componentManager.getComponent(playerId, Transform);
      if (playerTransform) {
        playerPos = { x: playerTransform.x, y: playerTransform.y };
      }
    }
    
    switch (def.behavior) {
      case 'patrol':
        this.updatePatrolBehavior(npcId, ai, transform, playerPos);
        break;
      case 'wander':
        this.updateWanderBehavior(npcId, ai, transform);
        break;
      case 'investigate':
        this.updateInvestigateBehavior(npcId, ai, transform, playerPos, playerId);
        break;
      case 'deal':
        this.updateDealerBehavior(npcId, ai, transform, playerPos);
        break;
      case 'stationary':
        // Don't move
        break;
    }
  }
  
  private updatePatrolBehavior(npcId: number, ai: AI, transform: Transform, playerPos: Vector2 | null): void {
    // Simple patrol: move randomly but stay on streets/sidewalks
    if (Math.random() < 0.3) { // 30% chance to move
      const directions = [
        { x: 0, y: -1 }, { x: 0, y: 1 },
        { x: -1, y: 0 }, { x: 1, y: 0 }
      ];
      
      const dir = directions[Math.floor(Math.random() * directions.length)];
      const newX = transform.x + dir.x;
      const newY = transform.y + dir.y;
      
      if (this.mapManager.isWalkable(newX, newY)) {
        const tileType = this.mapManager.getTileTypeId(newX, newY);
        if (tileType === 'street' || tileType === 'sidewalk') {
          transform.setPosition(newX, newY);
        }
      }
    }
    
    // Check for suspicious activity near player
    if (playerPos) {
      const distance = Math.abs(transform.x - playerPos.x) + Math.abs(transform.y - playerPos.y);
      if (distance <= 3) {
        ai.suspicion += 1;
        if (ai.suspicion > 20) {
          ai.state = 'suspicious';
        }
      } else {
        ai.suspicion = Math.max(0, ai.suspicion - 0.5);
      }
    }
  }
  
  private updateWanderBehavior(npcId: number, ai: AI, transform: Transform): void {
    if (Math.random() < 0.2) { // 20% chance to move
      const directions = [
        { x: 0, y: -1 }, { x: 0, y: 1 },
        { x: -1, y: 0 }, { x: 1, y: 0 }
      ];
      
      const dir = directions[Math.floor(Math.random() * directions.length)];
      const newX = transform.x + dir.x;
      const newY = transform.y + dir.y;
      
      if (this.mapManager.isWalkable(newX, newY)) {
        transform.setPosition(newX, newY);
      }
    }
  }
  
  private updateInvestigateBehavior(npcId: number, ai: AI, transform: Transform, playerPos: Vector2 | null, playerId?: number): void {
    if (playerPos && playerId) {
      const distance = Math.abs(transform.x - playerPos.x) + Math.abs(transform.y - playerPos.y);
      
      // Check player's heat level
      const playerLaw = this.world.componentManager.getComponent(playerId, LawEnforcement);
      if (playerLaw && playerLaw.heat > 30) {
        if (distance <= 5) {
          ai.suspicion += 2;
          ai.state = 'investigating';
          
          // Move towards player if highly suspicious
          if (ai.suspicion > 50 && distance > 1) {
            const dx = playerPos.x > transform.x ? 1 : (playerPos.x < transform.x ? -1 : 0);
            const dy = playerPos.y > transform.y ? 1 : (playerPos.y < transform.y ? -1 : 0);
            
            const newX = transform.x + dx;
            const newY = transform.y + dy;
            
            if (this.mapManager.isWalkable(newX, newY)) {
              transform.setPosition(newX, newY);
            }
          }
        }
      } else {
        ai.suspicion = Math.max(0, ai.suspicion - 1);
        if (ai.suspicion < 10) {
          ai.state = 'idle';
        }
      }
    }
  }
  
  private updateDealerBehavior(npcId: number, ai: AI, transform: Transform, playerPos: Vector2 | null): void {
    // Dealers mostly stay put but become active when player is nearby
    if (playerPos) {
      const distance = Math.abs(transform.x - playerPos.x) + Math.abs(transform.y - playerPos.y);
      
      if (distance <= 2) {
        ai.state = 'ready_to_deal';
      } else if (distance <= 5) {
        ai.state = 'alert';
      } else {
        ai.state = 'idle';
      }
    }
    
    // Occasionally move a bit (nervous behavior)
    if (Math.random() < 0.1) {
      const directions = [
        { x: 0, y: -1 }, { x: 0, y: 1 },
        { x: -1, y: 0 }, { x: 1, y: 0 }
      ];
      
      const dir = directions[Math.floor(Math.random() * directions.length)];
      const newX = transform.x + dir.x;
      const newY = transform.y + dir.y;
      
      if (this.mapManager.isWalkable(newX, newY)) {
        const currentTile = this.mapManager.getTileTypeId(transform.x, transform.y);
        const newTile = this.mapManager.getTileTypeId(newX, newY);
        
        // Stay near dealer spots
        if (currentTile === 'dealer_spot' || newTile === 'dealer_spot' || Math.random() < 0.3) {
          transform.setPosition(newX, newY);
        }
      }
    }
  }
  
  getNearbyNPCs(x: number, y: number, radius: number = 2): Array<{ id: number; def: NPCDef; transform: Transform; ai: AI }> {
    const nearby = [];
    const aiComponents = this.world.componentManager.getComponentsOfType(AI);
    
    for (const ai of aiComponents) {
      const transform = this.world.componentManager.getComponent(ai.entityId, Transform);
      const def = this.npcs.get(ai.entityId);
      
      if (transform && def) {
        const distance = Math.abs(transform.x - x) + Math.abs(transform.y - y);
        if (distance <= radius) {
          nearby.push({ id: ai.entityId, def, transform, ai });
        }
      }
    }
    
    return nearby;
  }
  
  interactWithNPC(npcId: number, playerId: number): string[] {
    const def = this.npcs.get(npcId);
    const ai = this.world.componentManager.getComponent(npcId, AI);
    const npcInventory = this.world.componentManager.getComponent(npcId, Inventory);
    
    if (!def || !ai) return ['NPC:tä ei löydy.'];
    
    const messages: string[] = [];
    
    switch (def.type) {
      case 'dealer':
        if (ai.state === 'ready_to_deal') {
          messages.push(`${def.name}: "Tarvitsetko jotain erityistä?"`);
          if (npcInventory && npcInventory.items.length > 0) {
            messages.push('--- Saatavilla ---');
            for (const item of npcInventory.items) {
              const drug = getDrug(item.itemId);
              const price = def.inventory?.find(i => i.itemId === item.itemId)?.price || 10;
              if (drug) {
                messages.push(`${drug.name}: ${price}€ (${item.quantity} kpl)`);
              }
            }
            messages.push('Osto: Tulossa pian...');
          }
        } else {
          messages.push(`${def.name} katsoo sinua epäillen...`);
        }
        break;
        
      case 'police':
        const playerLaw = this.world.componentManager.getComponent(playerId, LawEnforcement);
        if (playerLaw && playerLaw.heat > 40) {
          messages.push(`${def.name}: "Sinä! Pysähdy!"`);
          playerLaw.addHeat(5);
        } else if (ai.suspicion > 30) {
          messages.push(`${def.name}: "Kaikki kunnossa?"`);
          ai.suspicion += 5;
        } else {
          messages.push(`${def.name}: "Hyvää päivää."`);
        }
        break;
        
      case 'civilian':
        const greetings = [
          `${def.name}: "Hei."`,
          `${def.name}: "Kaunis päivä."`,
          `${def.name} nyökkää sinulle.`,
          `${def.name}: "Anteeksi, kiire."`
        ];
        messages.push(greetings[Math.floor(Math.random() * greetings.length)]);
        break;
    }
    
    return messages;
  }
  
  // Map NPC types to criminal backgrounds
  private getBackgroundForNPCType(npcType: string): string {
    const typeToBackground: Record<string, string[]> = {
      'dealer': ['street_dealer', 'drug_chemist'],
      'police': ['corrupt_official'],
      'civilian': ['street_thief', 'high_class_escort'],
      'patrol': ['corrupt_official']
    };
    
    const options = typeToBackground[npcType] || ['street_dealer'];
    return options[Math.floor(Math.random() * options.length)];
  }
  
  // Get NPC personality information
  getNPCPersonality(npcId: number): { personality: PersonalityTraits; mood: string; background: string } | null {
    const personalityComp = this.world.componentManager.getComponent(npcId, Personality);
    if (!personalityComp) return null;
    
    return {
      personality: personalityComp.traits,
      mood: personalityComp.currentMood.current,
      background: personalityComp.backgroundId
    };
  }
  
  // Update NPC moods periodically
  updateNPCMoods(): void {
    const personalityComponents = this.world.componentManager.getComponentsOfType(Personality);
    
    for (const personality of personalityComponents) {
      // Update mood duration
      personality.currentMood.duration -= 1; // Decrease by 1 second
      
      // Generate new mood if current one expired
      if (personality.currentMood.duration <= 0) {
        const newMood = generateMood(personality.traits);
        personality.updateMood(newMood);
      }
    }
  }
  
  getAllNPCs(): Array<{ id: number; def: NPCDef; transform: Transform; ai: AI }> {
    const aiComponents = this.world.componentManager.getComponentsOfType(AI);
    const aiEntities = aiComponents.map(ai => ai.entityId);
    const npcEntities = aiEntities.filter((id: any) => this.world.componentManager.hasComponent(id, AI));
    const allNPCs = [];
    
    for (const entityId of npcEntities) {
      const transform = this.world.componentManager.getComponent(entityId, Transform);
      const ai = this.world.componentManager.getComponent(entityId, AI);
      const def = this.npcs.get(entityId);
      
      if (transform && ai && def) {
        allNPCs.push({ id: entityId, def, transform, ai });
      }
    }
    
    return allNPCs;
  }
}
