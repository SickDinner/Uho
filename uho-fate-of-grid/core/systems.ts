import { System } from './ecs.ts';
import { Transform, Sprite, Stats, Needs, Inventory, Wallet, Skills, Addiction, LawEnforcement, AI, Vehicle } from './components.ts';
import type { EntityId, StatKey, NeedKey, ActiveEffect } from './types.ts';
import { getDrug } from '@data/drugs.ts';

// Movement System for grid-based movement
export class MovementSystem extends System {
  update(deltaTime: number): void {
    // Movement is handled in the main game class for turn-based input
    // This system could handle AI movement or vehicle movement
    const vehicles = this.componentManager.getComponentsOfType(Vehicle);
    const entities = vehicles.filter(vehicle =>
      this.componentManager.hasComponent(vehicle.entityId, Transform) &&
      this.componentManager.hasComponent(vehicle.entityId, Transform)
    ).map(vehicle => vehicle.entityId);
    
    for (const entityId of entities) {
      const vehicle = this.componentManager.getComponent(entityId, Vehicle)!;
      const transform = this.componentManager.getComponent(entityId, Transform)!;
      
      if (vehicle.canDrive() && vehicle.speed > 0) {
        // Consume fuel slowly when driving
        vehicle.consumeFuel(0.01 * deltaTime / 16); // ~0.6 per second
      }
    }
  }
}

// Collision System for world boundaries and obstacles
export class CollisionSystem extends System {
  private worldWidth = 256;
  private worldHeight = 256;
  
  // Määrittele esteet ja rakennukset kartalla
  private obstacles: Set<string> = new Set();
  
  constructor(componentManager: any, mapManager?: any) {
    super(componentManager);
    this.initializeObstacles(mapManager);
  }
  
  private initializeObstacles(mapManager?: any): void {
    // Lisää rakennuksia ja esteitä
    // Nämä koordinaatit edustavat läpikävelemättömiä alueita
    this.addObstacleArea(10, 10, 5, 5); // Esimerkki: poliisiasema
    this.addObstacleArea(20, 15, 4, 3); // Esimerkki: kauppa
    this.addObstacleArea(30, 20, 6, 4); // Esimerkki: pankki
    this.addObstacleArea(45, 35, 3, 3); // Esimerkki: pieni rakennus
    this.addObstacleArea(60, 25, 4, 6); // Esimerkki: sairaala
    
    // Lisää joitain yksittäisiä esteitä
    this.addObstacle(50, 50); // Puu tai pylväs
    this.addObstacle(75, 60);
    this.addObstacle(80, 45);
    
    console.log(`🚧 Collision system initialized with ${this.obstacles.size} obstacles`);
  }
  
  private addObstacle(x: number, y: number): void {
    this.obstacles.add(`${x},${y}`);
  }
  
  private addObstacleArea(startX: number, startY: number, width: number, height: number): void {
    for (let x = startX; x < startX + width; x++) {
      for (let y = startY; y < startY + height; y++) {
        this.addObstacle(x, y);
      }
    }
  }
  
  update(deltaTime: number): void {
    const entities = this.getEntitiesWithComponents(Transform);
    
    for (const entityId of entities) {
      const transform = this.componentManager.getComponent(entityId, Transform)!;
      
      // Tarkista rajojen ylitys
      this.checkWorldBounds(transform);
    }
  }
  
  // Tarkista voiko liikkua tiettyyn paikkaan
  public canMoveTo(x: number, y: number, entityId?: number): boolean {
    // Tarkista maailman rajat
    if (x < 0 || y < 0 || x >= this.worldWidth || y >= this.worldHeight) {
      return false;
    }
    
    // Tarkista staattiset esteet
    if (this.obstacles.has(`${Math.floor(x)},${Math.floor(y)}`)) {
      return false;
    }
    
    // Tarkista muut entiteetit
    if (this.isOccupiedByOtherEntity(x, y, entityId)) {
      return false;
    }
    
    return true;
  }
  
  // Tarkista onko paikka toisen entityn varassa
  private isOccupiedByOtherEntity(x: number, y: number, excludeEntityId?: number): boolean {
    const transforms = this.componentManager.getComponentsOfType(Transform);
    
    for (const transform of transforms) {
      if (excludeEntityId && transform.entityId === excludeEntityId) {
        continue; // Ohita oma entity
      }
      
      // Tarkista onko samassa paikassa (ruudukkoperusteinen)
      if (Math.floor(transform.x) === Math.floor(x) && 
          Math.floor(transform.y) === Math.floor(y)) {
        return true;
      }
    }
    
    return false;
  }
  
