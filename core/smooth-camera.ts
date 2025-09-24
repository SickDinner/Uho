// Sulava top-down kamera 360° liikkumiselle
// Kameran seuranta, zoomaus ja sulavat siirtymät

import type { Vector2 } from './types.ts';
import type { FreePhysicsBody } from './free-physics.ts';

export interface CameraTarget {
  position: Vector2;
  rotation?: number;
  zoom?: number;
  priority?: number; // Korkeampi prioriteetti ohittaa muut kohteet
}

export interface CameraSettings {
  // Seuranta
  followSmoothing: number;        // 0-1, suurempi = nopeampi seuranta
  rotationSmoothing: number;      // 0-1, kulman seuranta
  zoomSmoothing: number;          // 0-1, zoomauksen seuranta
  
  // Rajoitukset
  minZoom: number;
  maxZoom: number;
  
  // Offset-asetukset
  lookAheadDistance: number;      // Kuinka kauas katsoo liikkumissuuntaan
  lookAheadSmoothing: number;     // Look-ahead seuranta
  
  // Kameran rajoitukset
  worldBounds?: {
    x: number;
    y: number; 
    width: number;
    height: number;
  };
  
  // Tärinä-asetukset
  shakeEnabled: boolean;
  maxShakeIntensity: number;
}

export interface CameraShake {
  intensity: number;
  duration: number;
  frequency: number;
  fadeOut: boolean;
}

export class SmoothCamera {
  // Nykyinen tila
  public position: Vector2;
  public rotation: number;
  public zoom: number;
  
  // Target-tila
  private targetPosition: Vector2;
  private targetRotation: number;
  private targetZoom: number;
  
  // Look-ahead
  private lookAheadOffset: Vector2;
  private targetLookAhead: Vector2;
  
  // Seurattava kohde
  private followTarget: CameraTarget | null = null;
  private followTargetBody: FreePhysicsBody | null = null;
  
  // Tärinä
  private shakeOffset: Vector2;
  private currentShake: CameraShake | null = null;
  private shakeTime: number = 0;
  
  // Asetukset
  public settings: CameraSettings;
  
  // Näytön koko
  public viewportWidth: number;
  public viewportHeight: number;
  
  constructor(
    x: number = 0,
    y: number = 0,
    viewportWidth: number = 800,
    viewportHeight: number = 600
  ) {
    this.position = { x, y };
    this.targetPosition = { x, y };
    this.rotation = 0;
    this.targetRotation = 0;
    this.zoom = 1;
    this.targetZoom = 1;
    
    this.lookAheadOffset = { x: 0, y: 0 };
    this.targetLookAhead = { x: 0, y: 0 };
    
    this.shakeOffset = { x: 0, y: 0 };
    
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
    
    // Oletusasetukset
    this.settings = {
      followSmoothing: 0.05,
      rotationSmoothing: 0.08,
      zoomSmoothing: 0.1,
      
      minZoom: 0.25,
      maxZoom: 4.0,
      
      lookAheadDistance: 100,
      lookAheadSmoothing: 0.03,
      
      shakeEnabled: true,
      maxShakeIntensity: 20
    };
    
    console.log('📷 Smooth Camera initialized for 360° free movement');
  }

  // Aseta seurattava kohde
  setFollowTarget(target: CameraTarget | null): void {
    this.followTarget = target;
    this.followTargetBody = null;
    
    if (target) {
      console.log(`📷 Camera following target at (${target.position.x}, ${target.position.y})`);
    }
  }

  // Aseta seurattava fysiikkakapppale
  setFollowBody(body: FreePhysicsBody | null): void {
    this.followTargetBody = body;
    this.followTarget = null;
    
    if (body) {
      console.log(`📷 Camera following physics body ${body.id}`);
    }
  }

