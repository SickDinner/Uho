// Zelda 2-Style Side-Scrolling System with Parallax Backgrounds
// For city exploration and combat areas

import type { Vector2 } from './types.ts';
import { physicsEngine, type PhysicsBody } from './physics.ts';

export interface ParallaxLayer {
  id: string;
  image: HTMLImageElement | HTMLCanvasElement;
  scrollSpeed: number;    // Multiplier for camera movement (0.0 to 1.0+)
  repeatX: boolean;       // Should this layer repeat horizontally?
  repeatY: boolean;       // Should this layer repeat vertically?
  offset: Vector2;        // Additional offset for positioning
  opacity: number;        // Layer opacity (0-1)
  blendMode: string;      // Canvas blend mode
}

export interface SideScrollCamera {
  position: Vector2;
  target: Vector2;        // Camera follows this position
  bounds: {               // Camera movement constraints
    left: number;
    right: number;
    top: number;
    bottom: number;
  };
  
  // Camera behavior
  followSpeed: number;    // How quickly camera follows target (0-1)
  lookAhead: Vector2;     // Offset in direction of movement
  deadZone: {             // Area where target can move without camera moving
    width: number;
    height: number;
  };
  
  // Shake effects
  shake: {
    intensity: number;
    duration: number;
    timeRemaining: number;
  };
  
  // Zoom
  zoom: number;
  targetZoom: number;
  zoomSpeed: number;
}

export interface SideScrollArea {
  id: string;
  name: string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  
  // Visual layers
  parallaxLayers: ParallaxLayer[];
  
  // Physics platforms and collision
  platforms: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    type: 'solid' | 'platform' | 'hazard';
  }>;
  
  // Spawn points and exits
  spawnPoints: Record<string, Vector2>;
  exits: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    destination: string;
    spawnPoint?: string;
  }>;
  
  // Environmental settings
  gravity: number;
  windForce: Vector2;     // Environmental wind/current
  ambientLight: number;   // Lighting level (0-1)
}

export class SideScrollSystem {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private camera: SideScrollCamera;
  private currentArea: SideScrollArea | null = null;
  
  // Player tracking
  private playerId: number | null = null;
  private playerBody: PhysicsBody | null = null;
  
  // Input handling
  private keys: Set<string> = new Set();
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    
    // Initialize camera
    this.camera = {
      position: { x: 0, y: 0 },
      target: { x: 0, y: 0 },
      bounds: {
        left: 0,
        right: 1000,
        top: 0,
        bottom: 400
      },
      followSpeed: 0.1,
      lookAhead: { x: 50, y: 0 },
      deadZone: {
        width: 100,
        height: 50
      },
      shake: {
        intensity: 0,
        duration: 0,
        timeRemaining: 0
      },
      zoom: 1.0,
      targetZoom: 1.0,
      zoomSpeed: 0.05
    };
    
