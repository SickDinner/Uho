import { System, ComponentManager } from './ecs.ts';
import { Transform, Sprite } from './components.ts';
import { Camera } from './camera.ts';
import { MapManager, TILE_TYPES } from './map.ts';
import { spriteManager } from './sprites.ts';
import { particleSystem } from './particles.ts';
import type { EntityId, Vector2 } from './types.ts';

export interface RenderLayer {
  id: string;
  zIndex: number;
  visible: boolean;
  opacity: number;
}

export interface RenderableEntity {
  entityId: EntityId;
  transform: Transform;
  sprite: Sprite;
  layer: string;
}

export class RenderSystem extends System {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private camera: Camera;
  private mapManager: MapManager;
  
  // Render layers (sorted by zIndex)
  private layers: Map<string, RenderLayer> = new Map();
  
  // Default layers
  private static readonly DEFAULT_LAYERS: RenderLayer[] = [
    { id: 'background', zIndex: -100, visible: true, opacity: 1 },
    { id: 'terrain', zIndex: -50, visible: true, opacity: 1 },
    { id: 'buildings', zIndex: 0, visible: true, opacity: 1 },
    { id: 'npcs', zIndex: 10, visible: true, opacity: 1 },
    { id: 'player', zIndex: 20, visible: true, opacity: 1 },
    { id: 'effects', zIndex: 50, visible: true, opacity: 1 },
    { id: 'ui', zIndex: 100, visible: true, opacity: 1 }
  ];
  
  constructor(
    componentManager: ComponentManager,
    canvas: HTMLCanvasElement,
    camera: Camera,
    mapManager: MapManager
  ) {
    super(componentManager);
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.camera = camera;
    this.mapManager = mapManager;
    
    // Initialize default layers
    for (const layer of RenderSystem.DEFAULT_LAYERS) {
      this.layers.set(layer.id, { ...layer });
    }
    
    this.setupCanvas();
  }
  
  private setupCanvas(): void {
    // Configure rendering
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';
  }
  
  // Add or update a render layer
  setLayer(layer: RenderLayer): void {
    this.layers.set(layer.id, { ...layer });
  }
  
  // Get a render layer
  getLayer(id: string): RenderLayer | undefined {
    return this.layers.get(id);
  }
  
  // Set layer visibility
  setLayerVisible(layerId: string, visible: boolean): void {
    const layer = this.layers.get(layerId);
    if (layer) {
      layer.visible = visible;
    }
  }
  
  // Set layer opacity
  setLayerOpacity(layerId: string, opacity: number): void {
    const layer = this.layers.get(layerId);
    if (layer) {
      layer.opacity = Math.max(0, Math.min(1, opacity));
    }
  }
  
  update(deltaTime: number): void {
    this.render();
  }
  
  private render(): void {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Apply camera transform
    this.ctx.save();
    const transform = this.camera.getTransform();
    this.ctx.scale(transform.scale, transform.scale);
    this.ctx.translate(transform.translateX / transform.scale, transform.translateY / transform.scale);
    
    // Get sorted layers
    const sortedLayers = Array.from(this.layers.values())
      .filter(layer => layer.visible)
      .sort((a, b) => a.zIndex - b.zIndex);
    
    // Render each layer
    for (const layer of sortedLayers) {
      this.ctx.save();
      this.ctx.globalAlpha = layer.opacity;
      
      switch (layer.id) {
        case 'background':
          this.renderBackground();
          break;
        case 'terrain':
          this.renderTerrain();
          break;
        case 'buildings':
          this.renderBuildings();
          break;
        case 'npcs':
          this.renderNPCs();
          break;
        case 'player':
          this.renderPlayer();
          break;
        case 'effects':
          this.renderEffects();
          break;
        case 'ui':
          this.renderUIOverlay();
          break;
        default:
          // Custom layer - render entities assigned to this layer
          this.renderCustomLayer(layer.id);
          break;
      }
      
      this.ctx.restore();
    }
    
    this.ctx.restore();
  }
  
  private renderBackground(): void {
    const bounds = this.camera.getViewportBounds();
    this.ctx.fillStyle = '#001122';
    this.ctx.fillRect(bounds.left, bounds.top, bounds.right - bounds.left, bounds.bottom - bounds.top);
  }
  
