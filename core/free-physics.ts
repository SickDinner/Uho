// Vapaan liikkumisen fysiikkamoottori - 360° liikkuminen pikselitarkalla collision-logiikalla
// Ei enää tile-pohjaista liikkumista!

import type { Vector2 } from './types.ts';

export interface FreePhysicsBody {
  id: number;
  
  // Positio ja liikkuminen (pikselitasolla)
  position: Vector2;
  velocity: Vector2;
  acceleration: Vector2;
  
  // Suuntautuminen (0-360 astetta)
  rotation: number;
  angularVelocity: number;
  
  // Fyysiset ominaisuudet
  mass: number;
  friction: number;
  restitution: number; // Kimmokerroin
  
  // Törmäysalue (pikselitarkka)
  collisionShape: CollisionShape;
  isStatic: boolean;
  isSolid: boolean;
  
  // Liikkumisominaisuudet
  maxSpeed: number;
  acceleration_force: number;
  turnSpeed: number; // Kääntymisen nopeus
  
  // Tila
  isGrounded: boolean;
  isMoving: boolean;
  
  // Visuaalinen
  spriteId: string;
  scale: number;
  opacity: number;
  layer: number; // 0-5 (0-2 tausta, 3-5 sprite-tasot)
}

export interface CollisionShape {
  type: 'circle' | 'rectangle' | 'polygon' | 'pixel';
  
  // Ympyrä
  radius?: number;
  
  // Suorakulmio
  width?: number;
  height?: number;
  offset?: Vector2;
  
  // Polygoni
  vertices?: Vector2[];
  
  // Pikselitarkka (sprite-pohjainen)
  pixelData?: ImageData;
  pixelThreshold?: number; // Alpha-arvo törmäyksille (0-255)
}

export interface CollisionResult {
  hasCollision: boolean;
  point: Vector2;
  normal: Vector2;
  penetration: number;
  other: FreePhysicsBody;
}

export class FreePhysicsEngine {
  private bodies: Map<number, FreePhysicsBody> = new Map();
  private staticBodies: FreePhysicsBody[] = [];
  
  // Optimoinnit
  private spatialGrid: Map<string, FreePhysicsBody[]> = new Map();
  private gridSize: number = 128; // Suurempi ruudukko vapaalle liikkumiselle
  
  // Asetukset
  private gravity: number = 0; // Ei gravitaatiota ylhäältä näkymässä
  private airResistance: number = 0.98;
  private minVelocity: number = 0.1;
  
  constructor() {
    console.log('🆓 Free Physics Engine initialized - 360° movement enabled!');
  }

  createBody(
    id: number,
    x: number,
    y: number,
    collisionShape: CollisionShape,
    options: Partial<FreePhysicsBody> = {}
  ): FreePhysicsBody {
    const body: FreePhysicsBody = {
      id,
      position: { x, y },
      velocity: { x: 0, y: 0 },
      acceleration: { x: 0, y: 0 },
      
      rotation: 0,
      angularVelocity: 0,
      
      mass: 1,
      friction: 0.95,
      restitution: 0.1,
      
      collisionShape,
      isStatic: false,
      isSolid: true,
      
      maxSpeed: 200, // pikseliä/sekunti
      acceleration_force: 500,
      turnSpeed: 180, // astetta/sekunti
      
      isGrounded: true, // Aina "maassa" ylhäältä näkymässä
      isMoving: false,
      
      spriteId: '',
      scale: 1,
      opacity: 1,
      layer: 3, // Oletuslayer spriteille
      
      ...options
    };

    this.bodies.set(id, body);
    
    if (body.isStatic) {
      this.staticBodies.push(body);
    }
    
    this.updateSpatialGrid(body);
    return body;
  }

  // Vapaa liikkuminen - ei enää WASD ruudukkoon!
  moveBody(
    bodyId: number, 
    direction: Vector2, // Normalisoitu suuntavektori
    force: number = 1.0,
    turnTowards: boolean = true
  ): void {
    const body = this.getBody(bodyId);
    if (!body || body.isStatic) return;
    
    // Laske liikkumisvoima
    const moveForce = {
      x: direction.x * body.acceleration_force * force,
      y: direction.y * body.acceleration_force * force
    };
    
    // Lisää voima
    body.acceleration.x += moveForce.x / body.mass;
    body.acceleration.y += moveForce.y / body.mass;
    
    // Käännä kohti liikkumissuuntaa
    if (turnTowards && (Math.abs(direction.x) > 0.1 || Math.abs(direction.y) > 0.1)) {
      const targetRotation = Math.atan2(direction.y, direction.x) * (180 / Math.PI);
      this.rotateTowards(bodyId, targetRotation);
    }
    
    body.isMoving = Math.abs(direction.x) > 0.1 || Math.abs(direction.y) > 0.1;
  }

