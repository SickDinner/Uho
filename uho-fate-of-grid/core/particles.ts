export interface Particle {
  x: number;
  y: number;
  vx: number; // velocity x
  vy: number; // velocity y
  life: number; // current life
  maxLife: number; // maximum life
  size: number;
  color: string;
  alpha: number;
}

export interface ParticleEmitter {
  x: number;
  y: number;
  active: boolean;
  particleCount: number;
  emissionRate: number; // particles per second
  lastEmission: number;
  particles: Particle[];
  config: ParticleConfig;
}

export interface ParticleConfig {
  velocity: { min: number; max: number };
  angle: { min: number; max: number }; // in radians
  life: { min: number; max: number }; // in milliseconds
  size: { min: number; max: number };
  colors: string[];
  gravity: number;
  fadeOut: boolean;
}

export class ParticleSystem {
  private emitters: Map<string, ParticleEmitter> = new Map();

  // Predefined particle configs
  static readonly DUST_CLOUD: ParticleConfig = {
    velocity: { min: 0.5, max: 1.5 },
    angle: { min: 0, max: Math.PI * 2 },
    life: { min: 300, max: 600 },
    size: { min: 1, max: 3 },
    colors: ['#8B7355', '#A0522D', '#DEB887'],
    gravity: 0.1,
    fadeOut: true
  };

  static readonly FOOTSTEP_DUST: ParticleConfig = {
    velocity: { min: 0.2, max: 0.8 },
    angle: { min: Math.PI * 0.2, max: Math.PI * 0.8 }, // Upward cone
    life: { min: 200, max: 400 },
    size: { min: 0.5, max: 2 },
    colors: ['#696969', '#778899', '#A9A9A9'],
    gravity: 0.05,
    fadeOut: true
  };

  static readonly MOVEMENT_TRAIL: ParticleConfig = {
    velocity: { min: 0.1, max: 0.3 },
    angle: { min: Math.PI, max: Math.PI * 2 }, // Behind movement direction
    life: { min: 100, max: 200 },
    size: { min: 0.5, max: 1.5 },
    colors: ['#FFFF00', '#FFD700'],
    gravity: 0,
    fadeOut: true
  };

  createEmitter(
    id: string, 
    x: number, 
    y: number, 
    config: ParticleConfig, 
    particleCount: number = 10,
    emissionRate: number = 50
  ): void {
    const emitter: ParticleEmitter = {
      x,
      y,
      active: true,
      particleCount,
      emissionRate,
      lastEmission: performance.now(),
      particles: [],
      config
    };

    this.emitters.set(id, emitter);
  }

  emitParticles(id: string, count: number = 1): void {
    const emitter = this.emitters.get(id);
    if (!emitter || !emitter.active) return;

    for (let i = 0; i < count; i++) {
      if (emitter.particles.length >= emitter.particleCount) break;

      const config = emitter.config;
      const velocity = this.randomBetween(config.velocity.min, config.velocity.max);
      const angle = this.randomBetween(config.angle.min, config.angle.max);
      const life = this.randomBetween(config.life.min, config.life.max);
      const size = this.randomBetween(config.size.min, config.size.max);
      const color = config.colors[Math.floor(Math.random() * config.colors.length)];

      const particle: Particle = {
        x: emitter.x + (Math.random() - 0.5) * 4, // Small spread
        y: emitter.y + (Math.random() - 0.5) * 4,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        life,
        maxLife: life,
        size,
        color,
        alpha: 1.0
      };

      emitter.particles.push(particle);
    }
  }

  update(deltaTime: number): void {
    const currentTime = performance.now();

    this.emitters.forEach((emitter, id) => {
      if (!emitter.active && emitter.particles.length === 0) {
        this.emitters.delete(id);
        return;
      }

      // Update existing particles
      emitter.particles = emitter.particles.filter(particle => {
        // Update position
        particle.x += particle.vx * deltaTime / 16; // Normalize to ~60fps
        particle.y += particle.vy * deltaTime / 16;
        
        // Apply gravity
        particle.vy += emitter.config.gravity * deltaTime / 16;

        // Update life
        particle.life -= deltaTime;

        // Update alpha for fade out
        if (emitter.config.fadeOut) {
          particle.alpha = particle.life / particle.maxLife;
        }

        return particle.life > 0;
      });

      // Emit new particles if active
      if (emitter.active) {
        const timeSinceLastEmission = currentTime - emitter.lastEmission;
        const particlesToEmit = Math.floor((timeSinceLastEmission / 1000) * emitter.emissionRate);

        if (particlesToEmit > 0) {
          this.emitParticles(id, particlesToEmit);
          emitter.lastEmission = currentTime;
        }
      }
    });
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.emitters.forEach(emitter => {
      emitter.particles.forEach(particle => {
        ctx.save();
        ctx.globalAlpha = particle.alpha;
        ctx.fillStyle = particle.color;
        
        // Draw particle as a small circle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
      });
    });
  }

