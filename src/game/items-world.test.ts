import { describe, expect, it, vi } from 'vitest';
import { RNG } from '../core/rng';
import { PillCatalog, Inventory, type PillBlueprint } from './items';
import { World, type ZoneDefinition } from './world';

const blueprints: PillBlueprint[] = [
  { id: 'a', name: 'A', color: '#fff', icon: '●', tagline: 'a' },
  { id: 'b', name: 'B', color: '#000', icon: '●', tagline: 'b' }
];

describe('Inventory.usePill', () => {
  it('does not consume a pill for out-of-range indexes', () => {
    const catalog = new PillCatalog(blueprints, new RNG(1));
    const inventory = new Inventory(catalog);
    inventory.addPill(catalog.createInstance(blueprints[0]));

    const result = inventory.usePill(-1, {
      player: {
        adjustStat: vi.fn(),
        reduceShame: vi.fn(),
        increaseShame: vi.fn(),
        gainRicePower: vi.fn(),
        heal: vi.fn()
      } as any,
      inventory,
      log: { push: vi.fn() } as any,
      rng: new RNG(2)
    });

    expect(result).toBeUndefined();
    expect(inventory.getPills()).toHaveLength(1);
  });

  it('ignores non-positive grenade additions', () => {
    const catalog = new PillCatalog(blueprints, new RNG(1));
    const inventory = new Inventory(catalog);
    const before = inventory.getRiceGrenades();
    inventory.addRiceGrenades(0);
    inventory.addRiceGrenades(-3);
    expect(inventory.getRiceGrenades()).toBe(before);
  });
});

describe('World validation', () => {
  it('rejects non-rectangular layouts', () => {
    const zones: ZoneDefinition[] = [{
      id: 'z',
      name: 'Z',
      description: 'bad',
      layout: ['###', '##'],
      exits: [],
      ambient: []
    }];

    expect(() => new World(zones)).toThrow('layout must be rectangular');
  });

  it('rejects out-of-bounds exits', () => {
    const zones: ZoneDefinition[] = [{
      id: 'z',
      name: 'Z',
      description: 'bad',
      layout: ['###', '###'],
      exits: [{ x: 5, y: 1, to: 'x', spawn: { x: 0, y: 0 }, label: 'nope' }],
      ambient: []
    }];

    expect(() => new World(zones)).toThrow('out-of-bounds exit');
  });
});