  // Siirry tiettyyn pisteeseen sulavasti
  moveTo(x: number, y: number, zoom?: number, rotation?: number): void {
    this.targetPosition.x = x;
    this.targetPosition.y = y;
    
    if (zoom !== undefined) {
      this.targetZoom = Math.max(this.settings.minZoom, Math.min(this.settings.maxZoom, zoom));
    }
    
    if (rotation !== undefined) {
      this.targetRotation = rotation;
    }
  }

  // Hyppi heti tiettyyn pisteeseen (ei sulavasti)
  snapTo(x: number, y: number, zoom?: number, rotation?: number): void {
    this.position.x = x;
    this.position.y = y;
    this.targetPosition.x = x;
    this.targetPosition.y = y;
    
    if (zoom !== undefined) {
      this.zoom = Math.max(this.settings.minZoom, Math.min(this.settings.maxZoom, zoom));
      this.targetZoom = this.zoom;
    }
    
    if (rotation !== undefined) {
      this.rotation = rotation;
      this.targetRotation = rotation;
    }
    
    // Nollaa look-ahead
    this.lookAheadOffset.x = 0;
    this.lookAheadOffset.y = 0;
    this.targetLookAhead.x = 0;
    this.targetLookAhead.y = 0;
  }

  // Käynnistä kameran tärinä
  shake(intensity: number, duration: number = 500, frequency: number = 20): void {
    if (!this.settings.shakeEnabled) return;
    
    this.currentShake = {
      intensity: Math.min(intensity, this.settings.maxShakeIntensity),
      duration,
      frequency,
      fadeOut: true
    };
    
    this.shakeTime = 0;
    console.log(`📷 Camera shake: ${intensity} intensity for ${duration}ms`);
  }

  // Päivitä kamera
  update(deltaTime: number): void {
    const dt = deltaTime / 1000;
    
    // Päivitä seurattava kohde
    this.updateFollowTarget();
    
    // Päivitä look-ahead
    this.updateLookAhead(dt);
    
    // Päivitä tärinä
    this.updateShake(dt);
    
    // Interpoloi kameran sijainti
    this.interpolatePosition(dt);
    this.interpolateRotation(dt);  
    this.interpolateZoom(dt);
    
    // Rajoita kameran sijainti maailman rajoihin
    this.applyWorldBounds();
  }

  private updateFollowTarget(): void {
    let target: Vector2 | null = null;
    let targetRotation: number | undefined;
    let targetZoom: number | undefined;
    
    // Seuraa fysiikkakappaletta
    if (this.followTargetBody) {
      target = this.followTargetBody.position;
      
      // Käännä kamera kohti liikkumissuuntaa (valinnainen)
      if (this.followTargetBody.isMoving) {
        const velocity = this.followTargetBody.velocity;
        if (Math.abs(velocity.x) > 1 || Math.abs(velocity.y) > 1) {
          targetRotation = Math.atan2(velocity.y, velocity.x) * (180 / Math.PI);
        }
      }
    }
    // Seuraa target-objektia
    else if (this.followTarget) {
      target = this.followTarget.position;
      targetRotation = this.followTarget.rotation;
      targetZoom = this.followTarget.zoom;
    }
    
    if (target) {
      this.targetPosition.x = target.x;
      this.targetPosition.y = target.y;
      
      if (targetRotation !== undefined) {
        this.targetRotation = targetRotation;
      }
      
      if (targetZoom !== undefined) {
        this.targetZoom = Math.max(this.settings.minZoom, Math.min(this.settings.maxZoom, targetZoom));
      }
    }
  }

