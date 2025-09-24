/**
 * 🎨 LEGENDARY POST-PROCESSING EFFECTS & SHADERS 🎨
 * 
 * ULTIMATE 16-bit efektit jotka yhdistävät:
 * - SNES: Mode 7 transformations, mosaic effects, color math
 * - Jaguar: Advanced texture mapping, bilinear filtering, translucency
 * - Genesis: Raster effects, palette cycling, shadow/highlight
 * 
 * MAXIMUM VISUAL IMPACT! ⚡🔥
 */

export interface EffectParameters {
  intensity: number;
  time: number;
  [key: string]: any;
}

export interface ShaderProgram {
  name: string;
  vertexShader?: string;
  fragmentShader?: string;
  uniforms: Record<string, any>;
  enabled: boolean;
}

export class LegendaryEffects {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  
  // Effect state
  private time = 0;
  private previousFrame?: ImageData;
  private blurBuffer?: ImageData;
  
  // Color cycling tables for Genesis-style effects
  private colorCycleTable: number[][] = [];
  private paletteShiftOffset = 0;
  
  // Mode 7 transformation matrices
  private mode7Transform = {
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
    perspectiveX: 0,
    perspectiveY: 0,
    centerX: 0,
    centerY: 0
  };
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    
    this.initializeColorCycles();
    
