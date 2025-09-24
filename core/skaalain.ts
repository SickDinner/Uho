// Skaalain - Advanced Sprite Scaling System for UHO: Fate of the Grid
// Handles proper size relationships for apocalyptic game items

export interface SpriteCategory {
  id: string;
  name: string;
  baseSize: { width: number; height: number };
  defaultScale: number;
  minScale: number;
  maxScale: number;
}

export interface ScalingConfig {
  // Size categories for different game elements
  categories: {
    character: SpriteCategory;
    largeItem: SpriteCategory;
    mediumItem: SpriteCategory;
    smallItem: SpriteCategory;
    tinyItem: SpriteCategory;
    building: SpriteCategory;
    vehicle: SpriteCategory;
    weapon: SpriteCategory;
    drug: SpriteCategory;
  };
}

export interface ScaleAnimation {
  id: string;
  targetScale: number;
  duration: number;
  easing: (t: number) => number;
  startTime: number;
  originalScale: number;
}

export class SkaalainSystem {
  private scalingConfig: ScalingConfig;
  private activeAnimations: Map<string, ScaleAnimation> = new Map();

  constructor() {
    this.scalingConfig = this.createDefaultConfig();
  }

  private createDefaultConfig(): ScalingConfig {
    return {
      categories: {
        character: {
          id: 'character',
          name: 'Characters',
          baseSize: { width: 32, height: 32 },
          defaultScale: 1.0,
          minScale: 0.5,
          maxScale: 2.0
        },
        largeItem: {
          id: 'largeItem',
          name: 'Large Items',
          baseSize: { width: 24, height: 24 },
          defaultScale: 0.75,
          minScale: 0.5,
          maxScale: 1.5
        },
        mediumItem: {
          id: 'mediumItem', 
          name: 'Medium Items',
          baseSize: { width: 16, height: 16 },
          defaultScale: 0.5,
          minScale: 0.3,
          maxScale: 1.0
        },
        smallItem: {
          id: 'smallItem',
          name: 'Small Items', 
          baseSize: { width: 12, height: 12 },
          defaultScale: 0.375,
          minScale: 0.2,
          maxScale: 0.8
        },
        tinyItem: {
          id: 'tinyItem',
          name: 'Tiny Items (needles, pills, etc)',
          baseSize: { width: 8, height: 8 },
          defaultScale: 0.25,
          minScale: 0.1,
          maxScale: 0.5
        },
        building: {
          id: 'building',
          name: 'Buildings',
          baseSize: { width: 64, height: 64 },
          defaultScale: 2.0,
          minScale: 1.0,
          maxScale: 4.0
        },
        vehicle: {
          id: 'vehicle',
          name: 'Vehicles',
          baseSize: { width: 48, height: 32 },
          defaultScale: 1.5,
          minScale: 0.8,
          maxScale: 3.0
        },
        weapon: {
          id: 'weapon',
          name: 'Weapons',
          baseSize: { width: 20, height: 8 },
          defaultScale: 0.625,
          minScale: 0.3,
          maxScale: 1.2
        },
        drug: {
          id: 'drug',
          name: 'Drugs and substances',
          baseSize: { width: 10, height: 10 },
          defaultScale: 0.3125,
          minScale: 0.15,
          maxScale: 0.7
        }
      }
    };
  }

  // Get the appropriate scale for an item based on its category
  getScale(category: string, context: 'inventory' | 'world' | 'ui' = 'world'): number {
    const cat = this.scalingConfig.categories[category as keyof typeof this.scalingConfig.categories];
    if (!cat) return 1.0;

    let scale = cat.defaultScale;

    // Adjust scale based on context
    switch (context) {
      case 'inventory':
        scale *= 0.8; // Smaller in inventory
        break;
      case 'ui':
        scale *= 1.2; // Larger in UI elements
        break;
      case 'world':
      default:
        // Use default scale
        break;
    }

    return Math.max(cat.minScale, Math.min(cat.maxScale, scale));
  }

