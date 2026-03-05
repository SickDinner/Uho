import type { GameLog } from '../core/log';
import type { RNG } from '../core/rng';
import type { Inventory } from './items';
import type { Player } from './player';
import type { NPC, BossAbility } from './npcs';

export type CombatAction = 'slap' | 'kick' | 'spray' | 'rice-grenade' | 'wait';

export type CombatResolution =
  | { type: 'ongoing' }
  | { type: 'victory'; enemy: NPC }
  | { type: 'defeat' };

interface CombatOptions {
  zoneId: string;
  onSummonBoss?: (bossId: string) => NPC | undefined;
}

export class CombatEncounter {
  private skipTurns = 0;

  constructor(
    private player: Player,
    private enemy: NPC,
    private inventory: Inventory,
    private rng: RNG,
    private log: GameLog,
    private options: CombatOptions
  ) {}

  getEnemy(): NPC {
    return this.enemy;
  }

  playerAction(action: CombatAction): CombatResolution {
    if (!this.player.alive) {
      return { type: 'defeat' };
    }

    if (!this.enemy.alive) {
      return { type: 'victory', enemy: this.enemy };
    }

    if (this.skipTurns > 0) {
      this.log.push('You sway helplessly, mesmerised. The enemy takes advantage!', 'combat');
      this.skipTurns -= 1;
      const defeat = this.enemyTurn();
      return defeat ? { type: 'defeat' } : { type: 'ongoing' };
    }

    switch (action) {
      case 'slap':
        this.performSlap();
        break;
      case 'kick':
        this.performKick();
        break;
      case 'spray':
        this.performSpray();
        break;
      case 'rice-grenade':
        if (!this.performRiceGrenade()) {
          const defeatFromFailure = this.enemyTurn();
          return defeatFromFailure ? { type: 'defeat' } : { type: 'ongoing' };
        }
        break;
      case 'wait':
        this.log.push('You pose dramatically, inviting punishment.', 'combat');
        break;
      default:
        this.log.push('You forget what limbs are for.', 'combat');
    }

    if (!this.enemy.alive) {
      return { type: 'victory', enemy: this.enemy };
    }

    const defeat = this.enemyTurn();
    return defeat ? { type: 'defeat' } : { type: 'ongoing' };
  }

  private performSlap(): void {
    const base = 2 + Math.floor(this.player.stats.charm / 2);
    const damage = Math.max(1, base + this.rng.range(0, 2) - Math.floor(this.enemy.tolerance / 3));
    this.enemy.hp -= damage;
    this.log.push(`You slap with disco flourish for ${damage} damage!`, 'combat');
    if (this.enemy.hp <= 0) {
      this.finishEnemy('Your slap echoes like karaoke feedback.');
    }
  }

  private performKick(): void {
    const base = 3 + Math.floor(this.player.stats.groove / 2);
    const damage = Math.max(2, base + this.rng.range(1, 3) - Math.floor(this.enemy.tolerance / 2));
    this.enemy.hp -= damage;
    this.player.increaseShame(1);
    this.log.push(`You boot with platform shoes for ${damage} damage. Shame tingles.`, 'combat');
    if (this.enemy.hp <= 0) {
      this.finishEnemy('The foe tumbles into an existential split.');
    }
  }

  private performSpray(): void {
    const base = 2 + Math.floor(this.player.stats.tolerance / 2);
    const damage = Math.max(1, base + this.rng.range(0, 2) - Math.floor(this.enemy.riceArmor / 2));
    this.enemy.hp -= damage;
    this.player.adjustStat('tolerance', -1);
    this.log.push(`You unleash piller-spray! ${damage} damage and your tolerance peels slightly.`, 'combat');
    if (this.enemy.hp <= 0) {
      this.finishEnemy('The spray leaves them shimmering with regret.');
    }
  }

  private performRiceGrenade(): boolean {
    if (!this.inventory.consumeRiceGrenade()) {
      this.log.push('You rummage for rice but only find lint and invoices.', 'combat');
      return false;
    }

    const base = 5 + this.player.stats.ricePower;
    const damage = Math.max(3, base + this.rng.range(0, 4) - this.enemy.riceArmor);
    this.enemy.hp -= damage;
    this.player.gainRicePower(-1);
    this.log.push(`Rice grenade explodes in sticky confetti for ${damage} damage!`, 'combat');

    // Example: using a rice grenade in Hautajaiskirkko
    // Output in log:
    // "You scatter rice, the widow slips and summons Ankkel Penssi!"
    if (this.options.zoneId === 'hautajais-church' && this.enemy.id !== 'ankkel-penssi') {
      this.log.push('You scatter rice, the widow slips and summons Ankkel Penssi!', 'event');
      this.finishEnemy('The original foe flees slipping on starch.');
      const newEnemy = this.options.onSummonBoss?.('ankkel-penssi');
      if (newEnemy) {
        this.enemy = newEnemy;
        this.log.push('Ankkel Penssi™ waddles in, dripping capitalism aura.', 'boss');
      }
      return true;
    }

    if (this.enemy.hp <= 0) {
      this.finishEnemy('The explosion baptises them in carbohydrate oblivion.');
    }

    return true;
  }

  private finishEnemy(message: string): void {
    this.enemy.hp = 0;
    this.enemy.alive = false;
    this.log.push(message, 'combat');
  }

  private enemyTurn(): boolean {
    if (!this.enemy.alive) {
      return false;
    }

    const base = 2 + Math.floor(this.enemy.groove / 2);
    const damage = Math.max(1, base + this.rng.range(0, 3) - Math.floor(this.player.stats.tolerance / 2));
    this.player.takeDamage(damage);
    this.log.push(`${this.enemy.name} attacks with ${this.enemy.attackName}, dealing ${damage} damage!`, 'combat');

    if (!this.player.alive) {
      return true;
    }

    if (this.enemy.bossAbility) {
      this.applyBossAbility(this.enemy.bossAbility);
      if (!this.player.alive) {
        return true;
      }
    }

    return false;
  }

  private applyBossAbility(ability: BossAbility): void {
    switch (ability) {
      case 'steam':
        this.log.push('Korppi Commandant cranks the löyly! Steam scalds your tolerance.', 'boss');
        this.player.takeDamage(this.rng.range(1, 3));
        this.player.adjustStat('tolerance', -1);
        break;
      case 'capitalism':
        this.log.push('Ankkel Penssi™ invoices your soul. Shame balloons, charm wilts.', 'boss');
        this.player.increaseShame(2);
        this.player.adjustStat('charm', -1);
        break;
      case 'hypnosis':
        this.log.push('Teekeri whispers Confucian riddles. Your limbs forget choreography.', 'boss');
        if (this.rng.random() < 0.6) {
          this.skipTurns = 1;
          this.player.adjustStat('groove', -1);
          this.log.push('You lose the beat and will skip your next move!', 'boss');
        }
        break;
      default:
        break;
    }
  }
}