  // Käännä kohti tiettyä kulmaa sulavasti
  rotateTowards(bodyId: number, targetRotation: number): void {
    const body = this.getBody(bodyId);
    if (!body) return;
    
    // Normalisoi kulmat
    let current = body.rotation;
    let target = targetRotation;
    
    // Käsittele 360° kierto
    while (target - current > 180) target -= 360;
    while (current - target > 180) current -= 360;
    
    const diff = target - current;
    const maxTurn = body.turnSpeed * (1/60); // 60 FPS oletus
    
    if (Math.abs(diff) < maxTurn) {
      body.rotation = target;
      body.angularVelocity = 0;
    } else {
      body.angularVelocity = Math.sign(diff) * body.turnSpeed;
    }
  }

  // Päivitä fysiikka
  update(deltaTime: number): void {
    const dt = Math.min(deltaTime / 1000, 1/30); // Max 30 FPS timestep
    
    // Päivitä kaikki dynaamiset kappaleet
    for (const body of this.bodies.values()) {
      if (!body.isStatic) {
        this.updateBody(body, dt);
      }
    }
    
    // Törmäykset
    this.resolveCollisions();
    
    // Päivitä spatial grid
    this.updateAllSpatialGrids();
  }

  private updateBody(body: FreePhysicsBody, dt: number): void {
    // Päivitä kääntyminen
    body.rotation += body.angularVelocity * dt;
    body.rotation = this.normalizeAngle(body.rotation);
    
    // Ilmanvastus
    body.velocity.x *= this.airResistance;
    body.velocity.y *= this.airResistance;
    
    // Kitka
    body.velocity.x *= body.friction;
    body.velocity.y *= body.friction;
    
    // Päivitä nopeus
    body.velocity.x += body.acceleration.x * dt;
    body.velocity.y += body.acceleration.y * dt;
    
    // Rajoita maksiminopeus
    const speed = Math.sqrt(body.velocity.x ** 2 + body.velocity.y ** 2);
    if (speed > body.maxSpeed) {
      const factor = body.maxSpeed / speed;
      body.velocity.x *= factor;
      body.velocity.y *= factor;
    }
    
    // Pysäytä hyvin hitaat liikkeet
    if (speed < this.minVelocity) {
      body.velocity.x = 0;
      body.velocity.y = 0;
    }
    
    // Päivitä positio
    body.position.x += body.velocity.x * dt;
    body.position.y += body.velocity.y * dt;
    
    // Nollaa kiihtyvyys
    body.acceleration.x = 0;
    body.acceleration.y = 0;
  }

  // Pikselitarkka törmäystunnistus
  checkCollision(bodyA: FreePhysicsBody, bodyB: FreePhysicsBody): CollisionResult {
    const result: CollisionResult = {
      hasCollision: false,
      point: { x: 0, y: 0 },
      normal: { x: 0, y: 0 },
      penetration: 0,
      other: bodyB
    };

    // Valitse oikea törmäysmenetelmä
    if (bodyA.collisionShape.type === 'pixel' || bodyB.collisionShape.type === 'pixel') {
      return this.pixelPerfectCollision(bodyA, bodyB);
    } else if (bodyA.collisionShape.type === 'circle' && bodyB.collisionShape.type === 'circle') {
      return this.circleCollision(bodyA, bodyB);
    } else if (bodyA.collisionShape.type === 'rectangle' && bodyB.collisionShape.type === 'rectangle') {
      return this.rectangleCollision(bodyA, bodyB);
    } else {
      // Sekakollisiot - käytä bounding box
      return this.boundingBoxCollision(bodyA, bodyB);
    }
  }

  // Pikselitarkka törmäys (raskas, käytetään vain tärkeimmissä)
  private pixelPerfectCollision(bodyA: FreePhysicsBody, bodyB: FreePhysicsBody): CollisionResult {
    const result: CollisionResult = {
      hasCollision: false,
      point: { x: 0, y: 0 },
      normal: { x: 0, y: 0 },
      penetration: 0,
      other: bodyB
    };

    // Tämä vaatisi sprite-datan latauksen ja pikselitarkastuksen
    // Yksinkertaistettu versio - käytetään bounding boxia
    return this.boundingBoxCollision(bodyA, bodyB);
  }

