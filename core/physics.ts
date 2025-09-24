// 2D Physics Engine for UHO: Fate of the Grid
// Zelda 2-style physics with gravity, weight, and collision detection

import type { Vector2 } from './types.ts';

export interface PhysicsBody {
  id: number;
  position: Vector2;
  velocity: Vector2;
  acceleration: Vector2;
  
  // Physical properties
  mass: number;          // Mass in kg (affects gravity and collisions)
  weight: number;        // Weight factor (affects carrying capacity)
  density: number;       // For buoyancy and material interactions
  
  // Collision properties
  bounds: Rectangle;     // Collision box
  isStatic: boolean;     // Static objects don't move (walls, platforms)
  isGrounded: boolean;   // Currently touching ground
  isSolid: boolean;      // Can other objects collide with this?
  
  // Physics flags
  affectedByGravity: boolean;
  canJump: boolean;
  friction: number;      // Surface friction (0-1)
  restitution: number;   // Bounciness (0-1)
  
  // Movement constraints
  maxVelocity: Vector2;
  terminalVelocity: number;
  
  // Zelda 2 style movement
  jumpPower: number;
  walkSpeed: number;
  runSpeed: number;
  isRunning: boolean;
}

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CollisionInfo {
  hasCollision: boolean;
  normal: Vector2;       // Collision normal
  penetration: number;   // How deep the collision is
  contactPoint: Vector2; // Where the collision occurred
  otherBody: PhysicsBody;
}

export interface PhysicsConfig {
  gravity: number;              // Gravity acceleration (pixels/s²)
  airResistance: number;        // Air resistance factor
  groundFriction: number;       // Default ground friction
  pixelsPerMeter: number;       // Scale factor for physics calculations
  maxSimulationStep: number;    // Maximum physics timestep
  collisionIterations: number;  // Collision resolution iterations
}

export class PhysicsEngine {
  private bodies: Map<number, PhysicsBody> = new Map();
  private staticBodies: PhysicsBody[] = [];  // Optimization for static collision
  private config: PhysicsConfig;
  
  // Spatial partitioning for collision optimization
  private spatialGrid: Map<string, PhysicsBody[]> = new Map();
  private gridSize: number = 64;
  
  constructor(config?: Partial<PhysicsConfig>) {
    this.config = {
      gravity: 980,              // ~9.8 m/s² at 100 pixels/meter
      airResistance: 0.01,
      groundFriction: 0.7,
      pixelsPerMeter: 100,
      maxSimulationStep: 1/60,   // 60 FPS max
      collisionIterations: 4,
      ...config
    };
  }

  // Create physics body for an entity
  createBody(
    id: number,
    x: number,
    y: number,
    width: number,
    height: number,
    options?: Partial<PhysicsBody>
  ): PhysicsBody {
    const body: PhysicsBody = {
      id,
      position: { x, y },
      velocity: { x: 0, y: 0 },
      acceleration: { x: 0, y: 0 },
      
      // Default physical properties
      mass: 1,
      weight: 1,
      density: 1,
      
      bounds: { x, y, width, height },
      isStatic: false,
      isGrounded: false,
      isSolid: true,
      
      affectedByGravity: true,
      canJump: true,
      friction: this.config.groundFriction,
      restitution: 0.1,
      
      maxVelocity: { x: 400, y: 1000 }, // Max horizontal/vertical speed
      terminalVelocity: 800,
      
      // Zelda 2 movement defaults
      jumpPower: 300,
      walkSpeed: 100,
      runSpeed: 200,
      isRunning: false,
      
      ...options
    };

    this.bodies.set(id, body);
    
    if (body.isStatic) {
      this.staticBodies.push(body);
    }
    
    this.updateSpatialGrid(body);
    return body;
  }

  // Remove physics body
  removeBody(id: number): void {
    const body = this.bodies.get(id);
    if (body) {
      this.bodies.delete(id);
      if (body.isStatic) {
        const index = this.staticBodies.indexOf(body);
        if (index > -1) {
          this.staticBodies.splice(index, 1);
        }
      }
      this.removeFromSpatialGrid(body);
    }
  }

  // Get physics body
  getBody(id: number): PhysicsBody | undefined {
    return this.bodies.get(id);
  }

