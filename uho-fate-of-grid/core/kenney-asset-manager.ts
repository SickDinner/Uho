// 🎨 KENNEY SPRITE ASSET MANAGER
// Manages all Kenney Game Assets integration with proper loading and caching

export interface KenneyAssetConfig {
  name: string;
  path: string;
  type: 'spritesheet' | 'individual' | 'tileset';
  tileWidth?: number;
  tileHeight?: number;
  animations?: { [key: string]: number[] };
}

export interface KenneySprite {
  name: string;
  image: HTMLImageElement;
  width: number;
  height: number;
  frames?: ImageData[];
  animations?: { [key: string]: number[] };
  loaded: boolean;
}

export class KenneyAssetManager {
  private sprites: Map<string, KenneySprite> = new Map();
  private loadingPromises: Map<string, Promise<void>> = new Map();
  private loadedAssets = 0;
  private totalAssets = 0;

  // Kenney Game Assets configuration
  private kenneyAssets: KenneyAssetConfig[] = [
    // Roguelike character spritesheets
    {
      name: 'roguelike-characters',
      path: 'assets/sprites/roguelike/characters/Spritesheet/roguelikeSheet_transparent.png',
      type: 'spritesheet',
      tileWidth: 16,
      tileHeight: 16,
      animations: {
        'player_idle_south': [52],
        'player_idle_north': [104],
        'player_idle_west': [78],
        'player_idle_east': [26],
        'player_walk_south': [52, 53, 54, 55],
        'player_walk_north': [104, 105, 106, 107],
        'player_walk_west': [78, 79, 80, 81],
        'player_walk_east': [26, 27, 28, 29],
        'npc_merchant': [13],
        'npc_guard': [39],
        'npc_villager': [65],
        'npc_wizard': [91],
        'enemy_orc': [320],
        'enemy_skeleton': [346],
        'enemy_goblin': [372]
      }
    },

    // Roguelike items and objects
    {
      name: 'roguelike-items',
      path: 'assets/sprites/roguelike/items/Spritesheet/roguelikeSheet_transparent.png', 
      type: 'spritesheet',
      tileWidth: 16,
      tileHeight: 16,
      animations: {
        'sword': [0],
        'shield': [1],
        'bow': [2],
        'armor': [3],
        'potion_health': [16],
        'potion_mana': [17],
        'coin': [32],
        'gem': [33],
        'key': [48],
        'food_bread': [64],
        'food_meat': [65]
      }
    },

    // City/urban tileset
    {
      name: 'city-tiles',
      path: 'assets/sprites/roguelike/cities/Tilemap/tilemap_packed.png',
      type: 'tileset',
      tileWidth: 16,
      tileHeight: 16,
      animations: {
        'ground_grass': [0],
        'ground_dirt': [1],
        'ground_stone': [2],
        'ground_concrete': [3],
        'wall_brick': [16],
        'wall_stone': [17],
        'wall_wood': [18],
        'door_closed': [32],
        'door_open': [33],
        'window': [48],
        'roof_tile': [64],
        'roof_shingle': [65],
        'water': [80],
        'fence': [96]
      }
    },

    // UI elements
    {
      name: 'ui-elements',
      path: 'assets/sprites/ui/Tiles/Large tiles/Thick outline/tile_0000.png',
      type: 'individual',
      tileWidth: 32,
      tileHeight: 32
    },

    // UI buttons and panels
    {
      name: 'ui-buttons',
      path: 'assets/sprites/ui/Buttons/button_rectangle_depth_flat.png',
      type: 'individual',
      tileWidth: 32,
      tileHeight: 16
    }
  ];

  constructor() {
    this.totalAssets = this.kenneyAssets.length;
    console.log(`🎨 Kenney Asset Manager initialized with ${this.totalAssets} asset configs`);
  }

