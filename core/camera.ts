import type { Vector2, EntityId } from './types.ts';
import { Transform } from './components.ts';
import { ComponentManager } from './ecs.ts';

export interface CameraConfig {
  width: number;
  height: number;
  tileSize: number;
  smoothing: number; // 0-1, higher = more smoothing
  deadZone: Vector2; // Area where player can move without camera following
  maxDistance: Vector2; // Maximum distance camera can be from target
}

export type CameraMode = 'follow' | 'fixed' | 'smooth_follow' | 'locked';

export class Camera {
  // Current camera position (in world coordinates)
  public x: number = 0;
  public y: number = 0;
  
  // Visual position for smooth animations
  public visualX: number = 0;
  public visualY: number = 0;
  
  // Target position (what the camera wants to look at)
  public targetX: number = 0;
  public targetY: number = 0;
  
  // Camera configuration
  public config: CameraConfig;
  
  // Camera state
  public mode: CameraMode = 'smooth_follow';
  public followTarget?: EntityId;
  public isShaking: boolean = false;
  
  // Shake effect properties
  private shakeIntensity: number = 0;
  private shakeDuration: number = 0;
  private shakeTimer: number = 0;
  private shakeOffsetX: number = 0;
  private shakeOffsetY: number = 0;
  
  // Zoom properties
  public zoom: number = 1;
  public targetZoom: number = 1;
  public zoomSpeed: number = 0.05;
  
  constructor(config: Partial<CameraConfig> = {}) {
    this.config = {
      width: 800,
      height: 600,
      tileSize: 10,
      smoothing: 0.1,
      deadZone: { x: 50, y: 50 },
      maxDistance: { x: 200, y: 200 },
      ...config
    };
    
    this.visualX = this.x;
    this.visualY = this.y;
  }
  
  // Set the target for the camera to follow
  setTarget(entityId: EntityId): void {
    this.followTarget = entityId;
  }
  
  // Set camera mode
  setMode(mode: CameraMode): void {
    this.mode = mode;
  }
  
