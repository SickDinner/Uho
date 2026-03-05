import { describe, expect, it } from 'vitest';
import {
  clamp,
  computeMood,
  createSeededRandom,
  inferModeForIntensity,
  seasonPaceModifier,
  squaredDistance,
  planSimulationSteps,
  type NeedsState
} from '../src/genius-life-app.ts';

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
    seqA.forEach((value) => {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    });
  });

  it('planSimulationSteps preserves overflow time when max steps are hit', () => {
    const tickSeconds = 1 / 60;
    const maxSteps = 8;
    const accumulator = tickSeconds * 10.5;

    const plan = planSimulationSteps(accumulator, tickSeconds, maxSteps);

    expect(plan.steps).toBe(8);
    expect(plan.remainingAccumulator).toBeCloseTo(tickSeconds * 2.5, 10);
  });

  it('planSimulationSteps consumes all available steps below the cap', () => {
    const tickSeconds = 1 / 60;
    const plan = planSimulationSteps(tickSeconds * 3.25, tickSeconds, 8);

    expect(plan.steps).toBe(3);
    expect(plan.remainingAccumulator).toBeCloseTo(tickSeconds * 0.25, 10);
  });

  it('planSimulationSteps avoids stepping when maxSteps is zero', () => {
    const tickSeconds = 1 / 60;
    const accumulator = tickSeconds * 5;

    const plan = planSimulationSteps(accumulator, tickSeconds, 0);

    expect(plan.steps).toBe(0);
    expect(plan.remainingAccumulator).toBeCloseTo(accumulator, 10);
  });


  it('seasonPaceModifier maps seasons to expected pace values', () => {
    expect(seasonPaceModifier('kevät')).toBe(1);
    expect(seasonPaceModifier('kesä')).toBe(0.88);
    expect(seasonPaceModifier('syksy')).toBe(1);
    expect(seasonPaceModifier('talvi')).toBe(1.15);
  });

  it('inferModeForIntensity maps values to modes', () => {
    expect(inferModeForIntensity(0.8)).toBe('Calm');
    expect(inferModeForIntensity(0.6)).toBe('Calm');
    expect(inferModeForIntensity(1.0)).toBe('Balanced');
    expect(inferModeForIntensity(1.6)).toBe('Chaos');
    expect(inferModeForIntensity(1.8)).toBe('Chaos');
  });
});