  // Tarkista ja korjaa maailman rajat
  private checkWorldBounds(transform: Transform): void {
    let corrected = false;
    
    if (transform.x < 0) {
      transform.x = 0;
      corrected = true;
    }
    if (transform.y < 0) {
      transform.y = 0;
      corrected = true;
    }
    if (transform.x >= this.worldWidth) {
      transform.x = this.worldWidth - 1;
      corrected = true;
    }
    if (transform.y >= this.worldHeight) {
      transform.y = this.worldHeight - 1;
      corrected = true;
    }
    
    if (corrected) {
      console.log(`🚧 Entity ${transform.entityId} hit world boundary, corrected to (${transform.x}, ${transform.y})`);
    }
  }
  
  // Yritä siirtää entityä tiettyyn suuntaan
  public attemptMove(entityId: number, direction: 'north' | 'south' | 'east' | 'west'): boolean {
    const transform = this.componentManager.getComponent(entityId, Transform);
    if (!transform) return false;
    
    let newX = transform.x;
    let newY = transform.y;
    
    switch (direction) {
      case 'north':
        newY -= 1;
        break;
      case 'south':
        newY += 1;
        break;
      case 'west':
        newX -= 1;
        break;
      case 'east':
        newX += 1;
        break;
    }
    
    if (this.canMoveTo(newX, newY, entityId)) {
      transform.x = newX;
      transform.y = newY;
      transform.facing = direction;
      return true;
    } else {
      console.log(`🚧 Move blocked: Entity ${entityId} cannot move ${direction} to (${newX}, ${newY})`);
      return false;
    }
  }
  
  // Hae lähin vapaa paikka tietyn pisteen ympäriltä
  public findNearestFreePosition(x: number, y: number, maxRadius: number = 5): {x: number, y: number} | null {
    // Aloita keskipisteestä
    if (this.canMoveTo(x, y)) {
      return { x, y };
    }
    
    // Etsi spiraalissa
    for (let radius = 1; radius <= maxRadius; radius++) {
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
          // Tarkista vain kehän pisteet, ei sisäosia
          if (Math.abs(dx) === radius || Math.abs(dy) === radius) {
            const testX = x + dx;
            const testY = y + dy;
            
            if (this.canMoveTo(testX, testY)) {
              return { x: testX, y: testY };
            }
          }
        }
      }
    }
    
    return null; // Ei vapaata paikkaa löytynyt
  }
  
  // Debug-metodi: tulosta esteet konsoliin
  public debugObstacles(): void {
    console.log('🚧 Current obstacles:');
    Array.from(this.obstacles)
      .slice(0, 20) // Näytä vain 20 ensimmäistä
      .forEach(pos => console.log(`  - ${pos}`));
    
    if (this.obstacles.size > 20) {
      console.log(`  ... and ${this.obstacles.size - 20} more`);
    }
  }
  
  // Lisää uusi este dynaamisesti
  public addDynamicObstacle(x: number, y: number): void {
    this.obstacles.add(`${x},${y}`);
  }
  
  // Poista este
  public removeObstacle(x: number, y: number): void {
    this.obstacles.delete(`${x},${y}`);
  }
  
  // Tarkista onko paikka este
  public isObstacle(x: number, y: number): boolean {
    return this.obstacles.has(`${Math.floor(x)},${Math.floor(y)}`);
  }
}

// Needs System for survival mechanics
export class NeedsSystem extends System {
  private readonly needDecayRates: Record<NeedKey, number> = {
    hunger: 0.2,
    thirst: 0.3,
    sleep: 0.1,
    warmth: 0.05,
    social: 0.02,
    pain: -0.1, // Pain naturally decreases over time
    hygiene: 0.1
  };
  
  update(deltaTime: number): void {
    const needsComponents = this.componentManager.getComponentsOfType(Needs);
    const entities = needsComponents.map(needs => needs.entityId);
    
    for (const entityId of entities) {
      const needs = this.componentManager.getComponent(entityId, Needs)!;
      
      // Update needs based on time elapsed
      const timeElapsed = deltaTime / 1000; // Convert to seconds
      
      for (const [needKey, decayRate] of Object.entries(this.needDecayRates)) {
        const key = needKey as NeedKey;
        const change = decayRate * timeElapsed;
        needs.modifyNeed(key, -change);
      }
    }
  }
}

