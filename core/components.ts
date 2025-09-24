import { Component } from './ecs.ts';
import type { 
  EntityId, Vector2, StatKey, NeedKey, SkillKey, 
  ItemRef, ActiveEffect, Direction 
} from './types.ts';

// Transform component for position and movement
export class Transform extends Component {
  // Visual position (for smooth rendering)
  public visualX: number;
  public visualY: number;
  
  // Movement interpolation
  public isMoving = false;
  public moveStartTime = 0;
  public moveDuration = 150; // ms to move from one tile to another
  public moveFromX = 0;
  public moveFromY = 0;
  public moveToX = 0;
  public moveToY = 0;
  
  constructor(
    entityId: EntityId,
    public x: number = 0,
    public y: number = 0,
    public facing: Direction = 'south'
  ) {
    super(entityId);
    this.visualX = x;
    this.visualY = y;
    this.moveFromX = x;
    this.moveFromY = y;
    this.moveToX = x;
    this.moveToY = y;
  }
  
  getPosition(): Vector2 {
    return { x: this.x, y: this.y };
  }
  
  getVisualPosition(): Vector2 {
    return { x: this.visualX, y: this.visualY };
  }
  
  setPosition(x: number, y: number): void {
    // Start a smooth movement
    this.moveFromX = this.x;
    this.moveFromY = this.y;
    this.moveToX = x;
    this.moveToY = y;
    this.moveStartTime = performance.now();
    this.isMoving = true;
    
    // Update logical position immediately
    this.x = x;
    this.y = y;
  }
  
  // Update visual position based on movement interpolation
  updateVisualPosition(currentTime: number): void {
    if (!this.isMoving) {
      return;
    }
    
    const elapsed = currentTime - this.moveStartTime;
    const progress = Math.min(1, elapsed / this.moveDuration);
    
    // Smooth interpolation (ease-in-out function for more natural movement)
    const t = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
    
    this.visualX = this.moveFromX + (this.moveToX - this.moveFromX) * t;
    this.visualY = this.moveFromY + (this.moveToY - this.moveFromY) * t;
    
    if (progress >= 1) {
      this.isMoving = false;
      this.visualX = this.moveToX;
      this.visualY = this.moveToY;
    }
  }
}

// Sprite component for visual representation
export class Sprite extends Component {
  public currentAnimation: string = 'idle';
  public animationTime: number = 0;
  public frameIndex: number = 0;
  
  constructor(
    entityId: EntityId,
    public spriteSheetId: string = 'player',
    public scale: number = 2,
    public visible: boolean = true,
    public layer: number = 0
  ) {
    super(entityId);
  }
  
  setAnimation(animationName: string): void {
    if (this.currentAnimation !== animationName) {
      this.currentAnimation = animationName;
      this.animationTime = 0;
      this.frameIndex = 0;
    }
  }
  
  updateAnimation(deltaTime: number): void {
    this.animationTime += deltaTime;
  }
}

// Stats component for character attributes
export class Stats extends Component {
  public stats: Record<StatKey, number>;
  
  constructor(entityId: EntityId, initialStats?: Partial<Record<StatKey, number>>) {
    super(entityId);
    
    // Default stats (0-100 scale)
    this.stats = {
      strength: 50,
      endurance: 50,
      agility: 50,
      intelligence: 50,
      perception: 50,
      charisma: 50,
      willpower: 50,
      luck: 50,
      reflex: 50,
      tolerance: 50,
      stress: 50,
      technical: 50,
      crime: 20,
      medical: 30,
      cunning: 40,
      ...initialStats
    };
  }
  
  getStat(stat: StatKey): number {
    return Math.max(0, Math.min(100, this.stats[stat]));
  }
  
  modifyStat(stat: StatKey, amount: number): void {
    this.stats[stat] = Math.max(0, Math.min(100, this.stats[stat] + amount));
  }
}

// Needs component for survival mechanics
export class Needs extends Component {
  public needs: Record<NeedKey, number>;
  public lastTick: number = Date.now();
  
  constructor(entityId: EntityId, initialNeeds?: Partial<Record<NeedKey, number>>) {
    super(entityId);
    
    // Default needs (0-100 scale, 100 = fully satisfied)
    this.needs = {
      hunger: 80,
      thirst: 80,
      sleep: 80,
      warmth: 80,
      social: 60,
      pain: 0,    // 0 = no pain
      hygiene: 70,
      ...initialNeeds
    };
  }
  
  getNeed(need: NeedKey): number {
    return Math.max(0, Math.min(100, this.needs[need]));
  }
  
  modifyNeed(need: NeedKey, amount: number): void {
    this.needs[need] = Math.max(0, Math.min(100, this.needs[need] + amount));
  }
}

// Inventory component for items
export class Inventory extends Component {
  public maxCapacity: number;
  
  constructor(
    entityId: EntityId,
    public items: ItemRef[] = [],
    maxCapacity: number = 50
  ) {
    super(entityId);
    this.maxCapacity = maxCapacity;
  }
  
  addItem(itemId: string, quantity: number = 1): boolean {
    const existingItem = this.items.find(item => item.itemId === itemId);
    
    if (existingItem) {
      existingItem.quantity += quantity;
      return true;
    } else {
      if (this.items.length < this.maxCapacity) {
        this.items.push({ itemId, quantity });
        return true;
      }
      return false;
    }
  }
  