  // Utility methods for common particle effects
  createFootstepDust(x: number, y: number): void {
    const id = `footstep_${Date.now()}_${Math.random()}`;
    this.createEmitter(id, x, y, ParticleSystem.FOOTSTEP_DUST, 5, 0);
    this.emitParticles(id, 3);
    
    // Auto-deactivate after emission
    setTimeout(() => {
      const emitter = this.emitters.get(id);
      if (emitter) {
        emitter.active = false;
      }
    }, 50);
  }
  
  // LEGENDARY 16-BIT EFFECTS! 🎮⚡
  
  // SNES Mode 7 -tyylinen pyörivä efekti
  createMode7Swirl(x: number, y: number): void {
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const particle: Particle = {
        x: x + Math.cos(angle) * 5,
        y: y + Math.sin(angle) * 5,
        vx: Math.cos(angle) * 2,
        vy: Math.sin(angle) * 2,
        life: 800 + Math.random() * 400,
        maxLife: 1200,
        size: 1 + Math.random() * 2,
        color: '#00FFFF',
        alpha: 0.8
      };
      
      const id = `mode7_${Date.now()}_${i}`;
      if (!this.emitters.has(id)) {
        this.createEmitter(id, x, y, {
          velocity: { min: 1, max: 3 },
          angle: { min: angle - 0.2, max: angle + 0.2 },
          life: { min: 600, max: 1000 },
          size: { min: 0.5, max: 2.5 },
          colors: ['#00FFFF', '#FF00FF', '#FFFF00'],
          gravity: 0,
          fadeOut: true
        }, 1, 0);
      }
      
      const emitter = this.emitters.get(id);
      if (emitter) {
        emitter.particles.push(particle);
      }
    }
  }
  
  // Genesis Blast Processing -tyylinen räjähdys
  createGenesisExplosion(x: number, y: number, intensity: number = 1): void {
    const colors = ['#FF4444', '#FF8844', '#FFFF44', '#FFFFFF'];
    const particleCount = Math.floor(16 * intensity);
    
    const id = `genesis_explosion_${Date.now()}`;
    this.createEmitter(id, x, y, {
      velocity: { min: 2 * intensity, max: 6 * intensity },
      angle: { min: 0, max: Math.PI * 2 },
      life: { min: 300, max: 800 },
      size: { min: 1, max: 4 * intensity },
      colors: colors,
      gravity: 0.05,
      fadeOut: true
    }, particleCount, 0);
    
    this.emitParticles(id, particleCount);
    
    // Genesis-tyylinen "flickering" efekti
    let flickerCount = 0;
    const flickerInterval = setInterval(() => {
      const emitter = this.emitters.get(id);
      if (emitter && flickerCount < 5) {
        emitter.particles.forEach(particle => {
          particle.alpha = Math.random() > 0.3 ? particle.alpha : 0;
        });
        flickerCount++;
      } else {
        clearInterval(flickerInterval);
      }
    }, 50);
    
    setTimeout(() => {
      this.stopEmitter(id);
    }, 1000);
  }
  
  // Jaguar-tyylinen smooth particle trail
  createJaguarTrail(x: number, y: number, targetX: number, targetY: number): void {
    const distance = Math.sqrt((targetX - x) ** 2 + (targetY - y) ** 2);
    const steps = Math.floor(distance / 5);
    
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const trailX = x + (targetX - x) * t;
      const trailY = y + (targetY - y) * t;
      
      setTimeout(() => {
        const particle: Particle = {
          x: trailX + (Math.random() - 0.5) * 4,
          y: trailY + (Math.random() - 0.5) * 4,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          life: 400,
          maxLife: 400,
          size: 0.8 + Math.random() * 1.2,
          color: `hsl(${180 + Math.random() * 60}, 100%, 70%)`,
          alpha: 0.6
        };
        
        const id = `jaguar_trail_${Date.now()}_${i}`;
        if (!this.emitters.has(id)) {
          this.createEmitter(id, trailX, trailY, {
            velocity: { min: 0.1, max: 0.5 },
            angle: { min: 0, max: Math.PI * 2 },
            life: { min: 200, max: 600 },
            size: { min: 0.5, max: 1.5 },
            colors: ['#00DDDD', '#0088DD', '#0044DD'],
            gravity: 0,
            fadeOut: true
          }, 1, 0);
        }
        
        const emitter = this.emitters.get(id);
        if (emitter) {
          emitter.particles.push(particle);
        }
      }, i * 20); // Staggered timing for smooth trail
    }
  }

  createMovementTrail(x: number, y: number): void {
    const id = `trail_${Date.now()}_${Math.random()}`;
    this.createEmitter(id, x, y, ParticleSystem.MOVEMENT_TRAIL, 3, 0);
    this.emitParticles(id, 2);
    
    // Auto-deactivate after emission
    setTimeout(() => {
      const emitter = this.emitters.get(id);
      if (emitter) {
        emitter.active = false;
      }
    }, 50);
  }

  stopEmitter(id: string): void {
    const emitter = this.emitters.get(id);
    if (emitter) {
      emitter.active = false;
    }
  }

  removeEmitter(id: string): void {
    this.emitters.delete(id);
  }

  clear(): void {
    this.emitters.clear();
  }

  private randomBetween(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }
}

// Global particle system instance
export const particleSystem = new ParticleSystem();