  private updateLookAhead(dt: number): void {
    // Laske look-ahead kohteesta
    let targetDirection = { x: 0, y: 0 };
    
    if (this.followTargetBody && this.followTargetBody.isMoving) {
      const velocity = this.followTargetBody.velocity;
      const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
      
      if (speed > 10) { // Vähimmäisnopeus look-aheadia varten
        targetDirection.x = (velocity.x / speed) * this.settings.lookAheadDistance;
        targetDirection.y = (velocity.y / speed) * this.settings.lookAheadDistance;
      }
    }
    
    // Interpoloi look-ahead
    const smoothing = this.settings.lookAheadSmoothing;
    this.targetLookAhead.x = this.lerp(this.targetLookAhead.x, targetDirection.x, smoothing);
    this.targetLookAhead.y = this.lerp(this.targetLookAhead.y, targetDirection.y, smoothing);
    
    // Päivitä todellinen offset
    this.lookAheadOffset.x = this.lerp(this.lookAheadOffset.x, this.targetLookAhead.x, smoothing);
    this.lookAheadOffset.y = this.lerp(this.lookAheadOffset.y, this.targetLookAhead.y, smoothing);
  }

  private updateShake(dt: number): void {
    if (!this.currentShake) {
      this.shakeOffset.x = 0;
      this.shakeOffset.y = 0;
      return;
    }
    
    this.shakeTime += dt * 1000; // ms
    
    // Tarkista onko tärinä päättynyt
    if (this.shakeTime >= this.currentShake.duration) {
      this.currentShake = null;
      this.shakeOffset.x = 0;
      this.shakeOffset.y = 0;
      return;
    }
    
    // Laske tärinän voimakkuus (fade out)
    let intensity = this.currentShake.intensity;
    if (this.currentShake.fadeOut) {
      const progress = this.shakeTime / this.currentShake.duration;
      intensity *= (1 - progress);
    }
    
    // Generoi satunnainen tärinä
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * intensity;
    
    this.shakeOffset.x = Math.cos(angle) * distance;
    this.shakeOffset.y = Math.sin(angle) * distance;
  }

  private interpolatePosition(dt: number): void {
    const targetX = this.targetPosition.x + this.lookAheadOffset.x;
    const targetY = this.targetPosition.y + this.lookAheadOffset.y;
    
    this.position.x = this.lerp(this.position.x, targetX, this.settings.followSmoothing);
    this.position.y = this.lerp(this.position.y, targetY, this.settings.followSmoothing);
  }

  private interpolateRotation(dt: number): void {
    // Käsittele 360° kierto oikein
    let targetRot = this.targetRotation;
    let currentRot = this.rotation;
    
    // Normalisoi kulmat
    while (targetRot - currentRot > 180) targetRot -= 360;
    while (currentRot - targetRot > 180) currentRot -= 360;
    
    this.rotation = this.lerp(currentRot, targetRot, this.settings.rotationSmoothing);
    
    // Pidä kulma 0-360 välissä
    while (this.rotation < 0) this.rotation += 360;
    while (this.rotation >= 360) this.rotation -= 360;
  }

  private interpolateZoom(dt: number): void {
    this.zoom = this.lerp(this.zoom, this.targetZoom, this.settings.zoomSmoothing);
  }

  private applyWorldBounds(): void {
    if (!this.settings.worldBounds) return;
    
    const bounds = this.settings.worldBounds;
    const halfViewWidth = (this.viewportWidth / 2) / this.zoom;
    const halfViewHeight = (this.viewportHeight / 2) / this.zoom;
    
    // Rajoita kameran keskipiste maailman sisään
    this.position.x = Math.max(bounds.x + halfViewWidth, Math.min(bounds.x + bounds.width - halfViewWidth, this.position.x));
    this.position.y = Math.max(bounds.y + halfViewHeight, Math.min(bounds.y + bounds.height - halfViewHeight, this.position.y));
    
    // Päivitä myös target-sijainti estääkseen hyppimisen
    this.targetPosition.x = this.position.x;
    this.targetPosition.y = this.position.y;
  }

  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  // Kameran transformaatio-metodit renderöintiin
  