// Addiction System for drug dependencies
export class AddictionSystem extends System {
  update(deltaTime: number): void {
    const addictionComponents = this.componentManager.getComponentsOfType(Addiction);
    const entities = addictionComponents.filter(addiction =>
      this.componentManager.hasComponent(addiction.entityId, Needs)
    ).map(addiction => addiction.entityId);
    
    for (const entityId of entities) {
      const addiction = this.componentManager.getComponent(entityId, Addiction)!;
      const stats = this.componentManager.getComponent(entityId, Stats)!;
      const needs = this.componentManager.getComponent(entityId, Needs)!;
      
      // Update active drug effects
      addiction.updateEffects(deltaTime / 1000);
      
      // Apply current effects to stats and needs
      this.applyEffects(addiction.activeEffects, stats, needs);
      
      // Process withdrawal
      this.processWithdrawal(addiction, stats, needs, deltaTime / 1000);
      
      // Natural addiction decay (very slow)
      for (const drugId of Object.keys(addiction.addictions)) {
        const currentLevel = addiction.addictions[drugId];
        if (currentLevel > 0) {
          addiction.addictions[drugId] = Math.max(0, currentLevel - 0.001 * deltaTime / 1000);
        }
      }
    }
  }
  
  private applyEffects(effects: ActiveEffect[], stats: Stats, needs: Needs): void {
    // Reset temporary effects
    const baseStats = { ...stats.stats };
    const baseNeeds = { ...needs.needs };
    
    for (const effect of effects) {
      for (const [key, value] of Object.entries(effect.effects)) {
        if (key in baseStats) {
          stats.modifyStat(key as StatKey, value);
        } else if (key in baseNeeds) {
          needs.modifyNeed(key as NeedKey, value);
        }
      }
    }
  }
  
  private processWithdrawal(addiction: Addiction, stats: Stats, needs: Needs, deltaTime: number): void {
    for (const [drugId, level] of Object.entries(addiction.addictions)) {
      if (level > 10) { // Addicted
        const drug = getDrug(drugId);
        if (drug && Math.random() < 0.01 * deltaTime) { // Small chance per second
          // Apply withdrawal effects
          for (const [key, value] of Object.entries(drug.withdrawal)) {
            if (key in stats.stats) {
              stats.modifyStat(key as StatKey, value / 10); // Mild withdrawal
            } else if (key in needs.needs) {
              needs.modifyNeed(key as NeedKey, value / 10);
            }
          }
        }
      }
    }
  }
  
  public consumeDrug(entityId: EntityId, drugId: string): boolean {
    const addiction = this.componentManager.getComponent(entityId, Addiction);
    const stats = this.componentManager.getComponent(entityId, Stats);
    const needs = this.componentManager.getComponent(entityId, Needs);
    
    if (!addiction || !stats || !needs) return false;
    
    const drug = getDrug(drugId);
    if (!drug) return false;
    
    // Add addiction and tolerance
    addiction.addAddiction(drugId, drug.risk.addiction * 100);
    
    // Create active effect
    const effect: ActiveEffect = {
      id: `${drugId}_${Date.now()}`,
      name: drug.name,
      effects: drug.effects,
      duration: drug.duration,
      originalDuration: drug.duration,
      intensity: 1.0,
      source: 'drug'
    };
    
    addiction.addEffect(effect);
    
    // Check for overdose
    const tolerance = addiction.tolerance[drugId] || 0;
    const overdoseRisk = drug.risk.overdose * 100 * (1 - tolerance / 100);
    if (Math.random() < overdoseRisk) {
      // Overdose! Apply severe penalties
      stats.modifyStat('endurance', -20);
      needs.modifyNeed('pain', 30);
      return false; // Indicates overdose
    }
    
    return true;
  }
}

