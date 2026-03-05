import { describe, expect, it } from 'vitest';
import {
  clamp,
  computeFixedStepAdvance,
  computeMood,
  createSeededRandom,
  inferModeForIntensity,
  seasonPaceModifier,
  squaredDistance,
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


  it('computeFixedStepAdvance yields same tick count for 60fps vs 120fps over one second', () => {
    const tickSeconds = 1 / 60;
    const maxSteps = 8;
    const maxAccum = tickSeconds * 100;
    const epsilon = 1e-9;

    let accumulator60 = 0;
    let ticks60 = 0;
    for (let i = 0; i < 60; i++) {
      const step = computeFixedStepAdvance(accumulator60, 1 / 60, 1, tickSeconds, maxSteps, maxAccum, epsilon);
      accumulator60 = step.accumulator;
      ticks60 += step.stepsToSimulate;
    }

    let accumulator120 = 0;
    let ticks120 = 0;
    for (let i = 0; i < 120; i++) {
      const step = computeFixedStepAdvance(accumulator120, 1 / 120, 1, tickSeconds, maxSteps, maxAccum, epsilon);
      accumulator120 = step.accumulator;
      ticks120 += step.stepsToSimulate;
    }

    expect(ticks60).toBe(60);
    expect(ticks120).toBe(60);
    expect(accumulator60).toBe(0);
    expect(accumulator120).toBe(0);
  });

  it('computeFixedStepAdvance caps steps per frame but keeps remaining backlog', () => {
    const tickSeconds = 1 / 60;
    const result = computeFixedStepAdvance(0, 0.5, 1, tickSeconds, 8, tickSeconds * 100, 1e-9);

    expect(result.stepsToSimulate).toBe(8);
    expect(result.accumulator).toBeCloseTo(0.5 - 8 * tickSeconds, 10);
  });

  it('computeFixedStepAdvance sanitizes invalid values to stable no-op behavior', () => {
    const result = computeFixedStepAdvance(
      Number.NaN,
      -1,
      Number.POSITIVE_INFINITY,
      0,
      -4,
      -10,
      0
    );

    expect(result.stepsToSimulate).toBe(0);
    expect(result.accumulator).toBe(0);
  });

  it('computeFixedStepAdvance clamps incoming accumulator to maxAccumulatedSeconds', () => {
    const tickSeconds = 1 / 60;
    const maxAccum = tickSeconds * 10;
    const result = computeFixedStepAdvance(tickSeconds * 20, 0, 1, tickSeconds, 8, maxAccum, 1e-9);

    expect(result.stepsToSimulate).toBe(8);
    expect(result.accumulator).toBeCloseTo(tickSeconds * 2, 10);
  });

  it('computeFixedStepAdvance handles non-finite epsilon and tickSeconds safely', () => {
    const tickSeconds = 1 / 60;
    const result = computeFixedStepAdvance(0, tickSeconds, 1, Number.NaN, 8, tickSeconds * 100, Number.NaN);

    expect(result.stepsToSimulate).toBe(1);
    expect(result.accumulator).toBe(0);
  });

  it('computeFixedStepAdvance handles non-finite max bounds as zero', () => {
    const result = computeFixedStepAdvance(1, 1, 1, 1 / 60, 8, Number.NaN, 1e-9);

    expect(result.stepsToSimulate).toBe(0);
    expect(result.accumulator).toBe(0);
  });

});
