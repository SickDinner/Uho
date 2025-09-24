/**
 * RETRO GRAPHICS ENGINE
 * 
 * Yhdistää SNES:n, Jaguarin ja Genesisin parhaat grafiikka-ominaisuudet:
 * - SNES: Mode 7 scaling/rotation, layered backgrounds, sprite priorities
 * - Jaguar: Texture mapping, 64-bit color blending, advanced effects
 * - Genesis: Fast scanline rendering, aggressive optimizations, palette tricks
 * 
 * LEGENDARY 16-BIT POWER! 🎮⚡
 */

export interface RetroColor {
  r: number;
  g: number; 
  b: number;
  a?: number;
}

export interface Palette {
  colors: RetroColor[];
  transparent?: number;
}

export interface SpriteFrame {
  width: number;
  height: number;
  pixels: Uint8Array; // Palette indices
  hotspotX: number;
  hotspotY: number;
}

export interface TextureMappedSprite extends SpriteFrame {
  // Jaguar-style texture mapping
  uvMap?: Float32Array; // UV coordinates for each pixel
  normalMap?: Uint8Array; // Normal mapping for lighting
  specularMap?: Uint8Array; // Specular highlights
}

export interface BackgroundLayer {
  id: string;
  priority: number;
  scrollX: number;
  scrollY: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  alpha: number;
  mode7: boolean; // SNES Mode 7 perspective
  parallaxFactor: number;
  tiles: Uint16Array;
  tileWidth: number;
  tileHeight: number;
  mapWidth: number;
  mapHeight: number;
}

// SNES-style sprite attributes
export interface SpriteAttributes {
  x: number;
  y: number;
  frameIndex: number;
  palette: number;
  priority: number;
  flipH: boolean;
  flipV: boolean;
  size: 'small' | 'large'; // 16x16 or 32x32
  alpha: number;
  blend: 'normal' | 'add' | 'multiply' | 'screen';
  
  // Jaguar extensions
  scaleX: number;
  scaleY: number;
  rotation: number;
  textureMapped: boolean;
  
  // Genesis extensions  
  highPriority: boolean;
  shadowHighlight: boolean;
}

export interface RasterEffect {
  scanline: number;
  property: 'palette' | 'scroll' | 'zoom' | 'rotate';
  value: number | RetroColor[];
}