  // Load all Kenney assets
  public async loadAllAssets(): Promise<void> {
    console.log('📦 Starting to load all Kenney Game Assets...');
    
    const loadPromises = this.kenneyAssets.map(config => this.loadAsset(config));
    
    try {
      await Promise.all(loadPromises);
      console.log(`✅ Successfully loaded ${this.loadedAssets}/${this.totalAssets} Kenney assets`);
    } catch (error) {
      console.warn('⚠️ Some Kenney assets failed to load:', error);
      console.log(`📊 Loaded ${this.loadedAssets}/${this.totalAssets} assets`);
    }
  }

  // Load a specific asset configuration
  private async loadAsset(config: KenneyAssetConfig): Promise<void> {
    if (this.loadingPromises.has(config.name)) {
      return this.loadingPromises.get(config.name)!;
    }

    const loadPromise = this.performAssetLoad(config);
    this.loadingPromises.set(config.name, loadPromise);

    try {
      await loadPromise;
      this.loadedAssets++;
      console.log(`✨ Loaded Kenney asset: ${config.name}`);
    } catch (error) {
      console.warn(`❌ Failed to load Kenney asset: ${config.name}`, error);
      
      // Create placeholder sprite for failed loads
      this.createPlaceholderSprite(config.name, config.tileWidth || 16, config.tileHeight || 16);
    }
  }

