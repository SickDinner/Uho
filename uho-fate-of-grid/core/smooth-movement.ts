// 🎮 SMOOTH MOVEMENT SYSTEM with 360-degree rotation
// Provides smooth interpolation between grid positions and free rotation

export interface SmoothTransform {
  // Current grid position (logical)
  gridX: number;
  gridY: number;
  
  // Visual position (interpolated)
  visualX: number;
  visualY: number;
  
  // Target position for smooth movement
  targetX: number;
  targetY: number;
  
  // Rotation in degrees (0-360, fully smooth)
  rotation: number;
  targetRotation: number;
  
  // Movement state
  isMoving: boolean;
  moveSpeed: number; // Grid units per second
  rotationSpeed: number; // Degrees per second
  
  // Visual offset for sub-pixel positioning
  pixelOffsetX: number;
  pixelOffsetY: number;
}

export class SmoothMovementSystem {
  private transforms: Map<number, SmoothTransform> = new Map();
  private tileSize: number = 16; // Size of each grid tile in pixels
  private defaultMoveSpeed: number = 4.0; // Grid units per second
  private defaultRotationSpeed: number = 360.0; // Degrees per second (1 full rotation)

  constructor(tileSize: number = 16) {
    this.tileSize = tileSize;
  }

  // Initialize smooth transform for an entity
  public initializeEntity(
    entityId: number, 
    gridX: number, 
    gridY: number, 
    rotation: number = 0
  ): void {
    const transform: SmoothTransform = {
      gridX,
      gridY,
      visualX: gridX,
      visualY: gridY,
      targetX: gridX,
      targetY: gridY,
      rotation: this.normalizeRotation(rotation),
      targetRotation: this.normalizeRotation(rotation),
      isMoving: false,
      moveSpeed: this.defaultMoveSpeed,
      rotationSpeed: this.defaultRotationSpeed,
      pixelOffsetX: 0,
      pixelOffsetY: 0
    };
    
    this.transforms.set(entityId, transform);
  }

  // Start movement to a new grid position
  public moveToGrid(
    entityId: number, 
    gridX: number, 
    gridY: number, 
    customSpeed?: number
  ): boolean {
    const transform = this.transforms.get(entityId);
    if (!transform) return false;

    // Don't start new movement if already moving
    if (transform.isMoving) return false;

    // Set target position
    transform.targetX = gridX;
    transform.targetY = gridY;
    transform.isMoving = true;
    
    if (customSpeed !== undefined) {
      transform.moveSpeed = customSpeed;
    }

    // Calculate rotation to face movement direction
    const deltaX = gridX - transform.gridX;
    const deltaY = gridY - transform.gridY;
    
    if (deltaX !== 0 || deltaY !== 0) {
      const targetRotation = this.calculateRotationFromDirection(deltaX, deltaY);
      this.rotateToAngle(entityId, targetRotation);
    }

    console.log(`Entity ${entityId} moving from (${transform.gridX}, ${transform.gridY}) to (${gridX}, ${gridY})`);
    return true;
  }

  // Rotate to a specific angle (0-360 degrees)
  public rotateToAngle(entityId: number, targetRotation: number): boolean {
    const transform = this.transforms.get(entityId);
    if (!transform) return false;

    const normalizedTarget = this.normalizeRotation(targetRotation);
    
    // Choose the shortest rotation path
    const currentRot = transform.rotation;
    const diff = normalizedTarget - currentRot;
    
    let adjustedTarget = normalizedTarget;
    if (diff > 180) {
      adjustedTarget = normalizedTarget - 360;
    } else if (diff < -180) {
      adjustedTarget = normalizedTarget + 360;
    }

    transform.targetRotation = adjustedTarget;
    return true;
  }

  // Rotate by a relative amount
  public rotateBy(entityId: number, degrees: number): boolean {
    const transform = this.transforms.get(entityId);
    if (!transform) return false;

    const targetRotation = transform.rotation + degrees;
    return this.rotateToAngle(entityId, targetRotation);
  }

  // Face a specific direction (cardinal + diagonals + continuous)
  public faceDirection(entityId: number, direction: string | number): boolean {
    if (typeof direction === 'number') {
      return this.rotateToAngle(entityId, direction);
    }

    // Convert direction string to angle
    const directionAngles: { [key: string]: number } = {
      'north': 0,
      'northeast': 45,
      'east': 90,
      'southeast': 135,
      'south': 180,
      'southwest': 225,
      'west': 270,
      'northwest': 315,
      'up': 0,
      'right': 90,
      'down': 180,
      'left': 270
    };

    const angle = directionAngles[direction.toLowerCase()];
    if (angle !== undefined) {
      return this.rotateToAngle(entityId, angle);
    }

    return false;
  }

  // Update smooth movement and rotation (call every frame)
  public update(deltaTime: number): void {
    const dt = Math.min(deltaTime / 1000, 1/30); // Cap delta time to prevent large jumps
    
    for (const [entityId, transform] of this.transforms) {
      this.updateEntityTransform(transform, dt);
    }
  }

