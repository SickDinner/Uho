// Enhanced Sprite Component with Skaalain Integration
// Replaces or extends the existing Sprite component

import { skaalainSystem } from './skaalain.ts';
import { spriteManager } from './sprites.ts';

export interface EnhancedSpriteConfig {
  spriteSheetId: string;
  itemType?: string;         // Used for automatic scaling
  category?: string;         // Override automatic category detection
  baseScale?: number;        // Override base scale
  context?: 'world' | 'inventory' | 'ui';
}

export class EnhancedSprite {
  public entityId: number;
  public spriteSheetId: string;
  public frameIndex: number = 0;
  public currentAnimation: string = '';
  public animationTime: number = 0;
  public lastFrameTime: number = 0;
  
  // Scaling properties
  public itemType?: string;
  public category: string;
  public scale: number = 1;
  public context: 'world' | 'inventory' | 'ui' = 'world';
  public animatedScale: number = 1; // For scaling animations
  
  // Animation state
  public isAnimating: boolean = false;
  public animationLoop: boolean = true;
  
  constructor(entityId: number, config: EnhancedSpriteConfig) {
    this.entityId = entityId;
    this.spriteSheetId = config.spriteSheetId;
    this.itemType = config.itemType || '';
    this.context = config.context || 'world';
    
    // Determine category for scaling
    if (config.category) {
      this.category = config.category;
    } else if (config.itemType) {
      this.category = skaalainSystem.getApocalypticItemCategory(config.itemType);
    } else {
      this.category = 'character'; // Default
    }
    
    // Calculate scale
    this.scale = config.baseScale || skaalainSystem.getScale(this.category, this.context);
    this.animatedScale = this.scale;
    
    console.log(`Enhanced sprite created: ${this.spriteSheetId}, category: ${this.category}, scale: ${this.scale}x`);
  }
  
  // Update context (e.g., when moving from world to inventory)
  updateContext(newContext: 'world' | 'inventory' | 'ui'): void {
    this.context = newContext;
    this.scale = skaalainSystem.getScale(this.category, this.context);
    this.animatedScale = this.scale;
  }
  
  // Set animation with proper looping
  setAnimation(animationName: string): void {
    if (this.currentAnimation !== animationName) {
      this.currentAnimation = animationName;
      this.animationTime = 0;
      this.frameIndex = 0;
      this.lastFrameTime = 0;
      this.isAnimating = true;
    }
  }
  
  // Update animation timing
  updateAnimation(deltaTime: number): void {
    if (!this.isAnimating) return;
    
    this.animationTime += deltaTime;
    
    // Update animated scale (for emphasis effects, etc.)
    this.animatedScale = skaalainSystem.getAnimatedScale(
      this.entityId.toString(), 
      this.scale
    );
  }
  
  // Render the sprite with proper scaling
  render(
    ctx: CanvasRenderingContext2D, 
    x: number, 
    y: number, 
    currentTime: number = performance.now()
  ): void {
    const spriteSheet = spriteManager.getSpriteSheet(this.spriteSheetId);
    if (!spriteSheet) {
      this.renderFallback(ctx, x, y);
      return;
    }
    
    // Use animated sprite rendering if we have an animation
    if (this.currentAnimation && spriteSheet.animations[this.currentAnimation]) {
      spriteManager.drawAnimatedSprite(
        ctx,
        this.spriteSheetId,
        this.currentAnimation,
        currentTime,
        x,
        y,
        this.animatedScale
      );
    } else {
      // Static sprite rendering
      spriteManager.drawSprite(
        ctx,
        this.spriteSheetId,
        this.frameIndex,
        x,
        y,
        this.animatedScale
      );
    }
    
    // Debug rendering (show scale info in debug mode)
    if ((window as any).debugSprites) {
      this.renderDebugInfo(ctx, x, y);
    }
  }
  
  private renderFallback(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    // Fallback rendering when sprite is not available
    const size = Math.max(4, this.animatedScale * 16);
    
    // Color based on category
    let color = '#FFFFFF';
    switch (this.category) {
      case 'character': color = '#FFFF00'; break;
      case 'weapon': color = '#888888'; break;
      case 'tinyItem': color = '#00FF00'; break;
      case 'smallItem': color = '#4169E1'; break;
      case 'mediumItem': color = '#8B4513'; break;
      case 'largeItem': color = '#FF6347'; break;
    }
    
    ctx.fillStyle = color;
    ctx.fillRect(x, y, size, size);
    
    // Border for visibility
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, size, size);
  }
  
  private renderDebugInfo(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(x, y - 40, 120, 30);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '10px monospace';
    ctx.fillText(`${this.category}`, x + 2, y - 30);
    ctx.fillText(`Scale: ${this.animatedScale.toFixed(2)}x`, x + 2, y - 15);
    ctx.fillText(`Context: ${this.context}`, x + 2, y - 5);
  }
  
  // Animation effects
  pulse(intensity: number = 0.3, duration: number = 400): void {
    const targetScale = this.scale * (1 + intensity);
    skaalainSystem.animateScale(this.entityId.toString(), targetScale, duration / 2);
    
    // Return to normal
    setTimeout(() => {
      skaalainSystem.animateScale(this.entityId.toString(), this.scale, duration / 2);
    }, duration / 2);
  }
  
  emphasize(): void {
    skaalainSystem.emphasizeItem(this.entityId.toString());
  }
  
  // Get final rendered size for collision detection, etc.
  getRenderedSize(): { width: number; height: number } {
    const spriteSheet = spriteManager.getSpriteSheet(this.spriteSheetId);
    if (spriteSheet) {
      return {
        width: spriteSheet.frameWidth * this.animatedScale,
        height: spriteSheet.frameHeight * this.animatedScale
      };
    }
    
    // Fallback size
    const size = this.animatedScale * 16;
    return { width: size, height: size };
  }
  
  // Get scaling info for debugging
  getScalingInfo(): string {
    return `Enhanced Sprite ${this.entityId}:
  Sprite: ${this.spriteSheetId}
  Category: ${this.category}
  Base Scale: ${this.scale}x
  Animated Scale: ${this.animatedScale}x
  Context: ${this.context}
  Item Type: ${this.itemType || 'N/A'}`;
  }
}

// Factory function for easy creation
export function createEnhancedSprite(
  entityId: number, 
  spriteSheetId: string, 
  itemType?: string,
  context?: 'world' | 'inventory' | 'ui'
): EnhancedSprite {
  return new EnhancedSprite(entityId, {
    spriteSheetId,
    itemType: itemType || '',
    context: context || 'world'
  });
}

// Helper function to convert existing Sprite components
export function upgradeSprite(
  entityId: number,
  existingSprite: any,
  itemType?: string
): EnhancedSprite {
  return new EnhancedSprite(entityId, {
    spriteSheetId: existingSprite.spriteSheetId || 'player',
    itemType: itemType || ''
  });
}

// Export enhanced sprite as drop-in replacement
export { EnhancedSprite as Sprite };