  // Update physics simulation
  update(deltaTime: number): void {
    // Clamp delta time to prevent physics explosions
    const dt = Math.min(deltaTime / 1000, this.config.maxSimulationStep);
    
    // Update all dynamic bodies
    for (const body of this.bodies.values()) {
      if (!body.isStatic) {
        this.updateBody(body, dt);
      }
    }
    
    // Resolve collisions
    this.resolveCollisions();
    
    // Update spatial grid for all bodies
    this.updateAllSpatialGrids();
  }

  private updateBody(body: PhysicsBody, dt: number): void {
    // Apply gravity
    if (body.affectedByGravity && !body.isGrounded) {
      body.acceleration.y += this.config.gravity;
    }
    
    // Apply air resistance
    const airRes = this.config.airResistance;
    body.acceleration.x -= body.velocity.x * airRes;
    body.acceleration.y -= body.velocity.y * airRes * 0.1; // Less air resistance vertically
    
    // Apply ground friction when grounded
    if (body.isGrounded) {
      body.velocity.x *= (1 - body.friction * dt);
    }
    
    // Update velocity
    body.velocity.x += body.acceleration.x * dt;
    body.velocity.y += body.acceleration.y * dt;
    
    // Apply velocity constraints
    body.velocity.x = Math.max(-body.maxVelocity.x, Math.min(body.maxVelocity.x, body.velocity.x));
    body.velocity.y = Math.max(-body.maxVelocity.y, Math.min(body.maxVelocity.y, body.velocity.y));
    
    // Terminal velocity
    if (Math.abs(body.velocity.y) > body.terminalVelocity) {
      body.velocity.y = Math.sign(body.velocity.y) * body.terminalVelocity;
    }
    
    // Update position
    body.position.x += body.velocity.x * dt;
    body.position.y += body.velocity.y * dt;
    
    // Update collision bounds
    body.bounds.x = body.position.x;
    body.bounds.y = body.position.y;
    
    // Reset acceleration for next frame
    body.acceleration.x = 0;
    body.acceleration.y = 0;
    
    // Assume not grounded until collision detection proves otherwise
    body.isGrounded = false;
  }

  // Zelda 2-style movement functions
  moveLeft(bodyId: number, isRunning: boolean = false): void {
    const body = this.getBody(bodyId);
    if (!body) return;
    
    const speed = isRunning ? body.runSpeed : body.walkSpeed;
    body.velocity.x = -speed;
    body.isRunning = isRunning;
  }

  moveRight(bodyId: number, isRunning: boolean = false): void {
    const body = this.getBody(bodyId);
    if (!body) return;
    
    const speed = isRunning ? body.runSpeed : body.walkSpeed;
    body.velocity.x = speed;
    body.isRunning = isRunning;
  }

  jump(bodyId: number): boolean {
    const body = this.getBody(bodyId);
    if (!body || !body.canJump || !body.isGrounded) return false;
    
    body.velocity.y = -body.jumpPower;
    body.isGrounded = false;
    return true;
  }

  stopHorizontalMovement(bodyId: number): void {
    const body = this.getBody(bodyId);
    if (!body) return;
    
    // Don't immediately stop - let friction handle it for more realistic movement
    if (body.isGrounded) {
      body.velocity.x *= 0.5; // Quick deceleration
    }
  }

  // Apply force to body
  applyForce(bodyId: number, force: Vector2): void {
    const body = this.getBody(bodyId);
    if (!body || body.isStatic) return;
    
    // F = ma, so a = F/m
    body.acceleration.x += force.x / body.mass;
    body.acceleration.y += force.y / body.mass;
  }

  // Apply impulse (instant velocity change)
  applyImpulse(bodyId: number, impulse: Vector2): void {
    const body = this.getBody(bodyId);
    if (!body || body.isStatic) return;
    
    body.velocity.x += impulse.x / body.mass;
    body.velocity.y += impulse.y / body.mass;
  }

