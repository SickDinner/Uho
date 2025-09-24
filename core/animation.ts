// Easing functions for smooth animations
export const Easing = {
  // Linear
  linear: (t: number): number => t,
  
  // Quadratic
  quadIn: (t: number): number => t * t,
  quadOut: (t: number): number => 1 - (1 - t) * (1 - t),
  quadInOut: (t: number): number => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  
  // Cubic
  cubicIn: (t: number): number => t * t * t,
  cubicOut: (t: number): number => 1 - Math.pow(1 - t, 3),
  cubicInOut: (t: number): number => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  
  // Quartic
  quartIn: (t: number): number => t * t * t * t,
  quartOut: (t: number): number => 1 - Math.pow(1 - t, 4),
  quartInOut: (t: number): number => t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2,
  
  // Elastic
  elasticOut: (t: number): number => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
  
  // Bounce
  bounceOut: (t: number): number => {
    const n1 = 7.5625;
    const d1 = 2.75;
    
    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  },
  
  // 16-BIT CONSOLE CLASSICS! 🎮
  
  // SNES Super FX chip -tyylinen sine wave (F-Zero, Pilotwings)
  snesWave: (t: number): number => {
    return 0.5 * (1 + Math.sin(t * Math.PI - Math.PI / 2));
  },
  
  // Genesis blast processing -tyylinen nopea ramp
  genesisRamp: (t: number): number => {
    // Simulate Genesis VDP's immediate transitions
    return t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t);
  },
  
  // Jaguar 64-bit precision interpolation
  jaguarSmooth: (t: number): number => {
    // Ultra-smooth Jaguar-style curve
    return t * t * t * (t * (t * 6 - 15) + 10);
  },
  
  // SNES Mode 7 rotation curve
  mode7Rotation: (t: number): number => {
    return Math.sin(t * Math.PI * 0.5);
  },
  
  // Genesis dithering effect (steppy)
  genesisDither: (t: number): number => {
    // Simulate Genesis limited precision
    return Math.floor(t * 8) / 8;
  },
  
  // Arcade-style instant pop
  arcadeSnap: (t: number): number => {
    return t < 0.8 ? 0 : 1;
  },
  
  // SNES transparency fade
  snesTransparency: (t: number): number => {
    // SNES had specific transparency levels
    const levels = [0, 0.25, 0.5, 0.75, 1.0];
    const index = Math.floor(t * (levels.length - 1));
    return levels[Math.min(index, levels.length - 1)];
  },
  
  // Retro screen shake decay
  retroShake: (t: number): number => {
    return Math.pow(1 - t, 3) * Math.sin(t * Math.PI * 8);
  }
};

export type EasingFunction = (t: number) => number;

export interface TweenConfig {
  from: number;
  to: number;
  duration: number;
  easing?: EasingFunction;
  onUpdate?: (value: number) => void;
  onComplete?: () => void;
  delay?: number;
}

export class Tween {
  private startTime: number = 0;
  private currentTime: number = 0;
  private isActive: boolean = false;
  private isPaused: boolean = false;
  private hasStarted: boolean = false;
  
  public config: TweenConfig;
  
  constructor(config: TweenConfig) {
    this.config = {
      easing: Easing.quadOut,
      delay: 0,
      ...config
    };
  }
  
  start(): Tween {
    this.startTime = performance.now() + (this.config.delay || 0);
    this.currentTime = 0;
    this.isActive = true;
    this.isPaused = false;
    this.hasStarted = false;
    return this;
  }
  
  pause(): Tween {
    this.isPaused = true;
    return this;
  }
  
  resume(): Tween {
    this.isPaused = false;
    return this;
  }
  
  stop(): Tween {
    this.isActive = false;
    this.isPaused = false;
    return this;
  }
  
  update(currentTime: number): boolean {
    if (!this.isActive || this.isPaused) {
      return this.isActive;
    }
    
    // Check if we should start (handle delay)
    if (!this.hasStarted && currentTime >= this.startTime) {
      this.hasStarted = true;
      this.startTime = currentTime;
    }
    
    if (!this.hasStarted) {
      return true; // Still waiting for start time
    }
    
    const elapsed = currentTime - this.startTime;
    const progress = Math.min(1, elapsed / this.config.duration);
    
    // Apply easing
    const easedProgress = this.config.easing!(progress);
    const currentValue = this.config.from + (this.config.to - this.config.from) * easedProgress;
    
    // Call update callback
    if (this.config.onUpdate) {
      this.config.onUpdate(currentValue);
    }
    
    // Check if complete
    if (progress >= 1) {
      this.isActive = false;
      if (this.config.onComplete) {
        this.config.onComplete();
      }
      return false;
    }
    
    return true;
  }
  