// Police AI System for law enforcement
export class PoliceAISystem extends System {
  update(deltaTime: number): void {
    const aiComponents = this.componentManager.getComponentsOfType(AI);
    const policeEntities = aiComponents.filter(ai =>
      this.componentManager.hasComponent(ai.entityId, LawEnforcement)
    ).map(ai => ai.entityId);
    
    const lawComponents = this.componentManager.getComponentsOfType(LawEnforcement);
    const playerEntities = lawComponents.filter(law =>
      this.componentManager.hasComponent(law.entityId, Transform)
    ).map(law => law.entityId);
    
    if (playerEntities.length === 0) return;
    
    const playerId = playerEntities[0]; // Assume first is player
    const playerTransform = this.componentManager.getComponent(playerId, Transform)!;
    const playerLaw = this.componentManager.getComponent(playerId, LawEnforcement)!;
    
    for (const policeId of policeEntities) {
      const ai = this.componentManager.getComponent(policeId, AI)!;
      const transform = this.componentManager.getComponent(policeId, Transform)!;
      const lawEnforcement = this.componentManager.getComponent(policeId, LawEnforcement)!;
      
      // Calculate distance to player
      const dx = playerTransform.x - transform.x;
      const dy = playerTransform.y - transform.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Update AI state based on player heat and proximity
      if (playerLaw.wanted && distance < 10) {
        ai.state = 'pursuing';
        ai.suspicion = Math.min(100, ai.suspicion + deltaTime / 100);
      } else if (distance < 5 && playerLaw.heat > 30) {
        ai.state = 'suspicious';
        ai.suspicion = Math.min(100, ai.suspicion + deltaTime / 200);
      } else {
        ai.state = 'patrolling';
        ai.suspicion = Math.max(0, ai.suspicion - deltaTime / 300);
      }
      
      // Simple AI movement (basic patrolling)
      if (ai.state === 'patrolling' && Date.now() - ai.lastAction > 2000) {
        const directions = [
          { x: 0, y: -1 }, { x: 0, y: 1 }, 
          { x: -1, y: 0 }, { x: 1, y: 0 }
        ];
        const direction = directions[Math.floor(Math.random() * directions.length)];
        transform.x += direction.x;
        transform.y += direction.y;
        ai.lastAction = Date.now();
      } else if (ai.state === 'pursuing' && Date.now() - ai.lastAction > 1000) {
        // Move towards player
        if (dx !== 0) transform.x += dx > 0 ? 1 : -1;
        else if (dy !== 0) transform.y += dy > 0 ? 1 : -1;
        ai.lastAction = Date.now();
      }
    }
  }
}

// Vehicle System for transportation
export class VehicleSystem extends System {
  update(deltaTime: number): void {
    const vehicleComponents = this.componentManager.getComponentsOfType(Vehicle);
    const vehicles = vehicleComponents.filter(vehicle =>
      this.componentManager.hasComponent(vehicle.entityId, Transform)
    ).map(vehicle => vehicle.entityId);
    
    for (const entityId of vehicles) {
      const vehicle = this.componentManager.getComponent(entityId, Vehicle)!;
      
      // Fuel consumption and maintenance
      if (vehicle.driver && vehicle.fuel > 0) {
        // Vehicle is being driven, consume fuel
        const consumption = vehicle.speed * 0.1 * deltaTime / 1000;
        vehicle.consumeFuel(consumption);
        
        if (vehicle.fuel <= 0) {
          vehicle.driver = undefined; // Kick out driver when fuel runs out
        }
      }
    }
  }
}

// Economy System for money and transactions
export class EconomySystem extends System {
  update(deltaTime: number): void {
    const walletComponents = this.componentManager.getComponentsOfType(Wallet);
    const entities = walletComponents.map(wallet => wallet.entityId);
    
    for (const entityId of entities) {
      const wallet = this.componentManager.getComponent(entityId, Wallet)!;
      
      // Process debt interest (daily compounding)
      if (wallet.debt > 0) {
        const dailyInterest = 0.02; // 2% daily interest
        const timeElapsed = deltaTime / (1000 * 60 * 60 * 24); // Convert to days
        wallet.debt *= (1 + dailyInterest * timeElapsed);
      }
      
      // Bank interest (much smaller)
      if (wallet.bank > 0) {
        const dailyBankInterest = 0.001; // 0.1% daily interest
        const timeElapsed = deltaTime / (1000 * 60 * 60 * 24);
        wallet.bank *= (1 + dailyBankInterest * timeElapsed);
      }
    }
  }
}

// Combat System for turn-based fighting
export class CombatSystem extends System {
  update(deltaTime: number): void {
    // Combat will be triggered by events rather than continuous updates
    // This system handles ongoing combat effects and status conditions
  }
  