  // Set camera position immediately
  setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.visualX = x;
    this.visualY = y;
    this.targetX = x;
    this.targetY = y;
  }
  
  // Set target position for smooth movement
  setTargetPosition(x: number, y: number): void {
    this.targetX = x;
    this.targetY = y;
  }
  
  // Update camera position and effects
  update(deltaTime: number, componentManager: ComponentManager): void {
    // Update target position based on follow target
    if (this.followTarget && this.mode !== 'fixed' && this.mode !== 'locked') {
      const transform = componentManager.getComponent(this.followTarget, Transform);
      if (transform) {
        this.updateFollowTarget(transform, deltaTime);
      }
    }
    
    // Update camera position based on mode
    switch (this.mode) {
      case 'follow':
        this.x = this.targetX;
        this.y = this.targetY;
        break;
        
      case 'smooth_follow':
        this.updateSmoothFollow(deltaTime);
        break;
        
      case 'fixed':
      case 'locked':
        // No movement
        break;
    }
    
    // Update visual position with zoom consideration
    this.visualX = this.x;
    this.visualY = this.y;
    
    // Apply screen shake
    if (this.isShaking) {
      this.updateScreenShake(deltaTime);
    }
    
    // Update zoom
    this.updateZoom(deltaTime);
  }
  
  private updateFollowTarget(transform: Transform, deltaTime: number): void {
    const visualPos = transform.getVisualPosition();
    
    // Calculate world position of target
    const targetWorldX = visualPos.x * this.config.tileSize;
    const targetWorldY = visualPos.y * this.config.tileSize;
    
    // Calculate camera center
    const cameraCenterX = this.x + (this.config.width / 2) / this.zoom;
    const cameraCenterY = this.y + (this.config.height / 2) / this.zoom;
    
    // Calculate distance from camera center to target
    const distanceX = targetWorldX - cameraCenterX;
    const distanceY = targetWorldY - cameraCenterY;
    
    // Apply dead zone - only move camera if target is outside dead zone
    let newTargetX = this.targetX;
    let newTargetY = this.targetY;
    
    if (Math.abs(distanceX) > this.config.deadZone.x) {
      newTargetX = targetWorldX - (this.config.width / 2) / this.zoom;
      // Clamp to max distance
      const maxDistX = this.config.maxDistance.x;
      newTargetX = Math.max(this.x - maxDistX, Math.min(this.x + maxDistX, newTargetX));
    }
    
    if (Math.abs(distanceY) > this.config.deadZone.y) {
      newTargetY = targetWorldY - (this.config.height / 2) / this.zoom;
      // Clamp to max distance
      const maxDistY = this.config.maxDistance.y;
      newTargetY = Math.max(this.y - maxDistY, Math.min(this.y + maxDistY, newTargetY));
    }
    
    this.setTargetPosition(newTargetX, newTargetY);
  }
  
  private updateSmoothFollow(deltaTime: number): void {
    // Smooth interpolation towards target
    const smoothing = this.config.smoothing * (deltaTime / 16); // Normalize for ~60fps
    
    this.x += (this.targetX - this.x) * smoothing;
    this.y += (this.targetY - this.y) * smoothing;
  }
  
  private updateScreenShake(deltaTime: number): void {
    this.shakeTimer += deltaTime;
    
    if (this.shakeTimer >= this.shakeDuration) {
      this.isShaking = false;
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
      return;
    }
    
    // Generate random shake offset
    const intensity = this.shakeIntensity * (1 - this.shakeTimer / this.shakeDuration);
    this.shakeOffsetX = (Math.random() - 0.5) * intensity * 2;
    this.shakeOffsetY = (Math.random() - 0.5) * intensity * 2;
  }
  
  private updateZoom(deltaTime: number): void {
    if (Math.abs(this.zoom - this.targetZoom) > 0.001) {
      const diff = this.targetZoom - this.zoom;
      this.zoom += diff * this.zoomSpeed * (deltaTime / 16);
      
      // Snap if very close
      if (Math.abs(diff) < 0.01) {
        this.zoom = this.targetZoom;
      }
    }
  }
  
  // Start screen shake effect
  shake(intensity: number, duration: number): void {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
    this.shakeTimer = 0;
    this.isShaking = true;
  }
  
  // Set zoom level with smooth transition
  setZoom(zoom: number, immediate: boolean = false): void {
    this.targetZoom = Math.max(0.1, Math.min(3, zoom)); // Clamp zoom
    
    if (immediate) {
      this.zoom = this.targetZoom;
    }
  }
  
  // Get the viewport bounds in world coordinates
  getViewportBounds(): { left: number; top: number; right: number; bottom: number } {
    const left = this.visualX + this.shakeOffsetX;
    const top = this.visualY + this.shakeOffsetY;
    const right = left + (this.config.width / this.zoom);
    const bottom = top + (this.config.height / this.zoom);
    
    return { left, top, right, bottom };
  }
  
  // Get camera transform matrix values
  getTransform(): { translateX: number; translateY: number; scale: number } {
    return {
      translateX: -(this.visualX + this.shakeOffsetX) * this.zoom,
      translateY: -(this.visualY + this.shakeOffsetY) * this.zoom,
      scale: this.zoom
    };
  }
  
  // Convert world coordinates to screen coordinates
  worldToScreen(worldX: number, worldY: number): Vector2 {
    const transform = this.getTransform();
    return {
      x: (worldX * this.zoom) + transform.translateX,
      y: (worldY * this.zoom) + transform.translateY
    };
  }
  
  // Convert screen coordinates to world coordinates
  screenToWorld(screenX: number, screenY: number): Vector2 {
    const transform = this.getTransform();
    return {
      x: (screenX - transform.translateX) / this.zoom,
      y: (screenY - transform.translateY) / this.zoom
    };
  }
  
  // Check if a world position is visible on screen
  isVisible(worldX: number, worldY: number, margin: number = 0): boolean {
    const bounds = this.getViewportBounds();
    return worldX >= bounds.left - margin &&
           worldX <= bounds.right + margin &&
           worldY >= bounds.top - margin &&
           worldY <= bounds.bottom + margin;
  }
  
  // Check if a rectangle is visible on screen
  isRectVisible(x: number, y: number, width: number, height: number, margin: number = 0): boolean {
    const bounds = this.getViewportBounds();
    return !(x + width < bounds.left - margin ||
             x > bounds.right + margin ||
             y + height < bounds.top - margin ||
             y > bounds.bottom + margin);
  }
}