  removeItem(itemId: string, quantity: number = 1): boolean {
    const itemIndex = this.items.findIndex(item => item.itemId === itemId);
    
    if (itemIndex === -1) return false;
    
    const item = this.items[itemIndex];
    if (item.quantity >= quantity) {
      item.quantity -= quantity;
      if (item.quantity === 0) {
        this.items.splice(itemIndex, 1);
      }
      return true;
    }
    return false;
  }
  
  hasItem(itemId: string, quantity: number = 1): boolean {
    const item = this.items.find(item => item.itemId === itemId);
    return item ? item.quantity >= quantity : false;
  }
}

// Wallet component for money management
export class Wallet extends Component {
  constructor(
    entityId: EntityId,
    public cash: number = 100,
    public bank: number = 0,
    public debt: number = 0
  ) {
    super(entityId);
  }
  
  canAfford(amount: number): boolean {
    return this.cash >= amount;
  }
  
  spend(amount: number): boolean {
    if (this.canAfford(amount)) {
      this.cash -= amount;
      return true;
    }
    return false;
  }
  
  addCash(amount: number): void {
    this.cash += amount;
  }
}

// Addiction component for substance dependencies
export class Addiction extends Component {
  constructor(
    entityId: EntityId,
    public addictions: Record<string, number> = {},
    public tolerance: Record<string, number> = {},
    public withdrawal: Record<string, number> = {},
    public activeEffects: ActiveEffect[] = []
  ) {
    super(entityId);
  }
  
  addAddiction(drugId: string, amount: number): void {
    this.addictions[drugId] = (this.addictions[drugId] || 0) + amount;
    this.tolerance[drugId] = (this.tolerance[drugId] || 0) + amount * 0.1;
  }
  
  isAddicted(drugId: string): boolean {
    return (this.addictions[drugId] || 0) > 20;
  }
  
  addEffect(effect: ActiveEffect): void {
    // Remove existing effect of same type
    this.activeEffects = this.activeEffects.filter(e => e.id !== effect.id);
    this.activeEffects.push(effect);
  }
  
  updateEffects(deltaTime: number): void {
    this.activeEffects = this.activeEffects.filter(effect => {
      effect.duration -= deltaTime;
      return effect.duration > 0;
    });
  }
  
  getActiveEffectLevel(drugId: string): number {
    const effect = this.activeEffects.find(e => e.id === drugId);
    if (!effect) return 0;
    
    // Return intensity based on remaining duration (stronger when fresher)
    const timeRemaining = effect.duration / effect.originalDuration;
    return effect.intensity * Math.max(0.1, timeRemaining);
  }
}

// Skills component for learned abilities
export class Skills extends Component {
  public skills: Record<SkillKey, number>;
  
  constructor(entityId: EntityId, initialSkills?: Partial<Record<SkillKey, number>>) {
    super(entityId);
    
    this.skills = {
      theft: 10,
      lying: 15,
      torture: 5,
      debt: 10,
      brawling: 20,
      lockpicking: 5,
      evasion: 15,
      adult: 10,
      driving: 25,
      chemistry: 10,
      negotiation: 20,
      ...initialSkills
    };
  }
  
  getSkill(skill: SkillKey): number {
    return Math.max(0, Math.min(100, this.skills[skill]));
  }
  
  trainSkill(skill: SkillKey, amount: number = 1): void {
    const current = this.skills[skill];
    const difficulty = Math.max(1, current / 10);
    const gain = amount / difficulty;
    this.skills[skill] = Math.min(100, current + gain);
  }
}

// AI component for NPC behavior
export class AI extends Component {
  constructor(
    entityId: EntityId,
    public type: 'police' | 'civilian' | 'dealer' | 'collector' | 'patrol',
    public state: string = 'idle',
    public target?: Vector2,
    public lastAction: number = 0,
    public suspicion: number = 0
  ) {
    super(entityId);
  }
}

// Vehicle component for cars and transportation
export class Vehicle extends Component {
  constructor(
    entityId: EntityId,
    public type: 'car' | 'police_car' | 'motorcycle',
    public fuel: number = 100,
    public maxFuel: number = 100,
    public speed: number = 1,
    public driver?: EntityId
  ) {
    super(entityId);
  }
  
  canDrive(): boolean {
    return this.fuel > 0 && this.driver !== undefined;
  }
  
  consumeFuel(amount: number): void {
    this.fuel = Math.max(0, this.fuel - amount);
  }
}

// LawEnforcement component for police mechanics
export class LawEnforcement extends Component {
  constructor(
    entityId: EntityId,
    public heat: number = 0,
    public maxHeat: number = 100,
    public wanted: boolean = false,
    public crimesSeen: string[] = [],
    public lastCrimeTime: number = 0
  ) {
    super(entityId);
  }
  
  addHeat(amount: number): void {
    this.heat = Math.min(this.maxHeat, this.heat + amount);
    if (this.heat > 50) {
      this.wanted = true;
    }
  }
  
  reduceHeat(amount: number): void {
    this.heat = Math.max(0, this.heat - amount);
    if (this.heat < 25) {
      this.wanted = false;
    }
  }
  
  witnessedCrime(crimeType: string): void {
    this.crimesSeen.push(crimeType);
    this.lastCrimeTime = Date.now();
    this.addHeat(10);
  }
}

// QuestFlag component for game progression
export class QuestFlag extends Component {
  constructor(
    entityId: EntityId,
    public flags: Record<string, boolean | number | string> = {}
  ) {
    super(entityId);
  }
  
  setFlag(name: string, value: boolean | number | string): void {
    this.flags[name] = value;
  }
  
  getFlag(name: string): boolean | number | string | undefined {
    return this.flags[name];
  }
  
  hasFlag(name: string): boolean {
    return name in this.flags;
  }
}