    console.log('🎨 LEGENDARY EFFECTS ENGINE INITIALIZED');
    console.log('✨ Mode 7, Jaguar textures, Genesis rasters: READY');
  }
  
  private initializeColorCycles(): void {
    // Create color cycling tables for water, fire, etc.
    this.colorCycleTable = [
      // Water cycle (blue tones)
      [64, 96, 128, 160, 192, 224, 192, 160, 128, 96],
      // Fire cycle (red/orange tones)
      [255, 224, 192, 160, 128, 160, 192, 224],
      // Electric cycle (cyan/white)
      [0, 64, 128, 192, 255, 192, 128, 64],
    ];
  }
  
  // ============ SNES MODE 7 EFFECTS ============
  
  public applyMode7Transform(
    imageData: ImageData,
    scaleX = 1,
    scaleY = 1,
    rotation = 0,
    perspectiveX = 0,
    perspectiveY = 0
  ): ImageData {
    const { width, height } = imageData;
    const srcData = new Uint32Array(imageData.data.buffer);
    const result = new ImageData(width, height);
    const destData = new Uint32Array(result.data.buffer);
    
    const centerX = width / 2;
    const centerY = height / 2;
    const cosRot = Math.cos(rotation);
    const sinRot = Math.sin(rotation);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // Screen to world coordinate transformation
        const screenX = x - centerX;
        const screenY = y - centerY;
        
        // Apply perspective (Jaguar-style depth)
        const depth = 1 + (perspectiveY * screenY) / height;
        const perspectiveScale = 1 / Math.max(0.1, depth);
        
        // Apply rotation and scaling
        const worldX = (screenX * cosRot - screenY * sinRot) * scaleX * perspectiveScale + perspectiveX;
        const worldY = (screenX * sinRot + screenY * cosRot) * scaleY * perspectiveScale;
        
        // Map back to source coordinates
        const sourceX = Math.floor(worldX + centerX);
        const sourceY = Math.floor(worldY + centerY);
        
        // Bilinear sampling (Jaguar-style)
        const pixel = this.sampleBilinear(srcData, width, height, sourceX, sourceY);
        destData[y * width + x] = pixel;
      }
    }
    
    return result;
  }
  
  private sampleBilinear(
    data: Uint32Array,
    width: number,
    height: number,
    x: number,
    y: number
  ): number {
    // Bounds check
    if (x < 0 || x >= width - 1 || y < 0 || y >= height - 1) {
      return 0; // Transparent
    }
    
    const x1 = Math.floor(x);
    const y1 = Math.floor(y);
    const x2 = x1 + 1;
    const y2 = y1 + 1;
    
    const fx = x - x1;
    const fy = y - y1;
    
    // Sample four neighboring pixels
    const p1 = data[y1 * width + x1];
    const p2 = data[y1 * width + x2];
    const p3 = data[y2 * width + x1];
    const p4 = data[y2 * width + x2];
    
    // Bilinear interpolation
    return this.interpolatePixels(
      this.interpolatePixels(p1, p2, fx),
      this.interpolatePixels(p3, p4, fx),
      fy
    );
  }
  
  private interpolatePixels(p1: number, p2: number, t: number): number {
    const r1 = (p1 >> 0) & 0xFF;
    const g1 = (p1 >> 8) & 0xFF;
    const b1 = (p1 >> 16) & 0xFF;
    const a1 = (p1 >> 24) & 0xFF;
    
    const r2 = (p2 >> 0) & 0xFF;
    const g2 = (p2 >> 8) & 0xFF;
    const b2 = (p2 >> 16) & 0xFF;
    const a2 = (p2 >> 24) & 0xFF;
    
    const r = Math.floor(r1 + (r2 - r1) * t);
    const g = Math.floor(g1 + (g2 - g1) * t);
    const b = Math.floor(b1 + (b2 - b1) * t);
    const a = Math.floor(a1 + (a2 - a1) * t);
    
    return r | (g << 8) | (b << 16) | (a << 24);
  }
  
  // ============ SNES MOSAIC & COLOR EFFECTS ============
  
  public applyMosaicEffect(imageData: ImageData, mosaicSize: number): ImageData {
    const { width, height } = imageData;
    const data = new Uint32Array(imageData.data.buffer);
    const result = new ImageData(width, height);
    const resultData = new Uint32Array(result.data.buffer);
    
    for (let y = 0; y < height; y += mosaicSize) {
      for (let x = 0; x < width; x += mosaicSize) {
        // Sample the top-left pixel of the mosaic tile
        const samplePixel = data[y * width + x];
        
        // Fill the entire mosaic tile with this color
        for (let dy = 0; dy < mosaicSize && y + dy < height; dy++) {
          for (let dx = 0; dx < mosaicSize && x + dx < width; dx++) {
            resultData[(y + dy) * width + (x + dx)] = samplePixel;
          }
        }
      }
    }
    
    return result;
  }
  
  public applySnesColorMath(
    imageData: ImageData,
    operation: 'add' | 'subtract' | 'multiply' | 'screen',
    color: {r: number, g: number, b: number},
    intensity: number
  ): void {
    const data = imageData.data;
    const colorR = color.r * intensity;
    const colorG = color.g * intensity;
    const colorB = color.b * intensity;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      switch (operation) {
        case 'add':
          data[i] = Math.min(255, r + colorR);
          data[i + 1] = Math.min(255, g + colorG);
          data[i + 2] = Math.min(255, b + colorB);
          break;
          
        case 'subtract':
          data[i] = Math.max(0, r - colorR);
          data[i + 1] = Math.max(0, g - colorG);
          data[i + 2] = Math.max(0, b - colorB);
          break;
          
        case 'multiply':
          data[i] = Math.floor((r * colorR) / 255);
          data[i + 1] = Math.floor((g * colorG) / 255);
          data[i + 2] = Math.floor((b * colorB) / 255);
          break;
          
        case 'screen':
          data[i] = 255 - Math.floor(((255 - r) * (255 - colorR)) / 255);
          data[i + 1] = 255 - Math.floor(((255 - g) * (255 - colorG)) / 255);
          data[i + 2] = 255 - Math.floor(((255 - b) * (255 - colorB)) / 255);
          break;
      }
    }
  }
  
  // ============ JAGUAR TEXTURE MAPPING EFFECTS ============
  
  public applyTextureMapping(
    imageData: ImageData,
    textureData: ImageData,
    uvMap: Float32Array
  ): ImageData {
    const { width, height } = imageData;
    const result = new ImageData(width, height);
    const resultData = new Uint32Array(result.data.buffer);
    const textureBuffer = new Uint32Array(textureData.data.buffer);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = (y * width + x) * 2; // UV coordinates are pairs
        const u = uvMap[index] * textureData.width;
        const v = uvMap[index + 1] * textureData.height;
        
        // Sample texture with bilinear filtering
        const texelColor = this.sampleBilinear(
          textureBuffer,
          textureData.width,
          textureData.height,
          u,
          v
        );
        
        resultData[y * width + x] = texelColor;
      }
    }
    
    return result;
  }
  
  public applyEnvironmentMapping(
    imageData: ImageData,
    environmentMap: ImageData,
    normalMap: ImageData,
    reflectivity: number
  ): void {
    const data = new Uint32Array(imageData.data.buffer);
    const envData = new Uint32Array(environmentMap.data.buffer);
    const normalData = new Uint32Array(normalMap.data.buffer);
    
    const { width, height } = imageData;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = y * width + x;
        
        // Extract normal from normal map
        const normalPixel = normalData[index];
        const nx = ((normalPixel & 0xFF) - 128) / 128;
        const ny = (((normalPixel >> 8) & 0xFF) - 128) / 128;
        const nz = Math.sqrt(1 - nx * nx - ny * ny);
        
        // Calculate reflection vector
        const reflectU = (nx + 1) * 0.5;
        const reflectV = (ny + 1) * 0.5;
        
        // Sample environment map
        const envX = Math.floor(reflectU * environmentMap.width);
        const envY = Math.floor(reflectV * environmentMap.height);
        const envIndex = envY * environmentMap.width + envX;
        const envColor = envData[envIndex];
        
        // Blend with original color
        const originalColor = data[index];
        data[index] = this.blendColors(originalColor, envColor, reflectivity);
      }
    }
  }
  
  // ============ GENESIS RASTER EFFECTS ============
  
  public applyRasterEffects(imageData: ImageData, effects: Array<{
    scanline: number;
    type: 'palette' | 'scroll' | 'wave' | 'zoom';
    intensity: number;
  }>): void {
    const data = imageData.data;
    const { width, height } = imageData;
    
    for (const effect of effects) {
      const y = Math.floor((effect.scanline / 240) * height); // Normalize to screen height
      
      if (y >= 0 && y < height) {
        const scanlineStart = y * width * 4;
        const scanlineEnd = scanlineStart + width * 4;
        
        switch (effect.type) {
          case 'palette':
            this.applyPaletteShift(data, scanlineStart, scanlineEnd, effect.intensity);
            break;
            
          case 'wave':
            this.applyScanlineWave(imageData, y, effect.intensity);
            break;
            
          case 'zoom':
            this.applyScanlineZoom(imageData, y, effect.intensity);
            break;
        }
      }
    }
  }
  
  private applyPaletteShift(
    data: Uint8ClampedArray,
    start: number,
    end: number,
    intensity: number
  ): void {
    for (let i = start; i < end; i += 4) {
      // Shift hue based on position and intensity
      const hsl = this.rgbToHsl(data[i], data[i + 1], data[i + 2]);
      hsl.h = (hsl.h + intensity * 60) % 360; // Shift hue
      const rgb = this.hslToRgb(hsl.h, hsl.s, hsl.l);
      
      data[i] = rgb.r;
      data[i + 1] = rgb.g;
      data[i + 2] = rgb.b;
    }
  }
  
  private applyScanlineWave(imageData: ImageData, y: number, intensity: number): void {
    const data = new Uint32Array(imageData.data.buffer);
    const { width } = imageData;
    const waveOffset = Math.sin((y + this.time) * 0.1) * intensity;
    
    // Horizontal displacement wave
    for (let x = 0; x < width; x++) {
      const sourceX = x + Math.floor(waveOffset);
      if (sourceX >= 0 && sourceX < width) {
        data[y * width + x] = data[y * width + sourceX];
      }
    }
  }
  
  private applyScanlineZoom(imageData: ImageData, y: number, intensity: number): void {
    const data = new Uint32Array(imageData.data.buffer);
    const { width } = imageData;
    const centerX = width / 2;
    const zoom = 1 + (intensity * Math.sin(this.time * 0.05));
    
    for (let x = 0; x < width; x++) {
      const sourceX = centerX + (x - centerX) / zoom;
      if (sourceX >= 0 && sourceX < width) {
        data[y * width + x] = data[y * width + Math.floor(sourceX)];
      }
    }
  }
  
  // ============ GENESIS SHADOW/HIGHLIGHT ============
  
  public applyShadowHighlight(
    imageData: ImageData,
    shadowMask: ImageData,
    highlightMask: ImageData
  ): void {
    const data = imageData.data;
    const shadowData = shadowMask.data;
    const highlightData = highlightMask.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const shadowIntensity = shadowData[i] / 255;
      const highlightIntensity = highlightData[i] / 255;
      
      // Apply shadow (darken)
      if (shadowIntensity > 0) {
        data[i] = Math.floor(data[i] * (1 - shadowIntensity * 0.5));
        data[i + 1] = Math.floor(data[i + 1] * (1 - shadowIntensity * 0.5));
        data[i + 2] = Math.floor(data[i + 2] * (1 - shadowIntensity * 0.5));
      }
      
      // Apply highlight (brighten)
      if (highlightIntensity > 0) {
        data[i] = Math.min(255, data[i] + highlightIntensity * 64);
        data[i + 1] = Math.min(255, data[i + 1] + highlightIntensity * 64);
        data[i + 2] = Math.min(255, data[i + 2] + highlightIntensity * 64);
      }
    }
  }
  
  // ============ ADVANCED COMPOSITE EFFECTS ============
  
  public applyMotionBlur(imageData: ImageData, intensity: number): ImageData {
    if (!this.previousFrame) {
      this.previousFrame = new ImageData(
        new Uint8ClampedArray(imageData.data),
        imageData.width,
        imageData.height
      );
      return imageData;
    }
    
    const result = new ImageData(imageData.width, imageData.height);
    const currentData = imageData.data;
    const prevData = this.previousFrame.data;
    const resultData = result.data;
    
    for (let i = 0; i < currentData.length; i += 4) {
      // Blend current frame with previous frame
      resultData[i] = Math.floor(currentData[i] * (1 - intensity) + prevData[i] * intensity);
      resultData[i + 1] = Math.floor(currentData[i + 1] * (1 - intensity) + prevData[i + 1] * intensity);
      resultData[i + 2] = Math.floor(currentData[i + 2] * (1 - intensity) + prevData[i + 2] * intensity);
      resultData[i + 3] = currentData[i + 3]; // Preserve alpha
    }
    
    // Store current frame for next time
    this.previousFrame = new ImageData(
      new Uint8ClampedArray(currentData),
      imageData.width,
      imageData.height
    );
    
    return result;
  }
  
  public applyBloomEffect(imageData: ImageData, threshold: number, intensity: number): void {
    if (!this.blurBuffer) {
      this.blurBuffer = new ImageData(imageData.width, imageData.height);
    }
    
    // Extract bright pixels
    const data = imageData.data;
    const blurData = this.blurBuffer.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
      
      if (brightness > threshold) {
        blurData[i] = data[i];
        blurData[i + 1] = data[i + 1];
        blurData[i + 2] = data[i + 2];
        blurData[i + 3] = 255;
      } else {
        blurData[i] = 0;
        blurData[i + 1] = 0;
        blurData[i + 2] = 0;
        blurData[i + 3] = 0;
      }
    }
    
    // Apply Gaussian blur to bloom buffer
    this.applyGaussianBlur(this.blurBuffer, 2);
    
    // Additive blend bloom back to original
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, data[i] + blurData[i] * intensity);
      data[i + 1] = Math.min(255, data[i + 1] + blurData[i + 1] * intensity);
      data[i + 2] = Math.min(255, data[i + 2] + blurData[i + 2] * intensity);
    }
  }
  
  private applyGaussianBlur(imageData: ImageData, radius: number): void {
    const data = imageData.data;
    const { width, height } = imageData;
    const tempData = new Uint8ClampedArray(data);
    
    // Horizontal pass
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0, g = 0, b = 0, totalWeight = 0;
        
        for (let dx = -radius; dx <= radius; dx++) {
          const srcX = Math.max(0, Math.min(width - 1, x + dx));
          const weight = Math.exp(-(dx * dx) / (2 * radius * radius));
          const index = (y * width + srcX) * 4;
          
          r += tempData[index] * weight;
          g += tempData[index + 1] * weight;
          b += tempData[index + 2] * weight;
          totalWeight += weight;
        }
        
        const index = (y * width + x) * 4;
        data[index] = r / totalWeight;
        data[index + 1] = g / totalWeight;
        data[index + 2] = b / totalWeight;
      }
    }
    
    // Vertical pass
    tempData.set(data);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0, g = 0, b = 0, totalWeight = 0;
        
        for (let dy = -radius; dy <= radius; dy++) {
          const srcY = Math.max(0, Math.min(height - 1, y + dy));
          const weight = Math.exp(-(dy * dy) / (2 * radius * radius));
          const index = (srcY * width + x) * 4;
          
          r += tempData[index] * weight;
          g += tempData[index + 1] * weight;
          b += tempData[index + 2] * weight;
          totalWeight += weight;
        }
        
        const index = (y * width + x) * 4;
        data[index] = r / totalWeight;
        data[index + 1] = g / totalWeight;
        data[index + 2] = b / totalWeight;
      }
    }
  }
  
  // ============ UTILITY FUNCTIONS ============
  
  private blendColors(color1: number, color2: number, t: number): number {
    const r1 = (color1 >> 0) & 0xFF;
    const g1 = (color1 >> 8) & 0xFF;
    const b1 = (color1 >> 16) & 0xFF;
    const a1 = (color1 >> 24) & 0xFF;
    
    const r2 = (color2 >> 0) & 0xFF;
    const g2 = (color2 >> 8) & 0xFF;
    const b2 = (color2 >> 16) & 0xFF;
    const a2 = (color2 >> 24) & 0xFF;
    
    const r = Math.floor(r1 + (r2 - r1) * t);
    const g = Math.floor(g1 + (g2 - g1) * t);
    const b = Math.floor(b1 + (b2 - b1) * t);
    const a = Math.floor(a1 + (a2 - a1) * t);
    
    return r | (g << 8) | (b << 16) | (a << 24);
  }
  
  private rgbToHsl(r: number, g: number, b: number): {h: number, s: number, l: number} {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    const sum = max + min;
    
    const l = sum / 2;
    
    if (diff === 0) {
      return { h: 0, s: 0, l };
    }
    
    const s = l > 0.5 ? diff / (2 - sum) : diff / sum;
    
    let h = 0;
    if (max === r) {
      h = ((g - b) / diff + (g < b ? 6 : 0)) / 6;
    } else if (max === g) {
      h = ((b - r) / diff + 2) / 6;
    } else if (max === b) {
      h = ((r - g) / diff + 4) / 6;
    }
    
    return { h: h * 360, s, l };
  }
  
  private hslToRgb(h: number, s: number, l: number): {r: number, g: number, b: number} {
    h /= 360;
    
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    if (s === 0) {
      const gray = Math.floor(l * 255);
      return { r: gray, g: gray, b: gray };
    }
    
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    
    return {
      r: Math.floor(hue2rgb(p, q, h + 1/3) * 255),
      g: Math.floor(hue2rgb(p, q, h) * 255),
      b: Math.floor(hue2rgb(p, q, h - 1/3) * 255)
    };
  }
  
  public update(deltaTime: number): void {
    this.time += deltaTime / 1000; // Convert to seconds
    this.paletteShiftOffset = (this.paletteShiftOffset + 1) % 256;
  }
  
  public getTime(): number {
    return this.time;
  }
}

