// 📷 ADVANCED CAMERA SYSTEM
// SNES-inspired camera with smooth scrolling, zooming, and parallax effects

export interface CameraTransform {
  x: number;
  y: number;
  zoom: number;
  rotation: number; // in degrees
}

export interface CameraBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface CameraTarget {
  x: number;
  y: number;
  priority: number; // Higher priority targets take precedence
}

export interface ParallaxLayer {
  id: string;
  image?: HTMLImageElement | HTMLCanvasElement;
  pattern?: CanvasPattern;
  scrollSpeedX: number; // 0 = fixed, 1 = moves with camera, >1 = moves faster than camera
  scrollSpeedY: number;
  depth: number; // 0 = background, 1 = foreground
  opacity: number;
  tileX: boolean;
  tileY: boolean;
  blendMode: GlobalCompositeOperation;
  offsetX: number;
  offsetY: number;
}

export interface CameraConfig {
  // Viewport settings
  width: number;
  height: number;
  
  // Movement settings
  followSpeed: number; // 0-1, how quickly camera follows target
  maxFollowDistance: number; // Maximum distance before camera snaps to target
  
  // Zoom settings
  minZoom: number;
  maxZoom: number;
  zoomSpeed: number;
  
  // Rotation settings
  enableRotation: boolean;
  maxRotation: number; // Maximum rotation in degrees
  rotationSpeed: number;
  
  // Boundaries
  bounds?: CameraBounds;
  
  // Effects
  enableShake: boolean;
  enablePunch: boolean; // Quick zoom in/out effect
  enableTrauma: boolean; // Procedural screen shake based on events
  
  // Deadzone (area where target can move without camera following)
  deadzone: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  
  // Lookahead (camera moves slightly ahead of target's movement)
  lookahead: {
    enabled: boolean;
    distance: number;
    speed: number;
  };
}

export interface CameraEffects {
  // Screen shake
  shake: {
    intensity: number;
    duration: number;
    frequency: number;
    x: number;
    y: number;
  };
  
  // Camera punch (zoom effect)
  punch: {
    intensity: number;
    duration: number;
    zoomAmount: number;
  };
  
  // Trauma system (procedural shake)
  trauma: {
    level: number; // 0-1
    decay: number;
    frequency: number;
  };
  
  // Smooth zoom
  targetZoom: number;
  
  // Smooth rotation
  targetRotation: number;
}

export class AdvancedCamera {
  private config: CameraConfig;
  private transform: CameraTransform;
  private effects: CameraEffects;
  
  // Targets and following
  private targets: CameraTarget[] = [];
  private focusTarget: CameraTarget | null = null;
  
  // Parallax layers
  private parallaxLayers: ParallaxLayer[] = [];
  
  // Internal state
  private lastUpdateTime: number = 0;
  private velocity: { x: number; y: number } = { x: 0, y: 0 };
  private lookaheadOffset: { x: number; y: number } = { x: 0, y: 0 };
  
  // Canvas contexts for rendering
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private backBuffer: HTMLCanvasElement;
  private backCtx: CanvasRenderingContext2D;
  
  constructor(canvas: HTMLCanvasElement, config: Partial<CameraConfig>) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    
    // Create back buffer for smooth rendering
    this.backBuffer = document.createElement('canvas');
    this.backBuffer.width = canvas.width;
    this.backBuffer.height = canvas.height;
    this.backCtx = this.backBuffer.getContext('2d')!;
    
    this.config = {
      width: canvas.width,
      height: canvas.height,
      followSpeed: 0.1,
      maxFollowDistance: 200,
      minZoom: 0.25,
      maxZoom: 4.0,
      zoomSpeed: 0.1,
      enableRotation: false,
      maxRotation: 45,
      rotationSpeed: 0.1,
      enableShake: true,
      enablePunch: true,
      enableTrauma: true,
      deadzone: {
        x: canvas.width * 0.3,
        y: canvas.height * 0.3,
        width: canvas.width * 0.4,
        height: canvas.height * 0.4
      },
      lookahead: {
        enabled: true,
        distance: 50,
        speed: 0.05
      },
      ...config
    };
    