export class RetroGraphicsEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private imageData: ImageData;
  private pixels: Uint32Array;
  
  // Display properties
  private width: number;
  private height: number;
  private scanlineBuffer: Uint32Array;
  
  // Palettes (SNES-style, 16 colors per palette)
  private palettes: Palette[] = [];
  private currentPalette = 0;
  
  // Background layers
  private backgroundLayers: BackgroundLayer[] = [];
  
  // Sprites
  private sprites: SpriteFrame[] = [];
  private spriteInstances: SpriteAttributes[] = [];
  
  // Raster effects (Genesis-style)
  private rasterEffects: RasterEffect[] = [];
  
  // Mode 7 transformation matrix
  private mode7Matrix: Float32Array = new Float32Array([
    1, 0, 0,
    0, 1, 0,
    0, 0, 1
  ]);
  
  // Frame timing
  private frameTime = 0;
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { 
      alpha: false,
      desynchronized: true // Maximize performance
    })!;
    
    this.width = canvas.width;
    this.height = canvas.height;
    
    this.imageData = this.ctx.createImageData(this.width, this.height);
    this.pixels = new Uint32Array(this.imageData.data.buffer);
    this.scanlineBuffer = new Uint32Array(this.width);
    
    console.log(`🎮 RETRO GRAPHICS ENGINE INITIALIZED`);
    console.log(`📺 Resolution: ${this.width}x${this.height}`);
    console.log(`⚡ SNES + JAGUAR + GENESIS POWER COMBINED!`);
  }
  
  // ============ PALETTE SYSTEM (SNES-style) ============
  
  loadPalette(paletteIndex: number, colors: RetroColor[]): void {
    if (!this.palettes[paletteIndex]) {
      this.palettes[paletteIndex] = { colors: [] };
    }
    
    this.palettes[paletteIndex].colors = colors.slice(0, 16); // Max 16 colors
    console.log(`🎨 Loaded palette ${paletteIndex} with ${colors.length} colors`);
  }
  
  setPalette(paletteIndex: number): void {
    this.currentPalette = paletteIndex;
  }
  
  // Create classic 16-bit color palette
  createRetroColor(r: number, g: number, b: number, a = 255): RetroColor {
    // Quantize to 5-bit per channel (like SNES)
    return {
      r: Math.floor((r / 255) * 31) * 8,
      g: Math.floor((g / 255) * 31) * 8,
      b: Math.floor((b / 255) * 31) * 8,
      a
    };
  }
  
  // ============ SPRITE SYSTEM ============
  
  loadSprite(spriteData: SpriteFrame): number {
    const index = this.sprites.length;
    this.sprites.push(spriteData);
    console.log(`🖼️  Loaded sprite ${index} (${spriteData.width}x${spriteData.height})`);
    return index;
  }
  
  drawSprite(spriteIndex: number, attributes: SpriteAttributes): void {
    this.spriteInstances.push({ ...attributes, frameIndex: spriteIndex });
  }
  
  // ============ BACKGROUND LAYERS (SNES-style) ============
  
  createBackgroundLayer(layer: BackgroundLayer): void {
    this.backgroundLayers.push(layer);
    this.backgroundLayers.sort((a, b) => a.priority - b.priority);
    console.log(`🏔️  Created background layer "${layer.id}" with priority ${layer.priority}`);
  }
  
  setLayerScroll(layerId: string, x: number, y: number): void {
    const layer = this.backgroundLayers.find(l => l.id === layerId);
    if (layer) {
      layer.scrollX = x;
      layer.scrollY = y;
    }
  }
  
  // SNES Mode 7 transformation
  setMode7Transform(a: number, b: number, c: number, d: number, x: number, y: number): void {
    this.mode7Matrix[0] = a;
    this.mode7Matrix[1] = b;
    this.mode7Matrix[2] = c;
    this.mode7Matrix[3] = d;
    this.mode7Matrix[6] = x;
    this.mode7Matrix[7] = y;
  }
  
  // ============ RASTER EFFECTS (Genesis-style) ============
  
  addRasterEffect(effect: RasterEffect): void {
    this.rasterEffects.push(effect);
    this.rasterEffects.sort((a, b) => a.scanline - b.scanline);
  }
  
  clearRasterEffects(): void {
    this.rasterEffects.length = 0;
  }
  
  // ============ RENDERING PIPELINE ============
  
  render(): void {
    this.frameTime = performance.now();
    
    // Clear screen with first palette color
    const bgColor = this.palettes[0]?.colors[0] || { r: 0, g: 0, b: 0 };
    const bgPixel = this.packColor(bgColor.r, bgColor.g, bgColor.b, 255);
    this.pixels.fill(bgPixel);
    
    // Render each scanline with raster effects
    for (let y = 0; y < this.height; y++) {
      this.renderScanline(y);
    }
    
    // Blit to canvas
    this.ctx.putImageData(this.imageData, 0, 0);
    
    // Clear sprite instances for next frame
    this.spriteInstances.length = 0;
  }
  
  private renderScanline(y: number): void {
    // Apply raster effects for this scanline
    this.applyRasterEffects(y);
    
    // Clear scanline buffer
    this.scanlineBuffer.fill(0);
    
    // Render background layers
    for (const layer of this.backgroundLayers) {
      if (layer.mode7) {
        this.renderMode7Layer(layer, y);
      } else {
        this.renderTiledLayer(layer, y);
      }
    }
    
    // Render sprites
    this.renderSpritesOnScanline(y);
    
    // Copy scanline to main buffer
    const offset = y * this.width;
    for (let x = 0; x < this.width; x++) {
      if (this.scanlineBuffer[x] !== 0) { // 0 = transparent
        this.pixels[offset + x] = this.scanlineBuffer[x];
      }
    }
  }
  
  private renderMode7Layer(layer: BackgroundLayer, y: number): void {
    // SNES Mode 7 perspective transformation
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    
    for (let x = 0; x < this.width; x++) {
      // Transform screen coordinates to world coordinates
      const screenX = x - centerX;
      const screenY = y - centerY;
      
      const worldX = this.mode7Matrix[0] * screenX + this.mode7Matrix[1] * screenY + this.mode7Matrix[6];
      const worldY = this.mode7Matrix[3] * screenX + this.mode7Matrix[4] * screenY + this.mode7Matrix[7];
      
      // Apply layer scroll
      const mapX = Math.floor((worldX + layer.scrollX) / layer.tileWidth) & (layer.mapWidth - 1);
      const mapY = Math.floor((worldY + layer.scrollY) / layer.tileHeight) & (layer.mapHeight - 1);
      
      if (mapX >= 0 && mapX < layer.mapWidth && mapY >= 0 && mapY < layer.mapHeight) {
        const tileIndex = layer.tiles[mapY * layer.mapWidth + mapX];
        if (tileIndex > 0) {
          // Sample tile color (simplified)
          const color = this.sampleTile(tileIndex, worldX % layer.tileWidth, worldY % layer.tileHeight);
          if (color) {
            this.scanlineBuffer[x] = this.blendPixel(this.scanlineBuffer[x], color, layer.alpha);
          }
        }
      }
    }
  }
  
  private renderTiledLayer(layer: BackgroundLayer, y: number): void {
    // Standard tiled layer rendering (Genesis-style optimized)
    const layerY = Math.floor((y + layer.scrollY) / layer.tileHeight);
    
    for (let x = 0; x < this.width; x++) {
      const layerX = Math.floor((x + layer.scrollX) / layer.tileWidth);
      
      if (layerX >= 0 && layerX < layer.mapWidth && layerY >= 0 && layerY < layer.mapHeight) {
        const tileIndex = layer.tiles[layerY * layer.mapWidth + layerX];
        if (tileIndex > 0) {
          const tileX = (x + layer.scrollX) % layer.tileWidth;
          const tileY = (y + layer.scrollY) % layer.tileHeight;
          
          const color = this.sampleTile(tileIndex, tileX, tileY);
          if (color) {
            this.scanlineBuffer[x] = this.blendPixel(this.scanlineBuffer[x], color, layer.alpha);
          }
        }
      }
    }
  }
  
  private renderSpritesOnScanline(y: number): void {
    // Sort sprites by priority (SNES-style)
    const sortedSprites = this.spriteInstances.slice()
      .sort((a, b) => a.priority - b.priority);
    
    for (const sprite of sortedSprites) {
      const spriteData = this.sprites[sprite.frameIndex];
      if (!spriteData) continue;
      
      // Check if sprite intersects this scanline
      const spriteTop = sprite.y - spriteData.hotspotY;
      const spriteBottom = spriteTop + spriteData.height;
      
      if (y >= spriteTop && y < spriteBottom) {
        this.renderSpriteOnScanline(spriteData, sprite, y);
      }
    }
  }
  
  private renderSpriteOnScanline(spriteData: SpriteFrame, attributes: SpriteAttributes, y: number): void {
    const spriteY = y - (attributes.y - spriteData.hotspotY);
    const spriteLeft = attributes.x - spriteData.hotspotX;
    
    for (let x = 0; x < spriteData.width; x++) {
      const screenX = spriteLeft + x;
      
      if (screenX >= 0 && screenX < this.width) {
        const pixelIndex = spriteY * spriteData.width + x;
        const paletteIndex = spriteData.pixels[pixelIndex];
        
        if (paletteIndex > 0) { // 0 = transparent
          const palette = this.palettes[attributes.palette] || this.palettes[0];
          const color = palette?.colors[paletteIndex];
          
          if (color) {
            const pixel = this.packColor(color.r, color.g, color.b, Math.floor(color.a || 255 * attributes.alpha));
            this.scanlineBuffer[screenX] = this.blendPixel(this.scanlineBuffer[screenX], pixel, attributes.alpha);
          }
        }
      }
    }
  }
  
  private applyRasterEffects(scanline: number): void {
    for (const effect of this.rasterEffects) {
      if (effect.scanline === scanline) {
        switch (effect.property) {
          case 'palette':
            // Palette swap on specific scanlines (Genesis-style)
            if (Array.isArray(effect.value)) {
              this.loadPalette(0, effect.value as RetroColor[]);
            }
            break;
          case 'scroll':
            // Per-scanline scrolling
            this.backgroundLayers[0].scrollX += effect.value as number;
            break;
        }
      }
    }
  }
  
  // ============ UTILITY FUNCTIONS ============
  
  private packColor(r: number, g: number, b: number, a: number): number {
    return (a << 24) | (b << 16) | (g << 8) | r;
  }
  
  private blendPixel(dest: number, src: number, alpha: number): number {
    if (alpha >= 1) return src;
    if (alpha <= 0) return dest;
    
    const srcA = (src >>> 24) & 0xFF;
    const srcR = (src >>> 16) & 0xFF;
    const srcG = (src >>> 8) & 0xFF;
    const srcB = src & 0xFF;
    
    const destA = (dest >>> 24) & 0xFF;
    const destR = (dest >>> 16) & 0xFF;
    const destG = (dest >>> 8) & 0xFF;
    const destB = dest & 0xFF;
    
    const outA = Math.floor(srcA * alpha + destA * (1 - alpha));
    const outR = Math.floor(srcR * alpha + destR * (1 - alpha));
    const outG = Math.floor(srcG * alpha + destG * (1 - alpha));
    const outB = Math.floor(srcB * alpha + destB * (1 - alpha));
    
    return this.packColor(outR, outG, outB, outA);
  }
  
  private sampleTile(tileIndex: number, x: number, y: number): number | null {
    // Simplified tile sampling - would need actual tile graphics
    const palette = this.palettes[this.currentPalette];
    if (!palette || !palette.colors[tileIndex % palette.colors.length]) {
      return null;
    }
    
    const color = palette.colors[tileIndex % palette.colors.length];
    return this.packColor(color.r, color.g, color.b, color.a || 255);
  }
  
  // ============ DEBUG & PROFILING ============
  
  getPerformanceStats(): any {
    return {
      frameTime: performance.now() - this.frameTime,
      backgroundLayers: this.backgroundLayers.length,
      sprites: this.spriteInstances.length,
      rasterEffects: this.rasterEffects.length,
      resolution: `${this.width}x${this.height}`
    };
  }
}

