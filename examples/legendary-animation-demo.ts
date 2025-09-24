/**
 * 🎮 LEGENDARY 16-BIT ANIMATION SYSTEM DEMO 🎮
 * 
 * Demonstroi kaikkien 16-bitin animaatio-ominaisuuksien käyttöä:
 * 
 * 🔥 SNES Mode 7 efektit
 * ⚡ Genesis Blast Processing
 * 🚀 Jaguar 64-bit matematiikka
 * 💫 Hardware-accurate partikkelit
 * 🎵 Audio-synkronoitu animaatio
 * 
 * ULTIMATE RETRO DEMO! ⚡🔥🎨
 */

import { 
  SuperFXMath, 
  BlastProcessingEngine, 
  JaguarVectorMath, 
  Mode7Transform 
} from '../core/legendary-animation.ts';

import { 
  LegendaryParticleSystem, 
  legendaryParticles 
} from '../core/legendary-particles.ts';

import { 
  LegendaryAudioSync, 
  legendaryAudioSync 
} from '../core/legendary-audio-sync.ts';

import { Easing } from '../core/animation.ts';
import { particleSystem } from '../core/particles.ts';

// =============================================================================
// 🎮 LEGENDARY DEMO CLASS
// =============================================================================

export class LegendaryAnimationDemo {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private running = false;
  private lastTime = 0;
  
  // Demo objects
  private demoObjects: Array<{
    id: string;
    x: number;
    y: number;
    scale: number;
    rotation: number;
    color: string;
    type: 'sprite' | 'particle' | 'text';
    animationType: 'snes' | 'genesis' | 'jaguar';
  }> = [];
  
  // Mode 7 background
  private mode7Transform: Mode7Transform = {
    x: 0,
    y: 0,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    skewX: 0,
    skewY: 0,
    centerX: 400,
    centerY: 300
  };
  
  // Audio context for demo
  private audioContext?: AudioContext;
  private audioElement?: HTMLAudioElement;
  
  // Performance stats
  private frameCount = 0;
  private lastFPSCheck = 0;
  private currentFPS = 0;
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.ctx.imageSmoothingEnabled = false; // Pixel-perfect
    
    this.initializeDemoObjects();
    this.setupAudioSync();
    
