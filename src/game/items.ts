import type { GameLog } from '../core/log';
import type { RNG } from '../core/rng';
import type { Player } from './player';

export interface PillBlueprint {
  id: string;
  name: string;
  color: string;
  icon: string;
  tagline: string;
}

export interface PillEffectContext {
  player: Player;
  log: GameLog;
  rng: RNG;
  inventory: Inventory;
}

export interface PillEffectDefinition {
  id: string;
  title: string;
  description: string;
  apply: (context: PillEffectContext) => void;
}

export interface PillInstance {
  blueprint: PillBlueprint;
  effect: PillEffectDefinition;
  identified: boolean;
}

const pillEffects: PillEffectDefinition[] = [
  {
    id: 'washing-machine',
    title: 'Spin Cycle Ego',
    description: "You feel like a washing machine on gossip mode. Groove +2, Shame -1.",
    apply: ({ player, log }) => {
      player.adjustStat('groove', 2);
      player.reduceShame(1);
      log.push("You feel like a washing machine on gossip cycle! Groove bubbles over.", 'event');
    }
  },
  {
    id: 'capitalist-belch',
    title: 'Capitalist Belch',
    description: 'Charm +2 but Shame +2. Every wink accrues interest.',
    apply: ({ player, log }) => {
      player.adjustStat('charm', 2);
      player.increaseShame(2);
      log.push('Your smile files for an IPO. Charm rises, but shame invoices you.', 'flirt');
    }
  },
  {
    id: 'rice-supernova',
    title: 'Rice Supernova',
    description: 'RicePower +2. You can weaponise wedding buffets now.',
    apply: ({ player, log }) => {
      player.gainRicePower(2);
      log.push('You hear distant screams of sushi chefs; your RicePower surges.', 'combat');
    }
  },
  {
    id: 'sauna-firewall',
    title: 'Sauna Firewall',
    description: 'Tolerance +1 and heal 4 HP. Steam kisses your pores.',
    apply: ({ player, log }) => {
      player.adjustStat('tolerance', 1);
      player.heal(4);
      log.push('Your pores clap politely as steam fuses with your aura. Tolerance rises.', 'event');
    }
  },
  {
    id: 'flesh-accordion',
    title: 'Flesh Accordion',
    description: 'Groove +1 but Charm -1. Your spine wheezes tango.',
    apply: ({ player, log }) => {
      player.adjustStat('groove', 1);
      player.adjustStat('charm', -1);
      log.push('Your vertebrae start wheezing tango rhythms. Groove+1, Charm-1.', 'event');
    }
  },
  {
    id: 'ghost-of-neverland',
    title: 'Neverland Mirage',
    description: 'Charm +1, RicePower +1. You glow like unethical moonlight.',
    apply: ({ player, log }) => {
      player.adjustStat('charm', 1);
      player.gainRicePower(1);
      log.push('A spectral glove pats your cheek. Charm and RicePower intensify.', 'boss');
    }
  }
];

export class PillCatalog {
  private effectMap = new Map<string, PillEffectDefinition>();

  constructor(private blueprints: PillBlueprint[], rng: RNG) {
    const assignments = rng.shuffle(pillEffects);
    blueprints.forEach((blueprint, index) => {
      const effect = assignments[index % assignments.length];
      this.effectMap.set(blueprint.id, effect);
    });
  }

  createInstance(blueprint: PillBlueprint): PillInstance {
    const effect = this.effectMap.get(blueprint.id);
    if (!effect) {
      throw new Error(`No effect assigned for pill ${blueprint.id}`);
    }

    return {
      blueprint,
      effect,
      identified: false
    };
  }

  createRandomInstance(rng: RNG): PillInstance {
    const blueprint = rng.pick(this.blueprints);
    return this.createInstance(blueprint);
  }

  getBlueprints(): PillBlueprint[] {
    return this.blueprints;
  }
}

export class Inventory {
  private pills: PillInstance[] = [];
  private discoveries = new Map<string, PillEffectDefinition>();
  private riceGrenades = 1;

  constructor(private catalog: PillCatalog) {}

  addPill(pill: PillInstance): void {
    this.pills.push(pill);
  }

  addRandomPill(rng: RNG): PillInstance {
    const pill = this.catalog.createRandomInstance(rng);
    this.addPill(pill);
    return pill;
  }

  getPills(): PillInstance[] {
    return this.pills;
  }

  getDiscoveredEffect(id: string): PillEffectDefinition | undefined {
    return this.discoveries.get(id);
  }

  usePill(index: number, context: PillEffectContext): PillInstance | undefined {
    const pill = this.pills.splice(index, 1)[0];
    if (!pill) {
      return undefined;
    }

    context.log.push(`You swallow ${pill.blueprint.name}. ${pill.blueprint.tagline}`, 'event');
    pill.effect.apply(context);

    if (!pill.identified) {
      this.discoveries.set(pill.blueprint.id, pill.effect);
      pill.identified = true;
      context.log.push(`Identified: ${pill.blueprint.name} → ${pill.effect.title}.`, 'loot');
    }

    return pill;
  }

  hasPills(): boolean {
    return this.pills.length > 0;
  }

  hasRiceGrenade(): boolean {
    return this.riceGrenades > 0;
  }

  getRiceGrenades(): number {
    return this.riceGrenades;
  }

  consumeRiceGrenade(): boolean {
    if (!this.hasRiceGrenade()) {
      return false;
    }

    this.riceGrenades -= 1;
    return true;
  }

  addRiceGrenades(amount: number): void {
    this.riceGrenades += amount;
  }
}