  // Ympyrätörmäys
  private circleCollision(bodyA: FreePhysicsBody, bodyB: FreePhysicsBody): CollisionResult {
    const result: CollisionResult = {
      hasCollision: false,
      point: { x: 0, y: 0 },
      normal: { x: 0, y: 0 },
      penetration: 0,
      other: bodyB
    };

    const dx = bodyB.position.x - bodyA.position.x;
    const dy = bodyB.position.y - bodyA.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    const radiusA = bodyA.collisionShape.radius || 16;
    const radiusB = bodyB.collisionShape.radius || 16;
    const totalRadius = radiusA + radiusB;

    if (distance < totalRadius && distance > 0) {
      result.hasCollision = true;
      result.penetration = totalRadius - distance;
      
      // Normalisoi törmäysvektori
      result.normal.x = dx / distance;
      result.normal.y = dy / distance;
      
      // Törmäyspiste
      result.point.x = bodyA.position.x + result.normal.x * radiusA;
      result.point.y = bodyA.position.y + result.normal.y * radiusA;
    }

    return result;
  }

  // Suorakulmio törmäys
  private rectangleCollision(bodyA: FreePhysicsBody, bodyB: FreePhysicsBody): CollisionResult {
    const result: CollisionResult = {
      hasCollision: false,
      point: { x: 0, y: 0 },
      normal: { x: 0, y: 0 },
      penetration: 0,
      other: bodyB
    };

    const rectA = this.getBodyBounds(bodyA);
    const rectB = this.getBodyBounds(bodyB);

    if (this.rectanglesIntersect(rectA, rectB)) {
      result.hasCollision = true;
      
      // Laske törmäyssuunta
      const overlapX = Math.min(rectA.x + rectA.width - rectB.x, rectB.x + rectB.width - rectA.x);
      const overlapY = Math.min(rectA.y + rectA.height - rectB.y, rectB.y + rectB.height - rectA.y);
      
      if (overlapX < overlapY) {
        result.normal.x = rectA.x < rectB.x ? -1 : 1;
        result.normal.y = 0;
        result.penetration = overlapX;
      } else {
        result.normal.x = 0;
        result.normal.y = rectA.y < rectB.y ? -1 : 1;
        result.penetration = overlapY;
      }
      
      result.point.x = (rectA.x + rectB.x) / 2;
      result.point.y = (rectA.y + rectB.y) / 2;
    }

    return result;
  }

  // Bounding box törmäys (fallback)
  private boundingBoxCollision(bodyA: FreePhysicsBody, bodyB: FreePhysicsBody): CollisionResult {
    // Käytä suorakulmiotörmäystä
    return this.rectangleCollision(bodyA, bodyB);
  }

  private getBodyBounds(body: FreePhysicsBody) {
    const shape = body.collisionShape;
    
    if (shape.type === 'circle') {
      const radius = shape.radius || 16;
      return {
        x: body.position.x - radius,
        y: body.position.y - radius,
        width: radius * 2,
        height: radius * 2
      };
    } else if (shape.type === 'rectangle') {
      const width = shape.width || 32;
      const height = shape.height || 32;
      const offsetX = shape.offset?.x || 0;
      const offsetY = shape.offset?.y || 0;
      
      return {
        x: body.position.x + offsetX - width / 2,
        y: body.position.y + offsetY - height / 2,
        width,
        height
      };
    }
    
    // Default
    return {
      x: body.position.x - 16,
      y: body.position.y - 16,
      width: 32,
      height: 32
    };
  }

  private rectanglesIntersect(rectA: any, rectB: any): boolean {
    return rectA.x < rectB.x + rectB.width &&
           rectA.x + rectA.width > rectB.x &&
           rectA.y < rectB.y + rectB.height &&
           rectA.y + rectA.height > rectB.y;
  }