// Factory function to create default 16-bit palettes
export function createDefaultPalettes(): RetroColor[][] {
  return [
    // Palette 0: Grayscale
    [
      { r: 0, g: 0, b: 0 },       // Black
      { r: 32, g: 32, b: 32 },    // Dark gray
      { r: 64, g: 64, b: 64 },    // Gray
      { r: 96, g: 96, b: 96 },    // Light gray
      { r: 128, g: 128, b: 128 }, // Medium gray
      { r: 160, g: 160, b: 160 }, // Silver
      { r: 192, g: 192, b: 192 }, // Light silver
      { r: 224, g: 224, b: 224 }, // Off white
      { r: 255, g: 255, b: 255 }, // White
      { r: 255, g: 255, b: 200 }, // Warm white
      { r: 255, g: 200, b: 200 }, // Pink white
      { r: 200, g: 255, b: 200 }, // Green white
      { r: 200, g: 200, b: 255 }, // Blue white
      { r: 255, g: 255, b: 128 }, // Yellow white
      { r: 255, g: 128, b: 255 }, // Magenta white
      { r: 128, g: 255, b: 255 }  // Cyan white
    ],
    
    // Palette 1: Urban colors
    [
      { r: 0, g: 0, b: 0 },       // Black
      { r: 64, g: 32, b: 16 },    // Dark brown
      { r: 128, g: 64, b: 32 },   // Brown
      { r: 160, g: 128, b: 96 },  // Light brown
      { r: 32, g: 64, b: 32 },    // Dark green
      { r: 64, g: 128, b: 64 },   // Green
      { r: 32, g: 32, b: 64 },    // Dark blue
      { r: 64, g: 64, b: 128 },   // Blue
      { r: 128, g: 128, b: 128 }, // Gray concrete
      { r: 192, g: 192, b: 192 }, // Light concrete
      { r: 64, g: 64, b: 64 },    // Asphalt
      { r: 255, g: 255, b: 0 },   // Yellow lines
      { r: 255, g: 64, b: 64 },   // Red brick
      { r: 255, g: 128, b: 0 },   // Orange brick
      { r: 128, g: 128, b: 255 }, // Glass blue
      { r: 255, g: 255, b: 255 }  // White
    ]
  ];
}