  // Muunna maailmankoordinaatti näyttökoordinaatiksi
  worldToScreen(worldPos: Vector2): Vector2 {
    // Ota huomioon kameran sijainti, kierto ja zoomaus sekä tärinä
    const finalX = this.position.x + this.shakeOffset.x;
    const finalY = this.position.y + this.shakeOffset.y;
    
    // Suhteellinen sijainti kameraan
    const relX = worldPos.x - finalX;
    const relY = worldPos.y - finalY;
    
    // Käännetään kameran kulman mukaan (jos käytetään)
    let rotatedX = relX;
    let rotatedY = relY;
    
    if (this.rotation !== 0) {
      const rad = this.rotation * (Math.PI / 180);
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      
      rotatedX = relX * cos - relY * sin;
      rotatedY = relX * sin + relY * cos;
    }
    
    // Zoomaus ja keskitä näytölle
    return {
      x: (rotatedX * this.zoom) + (this.viewportWidth / 2),
      y: (rotatedY * this.zoom) + (this.viewportHeight / 2)
    };
  }

  // Muunna näyttökoordinaatti maailmankoordinaatiksi
  screenToWorld(screenPos: Vector2): Vector2 {
    // Vastaoperaatio worldToScreenille
    const finalX = this.position.x + this.shakeOffset.x;
    const finalY = this.position.y + this.shakeOffset.y;
    
    // Poista keskitys ja zoomaus
    const relX = (screenPos.x - (this.viewportWidth / 2)) / this.zoom;
    const relY = (screenPos.y - (this.viewportHeight / 2)) / this.zoom;
    
    // Käännä takaisin kameran kulman mukaan
    let worldX = relX;
    let worldY = relY;
    
    if (this.rotation !== 0) {
      const rad = -this.rotation * (Math.PI / 180); // Vastakkainen suunta
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      
      worldX = relX * cos - relY * sin;
      worldY = relX * sin + relY * cos;
    }
    
    return {
      x: worldX + finalX,
      y: worldY + finalY
    };
  }

  // Tarkista onko maailmankohta näkyvissä
  isVisible(worldPos: Vector2, margin: number = 50): boolean {
    const screenPos = this.worldToScreen(worldPos);
    
    return screenPos.x >= -margin &&
           screenPos.x <= this.viewportWidth + margin &&
           screenPos.y >= -margin &&
           screenPos.y <= this.viewportHeight + margin;
  }

  // Hanki näkyvä alue maailmankoordinaateissa
  getVisibleBounds(): { x: number; y: number; width: number; height: number } {
    const topLeft = this.screenToWorld({ x: 0, y: 0 });
    const bottomRight = this.screenToWorld({ x: this.viewportWidth, y: this.viewportHeight });
    
    return {
      x: topLeft.x,
      y: topLeft.y,
      width: bottomRight.x - topLeft.x,
      height: bottomRight.y - topLeft.y
    };
  }

  // Päivitä näytön koko
  resize(width: number, height: number): void {
    this.viewportWidth = width;
    this.viewportHeight = height;
    console.log(`📷 Camera viewport resized to ${width}x${height}`);
  }

  // Debug-info
  getDebugInfo(): string {
    const target = this.followTargetBody ? `Body ${this.followTargetBody.id}` : 
                  this.followTarget ? 'Custom target' : 'None';
    
    return `Smooth Camera:
Position: (${this.position.x.toFixed(1)}, ${this.position.y.toFixed(1)})
Target: (${this.targetPosition.x.toFixed(1)}, ${this.targetPosition.y.toFixed(1)})
Zoom: ${this.zoom.toFixed(2)}x (target: ${this.targetZoom.toFixed(2)}x)
Rotation: ${this.rotation.toFixed(1)}° (target: ${this.targetRotation.toFixed(1)}°)
Look-ahead: (${this.lookAheadOffset.x.toFixed(1)}, ${this.lookAheadOffset.y.toFixed(1)})
Following: ${target}
Shake: ${this.currentShake ? 'Active' : 'None'}`;
  }
}

// Globaali kamera-instanssi  
export const smoothCamera = new SmoothCamera();

// Debug-käyttöön
if (typeof window !== 'undefined') {
  (window as any).smoothCamera = smoothCamera;
  console.log('📷 Smooth Camera available as window.smoothCamera');
}