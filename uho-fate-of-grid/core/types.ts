// Core game types and enums

export type EntityId = number;

export type StatKey =
  | 'strength' | 'endurance' | 'agility' | 'intelligence' | 'perception' 
  | 'charisma' | 'willpower' | 'luck' | 'reflex' | 'tolerance' 
  | 'stress' | 'technical' | 'crime' | 'medical' | 'cunning';

export type NeedKey = 
  | 'hunger' | 'thirst' | 'sleep' | 'warmth' | 'social' | 'pain' | 'hygiene';

export type SkillKey =
  | 'theft' | 'lying' | 'torture' | 'debt' | 'brawling' | 'lockpicking' 
  | 'evasion' | 'adult' | 'driving' | 'chemistry' | 'negotiation' | 'technical';

export type Direction = 'north' | 'south' | 'east' | 'west';

export interface Vector2 {
  x: number;
  y: number;
}

export interface Drug {
  id: string;
  name: string;
  desc: string;
  effects: Partial<Record<StatKey | NeedKey, number>>;
  risk: {
    tolerance: number;
    addiction: number;
    overdose: number;
  };
  duration: number;
  withdrawal: Partial<Record<StatKey | NeedKey, number>>;
}

export interface Item {
  id: string;
  name: string;
  desc: string;
  type: 'consumable' | 'drug' | 'weapon' | 'armor' | 'misc';
  value: number;
  weight: number;
  stackable: boolean;
}

export interface ItemRef {
  itemId: string;
  quantity: number;
}

export interface PlayerSave {
  stats: Record<StatKey, number>;
  needs: Record<NeedKey, number>;
  skills: Record<SkillKey, number>;
  cash: number;
  bank: number;
  heat: number;
  notoriety: number;
  inventory: ItemRef[];
  location: {
    map: string;
    x: number;
    y: number;
  };
  addictions: Record<string, number>;
  activeEffects: ActiveEffect[];
}

export interface ActiveEffect {
  id: string;
  name: string;
  effects: Partial<Record<StatKey | NeedKey, number>>;
  duration: number;
  originalDuration: number;
  intensity: number;
  source: 'drug' | 'addiction' | 'condition';
}

export interface TileType {
  id: string;
  name: string;
  walkable: boolean;
  sprite: number;
  description: string;
}

export interface GameMap {
  id: string;
  name: string;
  width: number;
  height: number;
  tiles: number[][];
  spawns: { [key: string]: Vector2 };
}

export interface MessageType {
  text: string;
  type: 'normal' | 'system' | 'combat' | 'drug' | 'police';
  timestamp: number;
}