  public initiateCombat(attackerId: EntityId, defenderId: EntityId): boolean {
    const attackerStats = this.componentManager.getComponent(attackerId, Stats);
    const defenderStats = this.componentManager.getComponent(defenderId, Stats);
    const attackerSkills = this.componentManager.getComponent(attackerId, Skills);
    
    if (!attackerStats || !defenderStats) return false;
    
    // Calculate hit chance based on stats and skills
    const attackerReflex = attackerStats.getStat('reflex');
    const defenderReflex = defenderStats.getStat('reflex');
    const brawlingSkill = attackerSkills?.getSkill('brawling') || 0;
    
    const hitChance = 0.5 + (attackerReflex - defenderReflex) / 100 + brawlingSkill / 200;
    const hit = Math.random() < hitChance;
    
    if (hit) {
      // Calculate damage
      const strength = attackerStats.getStat('strength');
      const damage = Math.floor(strength / 10 + Math.random() * 5);
      
      // Apply damage (reduce endurance)
      defenderStats.modifyStat('endurance', -damage);
      
      // Add pain
      const defenderNeeds = this.componentManager.getComponent(defenderId, Needs);
      if (defenderNeeds) {
        defenderNeeds.modifyNeed('pain', damage * 2);
      }
      
      // Train brawling skill
      if (attackerSkills) {
        attackerSkills.trainSkill('brawling', 1);
      }
      
      return true;
    }
    
    return false;
  }
}

// Save/Load System for game persistence
export class SaveLoadSystem extends System {
  private readonly SAVE_KEY = 'uho_game_save';
  
  update(deltaTime: number): void {
    // Auto-save every 30 seconds
    // This would be implemented with a timer
  }
  
  public saveGame(slotNumber: number = 1): boolean {
    try {
      const transformComponents = this.componentManager.getComponentsOfType(Transform);
      const playerEntities = transformComponents.filter(transform =>
        this.componentManager.hasComponent(transform.entityId, Stats) &&
        this.componentManager.hasComponent(transform.entityId, Needs) &&
        this.componentManager.hasComponent(transform.entityId, Inventory) &&
        this.componentManager.hasComponent(transform.entityId, Wallet) &&
        this.componentManager.hasComponent(transform.entityId, Skills) &&
        this.componentManager.hasComponent(transform.entityId, Addiction) &&
        this.componentManager.hasComponent(transform.entityId, LawEnforcement)
      ).map(transform => transform.entityId);
      
      if (playerEntities.length === 0) return false;
      
      const playerId = playerEntities[0];
      const transform = this.componentManager.getComponent(playerId, Transform)!;
      const stats = this.componentManager.getComponent(playerId, Stats)!;
      const needs = this.componentManager.getComponent(playerId, Needs)!;
      const inventory = this.componentManager.getComponent(playerId, Inventory)!;
      const wallet = this.componentManager.getComponent(playerId, Wallet)!;
      const skills = this.componentManager.getComponent(playerId, Skills)!;
      const addiction = this.componentManager.getComponent(playerId, Addiction)!;
      const lawEnforcement = this.componentManager.getComponent(playerId, LawEnforcement)!;
      
      const saveData = {
        stats: stats.stats,
        needs: needs.needs,
        skills: skills.skills,
        cash: wallet.cash,
        bank: wallet.bank,
        heat: lawEnforcement.heat,
        notoriety: 0, // TODO: implement notoriety
        inventory: inventory.items,
        location: {
          map: 'overworld', // TODO: implement map system
          x: transform.x,
          y: transform.y
        },
        addictions: addiction.addictions,
        activeEffects: addiction.activeEffects,
        timestamp: Date.now()
      };
      
      localStorage.setItem(`${this.SAVE_KEY}_${slotNumber}`, JSON.stringify(saveData));
      return true;
    } catch (error) {
      console.error('Failed to save game:', error);
      return false;
    }
  }
  
  public loadGame(slotNumber: number = 1): boolean {
    try {
      const saveDataString = localStorage.getItem(`${this.SAVE_KEY}_${slotNumber}`);
      if (!saveDataString) return false;
      
      const saveData = JSON.parse(saveDataString);
      
      // TODO: Implement loading logic to restore all component states
      // This would recreate the player entity with saved data
      
      return true;
    } catch (error) {
      console.error('Failed to load game:', error);
      return false;
    }
  }
  
  public getSaveSlots(): Array<{ slot: number; timestamp?: number; exists: boolean }> {
    const slots = [];
    
    for (let i = 1; i <= 3; i++) {
      const saveData = localStorage.getItem(`${this.SAVE_KEY}_${i}`);
      if (saveData) {
        try {
          const parsed = JSON.parse(saveData);
          slots.push({ slot: i, timestamp: parsed.timestamp, exists: true });
        } catch {
          slots.push({ slot: i, exists: false });
        }
      } else {
        slots.push({ slot: i, exists: false });
      }
    }
    
    return slots;
  }
}