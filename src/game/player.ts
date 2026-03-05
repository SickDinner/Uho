import { Inventory, PillCatalog } from './items';

export type PlayerStat = 'charm' | 'shame' | 'groove' | 'tolerance' | 'ricePower';

export interface PlayerStats {
  charm: number;
  shame: number;
  groove: number;
  tolerance: number;
  ricePower: number;
}

export class Player {
  x = 2;
  y = 8;
  zoneId = 'torkyturpa-bar';

  readonly stats: PlayerStats = {
    charm: 6,
    shame: 4,
    groove: 5,
    tolerance: 5,
    ricePower: 4
  };

  maxHp: number;
  hp: number;
  inventory: Inventory;
  alive = true;
  shameThreshold = 12;

  constructor(catalog: PillCatalog) {
    this.inventory = new Inventory(catalog);
    this.maxHp = this.calculateMaxHp();
    this.hp = this.maxHp;
  }

  setPosition(x: number, y: number, zoneId?: string): void {
    this.x = x;
    this.y = y;
    if (zoneId) {
      this.zoneId = zoneId;
    }
  }

  get position(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }

  adjustStat(stat: PlayerStat, delta: number): void {
    this.stats[stat] = Math.max(0, this.stats[stat] + delta);
    if (stat === 'tolerance') {
      this.recalculateMaxHp();
    }
  }

  reduceShame(amount: number): void {
    this.stats.shame = Math.max(0, this.stats.shame - amount);
  }

  increaseShame(amount: number): void {
    this.stats.shame = Math.min(this.shameThreshold, this.stats.shame + amount);
  }

  gainRicePower(amount: number): void {
    this.stats.ricePower = Math.max(0, this.stats.ricePower + amount);
  }

  heal(amount: number): void {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  takeDamage(amount: number): void {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
    }
  }

  recalculateMaxHp(): void {
    this.maxHp = this.calculateMaxHp();
    this.hp = Math.min(this.hp, this.maxHp);
  }

  private calculateMaxHp(): number {
    return 12 + this.stats.tolerance * 2;
  }
}