    console.log('🎮 LEGENDARY ANIMATION DEMO initialized!');
  }
  
  private initializeDemoObjects(): void {
    // SNES-style rotating sprites
    for (let i = 0; i < 4; i++) {
      this.demoObjects.push({
        id: `snes_sprite_${i}`,
        x: 200 + i * 100,
        y: 150,
        scale: 1,
        rotation: 0,
        color: `hsl(${i * 90}, 100%, 50%)`,
        type: 'sprite',
        animationType: 'snes'
      });
    }
    
    // Genesis-style fast objects
    for (let i = 0; i < 6; i++) {
      this.demoObjects.push({
        id: `genesis_object_${i}`,
        x: 100 + i * 80,
        y: 300,
        scale: 0.8 + Math.random() * 0.4,
        rotation: 0,
        color: `hsl(${30 + i * 30}, 80%, 60%)`,
        type: 'sprite',
        animationType: 'genesis'
      });
    }
    
    // Jaguar-style smooth objects
    for (let i = 0; i < 3; i++) {
      this.demoObjects.push({
        id: `jaguar_object_${i}`,
        x: 250 + i * 150,
        y: 450,
        scale: 1.2,
        rotation: 0,
        color: `hsl(${200 + i * 40}, 90%, 70%)`,
        type: 'sprite',
        animationType: 'jaguar'
      });
    }
  }
  
  private setupAudioSync(): void {
    try {
      this.audioContext = new AudioContext();
      
      // Setup audio for demo (optional)
      this.audioElement = new Audio();
      this.audioElement.crossOrigin = 'anonymous';
      this.audioElement.loop = true;
      
      // Connect audio to sync engine if available
      if (this.audioElement) {
        const source = this.audioContext.createMediaElementSource(this.audioElement);
        legendaryAudioSync.connectAudioSource(source);
        
        // Add demo objects to audio sync
        this.demoObjects.forEach(obj => {
          let config;
          switch (obj.animationType) {
            case 'snes':
              config = LegendaryAudioSync.getFZeroConfig();
              break;
            case 'genesis':
              config = LegendaryAudioSync.getStreetsOfRageConfig();
              break;
            case 'jaguar':
              config = LegendaryAudioSync.getJaguarSmoothConfig();
              break;
          }
          
          if (config) {
            legendaryAudioSync.addSyncTarget(obj.id, obj, config);
          }
        });
      }
    } catch (error) {
      console.warn('Audio sync setup failed, continuing without audio:', error);
    }
  }
  
  // Start the demo
  start(): void {
    if (this.running) return;
    
    this.running = true;
    this.lastTime = performance.now();
    
    // Start particle effects
    this.startParticleDemo();
    
    // Start audio if available
    if (this.audioElement) {
      this.audioElement.play().catch(e => console.log('Auto-play blocked, click to start audio'));
    }
    
    // Start main loop
    this.loop();
    
    console.log('🚀 LEGENDARY DEMO started!');
  }
  
  // Stop the demo
  stop(): void {
    this.running = false;
    
    if (this.audioElement) {
      this.audioElement.pause();
    }
    
    legendaryParticles.clear();
    particleSystem.clear();
    
    console.log('⏹️ LEGENDARY DEMO stopped!');
  }
  
  private startParticleDemo(): void {
    // Create various particle effects every 2 seconds
    setInterval(() => {
      if (!this.running) return;
      
      const x = Math.random() * this.canvas.width;
      const y = Math.random() * this.canvas.height;
      
      // Randomly choose effect type
      const effectType = Math.floor(Math.random() * 4);
      
      switch (effectType) {
        case 0:
          // SNES Mode 7 swirl
          particleSystem.createMode7Swirl(x, y);
          break;
        case 1:
          // Genesis explosion
          particleSystem.createGenesisExplosion(x, y, 0.8 + Math.random() * 0.4);
          break;
        case 2:
          // Jaguar trail
          const targetX = Math.random() * this.canvas.width;
          const targetY = Math.random() * this.canvas.height;
          particleSystem.createJaguarTrail(x, y, targetX, targetY);
          break;
        case 3:
          // Legendary particles
          legendaryParticles.createSparkles(x, y, 10 + Math.floor(Math.random() * 10));
          break;
      }
    }, 2000);
  }
  
  // Main animation loop
  private loop = (): void => {
    if (!this.running) return;
    
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    
    // Update systems
    this.update(deltaTime);
    
    // Render frame
    this.render();
    
    // Update performance stats
    this.updateStats(currentTime);
    
    // Continue loop
    requestAnimationFrame(this.loop);
  };
  
  private update(deltaTime: number): void {
    // Update Mode 7 background transformation
    this.updateMode7Background(deltaTime);
    
    // Update demo objects with different animation styles
    this.updateDemoObjects(deltaTime);
    
    // Update particle systems
    particleSystem.update(deltaTime);
    legendaryParticles.update(deltaTime);
    
    // Update audio sync
    legendaryAudioSync.update(deltaTime);
  }
  
  private updateMode7Background(deltaTime: number): void {
    // SNES F-Zero style rotating background
    this.mode7Transform.rotation += 0.005 * (deltaTime / 16);
    this.mode7Transform.scaleX = 1 + 0.2 * SuperFXMath.fastSin(performance.now() * 0.001);
    this.mode7Transform.scaleY = 1 + 0.2 * SuperFXMath.fastCos(performance.now() * 0.001);
    
    // Add some skew for extra Mode 7 effect\n    this.mode7Transform.skewX = 0.1 * SuperFXMath.fastSin(performance.now() * 0.0007);\n    this.mode7Transform.skewY = 0.1 * SuperFXMath.fastCos(performance.now() * 0.0009);\n  }\n  \n  private updateDemoObjects(deltaTime: number): void {\n    const time = performance.now();\n    \n    this.demoObjects.forEach((obj, index) => {\n      switch (obj.animationType) {\n        case 'snes':\n          // SNES Mode 7 style movement\n          const angle = (time * 0.001) + (index * Math.PI / 2);\n          obj.x = 400 + 100 * SuperFXMath.fastCos(angle);\n          obj.y = 150 + 50 * SuperFXMath.fastSin(angle);\n          obj.rotation += 0.02 * (deltaTime / 16);\n          obj.scale = 1 + 0.3 * SuperFXMath.fastSin(time * 0.002 + index);\n          break;\n          \n        case 'genesis':\n          // Genesis blast processing style (fast, steppy)\n          obj.x += Easing.genesisRamp((time * 0.001 + index) % 1) * 2 - 1;\n          obj.y += Easing.genesisDither((time * 0.0007 + index) % 1) * 2 - 1;\n          \n          // Keep within bounds\n          if (obj.x < 0 || obj.x > this.canvas.width) {\n            obj.x = Math.max(0, Math.min(this.canvas.width, obj.x));\n          }\n          if (obj.y < 200 || obj.y > 400) {\n            obj.y = Math.max(200, Math.min(400, obj.y));\n          }\n          \n          obj.rotation += 0.05 * (deltaTime / 16);\n          obj.scale = 0.8 + 0.4 * Easing.arcadeSnap((time * 0.003 + index) % 1);\n          break;\n          \n        case 'jaguar':\n          // Jaguar ultra-smooth 64-bit precision\n          const t = (time * 0.0005 + index * 0.3) % 1;\n          const smoothT = JaguarVectorMath.smoothInterpolate(0, 1, t, 'quintic');\n          \n          obj.x = 150 + 400 * smoothT;\n          obj.y = 450 + 30 * Easing.jaguarSmooth(Math.sin(time * 0.002 + index));\n          obj.rotation = smoothT * Math.PI * 2;\n          obj.scale = 1 + 0.5 * Easing.jaguarSmooth(smoothT);\n          break;\n      }\n      \n      // Update color based on animation type\n      const hueShift = (time * 0.05 + index * 30) % 360;\n      obj.color = `hsl(${hueShift}, 80%, 60%)`;\n    });\n  }\n  \n  private render(): void {\n    // Clear with dark background\n    this.ctx.fillStyle = '#0a0a0a';\n    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);\n    \n    // Draw Mode 7 background grid\n    this.renderMode7Background();\n    \n    // Render particles\n    particleSystem.render(this.ctx);\n    legendaryParticles.render(this.ctx);\n    \n    // Render demo objects\n    this.renderDemoObjects();\n    \n    // Render UI and stats\n    this.renderUI();\n  }\n  \n  private renderMode7Background(): void {\n    this.ctx.save();\n    this.ctx.strokeStyle = 'rgba(0, 100, 200, 0.3)';\n    this.ctx.lineWidth = 1;\n    \n    // Draw transformed grid lines\n    const gridSize = 40;\n    for (let x = -200; x < this.canvas.width + 200; x += gridSize) {\n      for (let y = -200; y < this.canvas.height + 200; y += gridSize) {\n        const transformed = SuperFXMath.mode7Transform(x, y, this.mode7Transform);\n        \n        if (transformed.x > -50 && transformed.x < this.canvas.width + 50 &&\n            transformed.y > -50 && transformed.y < this.canvas.height + 50) {\n          \n          this.ctx.beginPath();\n          this.ctx.arc(transformed.x, transformed.y, 1, 0, Math.PI * 2);\n          this.ctx.stroke();\n        }\n      }\n    }\n    \n    this.ctx.restore();\n  }\n  \n  private renderDemoObjects(): void {\n    this.demoObjects.forEach(obj => {\n      this.ctx.save();\n      \n      // Apply transformation\n      this.ctx.translate(obj.x, obj.y);\n      this.ctx.rotate(obj.rotation);\n      this.ctx.scale(obj.scale, obj.scale);\n      \n      // Draw object based on type\n      switch (obj.type) {\n        case 'sprite':\n          this.ctx.fillStyle = obj.color;\n          this.ctx.fillRect(-10, -10, 20, 20);\n          \n          // Add console-specific styling\n          switch (obj.animationType) {\n            case 'snes':\n              // SNES-style rounded corners\n              this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';\n              this.ctx.fillRect(-8, -8, 16, 16);\n              break;\n            case 'genesis':\n              // Genesis-style sharp edges with dithering\n              this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';\n              for (let i = 0; i < 4; i++) {\n                if (Math.random() > 0.5) {\n                  this.ctx.fillRect(-10 + i * 5, -10, 2, 20);\n                }\n              }\n              break;\n            case 'jaguar':\n              // Jaguar-style smooth gradients\n              const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, 15);\n              gradient.addColorStop(0, obj.color);\n              gradient.addColorStop(1, 'rgba(0, 0, 0, 0.5)');\n              this.ctx.fillStyle = gradient;\n              this.ctx.fillRect(-12, -12, 24, 24);\n              break;\n          }\n          break;\n          \n        case 'text':\n          this.ctx.fillStyle = obj.color;\n          this.ctx.font = '16px monospace';\n          this.ctx.textAlign = 'center';\n          this.ctx.fillText(obj.animationType.toUpperCase(), 0, 0);\n          break;\n      }\n      \n      this.ctx.restore();\n    });\n  }\n  \n  private renderUI(): void {\n    this.ctx.save();\n    \n    // Background for stats\n    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';\n    this.ctx.fillRect(10, 10, 300, 120);\n    \n    // Title\n    this.ctx.fillStyle = '#00ff00';\n    this.ctx.font = 'bold 16px monospace';\n    this.ctx.textAlign = 'left';\n    this.ctx.fillText('🎮 LEGENDARY 16-BIT ANIMATION DEMO', 15, 30);\n    \n    // Stats\n    this.ctx.fillStyle = '#ffffff';\n    this.ctx.font = '12px monospace';\n    \n    const stats = [\n      `FPS: ${this.currentFPS}`,\n      `Objects: ${this.demoObjects.length}`,\n      `Particles: ${particleSystem.getStats ? 'Active' : 'N/A'}`,\n      `Audio Sync: ${legendaryAudioSync.getStats().syncTargets} targets`,\n      `Mode 7: ${this.mode7Transform.rotation.toFixed(2)} rad`,\n      `Console Modes: SNES + Genesis + Jaguar`\n    ];\n    \n    stats.forEach((stat, index) => {\n      this.ctx.fillText(stat, 15, 50 + index * 15);\n    });\n    \n    // Legend\n    this.ctx.fillStyle = '#cccccc';\n    this.ctx.font = '10px monospace';\n    this.ctx.fillText('🔥 SNES (Mode 7)  ⚡ Genesis (Blast)  🚀 Jaguar (64-bit)', 15, this.canvas.height - 10);\n    \n    this.ctx.restore();\n  }\n  \n  private updateStats(currentTime: number): void {\n    this.frameCount++;\n    \n    if (currentTime - this.lastFPSCheck >= 1000) {\n      this.currentFPS = this.frameCount;\n      this.frameCount = 0;\n      this.lastFPSCheck = currentTime;\n    }\n  }\n  \n  // Load audio file for sync demo\n  loadAudio(audioUrl: string): void {\n    if (this.audioElement) {\n      this.audioElement.src = audioUrl;\n      console.log('🎵 Audio loaded for sync demo:', audioUrl);\n    }\n  }\n  \n  // Enable/disable specific console modes\n  setConsoleMode(console: 'snes' | 'genesis' | 'jaguar', enabled: boolean): void {\n    this.demoObjects.forEach(obj => {\n      if (obj.animationType === console) {\n        obj.type = enabled ? 'sprite' : 'text';\n      }\n    });\n    \n    console.log(`${console.toUpperCase()} mode: ${enabled ? 'ENABLED' : 'DISABLED'}`);\n  }\n  \n  // Get demo statistics\n  getStats(): {\n    fps: number;\n    objects: number;\n    particles: any;\n    audioSync: any;\n    mode7: Mode7Transform;\n  } {\n    return {\n      fps: this.currentFPS,\n      objects: this.demoObjects.length,\n      particles: legendaryParticles.getStats(),\n      audioSync: legendaryAudioSync.getStats(),\n      mode7: this.mode7Transform\n    };\n  }\n}\n\n// Usage example\nexport function createLegendaryDemo(canvasId: string): LegendaryAnimationDemo {\n  const canvas = document.getElementById(canvasId) as HTMLCanvasElement;\n  if (!canvas) {\n    throw new Error(`Canvas element '${canvasId}' not found`);\n  }\n  \n  const demo = new LegendaryAnimationDemo(canvas);\n  \n  console.log('🎮 LEGENDARY ANIMATION DEMO created!');\n  console.log('Use demo.start() to begin the show!');\n  console.log('Use demo.loadAudio(url) to enable audio sync!');\n  \n  return demo;\n}