// 🎨 SNES-INSPIRED GRAPHICS EFFECTS SYSTEM
// Advanced visual effects inspired by classic 16-bit consoles

export interface SNESEffectConfig {
  enabled: boolean;
  intensity: number; // 0-1
  speed: number;
  params: { [key: string]: any };
}

export interface SNESGraphicsState {
  // Background scrolling effects
  parallaxLayers: ParallaxLayer[];
  backgroundScrollX: number;
  backgroundScrollY: number;
  
  // Mode 7-style effects
  mode7Enabled: boolean;
  mode7Horizon: number;
  mode7Scale: number;
  mode7Rotation: number;
  
  // Color and lighting effects
  colorCycling: SNESEffectConfig;
  scanlines: SNESEffectConfig;
  crtEffect: SNESEffectConfig;
  pixelPerfect: boolean;
  
  // Screen effects
  screenShake: { x: number; y: number; intensity: number; duration: number };
  fadeEffect: { opacity: number; color: string; active: boolean };
  flashEffect: { intensity: number; color: string; duration: number };
  
  // Zoom and camera effects
  zoomLevel: number;
  cameraRotation: number;
  
  // Time-based effects
  time: number;
  animationFrame: number;
}

export interface ParallaxLayer {
  id: string;
  image?: HTMLImageElement | HTMLCanvasElement;
  pattern?: string; // For generated patterns
  scrollSpeedX: number;
  scrollSpeedY: number;
  depth: number; // 0 = background, 1 = foreground
  opacity: number;
  tileX: boolean;
  tileY: boolean;
  offsetX: number;
  offsetY: number;
}

export class SNESGraphicsEngine {
  private state: SNESGraphicsState;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private backBuffer: HTMLCanvasElement;
  private backCtx: CanvasRenderingContext2D;
  
  // Effect patterns and gradients
  private gradientCache: Map<string, CanvasGradient> = new Map();
  private patternCache: Map<string, CanvasPattern> = new Map();
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    
    // Create back buffer for double buffering
    this.backBuffer = document.createElement('canvas');
    this.backBuffer.width = canvas.width;
    this.backBuffer.height = canvas.height;
    this.backCtx = this.backBuffer.getContext('2d')!;
    
    this.state = this.createInitialState();
    this.initializeEffects();
    