  // Collision detection
  checkCollision(bodyA: PhysicsBody, bodyB: PhysicsBody): CollisionInfo {
    const result: CollisionInfo = {
      hasCollision: false,
      normal: { x: 0, y: 0 },
      penetration: 0,
      contactPoint: { x: 0, y: 0 },
      otherBody: bodyB
    };

    if (!this.rectangleIntersection(bodyA.bounds, bodyB.bounds)) {
      return result;
    }

    // Calculate overlap
    const overlapX = Math.min(
      bodyA.bounds.x + bodyA.bounds.width - bodyB.bounds.x,
      bodyB.bounds.x + bodyB.bounds.width - bodyA.bounds.x
    );
    
    const overlapY = Math.min(
      bodyA.bounds.y + bodyA.bounds.height - bodyB.bounds.y,
      bodyB.bounds.y + bodyB.bounds.height - bodyA.bounds.y
    );

    result.hasCollision = true;

    // Determine collision normal based on smallest overlap
    if (overlapX < overlapY) {
      // Horizontal collision
      result.normal.x = bodyA.bounds.x < bodyB.bounds.x ? -1 : 1;
      result.normal.y = 0;
      result.penetration = overlapX;
      result.contactPoint.x = bodyA.bounds.x < bodyB.bounds.x ? 
        bodyA.bounds.x + bodyA.bounds.width : bodyA.bounds.x;
      result.contactPoint.y = bodyA.bounds.y + bodyA.bounds.height / 2;
    } else {
      // Vertical collision
      result.normal.x = 0;
      result.normal.y = bodyA.bounds.y < bodyB.bounds.y ? -1 : 1;
      result.penetration = overlapY;
      result.contactPoint.x = bodyA.bounds.x + bodyA.bounds.width / 2;
      result.contactPoint.y = bodyA.bounds.y < bodyB.bounds.y ? 
        bodyA.bounds.y + bodyA.bounds.height : bodyA.bounds.y;
    }

    return result;
  }

  private rectangleIntersection(rectA: Rectangle, rectB: Rectangle): boolean {
    return rectA.x < rectB.x + rectB.width &&
           rectA.x + rectA.width > rectB.x &&
           rectA.y < rectB.y + rectB.height &&
           rectA.y + rectA.height > rectB.y;
  }

  // Resolve collisions between all bodies
  private resolveCollisions(): void {
    // Check collisions for all dynamic bodies
    for (const bodyA of this.bodies.values()) {
      if (bodyA.isStatic || !bodyA.isSolid) continue;
      
      // Get nearby bodies from spatial grid
      const nearbyBodies = this.getNearbyBodies(bodyA);
      
      for (const bodyB of nearbyBodies) {
        if (bodyA.id === bodyB.id || !bodyB.isSolid) continue;
        
        const collision = this.checkCollision(bodyA, bodyB);
        if (collision.hasCollision) {
          this.resolveCollision(bodyA, bodyB, collision);
        }
      }
    }
  }

  private resolveCollision(bodyA: PhysicsBody, bodyB: PhysicsBody, collision: CollisionInfo): void {
    // Separate the bodies
    const separation = collision.penetration / 2;
    
    if (!bodyA.isStatic) {
      bodyA.position.x -= collision.normal.x * separation;
      bodyA.position.y -= collision.normal.y * separation;
      bodyA.bounds.x = bodyA.position.x;
      bodyA.bounds.y = bodyA.position.y;
    }
    
    if (!bodyB.isStatic) {
      bodyB.position.x += collision.normal.x * separation;
      bodyB.position.y += collision.normal.y * separation;
      bodyB.bounds.x = bodyB.position.x;
      bodyB.bounds.y = bodyB.position.y;
    }

    // Handle grounding (standing on top of objects)
    if (collision.normal.y < 0 && bodyA.velocity.y >= 0) {
      bodyA.isGrounded = true;
      bodyA.velocity.y = 0;
    }

    // Apply collision response
    if (!bodyA.isStatic && !bodyB.isStatic) {
      this.applyCollisionResponse(bodyA, bodyB, collision);
    } else if (!bodyA.isStatic) {
      // Collision with static body
      if (collision.normal.x !== 0) {
        bodyA.velocity.x *= -bodyA.restitution;
      }
      if (collision.normal.y !== 0) {
        bodyA.velocity.y *= -bodyA.restitution;
      }
    }
  }

