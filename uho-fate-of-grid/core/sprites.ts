export interface SpriteFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SpriteAnimation {
  name: string;
  frames: number[];
  duration: number; // ms per frame
  loop: boolean;
}

export interface SpriteSheet {
  id: string;
  image: HTMLImageElement;
  frameWidth: number;
  frameHeight: number;
  frames: SpriteFrame[];
  animations: Record<string, SpriteAnimation>;
}

export class SpriteManager {
  private spriteSheets: Map<string, SpriteSheet> = new Map();
  private loadingPromises: Map<string, Promise<SpriteSheet>> = new Map();

  async loadSpriteSheet(
    id: string, 
    imagePath: string, 
    frameWidth: number, 
    frameHeight: number,
    animations?: Record<string, SpriteAnimation>
  ): Promise<SpriteSheet> {
    if (this.spriteSheets.has(id)) {
      return this.spriteSheets.get(id)!;
    }

    if (this.loadingPromises.has(id)) {
      return this.loadingPromises.get(id)!;
    }

    const promise = this.createSpriteSheet(id, imagePath, frameWidth, frameHeight, animations);
    this.loadingPromises.set(id, promise);
    
    try {
      const spriteSheet = await promise;
      this.spriteSheets.set(id, spriteSheet);
      return spriteSheet;
    } finally {
      this.loadingPromises.delete(id);
    }
  }

  private async createSpriteSheet(
    id: string,
    imagePath: string,
    frameWidth: number,
    frameHeight: number,
    animations: Record<string, SpriteAnimation> = {}
  ): Promise<SpriteSheet> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      
      image.onload = () => {
        const frames: SpriteFrame[] = [];
        const cols = Math.floor(image.width / frameWidth);
        const rows = Math.floor(image.height / frameHeight);

        // Generate frames from sprite sheet
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            frames.push({
              x: col * frameWidth,
              y: row * frameHeight,
              width: frameWidth,
              height: frameHeight
            });
          }
        }

        resolve({
          id,
          image,
          frameWidth,
          frameHeight,
          frames,
          animations
        });
      };

      image.onerror = () => {
        reject(new Error(`Failed to load sprite sheet: ${imagePath}`));
      };

      image.src = imagePath;
    });
  }

  getSpriteSheet(id: string): SpriteSheet | undefined {
    return this.spriteSheets.get(id);
  }

  drawSprite(
    ctx: CanvasRenderingContext2D,
    spriteSheetId: string,
    frameIndex: number,
    x: number,
    y: number,
    scale: number = 1
  ): void {
    const spriteSheet = this.getSpriteSheet(spriteSheetId);
    if (!spriteSheet) return;

    const frame = spriteSheet.frames[frameIndex];
    if (!frame) return;

    ctx.drawImage(
      spriteSheet.image,
      frame.x,
      frame.y,
      frame.width,
      frame.height,
      x,
      y,
      frame.width * scale,
      frame.height * scale
    );
  }

  drawAnimatedSprite(
    ctx: CanvasRenderingContext2D,
    spriteSheetId: string,
    animationName: string,
    currentTime: number,
    x: number,
    y: number,
    scale: number = 1
  ): void {
    const spriteSheet = this.getSpriteSheet(spriteSheetId);
    if (!spriteSheet) return;

    const animation = spriteSheet.animations[animationName];
    if (!animation) return;

    const frameIndex = Math.floor((currentTime / animation.duration) % animation.frames.length);
    const spriteFrameIndex = animation.frames[frameIndex];
    
    this.drawSprite(ctx, spriteSheetId, spriteFrameIndex, x, y, scale);
  }
}

// Global sprite manager instance
export const spriteManager = new SpriteManager();