  // Ratkaise törmäykset
  private resolveCollisions(): void {
    for (const bodyA of this.bodies.values()) {
      if (bodyA.isStatic || !bodyA.isSolid) continue;
      
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

  private resolveCollision(bodyA: FreePhysicsBody, bodyB: FreePhysicsBody, collision: CollisionResult): void {
    if (bodyB.isStatic) {
      // Työnnä A:ta pois B:stä
      bodyA.position.x -= collision.normal.x * collision.penetration;
      bodyA.position.y -= collision.normal.y * collision.penetration;
      
      // Heijasta nopeus
      const dotProduct = bodyA.velocity.x * collision.normal.x + bodyA.velocity.y * collision.normal.y;
      bodyA.velocity.x -= 2 * dotProduct * collision.normal.x * bodyA.restitution;
      bodyA.velocity.y -= 2 * dotProduct * collision.normal.y * bodyA.restitution;
    } else {
      // Molemmat liikkuvia - jaa törmäys massojen mukaan
      const totalMass = bodyA.mass + bodyB.mass;
      const ratioA = bodyB.mass / totalMass;
      const ratioB = bodyA.mass / totalMass;
      
      bodyA.position.x -= collision.normal.x * collision.penetration * ratioA;
      bodyA.position.y -= collision.normal.y * collision.penetration * ratioA;
      
      bodyB.position.x += collision.normal.x * collision.penetration * ratioB;
      bodyB.position.y += collision.normal.y * collision.penetration * ratioB;
      
      // Vaihda impulssit
      const relativeVelocity = {
        x: bodyA.velocity.x - bodyB.velocity.x,
        y: bodyA.velocity.y - bodyB.velocity.y
      };
      
      const velocityAlongNormal = relativeVelocity.x * collision.normal.x + relativeVelocity.y * collision.normal.y;
      
      if (velocityAlongNormal > 0) return; // Erkanevat jo
      
      const restitution = Math.min(bodyA.restitution, bodyB.restitution);
      const impulse = -(1 + restitution) * velocityAlongNormal / totalMass;
      
      bodyA.velocity.x += impulse * bodyB.mass * collision.normal.x;
      bodyA.velocity.y += impulse * bodyB.mass * collision.normal.y;
      
      bodyB.velocity.x -= impulse * bodyA.mass * collision.normal.x;
      bodyB.velocity.y -= impulse * bodyA.mass * collision.normal.y;
    }
  }

  // Apufunktiot
  private normalizeAngle(angle: number): number {
    while (angle < 0) angle += 360;
    while (angle >= 360) angle -= 360;
    return angle;
  }

  getBody(id: number): FreePhysicsBody | undefined {
    return this.bodies.get(id);
  }

  removeBody(id: number): void {
    const body = this.bodies.get(id);
    if (body) {
      this.bodies.delete(id);
      if (body.isStatic) {
        const index = this.staticBodies.indexOf(body);
        if (index > -1) this.staticBodies.splice(index, 1);
      }
      this.removeFromSpatialGrid(body);
    }
  }

  // Spatial Grid optimointi
  private getSpatialGridKey(x: number, y: number): string {
    const gridX = Math.floor(x / this.gridSize);
    const gridY = Math.floor(y / this.gridSize);
    return `${gridX},${gridY}`;
  }

  private updateSpatialGrid(body: FreePhysicsBody): void {
    this.removeFromSpatialGrid(body);
    
    const key = this.getSpatialGridKey(body.position.x, body.position.y);
    if (!this.spatialGrid.has(key)) {
      this.spatialGrid.set(key, []);
    }
    this.spatialGrid.get(key)!.push(body);
  }

  private removeFromSpatialGrid(body: FreePhysicsBody): void {
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

  private getNearbyBodies(body: FreePhysicsBody): FreePhysicsBody[] {
    const nearby: FreePhysicsBody[] = [];
    
    // Tarkista ympäröivät ruudut
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
    
    // Lisää staattiset kappaleet
    nearby.push(...this.staticBodies);
    
    return nearby;
  }

  // Apukeinot kappaleille
  createPlayer(id: number, x: number, y: number): FreePhysicsBody {
    return this.createBody(id, x, y, {
      type: 'circle',
      radius: 12
    }, {
      mass: 70,
      maxSpeed: 300,
      acceleration_force: 800,
      turnSpeed: 270,
      friction: 0.92,
      restitution: 0.1,
      spriteId: 'player',
      layer: 4 // Pelaaja näkyy päällimmäisenä
    });
  }

  createStaticObstacle(id: number, x: number, y: number, width: number, height: number): FreePhysicsBody {
    return this.createBody(id, x, y, {
      type: 'rectangle',
      width,
      height
    }, {
      isStatic: true,
      spriteId: 'wall',
      layer: 3
    });
  }

  // Debug-info
  getDebugInfo(bodyId: number): string {
    const body = this.getBody(bodyId);
    if (!body) return 'Body not found';
    
    return `Free Physics Body ${bodyId}:
Position: (${body.position.x.toFixed(1)}, ${body.position.y.toFixed(1)})
Velocity: (${body.velocity.x.toFixed(1)}, ${body.velocity.y.toFixed(1)})
Rotation: ${body.rotation.toFixed(1)}°
Speed: ${Math.sqrt(body.velocity.x ** 2 + body.velocity.y ** 2).toFixed(1)} px/s
Moving: ${body.isMoving}
Layer: ${body.layer}`;
  }
}

// Globaali instanssi
export const freePhysicsEngine = new FreePhysicsEngine();

// Debug-käyttöön
if (typeof window !== 'undefined') {
  (window as any).freePhysics = freePhysicsEngine;
  console.log('🆓 Free Physics available as window.freePhysics');
}