  // Create size-appropriate sprites for apocalyptic items
  getApocalypticItemCategory(itemType: string): string {
    const categoryMap: Record<string, string> = {
      // Characters
      'player': 'character',
      'survivor': 'character', 
      'raider': 'character',
      'mutant': 'character',
      'robot': 'character',
      
      // Weapons
      'pistol': 'weapon',
      'rifle': 'weapon',
      'shotgun': 'weapon',
      'knife': 'smallItem',
      'bat': 'weapon',
      'pipe': 'weapon',
      
      // Drugs and consumables
      'needle': 'tinyItem',
      'syringe': 'tinyItem', 
      'pill': 'tinyItem',
      'bottle': 'smallItem',
      'can': 'smallItem',
      'stimpak': 'smallItem',
      'radaway': 'mediumItem',
      
      // Equipment
      'backpack': 'largeItem',
      'armor': 'largeItem',
      'helmet': 'mediumItem',
      'boots': 'mediumItem',
      'gloves': 'smallItem',
      
      // Environment
      'car': 'vehicle',
      'truck': 'vehicle',
      'motorcycle': 'vehicle',
      'building': 'building',
      'ruin': 'building',
      'bunker': 'building',
      
      // Misc items
      'scrap': 'tinyItem',
      'component': 'smallItem',
      'tool': 'mediumItem',
      'container': 'largeItem',
      'barrel': 'largeItem'
    };

    return categoryMap[itemType] || 'mediumItem';
  }

  // Animate scale changes smoothly
  animateScale(
    entityId: string,
    targetScale: number,
    duration: number = 300,
    easing: (t: number) => number = this.easeOutQuad
  ): void {
    const animation: ScaleAnimation = {
      id: entityId,
      targetScale,
      duration,
      easing,
      startTime: performance.now(),
      originalScale: this.getCurrentScale(entityId)
    };

    this.activeAnimations.set(entityId, animation);
  }

  private getCurrentScale(entityId: string): number {
    const animation = this.activeAnimations.get(entityId);
    return animation?.targetScale || 1.0;
  }

  // Update scale animations
  update(deltaTime: number): void {
    const currentTime = performance.now();
    const toRemove: string[] = [];

    for (const [entityId, animation] of this.activeAnimations) {
      const elapsed = currentTime - animation.startTime;
      const progress = Math.min(elapsed / animation.duration, 1);

      if (progress >= 1) {
        toRemove.push(entityId);
      }
    }

    // Clean up completed animations
    toRemove.forEach(id => this.activeAnimations.delete(id));
  }

  // Get current animated scale for an entity
  getAnimatedScale(entityId: string, baseScale: number = 1.0): number {
    const animation = this.activeAnimations.get(entityId);
    if (!animation) return baseScale;

    const currentTime = performance.now();
    const elapsed = currentTime - animation.startTime;
    const progress = Math.min(elapsed / animation.duration, 1);
    const easedProgress = animation.easing(progress);

    return animation.originalScale + (animation.targetScale - animation.originalScale) * easedProgress;
  }

  // Easing functions
  private easeOutQuad(t: number): number {
    return t * (2 - t);
  }

  private easeInOutQuad(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  private easeOutElastic(t: number): number {
    const c4 = (2 * Math.PI) / 3;
    return t === 0
      ? 0
      : t === 1
      ? 1
      : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  }

  // Zoom effects for important items
  emphasizeItem(entityId: string): void {
    this.animateScale(entityId, 1.3, 200, this.easeOutElastic.bind(this));
    // Return to normal after emphasis
    setTimeout(() => {
      this.animateScale(entityId, 1.0, 300);
    }, 250);
  }

  // Get size comparison info for debugging
  getSizeInfo(category: string): string {
    const cat = this.scalingConfig.categories[category as keyof typeof this.scalingConfig.categories];
    if (!cat) return 'Unknown category';

    return `${cat.name}: ${cat.baseSize.width}x${cat.baseSize.height} @ ${cat.defaultScale}x scale`;
  }

  // Visual size reference for different categories
  getVisualSizeComparison(): string {
    let comparison = "Sprite Size Comparison (approximate pixel sizes at default scale):\n";
    comparison += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    
    for (const [key, category] of Object.entries(this.scalingConfig.categories)) {
      const finalWidth = Math.round(category.baseSize.width * category.defaultScale);
      const finalHeight = Math.round(category.baseSize.height * category.defaultScale);
      comparison += `${category.name.padEnd(25)} | ${finalWidth}x${finalHeight} px\n`;
    }
    
    comparison += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    comparison += "Note: Needles/syringes will be ~8px, characters ~32px\n";
    
    return comparison;
  }
}

// Global instance
export const skaalainSystem = new SkaalainSystem();

// Console helper for debugging sizes
if (typeof window !== 'undefined') {
  (window as any).skaalain = skaalainSystem;
  console.log("🎯 Skaalain System loaded!");
  console.log("Use window.skaalain.getVisualSizeComparison() to see size reference");
}