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

  it('computeFixedStepAdvance treats non-finite tickSeconds as a stable no-op', () => {
    const tickSeconds = 1 / 60;
    const result = computeFixedStepAdvance(0, tickSeconds, 1, Number.NaN, 8, tickSeconds * 100, Number.NaN);

    expect(result.stepsToSimulate).toBe(0);
    expect(result.accumulator).toBe(0);
  });

  it('computeFixedStepAdvance handles non-finite max bounds as zero', () => {
    const result = computeFixedStepAdvance(1, 1, 1, 1 / 60, 8, Number.NaN, 1e-9);

    expect(result.stepsToSimulate).toBe(0);
    expect(result.accumulator).toBe(0);
  });


  it('computeFixedStepAdvance preserves elapsed simulation time beyond the FPS display clamp', () => {
    const tickSeconds = 1 / 60;
    const result = computeFixedStepAdvance(0, 0.5, 1, tickSeconds, 60, 60, 1e-9);

    expect(result.stepsToSimulate).toBe(30);
    expect(result.accumulator).toBe(0);
  });

  it('computeFixedStepAdvance matches tick counts at 30, 60, 120 and 144 FPS at x1', () => {
    const tickSeconds = 1 / 60;

    for (const fps of [30, 60, 120, 144]) {
      let accumulator = 0;
      let ticks = 0;

      for (let frame = 0; frame < fps; frame += 1) {
        const step = computeFixedStepAdvance(accumulator, 1 / fps, 1, tickSeconds, 15, 60, 1e-9);
        accumulator = step.accumulator;
        ticks += step.stepsToSimulate;
      }

      expect(ticks).toBe(60);
      expect(accumulator).toBeCloseTo(0, 9);
    }
  });

  it('computeFixedStepAdvance produces expected one-second totals at x1, x2 and x4', () => {
    const tickSeconds = 1 / 60;

    for (const speed of [1, 2, 4]) {
      let accumulator = 0;
      let ticks = 0;

      for (let frame = 0; frame < 60; frame += 1) {
        const step = computeFixedStepAdvance(
          accumulator,
          1 / 60,
          speed,
          tickSeconds,
          15 * speed,
          60,
          1e-9
        );
        accumulator = step.accumulator;
        ticks += step.stepsToSimulate;
      }

      expect(ticks).toBe(60 * speed);
      expect(accumulator).toBeCloseTo(0, 9);
    }
  });

  it('computeFixedStepAdvance sustains x4 at 30 FPS with the speed-scaled cap', () => {
    const tickSeconds = 1 / 60;
    let accumulator = 0;
    let ticks = 0;

    for (let frame = 0; frame < 30; frame += 1) {
      const step = computeFixedStepAdvance(accumulator, 1 / 30, 4, tickSeconds, 60, 60, 1e-9);
      accumulator = step.accumulator;
      ticks += step.stepsToSimulate;
    }

    expect(ticks).toBe(240);
    expect(accumulator).toBeCloseTo(0, 9);
  });

  it('computeFixedStepAdvance is independent of irregular frame partitioning', () => {
    const tickSeconds = 1 / 60;
    const frames = [0.1, 0.03, 0.2, 0.17, 0.5];
    let accumulator = 0;
    let ticks = 0;

    for (const dt of frames) {
      const step = computeFixedStepAdvance(accumulator, dt, 1, tickSeconds, 60, 60, 1e-9);
      accumulator = step.accumulator;
      ticks += step.stepsToSimulate;
    }

    expect(ticks).toBe(60);
    expect(accumulator).toBeCloseTo(0, 9);
  });

  it('computeFixedStepAdvance drains capped backlog without dropping accumulated time', () => {
    const tickSeconds = 1 / 60;
    let result = computeFixedStepAdvance(0, 2, 1, tickSeconds, 15, 60, 1e-9);
    let ticks = result.stepsToSimulate;

    for (let i = 0; i < 10 && result.accumulator > 0; i += 1) {
      result = computeFixedStepAdvance(result.accumulator, 0, 1, tickSeconds, 15, 60, 1e-9);
      ticks += result.stepsToSimulate;
    }

    expect(ticks).toBe(120);
    expect(result.accumulator).toBeCloseTo(0, 9);
  });

  it('computeFixedStepAdvance rejects NaN and infinite tickSeconds without inventing ticks', () => {
    for (const invalidTick of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      const result = computeFixedStepAdvance(0.25, 1, 1, invalidTick, 60, 60, 1e-9);
      expect(result.stepsToSimulate).toBe(0);
      expect(result.accumulator).toBeCloseTo(0.25, 12);
    }
  });

  it('computeFixedStepAdvance rejects zero and negative tickSeconds without inventing ticks', () => {
    for (const invalidTick of [0, -0, -0.1]) {
      const result = computeFixedStepAdvance(0.25, 1, 1, invalidTick, 60, 60, 1e-9);
      expect(result.stepsToSimulate).toBe(0);
      expect(result.accumulator).toBeCloseTo(0.25, 12);
    }
  });

  it('computeFixedStepAdvance avoids decimal division undercount for 0.3 / 0.1', () => {
    const result = computeFixedStepAdvance(0, 0.3, 1, 0.1, 3, 1, 1e-9);

    expect(result.stepsToSimulate).toBe(3);
    expect(result.accumulator).toBe(0);
  });

  it('computeFixedStepAdvance does not overcount materially sub-tick accumulator values', () => {
    const tickSeconds = 0.1;
    const result = computeFixedStepAdvance(tickSeconds - 1e-6, 0, 1, tickSeconds, 3, 1, 1e-9);

    expect(result.stepsToSimulate).toBe(0);
    expect(result.accumulator).toBeCloseTo(tickSeconds - 1e-6, 12);
  });

  it('computeFixedStepAdvance clamps a near-zero floating remainder to zero', () => {
    const result = computeFixedStepAdvance(0, 0.30000000000000004, 1, 0.1, 3, 1, 1e-9);

    expect(result.stepsToSimulate).toBe(3);
    expect(result.accumulator).toBe(0);
  });

  it('computeFixedStepAdvance floors fractional maxSteps instead of creating an extra tick', () => {
    const tickSeconds = 1 / 60;
    const result = computeFixedStepAdvance(0, tickSeconds * 5, 1, tickSeconds, 2.9, 60, 1e-9);

    expect(result.stepsToSimulate).toBe(2);
    expect(result.accumulator).toBeCloseTo(tickSeconds * 3, 10);
  });

  it('computeFixedStepAdvance treats a negative frame delta as zero elapsed time', () => {
    const result = computeFixedStepAdvance(0.25, -10, 1, 0.1, 60, 60, 1e-9);

    expect(result.stepsToSimulate).toBe(2);
    expect(result.accumulator).toBeCloseTo(0.05, 12);
  });

  it('computeFixedStepAdvance treats negative speed as zero additional simulation time', () => {
    const result = computeFixedStepAdvance(0.25, 10, -4, 0.1, 60, 60, 1e-9);

    expect(result.stepsToSimulate).toBe(2);
    expect(result.accumulator).toBeCloseTo(0.05, 12);
  });

  it('seeded random consumption stays deterministic across 60 FPS and 120 FPS stepping', () => {
    const tickSeconds = 1 / 60;

    const run = (fps: number) => {
      const random = createSeededRandom(72);
      let accumulator = 0;
      let ticks = 0;
      let sample = 0;

      for (let frame = 0; frame < fps; frame += 1) {
        const step = computeFixedStepAdvance(accumulator, 1 / fps, 1, tickSeconds, 15, 60, 1e-9);
        accumulator = step.accumulator;

        for (let i = 0; i < step.stepsToSimulate; i += 1) {
          sample = random();
          ticks += 1;
        }
      }

      return { ticks, sample, accumulator };
    };

    const at60 = run(60);
    const at120 = run(120);

    expect(at60.ticks).toBe(60);
    expect(at120.ticks).toBe(60);
    expect(at60.sample).toBe(at120.sample);
    expect(at60.accumulator).toBeCloseTo(at120.accumulator, 12);
  });

  it('computeFixedStepAdvance keeps the fully-consumed remainder below one tick', () => {
    const tickSeconds = 1 / 60;
    const result = computeFixedStepAdvance(0, tickSeconds * 7.9999999999, 1, tickSeconds, 15, 60, 1e-9);

    expect(result.stepsToSimulate).toBe(8);
    expect(result.accumulator).toBeGreaterThanOrEqual(0);
    expect(result.accumulator).toBeLessThan(tickSeconds);
  });

});