  private async performAssetLoad(config: KenneyAssetConfig): Promise<void> {
    const image = new Image();
    
    // Wait for image to load
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error(`Failed to load image: ${config.path}`));
      image.src = config.path;
    });

    const sprite: KenneySprite = {
      name: config.name,
      image: image,
      width: config.tileWidth || image.width,
      height: config.tileHeight || image.height,
      animations: config.animations || {},
      loaded: true,
      frames: []
    };

    // For spritesheets and tilesets, extract individual frames
    if (config.type === 'spritesheet' || config.type === 'tileset') {
      sprite.frames = this.extractFrames(image, config.tileWidth!, config.tileHeight!);
      console.log(`🖼️ Extracted ${sprite.frames.length} frames from ${config.name}`);
    }

    this.sprites.set(config.name, sprite);
  }

  // Extract individual frames from a spritesheet
  private extractFrames(image: HTMLImageElement, tileWidth: number, tileHeight: number): ImageData[] {
    const frames: ImageData[] = [];
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    canvas.width = tileWidth;
    canvas.height = tileHeight;

    const cols = Math.floor(image.width / tileWidth);
    const rows = Math.floor(image.height / tileHeight);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        ctx.clearRect(0, 0, tileWidth, tileHeight);
        ctx.drawImage(
          image,
          col * tileWidth, row * tileHeight, tileWidth, tileHeight,
          0, 0, tileWidth, tileHeight
        );
        
        const imageData = ctx.getImageData(0, 0, tileWidth, tileHeight);
        frames.push(imageData);
      }
    }

    return frames;
  }

  // Create a placeholder colored rectangle for failed loads
  private createPlaceholderSprite(name: string, width: number, height: number): void {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d')!;
    
    // Create a distinctive placeholder pattern
    ctx.fillStyle = '#FF00FF'; // Magenta background
    ctx.fillRect(0, 0, width, height);
    
    ctx.fillStyle = '#000000';
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('?', width / 2, height / 2);
    
    // Create image from canvas
    const image = new Image();
    image.src = canvas.toDataURL();
    
    const sprite: KenneySprite = {
      name: name,
      image: image,
      width: width,
      height: height,
      animations: {},
      loaded: false, // Mark as not properly loaded
      frames: []
    };

    this.sprites.set(name, sprite);
    console.log(`🔴 Created placeholder for ${name}`);
  }

  // Get a sprite by name
  public getSprite(name: string): KenneySprite | null {
    return this.sprites.get(name) || null;
  }

  // Get a specific frame from a spritesheet
  public getSpriteFrame(spriteName: string, frameIndex: number): ImageData | null {
    const sprite = this.sprites.get(spriteName);
    if (!sprite || !sprite.frames || frameIndex >= sprite.frames.length) {
      return null;
    }
    
    return sprite.frames[frameIndex];
  }

  // Get animation frames for a specific animation
  public getAnimationFrames(spriteName: string, animationName: string): ImageData[] {
    const sprite = this.sprites.get(spriteName);
    if (!sprite || !sprite.animations || !sprite.frames) {
      return [];
    }

    const frameIndices = sprite.animations[animationName];
    if (!frameIndices) {
      return [];
    }

    return frameIndices.map(index => sprite.frames![index]).filter(frame => frame);
  }

  // Render a sprite frame to a canvas context
  public renderSprite(
    ctx: CanvasRenderingContext2D,
    spriteName: string,
    frameIndex: number,
    x: number,
    y: number,
    scale: number = 1
  ): boolean {
    const frame = this.getSpriteFrame(spriteName, frameIndex);
    if (!frame) {
      // Render placeholder
      this.renderPlaceholder(ctx, x, y, 16 * scale, 16 * scale);
      return false;
    }

    // Create temporary canvas for the frame
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = frame.width;
    tempCanvas.height = frame.height;
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCtx.putImageData(frame, 0, 0);

    // Render to target context
    ctx.save();
    ctx.imageSmoothingEnabled = false; // Pixel-perfect rendering
    ctx.drawImage(tempCanvas, x, y, frame.width * scale, frame.height * scale);
    ctx.restore();

    return true;
  }

  private renderPlaceholder(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number): void {
    ctx.save();
    ctx.fillStyle = '#FF00FF';
    ctx.fillRect(x, y, width, height);
    
    ctx.fillStyle = '#000000';
    ctx.font = `${Math.min(width, height) / 2}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('?', x + width / 2, y + height / 2);
    ctx.restore();
  }

  // Get loading progress
  public getLoadingProgress(): { loaded: number; total: number; percentage: number } {
    return {
      loaded: this.loadedAssets,
      total: this.totalAssets,
      percentage: this.totalAssets > 0 ? (this.loadedAssets / this.totalAssets) * 100 : 0
    };
  }

  // Check if all assets are loaded
  public isFullyLoaded(): boolean {
    return this.loadedAssets >= this.totalAssets;
  }

  // Get list of all loaded sprite names
  public getLoadedSpriteNames(): string[] {
    return Array.from(this.sprites.keys()).filter(name => this.sprites.get(name)?.loaded);
  }

  // Get list of failed/placeholder sprites
  public getFailedSpriteNames(): string[] {
    return Array.from(this.sprites.keys()).filter(name => !this.sprites.get(name)?.loaded);
  }

  // Debug information
  public getDebugInfo(): any {
    return {
      totalAssets: this.totalAssets,
      loadedAssets: this.loadedAssets,
      loadingProgress: this.getLoadingProgress().percentage.toFixed(1) + '%',
      sprites: Array.from(this.sprites.entries()).map(([name, sprite]) => ({
        name,
        loaded: sprite.loaded,
        frameCount: sprite.frames?.length || 0,
        animationCount: Object.keys(sprite.animations || {}).length
      }))
    };
  }
}

// Global Kenney Asset Manager instance
export const kenneyAssets = new KenneyAssetManager();

// Convenience functions for easy access
export function loadKenneyAssets(): Promise<void> {
  return kenneyAssets.loadAllAssets();
}

export function getKenneySprite(name: string): KenneySprite | null {
  return kenneyAssets.getSprite(name);
}

export function getKenneyFrame(spriteName: string, frameIndex: number): ImageData | null {
  return kenneyAssets.getSpriteFrame(spriteName, frameIndex);
}

export function getKenneyAnimation(spriteName: string, animationName: string): ImageData[] {
  return kenneyAssets.getAnimationFrames(spriteName, animationName);
}

export function renderKenneySprite(
  ctx: CanvasRenderingContext2D,
  spriteName: string,
  frameIndex: number,
  x: number,
  y: number,
  scale?: number
): boolean {
  return kenneyAssets.renderSprite(ctx, spriteName, frameIndex, x, y, scale);
}