  private updateEntityTransform(transform: SmoothTransform, deltaTime: number): void {
    let hasChanges = false;

    // Update position
    if (transform.isMoving) {
      const deltaX = transform.targetX - transform.visualX;
      const deltaY = transform.targetY - transform.visualY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (distance < 0.01) {
        // Reached target
        transform.visualX = transform.targetX;
        transform.visualY = transform.targetY;
        transform.gridX = transform.targetX;
        transform.gridY = transform.targetY;
        transform.isMoving = false;
        hasChanges = true;
      } else {
        // Move towards target
        const moveDistance = transform.moveSpeed * deltaTime;
        const moveRatio = Math.min(moveDistance / distance, 1.0);
        
        transform.visualX += deltaX * moveRatio;
        transform.visualY += deltaY * moveRatio;
        hasChanges = true;
      }
    }

    // Update rotation
    const rotationDiff = transform.targetRotation - transform.rotation;
    if (Math.abs(rotationDiff) > 0.1) {
      const rotationMove = transform.rotationSpeed * deltaTime;
      const rotationRatio = Math.min(rotationMove / Math.abs(rotationDiff), 1.0);
      
      transform.rotation += rotationDiff * rotationRatio;
      transform.rotation = this.normalizeRotation(transform.rotation);
      hasChanges = true;
    } else if (Math.abs(rotationDiff) > 0) {
      transform.rotation = this.normalizeRotation(transform.targetRotation);
      hasChanges = true;
    }
  }

  // Get current visual position in world coordinates
  public getVisualPosition(entityId: number): { x: number, y: number } | null {
    const transform = this.transforms.get(entityId);
    if (!transform) return null;

    return {
      x: transform.visualX * this.tileSize + transform.pixelOffsetX,
      y: transform.visualY * this.tileSize + transform.pixelOffsetY
    };
  }

  // Get current grid position
  public getGridPosition(entityId: number): { x: number, y: number } | null {
    const transform = this.transforms.get(entityId);
    if (!transform) return null;

    return { x: transform.gridX, y: transform.gridY };
  }

  // Get current rotation
  public getRotation(entityId: number): number | null {
    const transform = this.transforms.get(entityId);
    if (!transform) return null;

    return transform.rotation;
  }

  // Check if entity is currently moving
  public isMoving(entityId: number): boolean {
    const transform = this.transforms.get(entityId);
    if (!transform) return false;

    return transform.isMoving;
  }

  // Set movement and rotation speeds
  public setSpeed(entityId: number, moveSpeed?: number, rotationSpeed?: number): boolean {
    const transform = this.transforms.get(entityId);
    if (!transform) return false;

    if (moveSpeed !== undefined) {
      transform.moveSpeed = Math.max(0.1, moveSpeed);
    }
    
    if (rotationSpeed !== undefined) {
      transform.rotationSpeed = Math.max(1.0, rotationSpeed);
    }

    return true;
  }

  // Add pixel-level offset for fine positioning
  public setPixelOffset(entityId: number, offsetX: number, offsetY: number): boolean {
    const transform = this.transforms.get(entityId);
    if (!transform) return false;

    transform.pixelOffsetX = offsetX;
    transform.pixelOffsetY = offsetY;
    return true;
  }

  // Stop current movement immediately
  public stopMovement(entityId: number): boolean {
    const transform = this.transforms.get(entityId);
    if (!transform) return false;

    if (transform.isMoving) {
      // Snap to current grid position
      transform.targetX = Math.round(transform.visualX);
      transform.targetY = Math.round(transform.visualY);
      transform.gridX = transform.targetX;
      transform.gridY = transform.targetY;
      transform.visualX = transform.targetX;
      transform.visualY = transform.targetY;
      transform.isMoving = false;
    }

    return true;
  }

  // Get transform for rendering system
  public getTransform(entityId: number): SmoothTransform | null {
    return this.transforms.get(entityId) || null;
  }

  // Remove entity from system
  public removeEntity(entityId: number): boolean {
    return this.transforms.delete(entityId);
  }

  private normalizeRotation(rotation: number): number {
    let normalized = rotation % 360;
    if (normalized < 0) normalized += 360;
    return normalized;
  }

  private calculateRotationFromDirection(deltaX: number, deltaY: number): number {
    // Calculate angle in degrees (0 = north, 90 = east, 180 = south, 270 = west)
    let angle = Math.atan2(deltaX, -deltaY) * (180 / Math.PI);
    return this.normalizeRotation(angle);
  }

  // Debug information
  public getDebugInfo(entityId: number): string | null {
    const transform = this.transforms.get(entityId);
    if (!transform) return null;

    return `Entity ${entityId}:
      Grid: (${transform.gridX.toFixed(1)}, ${transform.gridY.toFixed(1)})
      Visual: (${transform.visualX.toFixed(2)}, ${transform.visualY.toFixed(2)})
      Target: (${transform.targetX}, ${transform.targetY})
      Rotation: ${transform.rotation.toFixed(1)}° → ${transform.targetRotation.toFixed(1)}°
      Moving: ${transform.isMoving}
      Speed: ${transform.moveSpeed} grid/s, ${transform.rotationSpeed}°/s`;
  }

  // Get all entities managed by this system
  public getEntityCount(): number {
    return this.transforms.size;
  }

  public getAllEntities(): number[] {
    return Array.from(this.transforms.keys());
  }
}

// Global instance
export const smoothMovement = new SmoothMovementSystem(16); // 16px tile size

// Convenience functions
export function initSmoothMovement(entityId: number, x: number, y: number, rotation: number = 0): void {
  smoothMovement.initializeEntity(entityId, x, y, rotation);
}

export function moveSmooth(entityId: number, x: number, y: number, speed?: number): boolean {
  return smoothMovement.moveToGrid(entityId, x, y, speed);
}

export function rotateSmooth(entityId: number, rotation: number): boolean {
  return smoothMovement.rotateToAngle(entityId, rotation);
}

export function faceDirection(entityId: number, direction: string | number): boolean {
  return smoothMovement.faceDirection(entityId, direction);
}