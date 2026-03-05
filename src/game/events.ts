import type { GameLog } from '../core/log';
import type { RNG } from '../core/rng';
import type { Inventory } from './items';
import type { Player } from './player';

interface EventContext {
  zoneId: string;
  player: Player;
  inventory: Inventory;
  log: GameLog;
  rng: RNG;
}

interface EventDefinition {
  message: string | ((context: EventContext) => string);
  category?: Parameters<GameLog['push']>[1];
  effect?: (context: EventContext) => void;
}

const baseEvents: EventDefinition[] = [
  {
    message: 'You slipped on a condom full of rice! HP -2, RicePower +1.',
    category: 'event',
    effect: ({ player }) => {
      player.takeDamage(2);
      player.gainRicePower(1);
    }
  },
  {
    message: 'An alley seagull baptises you with glitter puke. Charm +1.',
    category: 'event',
    effect: ({ player }) => {
      player.adjustStat('charm', 1);
    }
  },
  {
    message: 'A vending machine howls “Mikä ikä?!” Shame +1.',
    category: 'event',
    effect: ({ player }) => {
      player.increaseShame(1);
    }
  },
  {
    message: 'A feral accordion trio grants you Groove +1.',
    category: 'event',
    effect: ({ player }) => {
      player.adjustStat('groove', 1);
    }
  },
  {
    message: 'You inhale recycled sauna steam. Heal 2 HP.',
    category: 'event',
    effect: ({ player }) => {
      player.heal(2);
    }
  }
];

const zoneEvents: Record<string, EventDefinition[]> = {
  'torkyturpa-bar': [
    {
      message: 'Bartender sprays you with tar-lonkero mist. Tolerance +1, Shame +1.',
      effect: ({ player }) => {
        player.adjustStat('tolerance', 1);
        player.increaseShame(1);
      }
    },
    {
      message: ({ inventory, rng }) => {
        const pill = inventory.addRandomPill(rng);
        return `A bouncer slips ${pill.blueprint.name} into your pocket muttering “Luota kohtaloon”.`;
      },
      category: 'loot'
    }
  ],
  'karpas-alley': [
    {
      message: 'Fly mafia levies a buzz-tax. Shame +1, Groove -1.',
      effect: ({ player }) => {
        player.increaseShame(1);
        player.adjustStat('groove', -1);
      }
    },
    {
      message: 'You find a rice grenade in a puddle of lipstick. +1 Rice Grenade.',
      category: 'loot',
      effect: ({ inventory }) => {
        inventory.addRiceGrenades(1);
      }
    }
  ],
  'korppi-sauna': [
    {
      message: 'Steam condenses into a judgemental raven. Tolerance -1.',
      effect: ({ player }) => {
        player.adjustStat('tolerance', -1);
      }
    },
    {
      message: 'You lick eucalyptus off the bench. Heal 3 HP.',
      effect: ({ player }) => {
        player.heal(3);
      }
    }
  ],
  'hautajais-church': [
    {
      message: 'A widow catapults rice at your face. RicePower +1.',
      effect: ({ player }) => {
        player.gainRicePower(1);
      }
    },
    {
      message: 'You absorb gothic organ bass. Groove +1, Shame -1.',
      effect: ({ player }) => {
        player.adjustStat('groove', 1);
        player.reduceShame(1);
      }
    }
  ],
  'teekeri-den': [
    {
      message: 'Teekeri scribbles Confucian kanji on your forehead. Charm +1.',
      effect: ({ player }) => {
        player.adjustStat('charm', 1);
      }
    },
    {
      message: 'Kombucha spores invade your lungs. Tolerance +1, HP -1.',
      effect: ({ player }) => {
        player.adjustStat('tolerance', 1);
        player.takeDamage(1);
      }
    }
  ]
};

export class EventDirector {
  private cooldown = 0;

  constructor(private rng: RNG) {}

  tick(zoneId: string, player: Player, inventory: Inventory, log: GameLog): void {
    if (this.cooldown > 0) {
      this.cooldown -= 1;
      return;
    }

    if (this.rng.random() > 0.35) {
      return;
    }

    const events = [...baseEvents, ...(zoneEvents[zoneId] ?? [])];
    if (events.length === 0) {
      return;
    }

    const event = this.rng.pick(events);
    const context: EventContext = { zoneId, player, inventory, log, rng: this.rng };
    const message = typeof event.message === 'function' ? event.message(context) : event.message;
    log.push(message, event.category ?? 'event');
    event.effect?.(context);
    this.cooldown = 2;
  }
}