// Factory function for creating effect presets
export function createEffectPresets(): Record<string, (effects: LegendaryEffects, imageData: ImageData, params: EffectParameters) => void> {
  return {
    // SNES-style effects
    'snes_mode7': (effects, imageData, params) => {
      const transformed = effects.applyMode7Transform(
        imageData,
        params.scaleX || 1,
        params.scaleY || 1,
        params.rotation || 0,
        params.perspectiveX || 0,
        params.perspectiveY || 0.5
      );
      imageData.data.set(transformed.data);
    },
    
    'snes_mosaic': (effects, imageData, params) => {
      const mosaic = effects.applyMosaicEffect(imageData, params.mosaicSize || 4);
      imageData.data.set(mosaic.data);
    },
    
    // Jaguar-style effects
    'jaguar_bloom': (effects, imageData, params) => {
      effects.applyBloomEffect(imageData, params.threshold || 200, params.intensity || 0.5);
    },
    
    'jaguar_motion_blur': (effects, imageData, params) => {
      const blurred = effects.applyMotionBlur(imageData, params.intensity || 0.3);
      imageData.data.set(blurred.data);
    },
    
    // Genesis-style effects
    'genesis_raster': (effects, imageData, params) => {
      effects.applyRasterEffects(imageData, [
        { scanline: 60, type: 'wave', intensity: params.intensity || 5 },
        { scanline: 120, type: 'palette', intensity: params.intensity || 0.5 },
        { scanline: 180, type: 'zoom', intensity: params.intensity || 0.2 }
      ]);
    }
  };
}