  isRunning(): boolean {
    return this.isActive && !this.isPaused;
  }
  
  getCurrentValue(): number {
    if (!this.hasStarted) return this.config.from;
    
    const elapsed = performance.now() - this.startTime;
    const progress = Math.min(1, elapsed / this.config.duration);
    const easedProgress = this.config.easing!(progress);
    return this.config.from + (this.config.to - this.config.from) * easedProgress;
  }
}

export interface Vector2TweenConfig {
  from: { x: number; y: number };
  to: { x: number; y: number };
  duration: number;
  easing?: EasingFunction;
  onUpdate?: (value: { x: number; y: number }) => void;
  onComplete?: () => void;
  delay?: number;
}

export class Vector2Tween {
  private tweenX: Tween;
  private tweenY: Tween;
  
  constructor(config: Vector2TweenConfig) {
    this.tweenX = new Tween({
      from: config.from.x,
      to: config.to.x,
      duration: config.duration,
      easing: config.easing || Easing.linear,
      delay: config.delay || 0,
      onUpdate: (x) => {
        const y = this.tweenY.getCurrentValue();
        if (config.onUpdate) {
          config.onUpdate({ x, y });
        }
      }
    });
    
    this.tweenY = new Tween({
      from: config.from.y,
      to: config.to.y,
      duration: config.duration,
      easing: config.easing || Easing.linear,
      delay: config.delay || 0,
      ...(config.onComplete && { onComplete: config.onComplete })
    });
  }
  
  start(): Vector2Tween {
    this.tweenX.start();
    this.tweenY.start();
    return this;
  }
  
  pause(): Vector2Tween {
    this.tweenX.pause();
    this.tweenY.pause();
    return this;
  }
  
  resume(): Vector2Tween {
    this.tweenX.resume();
    this.tweenY.resume();
    return this;
  }
  
  stop(): Vector2Tween {
    this.tweenX.stop();
    this.tweenY.stop();
    return this;
  }
  
  update(currentTime: number): boolean {
    const xActive = this.tweenX.update(currentTime);
    const yActive = this.tweenY.update(currentTime);
    return xActive || yActive;
  }
  
  isRunning(): boolean {
    return this.tweenX.isRunning() || this.tweenY.isRunning();
  }
  
  getCurrentValue(): { x: number; y: number } {
    return {
      x: this.tweenX.getCurrentValue(),
      y: this.tweenY.getCurrentValue()
    };
  }
}

export class TweenManager {
  private tweens: Set<Tween | Vector2Tween> = new Set();
  
  add(tween: Tween | Vector2Tween): Tween | Vector2Tween {
    this.tweens.add(tween);
    return tween;
  }
  
  remove(tween: Tween | Vector2Tween): void {
    this.tweens.delete(tween);
  }
  
  update(currentTime: number = performance.now()): void {
    for (const tween of this.tweens) {
      if (!tween.update(currentTime)) {
        this.tweens.delete(tween);
      }
    }
  }
  
  clear(): void {
    for (const tween of this.tweens) {
      tween.stop();
    }
    this.tweens.clear();
  }
  
  pauseAll(): void {
    for (const tween of this.tweens) {
      tween.pause();
    }
  }
  
  resumeAll(): void {
    for (const tween of this.tweens) {
      tween.resume();
    }
  }
  
  getActiveTweenCount(): number {
    return Array.from(this.tweens).filter(tween => tween.isRunning()).length;
  }
}

// Global tween manager instance
export const tweenManager = new TweenManager();