  private applyCollisionResponse(bodyA: PhysicsBody, bodyB: PhysicsBody, collision: CollisionInfo): void {
    // Calculate relative velocity
    const relativeVel = {
      x: bodyA.velocity.x - bodyB.velocity.x,
      y: bodyA.velocity.y - bodyB.velocity.y
    };

    // Calculate relative velocity along collision normal
    const velAlongNormal = relativeVel.x * collision.normal.x + relativeVel.y * collision.normal.y;

    // Don't resolve if velocities are separating
    if (velAlongNormal > 0) return;

    // Calculate restitution
    const restitution = Math.min(bodyA.restitution, bodyB.restitution);

    // Calculate impulse scalar
    const impulseScalar = -(1 + restitution) * velAlongNormal;
    const totalMass = bodyA.mass + bodyB.mass;

    // Apply impulse
    const impulse = {
      x: impulseScalar * collision.normal.x / totalMass,
      y: impulseScalar * collision.normal.y / totalMass
    };

    bodyA.velocity.x += impulse.x * bodyB.mass;
    bodyA.velocity.y += impulse.y * bodyB.mass;
    bodyB.velocity.x -= impulse.x * bodyA.mass;
    bodyB.velocity.y -= impulse.y * bodyA.mass;
  }

  // Spatial grid optimization
  private getSpatialGridKey(x: number, y: number): string {
    const gridX = Math.floor(x / this.gridSize);
    const gridY = Math.floor(y / this.gridSize);
    return `${gridX},${gridY}`;
  }

  private updateSpatialGrid(body: PhysicsBody): void {
    this.removeFromSpatialGrid(body);
    
    const key = this.getSpatialGridKey(body.position.x, body.position.y);
    if (!this.spatialGrid.has(key)) {
      this.spatialGrid.set(key, []);
    }
    this.spatialGrid.get(key)!.push(body);
  }

  private removeFromSpatialGrid(body: PhysicsBody): void {
    for (const [key, bodies] of this.spatialGrid.entries()) {
      const index = bodies.indexOf(body);
      if (index > -1) {
        bodies.splice(index, 1);
        if (bodies.length === 0) {
          this.spatialGrid.delete(key);
        }
        break;
      }
    }
  }

  private updateAllSpatialGrids(): void {
    for (const body of this.bodies.values()) {
      this.updateSpatialGrid(body);
    }
  }

  private getNearbyBodies(body: PhysicsBody): PhysicsBody[] {
    const nearby: PhysicsBody[] = [];
    const key = this.getSpatialGridKey(body.position.x, body.position.y);
    
    // Check surrounding grid cells
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const gridX = Math.floor(body.position.x / this.gridSize) + dx;
        const gridY = Math.floor(body.position.y / this.gridSize) + dy;
        const searchKey = `${gridX},${gridY}`;
        
        const bodies = this.spatialGrid.get(searchKey);
        if (bodies) {
          nearby.push(...bodies);
        }
      }
    }
    
    // Always check static bodies
    nearby.push(...this.staticBodies);
    
    return nearby;
  }

  // Debug and utility functions
  getPhysicsInfo(bodyId: number): string {
    const body = this.getBody(bodyId);
    if (!body) return 'Body not found';
    
    return `Physics Info for Body ${bodyId}:
Position: (${body.position.x.toFixed(1)}, ${body.position.y.toFixed(1)})
Velocity: (${body.velocity.x.toFixed(1)}, ${body.velocity.y.toFixed(1)})
Mass: ${body.mass}kg, Weight: ${body.weight}
Grounded: ${body.isGrounded}
Static: ${body.isStatic}`;
  }

  // Create common physics bodies
  createCharacter(id: number, x: number, y: number): PhysicsBody {
    return this.createBody(id, x, y, 16, 32, {
      mass: 70,           // 70kg average human
      weight: 1,
      jumpPower: 400,
      walkSpeed: 120,
      runSpeed: 200,
      friction: 0.8,
      restitution: 0.1
    });
  }

  createItem(id: number, x: number, y: number, itemWeight: number = 0.5): PhysicsBody {
    const size = itemWeight < 0.1 ? 4 : itemWeight < 1 ? 8 : 12;
    return this.createBody(id, x, y, size, size, {
      mass: itemWeight,
      weight: itemWeight,
      jumpPower: 0,
      canJump: false,
      friction: 0.9,
      restitution: 0.3
    });
  }

  createPlatform(id: number, x: number, y: number, width: number, height: number = 16): PhysicsBody {
    return this.createBody(id, x, y, width, height, {
      isStatic: true,
      affectedByGravity: false,
      mass: Infinity,
      friction: 0.8,
      restitution: 0
    });
  }
}

// Global physics engine instance
export const physicsEngine = new PhysicsEngine();

// Export for debugging
if (typeof window !== 'undefined') {
  (window as any).physics = physicsEngine;
  console.log('🎯 Physics Engine loaded! Use window.physics for debugging.');
}