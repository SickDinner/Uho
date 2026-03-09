import { describe, expect, it } from 'vitest';
import { clamp, computeMood, createSeededRandom, squaredDistance, type NeedsState } from '../src/genius-life-app.ts';

describe('genius-life-app helpers', () => {
  it('clamp keeps values in bounds', () => {
    expect(clamp(12, 0, 10)).toBe(10);
    expect(clamp(-4, 0, 10)).toBe(0);
    expect(clamp(7, 0, 10)).toBe(7);
  });

  it('squaredDistance avoids sqrt and returns stable values', () => {
    expect(squaredDistance(0, 0, 3, 4)).toBe(25);
    expect(squaredDistance(10, 5, 10, 5)).toBe(0);
  });

  it('computeMood applies profession bonus and clamps max', () => {
    const goodNeeds: NeedsState = { energy: 95, social: 90, curiosity: 96, health: 94 };
    expect(computeMood(goodNeeds, 'Taiteilija')).toBe(95.75);

    const peakNeeds: NeedsState = { energy: 100, social: 100, curiosity: 100, health: 100 };
    expect(computeMood(peakNeeds, 'Taiteilija')).toBe(100);
  });

  it('createSeededRandom produces deterministic sequence', () => {
    const a = createSeededRandom(12345);
    const b = createSeededRandom(12345);

    const seqA = [a(), a(), a()];
    const seqB = [b(), b(), b()];

    expect(seqA).toEqual(seqB);
  });
});