// Utility functions for common animations
export const AnimationUtils = {
  // Fade in/out
  fadeIn: (element: { opacity: number }, duration: number = 300, easing: EasingFunction = Easing.quadOut): Tween => {
    return tweenManager.add(new Tween({
      from: element.opacity,
      to: 1,
      duration,
      easing,
      onUpdate: (value) => { element.opacity = value; }
    })) as Tween;
  },
  
  fadeOut: (element: { opacity: number }, duration: number = 300, easing: EasingFunction = Easing.quadOut): Tween => {
    return tweenManager.add(new Tween({
      from: element.opacity,
      to: 0,
      duration,
      easing,
      onUpdate: (value) => { element.opacity = value; }
    })) as Tween;
  },
  
  // Scale animations
  scaleIn: (element: { scale?: number }, duration: number = 300, easing: EasingFunction = Easing.elasticOut): Tween => {
    element.scale = element.scale || 0;
    return tweenManager.add(new Tween({
      from: element.scale,
      to: 1,
      duration,
      easing,
      onUpdate: (value) => { element.scale = value; }
    })) as Tween;
  },
  
  scaleOut: (element: { scale?: number }, duration: number = 300, easing: EasingFunction = Easing.quadIn): Tween => {
    element.scale = element.scale || 1;
    return tweenManager.add(new Tween({
      from: element.scale,
      to: 0,
      duration,
      easing,
      onUpdate: (value) => { element.scale = value; }
    })) as Tween;
  },
  
  // Pulse effect
  pulse: (element: { scale?: number }, intensity: number = 0.1, duration: number = 500): void => {
    const originalScale = element.scale || 1;
    const targetScale = originalScale + intensity;
    
    const pulseOut = new Tween({
      from: originalScale,
      to: targetScale,
      duration: duration / 2,
      easing: Easing.quadOut,
      onUpdate: (value) => { element.scale = value; },
      onComplete: () => {
        const pulseIn = new Tween({
          from: targetScale,
          to: originalScale,
          duration: duration / 2,
          easing: Easing.quadIn,
          onUpdate: (value) => { element.scale = value; }
        });
        tweenManager.add(pulseIn);
        pulseIn.start();
      }
    });
    
    tweenManager.add(pulseOut);
    pulseOut.start();
  },
  
  // Slide animations
  slideIn: (element: { x: number; y: number }, direction: 'left' | 'right' | 'up' | 'down', distance: number, duration: number = 400): Vector2Tween => {
    let fromX = element.x;
    let fromY = element.y;
    
    switch (direction) {
      case 'left':
        fromX -= distance;
        break;
      case 'right':
        fromX += distance;
        break;
      case 'up':
        fromY -= distance;
        break;
      case 'down':
        fromY += distance;
        break;
    }
    
    const originalX = element.x;
    const originalY = element.y;
    element.x = fromX;
    element.y = fromY;
    
    return tweenManager.add(new Vector2Tween({
      from: { x: fromX, y: fromY },
      to: { x: originalX, y: originalY },
      duration,
      easing: Easing.quadOut,
      onUpdate: (value) => {
        element.x = value.x;
        element.y = value.y;
      }
    })) as Vector2Tween;
  },
  
  // Shake effect
  shake: (element: { x: number; y: number }, intensity: number = 5, duration: number = 300): void => {
    const originalX = element.x;
    const originalY = element.y;
    const startTime = performance.now();
    
    const shakeUpdate = () => {
      const elapsed = performance.now() - startTime;
      const progress = elapsed / duration;
      
      if (progress >= 1) {
        element.x = originalX;
        element.y = originalY;
        return;
      }
      
      const currentIntensity = intensity * (1 - progress);
      element.x = originalX + (Math.random() - 0.5) * currentIntensity * 2;
      element.y = originalY + (Math.random() - 0.5) * currentIntensity * 2;
      
      requestAnimationFrame(shakeUpdate);
    };
    
    shakeUpdate();
  },
  
  // Sequence multiple tweens
  sequence: (tweens: (() => Tween | Vector2Tween)[]): void => {
    if (tweens.length === 0) return;
    
    const runNext = (index: number) => {
      if (index >= tweens.length) return;
      
      const tween = tweens[index]();
      
      // Handle Tween vs Vector2Tween differently since Vector2Tween doesn't have config
      if ('config' in tween) {
        const originalOnComplete = tween.config.onComplete;
        tween.config.onComplete = () => {
          if (originalOnComplete) originalOnComplete();
          runNext(index + 1);
        };
      } else {
        // For Vector2Tween, we need to modify the internal tweenY's onComplete
        const vector2Tween = tween as Vector2Tween;
        const tweenY = (vector2Tween as any).tweenY as Tween;
        const originalOnComplete = tweenY.config.onComplete;
        tweenY.config.onComplete = () => {
          if (originalOnComplete) originalOnComplete();
          runNext(index + 1);
        };
      }
      
      tweenManager.add(tween);
      tween.start();
    };
    
    runNext(0);
  },
  
  // Parallel tweens
  parallel: (tweens: (() => Tween | Vector2Tween)[]): void => {
    for (const createTween of tweens) {
      const tween = createTween();
      tweenManager.add(tween);
      tween.start();
    }
  }
};

// Helper for interpolating between values
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// Helper for interpolating between vectors
export function lerpVector2(a: { x: number; y: number }, b: { x: number; y: number }, t: number): { x: number; y: number } {
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t)
  };
}

// Helper for smoothly interpolating angles
export function lerpAngle(a: number, b: number, t: number): number {
  const diff = ((b - a + Math.PI) % (2 * Math.PI)) - Math.PI;
  return a + diff * t;
}