  private renderTerrain(): void {
    const bounds = this.camera.getViewportBounds();
    const map = this.mapManager.getCurrentMap();
    const tileSize = this.camera.config.tileSize;
    
    // Calculate tile bounds to render (with some margin for smooth scrolling)
    const margin = 2;
    const startX = Math.max(0, Math.floor(bounds.left / tileSize) - margin);
    const endX = Math.min(map.width - 1, Math.ceil(bounds.right / tileSize) + margin);
    const startY = Math.max(0, Math.floor(bounds.top / tileSize) - margin);
    const endY = Math.min(map.height - 1, Math.ceil(bounds.bottom / tileSize) + margin);
    
    // Only render visible terrain tiles
    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        const tileId = map.tiles[y][x];
        const tileType = Object.values(TILE_TYPES)[tileId] || TILE_TYPES.empty;
        
        // Skip rendering buildings in terrain layer
        if (!tileType.walkable) continue;
        
        const color = this.getTileColor(tileId);
        const worldX = x * tileSize;
        const worldY = y * tileSize;
        
        this.ctx.fillStyle = color;
        this.ctx.fillRect(worldX, worldY, tileSize, tileSize);
        
        // Add subtle border for non-empty tiles
        if (tileId > 0) {
          this.ctx.strokeStyle = '#000000';
          this.ctx.lineWidth = 0.5;
          this.ctx.strokeRect(worldX, worldY, tileSize, tileSize);
        }
      }
    }
  }
  
  private renderBuildings(): void {
    const bounds = this.camera.getViewportBounds();
    const map = this.mapManager.getCurrentMap();
    const tileSize = this.camera.config.tileSize;
    
    // Calculate tile bounds to render
    const margin = 2;
    const startX = Math.max(0, Math.floor(bounds.left / tileSize) - margin);
    const endX = Math.min(map.width - 1, Math.ceil(bounds.right / tileSize) + margin);
    const startY = Math.max(0, Math.floor(bounds.top / tileSize) - margin);
    const endY = Math.min(map.height - 1, Math.ceil(bounds.bottom / tileSize) + margin);
    
    // Render building tiles
    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        const tileId = map.tiles[y][x];
        const tileType = Object.values(TILE_TYPES)[tileId] || TILE_TYPES.empty;
        
        // Only render non-walkable tiles (buildings)
        if (tileType.walkable) continue;
        
        const color = this.getTileColor(tileId);
        const worldX = x * tileSize;
        const worldY = y * tileSize;
        
        this.ctx.fillStyle = color;
        this.ctx.fillRect(worldX, worldY, tileSize, tileSize);
        
        // Add border
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 0.5;
        this.ctx.strokeRect(worldX, worldY, tileSize, tileSize);
      }
    }
  }
  
  private renderNPCs(): void {
    // This will be populated by NPC system
    // For now, we'll render entities with sprites that are not the player
    const renderableEntities = this.getRenderableEntities();
    
    for (const entity of renderableEntities) {
      if (entity.sprite.layer === 'npcs' || (typeof entity.sprite.layer === 'number' && entity.sprite.layer === 0 && entity.layer !== 'player')) {
        this.renderEntity(entity);
      }
    }
  }
  
  private renderPlayer(): void {
    const renderableEntities = this.getRenderableEntities();
    
    for (const entity of renderableEntities) {
      if (entity.sprite.layer === 'player' || entity.layer === 'player') {
        this.renderEntity(entity);
      }
    }
  }
  
  private renderEffects(): void {
    // Render particle system
    particleSystem.render(this.ctx);
  }
  
  private renderUIOverlay(): void {
    // This could be used for world-space UI elements like health bars, names, etc.
    // Screen-space UI is handled separately
  }
  
  private renderCustomLayer(layerId: string): void {
    const renderableEntities = this.getRenderableEntities();
    
    for (const entity of renderableEntities) {
      if (entity.layer === layerId) {
        this.renderEntity(entity);
      }
    }
  }
  
  private renderEntity(entity: RenderableEntity): void {
    const tileSize = this.camera.config.tileSize;
    const transform = entity.transform;
    const sprite = entity.sprite;
    
    if (!sprite.visible) return;
    
    // Update visual position for smooth movement
    transform.updateVisualPosition(performance.now());
    const visualPos = transform.getVisualPosition();
    
    const worldX = visualPos.x * tileSize;
    const worldY = visualPos.y * tileSize;
    
    // Check if entity is visible
    if (!this.camera.isVisible(worldX, worldY, tileSize)) {
      return;
    }
    
    // Try to render with sprite system first
    const spriteSheet = spriteManager.getSpriteSheet(sprite.spriteSheetId);
    if (spriteSheet) {
      // Update sprite animation
      sprite.updateAnimation(16); // ~16ms per frame at 60fps
      
      // Draw animated sprite
      spriteManager.drawAnimatedSprite(
        this.ctx,
        sprite.spriteSheetId,
        sprite.currentAnimation,
        sprite.animationTime,
        worldX,
        worldY,
        sprite.scale
      );
    } else {
      // Fallback to colored rectangle rendering
      this.renderFallbackSprite(entity, worldX, worldY, tileSize);
    }
  }
  
  private renderFallbackSprite(entity: RenderableEntity, worldX: number, worldY: number, tileSize: number): void {
    const { transform } = entity;
    
    // Entity shadow
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.ctx.fillRect(worldX + 2, worldY + 2, tileSize - 2, tileSize - 2);
    
    // Entity body (color based on layer/type)
    let color = '#808080'; // Default gray
    if (entity.layer === 'player') {
      color = '#ffff00'; // Yellow for player
    } else if (entity.layer === 'npcs') {
      color = '#0088ff'; // Blue for NPCs
    }
    
    this.ctx.fillStyle = color;
    this.ctx.fillRect(worldX + 1, worldY + 1, tileSize - 2, tileSize - 2);
    
    // Facing indicator
    this.ctx.fillStyle = '#ffffff';
    const centerX = worldX + tileSize / 2;
    const centerY = worldY + tileSize / 2;
    
    switch (transform.facing) {
      case 'north':
        this.ctx.fillRect(centerX - 1, centerY - 2, 2, 1);
        break;
      case 'south':
        this.ctx.fillRect(centerX - 1, centerY + 2, 2, 1);
        break;
      case 'west':
        this.ctx.fillRect(centerX - 2, centerY - 1, 1, 2);
        break;
      case 'east':
        this.ctx.fillRect(centerX + 2, centerY - 1, 1, 2);
        break;
    }
  }
  
  private getRenderableEntities(): RenderableEntity[] {
    const entities: RenderableEntity[] = [];
    const transforms = this.componentManager.getComponentsOfType(Transform);
    
    for (const transform of transforms) {
      const sprite = this.componentManager.getComponent(transform.entityId, Sprite);
      if (sprite) {
        entities.push({
          entityId: transform.entityId,
          transform,
          sprite,
          layer: this.determineEntityLayer(transform.entityId, sprite)
        });
      }
    }
    
    return entities;
  }
  
  private determineEntityLayer(entityId: EntityId, sprite: Sprite): string {
    // Determine layer based on sprite properties or entity type
    // This could be expanded to use a component for layer assignment
    if (sprite.layer === 'player' || sprite.spriteSheetId === 'player') {
      return 'player';
    } else if (sprite.layer === 'npcs' || (typeof sprite.layer === 'number' && sprite.layer === 10)) {
      return 'npcs';
    } else {
      return 'npcs'; // Default to NPCs layer
    }
  }
  
  private getTileColor(tileId: number): string {
    const colors = [
      '#001122', // 0: empty (dark blue)
      '#444444', // 1: street (dark gray)
      '#666666', // 2: sidewalk (gray)
      '#8B4513', // 3: building (brown)
      '#32CD32', // 4: shop (lime green)
      '#FF6347', // 5: hospital (tomato red)
      '#FFD700', // 6: bank (gold)
      '#8B008B', // 7: dealer spot (dark magenta)
      '#4169E1', // 8: safe house (royal blue)
      '#DC143C'  // 9: police station (crimson)
    ];
    
    return colors[tileId] || colors[0];
  }
  
  // Debug methods
  renderDebugInfo(): void {
    this.ctx.save();
    this.ctx.resetTransform();
    
    // Camera info
    const bounds = this.camera.getViewportBounds();
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(10, 10, 300, 120);
    
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '12px monospace';
    this.ctx.fillText(`Camera: (${this.camera.x.toFixed(1)}, ${this.camera.y.toFixed(1)})`, 15, 25);
    this.ctx.fillText(`Zoom: ${this.camera.zoom.toFixed(2)}`, 15, 40);
    this.ctx.fillText(`Mode: ${this.camera.mode}`, 15, 55);
    this.ctx.fillText(`Bounds: ${bounds.left.toFixed(1)}, ${bounds.top.toFixed(1)} - ${bounds.right.toFixed(1)}, ${bounds.bottom.toFixed(1)}`, 15, 70);
    this.ctx.fillText(`Layers: ${Array.from(this.layers.keys()).join(', ')}`, 15, 85);
    
    this.ctx.restore();
  }
  
  // Utility method to take screenshots
  screenshot(): string {
    return this.canvas.toDataURL('image/png');
  }
}