    console.log('🎨 SNES Graphics Engine initialized');
  }
  
  private createInitialState(): SNESGraphicsState {
    return {
      parallaxLayers: [],
      backgroundScrollX: 0,
      backgroundScrollY: 0,
      mode7Enabled: false,
      mode7Horizon: 100,
      mode7Scale: 1.0,
      mode7Rotation: 0,
      colorCycling: { enabled: false, intensity: 0.5, speed: 1.0, params: {} },
      scanlines: { enabled: true, intensity: 0.3, speed: 1.0, params: { spacing: 2 } },
      crtEffect: { enabled: false, intensity: 0.4, speed: 1.0, params: { curvature: 0.1 } },
      pixelPerfect: true,
      screenShake: { x: 0, y: 0, intensity: 0, duration: 0 },
      fadeEffect: { opacity: 0, color: 'black', active: false },
      flashEffect: { intensity: 0, color: 'white', duration: 0 },
      zoomLevel: 1.0,
      cameraRotation: 0,
      time: 0,
      animationFrame: 0
    };\n  }\n  \n  private initializeEffects(): void {\n    // Set up rendering context for pixel art\n    this.ctx.imageSmoothingEnabled = false;\n    this.backCtx.imageSmoothingEnabled = false;\n    \n    // Create default parallax layers\n    this.addParallaxLayer({\n      id: 'far-background',\n      pattern: 'clouds',\n      scrollSpeedX: 0.1,\n      scrollSpeedY: 0.05,\n      depth: 0,\n      opacity: 0.3,\n      tileX: true,\n      tileY: true,\n      offsetX: 0,\n      offsetY: 0\n    });\n    \n    this.addParallaxLayer({\n      id: 'mid-background',\n      pattern: 'mountains',\n      scrollSpeedX: 0.3,\n      scrollSpeedY: 0.1,\n      depth: 0.5,\n      opacity: 0.6,\n      tileX: true,\n      tileY: false,\n      offsetX: 0,\n      offsetY: 50\n    });\n  }\n  \n  // Public API methods\n  \n  public addParallaxLayer(layer: ParallaxLayer): void {\n    this.state.parallaxLayers.push(layer);\n    this.state.parallaxLayers.sort((a, b) => a.depth - b.depth);\n  }\n  \n  public enableMode7(enabled: boolean, options?: { horizon?: number; scale?: number }): void {\n    this.state.mode7Enabled = enabled;\n    if (options) {\n      if (options.horizon !== undefined) this.state.mode7Horizon = options.horizon;\n      if (options.scale !== undefined) this.state.mode7Scale = options.scale;\n    }\n  }\n  \n  public enableScanlines(enabled: boolean, intensity: number = 0.3): void {\n    this.state.scanlines.enabled = enabled;\n    this.state.scanlines.intensity = intensity;\n  }\n  \n  public enableCRT(enabled: boolean, intensity: number = 0.4): void {\n    this.state.crtEffect.enabled = enabled;\n    this.state.crtEffect.intensity = intensity;\n  }\n  \n  public shakeScreen(intensity: number, duration: number): void {\n    this.state.screenShake.intensity = intensity;\n    this.state.screenShake.duration = duration;\n  }\n  \n  public flashScreen(intensity: number, color: string, duration: number): void {\n    this.state.flashEffect.intensity = intensity;\n    this.state.flashEffect.color = color;\n    this.state.flashEffect.duration = duration;\n  }\n  \n  public fadeScreen(opacity: number, color: string = 'black'): void {\n    this.state.fadeEffect.opacity = Math.max(0, Math.min(1, opacity));\n    this.state.fadeEffect.color = color;\n    this.state.fadeEffect.active = this.state.fadeEffect.opacity > 0;\n  }\n  \n  public setZoom(level: number): void {\n    this.state.zoomLevel = Math.max(0.1, Math.min(10, level));\n  }\n  \n  public setCameraRotation(rotation: number): void {\n    this.state.cameraRotation = rotation;\n  }\n  \n  public update(deltaTime: number): void {\n    this.state.time += deltaTime;\n    this.state.animationFrame++;\n    \n    // Update screen shake\n    if (this.state.screenShake.duration > 0) {\n      this.state.screenShake.duration -= deltaTime;\n      if (this.state.screenShake.duration <= 0) {\n        this.state.screenShake.x = 0;\n        this.state.screenShake.y = 0;\n        this.state.screenShake.intensity = 0;\n      } else {\n        const shake = this.state.screenShake.intensity;\n        this.state.screenShake.x = (Math.random() - 0.5) * shake * 2;\n        this.state.screenShake.y = (Math.random() - 0.5) * shake * 2;\n      }\n    }\n    \n    // Update flash effect\n    if (this.state.flashEffect.duration > 0) {\n      this.state.flashEffect.duration -= deltaTime;\n      if (this.state.flashEffect.duration <= 0) {\n        this.state.flashEffect.intensity = 0;\n      }\n    }\n    \n    // Update parallax scrolling\n    for (const layer of this.state.parallaxLayers) {\n      layer.offsetX += layer.scrollSpeedX * (deltaTime / 1000) * 60; // 60fps reference\n      layer.offsetY += layer.scrollSpeedY * (deltaTime / 1000) * 60;\n    }\n  }\n  \n  public preRender(): void {\n    // Clear back buffer\n    this.backCtx.clearRect(0, 0, this.backBuffer.width, this.backBuffer.height);\n    \n    // Apply camera transformations\n    this.backCtx.save();\n    \n    // Apply screen shake\n    if (this.state.screenShake.intensity > 0) {\n      this.backCtx.translate(this.state.screenShake.x, this.state.screenShake.y);\n    }\n    \n    // Apply zoom\n    if (this.state.zoomLevel !== 1) {\n      const centerX = this.backBuffer.width / 2;\n      const centerY = this.backBuffer.height / 2;\n      this.backCtx.translate(centerX, centerY);\n      this.backCtx.scale(this.state.zoomLevel, this.state.zoomLevel);\n      this.backCtx.translate(-centerX, -centerY);\n    }\n    \n    // Apply camera rotation\n    if (this.state.cameraRotation !== 0) {\n      const centerX = this.backBuffer.width / 2;\n      const centerY = this.backBuffer.height / 2;\n      this.backCtx.translate(centerX, centerY);\n      this.backCtx.rotate(this.state.cameraRotation * Math.PI / 180);\n      this.backCtx.translate(-centerX, -centerY);\n    }\n    \n    // Render parallax background layers\n    this.renderParallaxLayers();\n  }\n  \n  public postRender(): void {\n    this.backCtx.restore();\n    \n    // Apply post-processing effects to back buffer\n    this.applyPostEffects();\n    \n    // Copy back buffer to main canvas\n    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);\n    this.ctx.drawImage(this.backBuffer, 0, 0);\n    \n    // Apply screen-level effects\n    this.applyScreenEffects();\n  }\n  \n  private renderParallaxLayers(): void {\n    for (const layer of this.state.parallaxLayers) {\n      this.backCtx.save();\n      this.backCtx.globalAlpha = layer.opacity;\n      \n      if (layer.pattern) {\n        this.renderPatternLayer(layer);\n      } else if (layer.image) {\n        this.renderImageLayer(layer);\n      }\n      \n      this.backCtx.restore();\n    }\n  }\n  \n  private renderPatternLayer(layer: ParallaxLayer): void {\n    const pattern = this.getOrCreatePattern(layer.pattern!);\n    if (!pattern) return;\n    \n    // Create a transform matrix for the pattern offset\n    const transform = new DOMMatrix();\n    transform.translateSelf(-layer.offsetX, -layer.offsetY);\n    \n    pattern.setTransform(transform);\n    \n    this.backCtx.fillStyle = pattern;\n    this.backCtx.fillRect(0, 0, this.backBuffer.width, this.backBuffer.height);\n  }\n  \n  private renderImageLayer(layer: ParallaxLayer): void {\n    if (!layer.image) return;\n    \n    const imgWidth = layer.image.width;\n    const imgHeight = layer.image.height;\n    \n    if (layer.tileX || layer.tileY) {\n      // Tile the image\n      const startX = layer.tileX ? -(layer.offsetX % imgWidth) : layer.offsetX;\n      const startY = layer.tileY ? -(layer.offsetY % imgHeight) : layer.offsetY;\n      \n      const endX = layer.tileX ? this.backBuffer.width + imgWidth : startX + imgWidth;\n      const endY = layer.tileY ? this.backBuffer.height + imgHeight : startY + imgHeight;\n      \n      for (let x = startX; x < endX; x += imgWidth) {\n        for (let y = startY; y < endY; y += imgHeight) {\n          this.backCtx.drawImage(layer.image, x, y);\n        }\n      }\n    } else {\n      this.backCtx.drawImage(layer.image, layer.offsetX, layer.offsetY);\n    }\n  }\n  \n  private getOrCreatePattern(patternType: string): CanvasPattern | null {\n    if (this.patternCache.has(patternType)) {\n      return this.patternCache.get(patternType)!;\n    }\n    \n    const patternCanvas = this.generatePattern(patternType);\n    if (!patternCanvas) return null;\n    \n    const pattern = this.backCtx.createPattern(patternCanvas, 'repeat');\n    if (pattern) {\n      this.patternCache.set(patternType, pattern);\n    }\n    \n    return pattern;\n  }\n  \n  private generatePattern(patternType: string): HTMLCanvasElement | null {\n    const canvas = document.createElement('canvas');\n    const ctx = canvas.getContext('2d')!;\n    \n    switch (patternType) {\n      case 'clouds':\n        canvas.width = canvas.height = 64;\n        return this.generateCloudPattern(ctx, canvas.width, canvas.height);\n        \n      case 'mountains':\n        canvas.width = 128;\n        canvas.height = 64;\n        return this.generateMountainPattern(ctx, canvas.width, canvas.height);\n        \n      case 'stars':\n        canvas.width = canvas.height = 128;\n        return this.generateStarPattern(ctx, canvas.width, canvas.height);\n        \n      default:\n        return null;\n    }\n  }\n  \n  private generateCloudPattern(ctx: CanvasRenderingContext2D, width: number, height: number): HTMLCanvasElement {\n    // Generate a simple cloud pattern using gradients\n    const gradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width/2);\n    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');\n    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.4)');\n    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');\n    \n    ctx.fillStyle = gradient;\n    ctx.fillRect(0, 0, width, height);\n    \n    return ctx.canvas;\n  }\n  \n  private generateMountainPattern(ctx: CanvasRenderingContext2D, width: number, height: number): HTMLCanvasElement {\n    // Generate simple mountain silhouette\n    ctx.fillStyle = '#2a4a6b';\n    \n    ctx.beginPath();\n    ctx.moveTo(0, height);\n    \n    // Generate mountain peaks\n    for (let x = 0; x < width; x += 8) {\n      const peakHeight = height * (0.3 + Math.sin(x / 20) * 0.3 + Math.sin(x / 5) * 0.1);\n      ctx.lineTo(x, height - peakHeight);\n    }\n    \n    ctx.lineTo(width, height);\n    ctx.closePath();\n    ctx.fill();\n    \n    return ctx.canvas;\n  }\n  \n  private generateStarPattern(ctx: CanvasRenderingContext2D, width: number, height: number): HTMLCanvasElement {\n    // Generate random stars\n    ctx.fillStyle = 'white';\n    \n    for (let i = 0; i < 20; i++) {\n      const x = Math.random() * width;\n      const y = Math.random() * height;\n      const size = Math.random() * 2 + 1;\n      \n      ctx.fillRect(x, y, size, size);\n    }\n    \n    return ctx.canvas;\n  }\n  \n  private applyPostEffects(): void {\n    // Apply Mode 7 effect if enabled\n    if (this.state.mode7Enabled) {\n      this.applyMode7Effect();\n    }\n  }\n  \n  private applyMode7Effect(): void {\n    // Simple Mode 7-style perspective effect\n    // This is a simplified version - full Mode 7 would require more complex matrix transforms\n    const imageData = this.backCtx.getImageData(0, 0, this.backBuffer.width, this.backBuffer.height);\n    const outputData = this.backCtx.createImageData(this.backBuffer.width, this.backBuffer.height);\n    \n    const horizon = this.state.mode7Horizon;\n    const scale = this.state.mode7Scale;\n    const rotation = this.state.mode7Rotation * Math.PI / 180;\n    \n    for (let y = 0; y < this.backBuffer.height; y++) {\n      for (let x = 0; x < this.backBuffer.width; x++) {\n        // Simple perspective transformation\n        if (y > horizon) {\n          const distance = (y - horizon) / (this.backBuffer.height - horizon);\n          const perspectiveScale = scale / (1 + distance * 2);\n          \n          // Apply rotation\n          const centerX = this.backBuffer.width / 2;\n          const centerY = horizon;\n          const rotX = (x - centerX) * Math.cos(rotation) - (y - centerY) * Math.sin(rotation);\n          const rotY = (x - centerX) * Math.sin(rotation) + (y - centerY) * Math.cos(rotation);\n          \n          const sourceX = Math.floor(centerX + rotX * perspectiveScale);\n          const sourceY = Math.floor(centerY + rotY * perspectiveScale);\n          \n          if (sourceX >= 0 && sourceX < this.backBuffer.width && \n              sourceY >= 0 && sourceY < this.backBuffer.height) {\n            const sourceIndex = (sourceY * this.backBuffer.width + sourceX) * 4;\n            const targetIndex = (y * this.backBuffer.width + x) * 4;\n            \n            outputData.data[targetIndex] = imageData.data[sourceIndex];\n            outputData.data[targetIndex + 1] = imageData.data[sourceIndex + 1];\n            outputData.data[targetIndex + 2] = imageData.data[sourceIndex + 2];\n            outputData.data[targetIndex + 3] = imageData.data[sourceIndex + 3];\n          }\n        } else {\n          // Copy pixel as-is for area above horizon\n          const index = (y * this.backBuffer.width + x) * 4;\n          outputData.data[index] = imageData.data[index];\n          outputData.data[index + 1] = imageData.data[index + 1];\n          outputData.data[index + 2] = imageData.data[index + 2];\n          outputData.data[index + 3] = imageData.data[index + 3];\n        }\n      }\n    }\n    \n    this.backCtx.putImageData(outputData, 0, 0);\n  }\n  \n  private applyScreenEffects(): void {\n    // Apply scanlines\n    if (this.state.scanlines.enabled) {\n      this.ctx.save();\n      this.ctx.globalAlpha = this.state.scanlines.intensity;\n      this.ctx.fillStyle = 'black';\n      \n      const spacing = this.state.scanlines.params.spacing || 2;\n      for (let y = 0; y < this.canvas.height; y += spacing) {\n        this.ctx.fillRect(0, y, this.canvas.width, 1);\n      }\n      \n      this.ctx.restore();\n    }\n    \n    // Apply CRT effect\n    if (this.state.crtEffect.enabled) {\n      this.applyCRTEffect();\n    }\n    \n    // Apply flash effect\n    if (this.state.flashEffect.intensity > 0) {\n      this.ctx.save();\n      this.ctx.globalAlpha = this.state.flashEffect.intensity;\n      this.ctx.fillStyle = this.state.flashEffect.color;\n      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);\n      this.ctx.restore();\n    }\n    \n    // Apply fade effect\n    if (this.state.fadeEffect.active) {\n      this.ctx.save();\n      this.ctx.globalAlpha = this.state.fadeEffect.opacity;\n      this.ctx.fillStyle = this.state.fadeEffect.color;\n      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);\n      this.ctx.restore();\n    }\n  }\n  \n  private applyCRTEffect(): void {\n    // Simple CRT-like curvature and vignetting effect\n    const gradient = this.ctx.createRadialGradient(\n      this.canvas.width / 2, this.canvas.height / 2, 0,\n      this.canvas.width / 2, this.canvas.height / 2, Math.max(this.canvas.width, this.canvas.height) / 2\n    );\n    \n    gradient.addColorStop(0, 'transparent');\n    gradient.addColorStop(0.8, 'rgba(0, 0, 0, 0.1)');\n    gradient.addColorStop(1, `rgba(0, 0, 0, ${this.state.crtEffect.intensity})`);\n    \n    this.ctx.save();\n    this.ctx.fillStyle = gradient;\n    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);\n    this.ctx.restore();\n  }\n  \n  // Getters for current state\n  public getZoomLevel(): number { return this.state.zoomLevel; }\n  public getCameraRotation(): number { return this.state.cameraRotation; }\n  public isMode7Enabled(): boolean { return this.state.mode7Enabled; }\n  public getTime(): number { return this.state.time; }\n  \n  // Preset configurations\n  public applyPreset(preset: 'classic' | 'modern' | 'retro' | 'arcade'): void {\n    switch (preset) {\n      case 'classic':\n        this.enableScanlines(true, 0.2);\n        this.enableCRT(false);\n        this.enableMode7(false);\n        break;\n        \n      case 'modern':\n        this.enableScanlines(false);\n        this.enableCRT(false);\n        this.enableMode7(false);\n        break;\n        \n      case 'retro':\n        this.enableScanlines(true, 0.4);\n        this.enableCRT(true, 0.3);\n        this.enableMode7(false);\n        break;\n        \n      case 'arcade':\n        this.enableScanlines(true, 0.3);\n        this.enableCRT(true, 0.5);\n        this.enableMode7(true, { horizon: 120, scale: 1.2 });\n        break;\n    }\n    \n    console.log(`🎨 Applied ${preset} graphics preset`);\n  }\n}\n\n// Global SNES graphics engine instance (will be initialized when canvas is available)\nlet snesGraphics: SNESGraphicsEngine | null = null;\n\nexport function initializeSNESGraphics(canvas: HTMLCanvasElement): SNESGraphicsEngine {\n  snesGraphics = new SNESGraphicsEngine(canvas);\n  return snesGraphics;\n}\n\nexport function getSNESGraphics(): SNESGraphicsEngine | null {\n  return snesGraphics;\n}\n\n// Convenience functions\nexport function enableMode7(enabled: boolean, options?: { horizon?: number; scale?: number }): void {\n  snesGraphics?.enableMode7(enabled, options);\n}\n\nexport function enableScanlines(enabled: boolean, intensity?: number): void {\n  snesGraphics?.enableScanlines(enabled, intensity);\n}\n\nexport function enableCRT(enabled: boolean, intensity?: number): void {\n  snesGraphics?.enableCRT(enabled, intensity);\n}\n\nexport function shakeScreen(intensity: number, duration: number): void {\n  snesGraphics?.shakeScreen(intensity, duration);\n}\n\nexport function flashScreen(intensity: number, color: string, duration: number): void {\n  snesGraphics?.flashScreen(intensity, color, duration);\n}\n\nexport function applyGraphicsPreset(preset: 'classic' | 'modern' | 'retro' | 'arcade'): void {\n  snesGraphics?.applyPreset(preset);\n}