    this.setupInput();
  }

  private setupInput(): void {
    document.addEventListener('keydown', (e) => {
      this.keys.add(e.key.toLowerCase());
    });
    
    document.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase());
    });
  }

  // Set the player character to follow
  setPlayer(playerId: number): void {
    this.playerId = playerId;
    this.playerBody = physicsEngine.getBody(playerId) || null;
  }

  // Load a side-scrolling area
  loadArea(area: SideScrollArea): void {
    this.currentArea = area;
    
    // Set camera bounds based on area
    this.camera.bounds = {
      left: area.bounds.x,
      right: area.bounds.x + area.bounds.width - this.canvas.width,
      top: area.bounds.y,
      bottom: area.bounds.y + area.bounds.height - this.canvas.height
    };
    
    // Create physics platforms
    this.createAreaPlatforms(area);
    
    // Load parallax layers
    this.loadParallaxLayers(area.parallaxLayers);
  }

  private createAreaPlatforms(area: SideScrollArea): void {
    // Clear existing platforms (you'd need to track these IDs)
    // For now, we'll create new ones
    
    area.platforms.forEach((platform, index) => {
      const id = 10000 + index; // Use high IDs for platforms
      physicsEngine.createPlatform(
        id,
        platform.x,
        platform.y,
        platform.width,
        platform.height
      );
    });
  }

  private async loadParallaxLayers(layers: ParallaxLayer[]): Promise<void> {
    // In a real implementation, you'd load images here
    // For now, we'll create colored placeholder layers
    for (const layer of layers) {
      if (!layer.image) {
        // Create a placeholder canvas
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 400;
        const ctx = canvas.getContext('2d')!;
        
        // Create different colored layers based on scroll speed
        if (layer.scrollSpeed < 0.1) {
          // Far background - sky/mountains
          const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
          gradient.addColorStop(0, '#87CEEB'); // Sky blue
          gradient.addColorStop(1, '#98FB98'); // Light green
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else if (layer.scrollSpeed < 0.5) {
          // Mid background - distant buildings
          ctx.fillStyle = '#2F4F4F'; // Dark slate gray
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          // Add some building silhouettes
          for (let i = 0; i < 10; i++) {
            const x = (i * 120) % canvas.width;
            const height = 100 + Math.random() * 150;
            ctx.fillStyle = '#1C1C1C';
            ctx.fillRect(x, canvas.height - height, 80, height);
          }
        } else {
          // Foreground - detailed environment
          ctx.fillStyle = '#8B4513'; // Saddle brown (urban decay)
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        layer.image = canvas;
      }
    }
  }

  // Handle Zelda 2-style input
  handleInput(): void {
    if (!this.playerId || !this.playerBody) return;
    
    let isRunning = this.keys.has('shift');
    
    // Horizontal movement
    if (this.keys.has('a') || this.keys.has('arrowleft')) {
      physicsEngine.moveLeft(this.playerId, isRunning);
    } else if (this.keys.has('d') || this.keys.has('arrowright')) {
      physicsEngine.moveRight(this.playerId, isRunning);
    } else {
      physicsEngine.stopHorizontalMovement(this.playerId);
    }
    
    // Jumping
    if (this.keys.has(' ') || this.keys.has('w') || this.keys.has('arrowup')) {
      physicsEngine.jump(this.playerId);
    }
    
    // Special abilities
    if (this.keys.has('x')) {
      // Attack or use item
      this.handleAttack();
    }
    
    if (this.keys.has('z')) {
      // Secondary action (block, use magic, etc.)
      this.handleSecondaryAction();
    }
  }

  private handleAttack(): void {
    // Implement attack logic here
    // Could create attack hitboxes, play animations, etc.
    if (this.playerBody) {
      this.shakeCamera(5, 200); // Small camera shake on attack
    }
  }

  private handleSecondaryAction(): void {
    // Implement secondary action logic
  }

  // Update camera position
  updateCamera(deltaTime: number): void {
    if (!this.playerBody) return;
    
    const dt = deltaTime / 1000;
    
    // Calculate target position
    let targetX = this.playerBody.position.x - this.canvas.width / 2;
    let targetY = this.playerBody.position.y - this.canvas.height / 2;
    
    // Add look-ahead based on velocity
    if (Math.abs(this.playerBody.velocity.x) > 10) {
      targetX += Math.sign(this.playerBody.velocity.x) * this.camera.lookAhead.x;
    }
    
    // Apply dead zone
    const deadZoneLeft = this.camera.position.x + (this.canvas.width / 2) - (this.camera.deadZone.width / 2);
    const deadZoneRight = this.camera.position.x + (this.canvas.width / 2) + (this.camera.deadZone.width / 2);
    const deadZoneTop = this.camera.position.y + (this.canvas.height / 2) - (this.camera.deadZone.height / 2);
    const deadZoneBottom = this.camera.position.y + (this.canvas.height / 2) + (this.camera.deadZone.height / 2);
    
    if (this.playerBody.position.x > deadZoneLeft && this.playerBody.position.x < deadZoneRight) {
      targetX = this.camera.position.x; // Don't move horizontally
    }
    
    if (this.playerBody.position.y > deadZoneTop && this.playerBody.position.y < deadZoneBottom) {
      targetY = this.camera.position.y; // Don't move vertically
    }
    
    // Constrain to bounds
    targetX = Math.max(this.camera.bounds.left, Math.min(this.camera.bounds.right, targetX));
    targetY = Math.max(this.camera.bounds.top, Math.min(this.camera.bounds.bottom, targetY));
    
    // Smooth camera movement
    this.camera.position.x += (targetX - this.camera.position.x) * this.camera.followSpeed;
    this.camera.position.y += (targetY - this.camera.position.y) * this.camera.followSpeed;
    
    // Update zoom
    if (Math.abs(this.camera.targetZoom - this.camera.zoom) > 0.01) {
      this.camera.zoom += (this.camera.targetZoom - this.camera.zoom) * this.camera.zoomSpeed;
    }
    
    // Update camera shake
    if (this.camera.shake.timeRemaining > 0) {
      this.camera.shake.timeRemaining -= deltaTime;
      
      const shakeX = (Math.random() - 0.5) * this.camera.shake.intensity;
      const shakeY = (Math.random() - 0.5) * this.camera.shake.intensity;
      
      this.camera.position.x += shakeX;
      this.camera.position.y += shakeY;
    }
  }

  // Render the side-scrolling scene
  render(): void {
    if (!this.currentArea) return;
    
    this.ctx.save();
    
    // Apply camera transform
    this.ctx.scale(this.camera.zoom, this.camera.zoom);
    this.ctx.translate(-this.camera.position.x, -this.camera.position.y);
    
    // Render parallax layers (back to front)
    for (const layer of this.currentArea.parallaxLayers) {
      this.renderParallaxLayer(layer);
    }
    
    // Render game objects (handled by main renderer)
    // The main renderer should use the camera position for proper placement
    
    this.ctx.restore();
    
    // Render UI elements (not affected by camera)
    this.renderUI();
  }

  private renderParallaxLayer(layer: ParallaxLayer): void {
    if (!layer.image) return;
    
    this.ctx.save();
    
    // Calculate parallax offset
    const parallaxX = this.camera.position.x * layer.scrollSpeed;
    const parallaxY = this.camera.position.y * layer.scrollSpeed * 0.5; // Less vertical parallax
    
    // Apply layer offset
    const offsetX = parallaxX + layer.offset.x;
    const offsetY = parallaxY + layer.offset.y;
    
    // Set opacity and blend mode
    this.ctx.globalAlpha = layer.opacity;
    this.ctx.globalCompositeOperation = layer.blendMode as GlobalCompositeOperation;
    
    if (layer.repeatX) {
      // Tile horizontally
      const imageWidth = layer.image.width;
      const startX = Math.floor(offsetX / imageWidth) * imageWidth - offsetX;
      const endX = startX + this.canvas.width / this.camera.zoom + imageWidth * 2;
      
      for (let x = startX; x < endX; x += imageWidth) {
        if (layer.repeatY) {
          // Tile vertically too
          const imageHeight = layer.image.height;
          const startY = Math.floor(offsetY / imageHeight) * imageHeight - offsetY;
          const endY = startY + this.canvas.height / this.camera.zoom + imageHeight * 2;
          
          for (let y = startY; y < endY; y += imageHeight) {
            this.ctx.drawImage(layer.image, x, y);
          }
        } else {
          this.ctx.drawImage(layer.image, x, -offsetY);
        }
      }
    } else {
      // Single image
      this.ctx.drawImage(layer.image, -offsetX, -offsetY);
    }
    
    this.ctx.restore();
  }

  private renderUI(): void {
    // Render UI elements that should stay on screen
    // Health bars, ammo counters, etc.
    
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(10, 10, 200, 60);
    
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = '16px monospace';
    this.ctx.fillText('SIDE-SCROLL MODE', 20, 30);
    this.ctx.fillText(`Camera: (${this.camera.position.x.toFixed(0)}, ${this.camera.position.y.toFixed(0)})`, 20, 50);
    
    if (this.playerBody) {
      this.ctx.fillText(`Player: (${this.playerBody.position.x.toFixed(0)}, ${this.playerBody.position.y.toFixed(0)})`, 20, 70);
    }
  }

  // Camera effects
  shakeCamera(intensity: number, duration: number): void {
    this.camera.shake.intensity = intensity;
    this.camera.shake.duration = duration;
    this.camera.shake.timeRemaining = duration;
  }

  setCameraZoom(zoom: number, smooth: boolean = true): void {
    if (smooth) {
      this.camera.targetZoom = zoom;
    } else {
      this.camera.zoom = zoom;
      this.camera.targetZoom = zoom;
    }
  }

  // Get camera position (for other systems to use)
  getCameraPosition(): Vector2 {
    return { ...this.camera.position };
  }

  // Create a sample city area
  static createSampleCityArea(): SideScrollArea {
    return {
      id: 'downtown',
      name: 'Downtown District',
      bounds: {
        x: 0,
        y: 0,
        width: 2000,
        height: 600
      },
      parallaxLayers: [
        {
          id: 'sky',
          image: null as any, // Will be created dynamically
          scrollSpeed: 0.05,
          repeatX: true,
          repeatY: false,
          offset: { x: 0, y: 0 },
          opacity: 1.0,
          blendMode: 'normal'
        },
        {
          id: 'distant_buildings',
          image: null as any,
          scrollSpeed: 0.3,
          repeatX: true,
          repeatY: false,
          offset: { x: 0, y: 50 },
          opacity: 0.8,
          blendMode: 'multiply'
        },
        {
          id: 'foreground',
          image: null as any,
          scrollSpeed: 0.9,
          repeatX: true,
          repeatY: false,
          offset: { x: 0, y: 200 },
          opacity: 0.6,
          blendMode: 'overlay'
        }
      ],
      platforms: [
        // Ground
        { x: 0, y: 550, width: 2000, height: 50, type: 'solid' },
        // Buildings/platforms
        { x: 300, y: 450, width: 100, height: 100, type: 'solid' },
        { x: 500, y: 400, width: 80, height: 150, type: 'solid' },
        { x: 700, y: 350, width: 120, height: 200, type: 'solid' },
        { x: 1000, y: 500, width: 150, height: 50, type: 'platform' },
        { x: 1200, y: 400, width: 100, height: 150, type: 'solid' },
        { x: 1500, y: 480, width: 80, height: 70, type: 'platform' },
      ],
      spawnPoints: {
        'main': { x: 100, y: 500 },
        'upper': { x: 1000, y: 450 },
        'end': { x: 1800, y: 500 }
      },
      exits: [
        {
          x: 1900,
          y: 450,
          width: 50,
          height: 100,
          destination: 'world_map',
          spawnPoint: 'city_exit'
        }
      ],
      gravity: 980,
      windForce: { x: 0, y: 0 },
      ambientLight: 0.7
    };
  }

  update(deltaTime: number): void {
    this.handleInput();
    this.updateCamera(deltaTime);
  }
}

// Export for global access
export let sideScrollSystem: SideScrollSystem | null = null;

export function initializeSideScrollSystem(canvas: HTMLCanvasElement): SideScrollSystem {
  sideScrollSystem = new SideScrollSystem(canvas);
  console.log('🏙️ Side-scrolling system initialized!');
  return sideScrollSystem;
}