    this.transform = {
      x: 0,
      y: 0,
      zoom: 1,
      rotation: 0
    };
    
    this.effects = {
      shake: {
        intensity: 0,
        duration: 0,
        frequency: 30,
        x: 0,
        y: 0
      },
      punch: {
        intensity: 0,
        duration: 0,
        zoomAmount: 0
      },
      trauma: {
        level: 0,
        decay: 0.8,
        frequency: 50
      },
      targetZoom: 1,
      targetRotation: 0
    };
    
    // Set up pixel-perfect rendering
    this.ctx.imageSmoothingEnabled = false;
    this.backCtx.imageSmoothingEnabled = false;
    
    console.log('📷 Advanced Camera System initialized');
  }
  
  // Target management
  
  public addTarget(target: CameraTarget): void {
    this.targets.push(target);
    this.updateFocusTarget();
  }
  
  public removeTarget(x: number, y: number): void {
    this.targets = this.targets.filter(t => t.x !== x || t.y !== y);
    this.updateFocusTarget();
  }
  
  public updateTarget(oldX: number, oldY: number, newX: number, newY: number): void {
    const target = this.targets.find(t => t.x === oldX && t.y === oldY);
    if (target) {
      target.x = newX;
      target.y = newY;
    }
  }
  
  private updateFocusTarget(): void {
    if (this.targets.length === 0) {
      this.focusTarget = null;
      return;
    }
    
    // Find the highest priority target
    this.focusTarget = this.targets.reduce((highest, current) => 
      current.priority > highest.priority ? current : highest
    );
  }
  
  // Parallax layer management
  
  public addParallaxLayer(layer: ParallaxLayer): void {
    this.parallaxLayers.push(layer);
    // Sort by depth (background to foreground)
    this.parallaxLayers.sort((a, b) => a.depth - b.depth);
  }
  
  public removeParallaxLayer(id: string): void {
    this.parallaxLayers = this.parallaxLayers.filter(layer => layer.id !== id);
  }
  
  public getParallaxLayer(id: string): ParallaxLayer | undefined {
    return this.parallaxLayers.find(layer => layer.id === id);
  }
  
  // Camera controls
  
  public setPosition(x: number, y: number, instant: boolean = false): void {
    if (instant) {
      this.transform.x = x;
      this.transform.y = y;
    } else {
      // Smooth transition will be handled in update
      this.focusTarget = { x, y, priority: 999 };
    }
  }
  
  public setZoom(zoom: number, instant: boolean = false): void {
    zoom = Math.max(this.config.minZoom, Math.min(this.config.maxZoom, zoom));
    
    if (instant) {
      this.transform.zoom = zoom;
    }
    
    this.effects.targetZoom = zoom;
  }
  
  public setRotation(rotation: number, instant: boolean = false): void {
    if (!this.config.enableRotation) return;
    
    // Clamp rotation to max allowed
    rotation = Math.max(-this.config.maxRotation, Math.min(this.config.maxRotation, rotation));
    
    if (instant) {
      this.transform.rotation = rotation;
    }
    
    this.effects.targetRotation = rotation;
  }
  
  public setBounds(bounds: CameraBounds): void {
    this.config.bounds = bounds;
  }
  
  // Effects
  
  public shake(intensity: number, duration: number, frequency: number = 30): void {
    if (!this.config.enableShake) return;
    
    this.effects.shake.intensity = intensity;
    this.effects.shake.duration = duration;
    this.effects.shake.frequency = frequency;
  }
  
  public punch(intensity: number, duration: number): void {
    if (!this.config.enablePunch) return;
    
    this.effects.punch.intensity = intensity;
    this.effects.punch.duration = duration;
    this.effects.punch.zoomAmount = intensity * 0.1; // Scale zoom based on intensity
  }
  
  public addTrauma(amount: number): void {
    if (!this.config.enableTrauma) return;
    
    this.effects.trauma.level = Math.min(1, this.effects.trauma.level + amount);
  }
  
  public update(deltaTime: number): void {
    this.lastUpdateTime += deltaTime;
    const dt = deltaTime / 1000;
    
    // Update camera position
    this.updatePosition(dt);
    
    // Update camera zoom
    this.updateZoom(dt);
    
    // Update camera rotation
    this.updateRotation(dt);
    
    // Update effects
    this.updateEffects(dt);
    
    // Update parallax layers
    this.updateParallaxLayers(dt);
    
    // Apply bounds
    this.applyBounds();
  }
  
  private updatePosition(dt: number): void {
    if (!this.focusTarget) return;
    
    // Calculate target position
    let targetX = this.focusTarget.x - this.config.width / 2;
    let targetY = this.focusTarget.y - this.config.height / 2;
    
    // Apply lookahead
    if (this.config.lookahead.enabled) {
      this.updateLookahead(dt);
      targetX += this.lookaheadOffset.x;
      targetY += this.lookaheadOffset.y;
    }
    
    // Check deadzone
    const deadzone = this.config.deadzone;
    const cameraCenter = {
      x: this.transform.x + this.config.width / 2,
      y: this.transform.y + this.config.height / 2
    };
    
    const inDeadzone = (
      this.focusTarget.x >= cameraCenter.x - deadzone.width / 2 &&
      this.focusTarget.x <= cameraCenter.x + deadzone.width / 2 &&
      this.focusTarget.y >= cameraCenter.y - deadzone.height / 2 &&
      this.focusTarget.y <= cameraCenter.y + deadzone.height / 2
    );
    
    if (!inDeadzone) {
      // Calculate distance to target
      const dx = targetX - this.transform.x;
      const dy = targetY - this.transform.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Snap if too far away
      if (distance > this.config.maxFollowDistance) {
        this.transform.x = targetX;
        this.transform.y = targetY;
      } else {
        // Smooth follow
        this.transform.x += dx * this.config.followSpeed;
        this.transform.y += dy * this.config.followSpeed;
      }
    }
    
    // Update velocity for lookahead
    this.velocity.x = (this.transform.x - this.velocity.x) / dt;
    this.velocity.y = (this.transform.y - this.velocity.y) / dt;
  }
  
  private updateLookahead(dt: number): void {
    const targetOffsetX = this.velocity.x * this.config.lookahead.distance / 1000;
    const targetOffsetY = this.velocity.y * this.config.lookahead.distance / 1000;
    
    this.lookaheadOffset.x += (targetOffsetX - this.lookaheadOffset.x) * this.config.lookahead.speed;
    this.lookaheadOffset.y += (targetOffsetY - this.lookaheadOffset.y) * this.config.lookahead.speed;
  }
  
  private updateZoom(dt: number): void {
    const zoomDiff = this.effects.targetZoom - this.transform.zoom;
    if (Math.abs(zoomDiff) > 0.01) {
      this.transform.zoom += zoomDiff * this.config.zoomSpeed;
    }
    
    // Apply punch effect
    if (this.effects.punch.duration > 0) {
      const punchProgress = 1 - (this.effects.punch.duration / 200); // 200ms punch duration
      const punchZoom = Math.sin(punchProgress * Math.PI) * this.effects.punch.zoomAmount;
      this.transform.zoom += punchZoom;
      
      this.effects.punch.duration -= dt * 1000;
      if (this.effects.punch.duration <= 0) {
        this.effects.punch.intensity = 0;
        this.effects.punch.zoomAmount = 0;
      }
    }
  }
  
  private updateRotation(dt: number): void {
    if (!this.config.enableRotation) return;
    
    const rotationDiff = this.effects.targetRotation - this.transform.rotation;
    if (Math.abs(rotationDiff) > 0.1) {
      this.transform.rotation += rotationDiff * this.config.rotationSpeed;
    }
  }
  
  private updateEffects(dt: number): void {
    // Update screen shake
    if (this.effects.shake.duration > 0) {
      const shakeTime = this.lastUpdateTime * this.effects.shake.frequency / 1000;
      this.effects.shake.x = Math.sin(shakeTime) * this.effects.shake.intensity;
      this.effects.shake.y = Math.cos(shakeTime * 0.7) * this.effects.shake.intensity;
      
      this.effects.shake.duration -= dt * 1000;
      if (this.effects.shake.duration <= 0) {
        this.effects.shake.intensity = 0;
        this.effects.shake.x = 0;
        this.effects.shake.y = 0;
      }
    }
    
    // Update trauma system
    if (this.effects.trauma.level > 0) {
      const traumaTime = this.lastUpdateTime * this.effects.trauma.frequency / 1000;
      const traumaShake = this.effects.trauma.level * this.effects.trauma.level;
      
      this.effects.shake.x += Math.sin(traumaTime) * traumaShake * 10;
      this.effects.shake.y += Math.cos(traumaTime * 0.8) * traumaShake * 10;
      
      this.effects.trauma.level *= this.effects.trauma.decay;
      if (this.effects.trauma.level < 0.01) {
        this.effects.trauma.level = 0;
      }
    }
  }
  
  private updateParallaxLayers(dt: number): void {
    for (const layer of this.parallaxLayers) {
      // Update layer offset based on camera movement and scroll speed
      layer.offsetX = this.transform.x * layer.scrollSpeedX;
      layer.offsetY = this.transform.y * layer.scrollSpeedY;
    }
  }
  
  private applyBounds(): void {
    if (!this.config.bounds) return;
    
    const bounds = this.config.bounds;
    
    this.transform.x = Math.max(bounds.minX, Math.min(bounds.maxX - this.config.width, this.transform.x));
    this.transform.y = Math.max(bounds.minY, Math.min(bounds.maxY - this.config.height, this.transform.y));
  }
  
  // Rendering methods
  
  public beginRender(): void {
    this.backCtx.save();
    
    // Clear back buffer
    this.backCtx.clearRect(0, 0, this.backBuffer.width, this.backBuffer.height);
    
    // Apply camera transform
    this.applyTransform(this.backCtx);
    
    // Render parallax background layers
    this.renderParallaxLayers(false);
  }
  
  public endRender(): void {
    // Render parallax foreground layers
    this.renderParallaxLayers(true);
    
    this.backCtx.restore();
    
    // Copy back buffer to main canvas with effects
    this.ctx.save();
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Apply screen shake to final render
    if (this.effects.shake.x !== 0 || this.effects.shake.y !== 0) {
      this.ctx.translate(this.effects.shake.x, this.effects.shake.y);
    }
    
    this.ctx.drawImage(this.backBuffer, 0, 0);
    this.ctx.restore();
  }
  
  private applyTransform(ctx: CanvasRenderingContext2D): void {
    const centerX = this.config.width / 2;
    const centerY = this.config.height / 2;
    
    // Translate to center
    ctx.translate(centerX, centerY);
    
    // Apply zoom
    ctx.scale(this.transform.zoom, this.transform.zoom);
    
    // Apply rotation
    if (this.transform.rotation !== 0) {
      ctx.rotate(this.transform.rotation * Math.PI / 180);
    }
    
    // Translate by camera position (inverted)
    ctx.translate(-this.transform.x - centerX, -this.transform.y - centerY);
  }
  
  private renderParallaxLayers(foreground: boolean): void {
    for (const layer of this.parallaxLayers) {
      // Skip background layers when rendering foreground and vice versa
      if (foreground && layer.depth < 0.5) continue;
      if (!foreground && layer.depth >= 0.5) continue;
      
      this.renderParallaxLayer(layer);
    }
  }
  
  private renderParallaxLayer(layer: ParallaxLayer): void {
    this.backCtx.save();
    
    this.backCtx.globalAlpha = layer.opacity;
    this.backCtx.globalCompositeOperation = layer.blendMode;
    
    if (layer.image) {
      this.renderParallaxImage(layer);
    } else if (layer.pattern) {
      this.renderParallaxPattern(layer);
    }
    
    this.backCtx.restore();
  }
  
  private renderParallaxImage(layer: ParallaxLayer): void {
    if (!layer.image) return;
    
    const img = layer.image;
    const offsetX = -layer.offsetX + layer.offsetX;
    const offsetY = -layer.offsetY + layer.offsetY;
    
    if (layer.tileX || layer.tileY) {
      // Tile the image
      const startX = layer.tileX ? Math.floor(offsetX / img.width) * img.width : offsetX;
      const startY = layer.tileY ? Math.floor(offsetY / img.height) * img.height : offsetY;
      const endX = layer.tileX ? startX + this.config.width + img.width * 2 : startX + img.width;
      const endY = layer.tileY ? startY + this.config.height + img.height * 2 : startY + img.height;
      
      for (let x = startX; x < endX; x += img.width) {
        for (let y = startY; y < endY; y += img.height) {
          this.backCtx.drawImage(img, x, y);
        }
      }
    } else {
      this.backCtx.drawImage(img, offsetX, offsetY);
    }
  }
  
  private renderParallaxPattern(layer: ParallaxLayer): void {
    if (!layer.pattern) return;
    
    this.backCtx.fillStyle = layer.pattern;
    this.backCtx.fillRect(0, 0, this.config.width, this.config.height);
  }
  
  // Utility methods
  
  public screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    const centerX = this.config.width / 2;
    const centerY = this.config.height / 2;
    
    // Reverse the camera transform
    let worldX = (screenX - centerX) / this.transform.zoom;
    let worldY = (screenY - centerY) / this.transform.zoom;
    
    // Apply rotation (reverse)
    if (this.transform.rotation !== 0) {
      const cos = Math.cos(-this.transform.rotation * Math.PI / 180);
      const sin = Math.sin(-this.transform.rotation * Math.PI / 180);
      const x = worldX * cos - worldY * sin;
      const y = worldX * sin + worldY * cos;
      worldX = x;
      worldY = y;
    }
    
    worldX += this.transform.x + centerX;
    worldY += this.transform.y + centerY;
    
    return { x: worldX, y: worldY };
  }
  
  public worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    const centerX = this.config.width / 2;
    const centerY = this.config.height / 2;
    
    // Apply camera transform
    let screenX = worldX - this.transform.x - centerX;
    let screenY = worldY - this.transform.y - centerY;
    
    // Apply rotation
    if (this.transform.rotation !== 0) {
      const cos = Math.cos(this.transform.rotation * Math.PI / 180);
      const sin = Math.sin(this.transform.rotation * Math.PI / 180);
      const x = screenX * cos - screenY * sin;
      const y = screenX * sin + screenY * cos;
      screenX = x;
      screenY = y;
    }
    
    screenX = screenX * this.transform.zoom + centerX;
    screenY = screenY * this.transform.zoom + centerY;
    
    return { x: screenX, y: screenY };
  }
  
  public isVisible(worldX: number, worldY: number, width: number = 0, height: number = 0): boolean {
    const screenPos = this.worldToScreen(worldX, worldY);
    
    return (
      screenPos.x + width >= 0 &&
      screenPos.x - width <= this.config.width &&
      screenPos.y + height >= 0 &&
      screenPos.y - height <= this.config.height
    );
  }
  
  // Getters
  
  public getTransform(): Readonly<CameraTransform> {
    return { ...this.transform };
  }
  
  public getViewBounds(): { x: number; y: number; width: number; height: number } {
    return {
      x: this.transform.x,
      y: this.transform.y,
      width: this.config.width / this.transform.zoom,
      height: this.config.height / this.transform.zoom
    };
  }
  
  public getFocusTarget(): CameraTarget | null {
    return this.focusTarget;
  }
}

export default AdvancedCamera;
