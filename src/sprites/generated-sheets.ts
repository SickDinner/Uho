import { spriteManager } from '@core/sprites.ts';
import type { SpriteAnimation } from '@core/sprites.ts';

type Direction = 'south' | 'east' | 'west' | 'north';
type Step = -1 | 0 | 1;

type CharacterPalette = {
  body: string;
  accent: string;
  outline: string;
  skin: string;
  hair: string;
};

type VehiclePalette = {
  body: string;
  roof: string;
  stripe: string;
  window: string;
  wheel: string;
  light: string;
  sirenBlue: string;
  sirenRed: string;
};

type SpriteRecipe =
  | { id: string; type: 'character'; palette: CharacterPalette }
  | { id: string; type: 'vehicle'; palette: VehiclePalette };

const FRAME_WIDTH = 16;
const FRAME_HEIGHT = 16;
const STEP_ORDER: Step[] = [-1, 0, 1];
const DIRECTION_ORDER: Direction[] = ['south', 'west', 'east', 'north'];

const RECIPES: SpriteRecipe[] = [
  {
    id: 'player',
    type: 'character',
    palette: {
      body: '#2b59c3',
      accent: '#f9c80e',
      outline: '#081431',
      skin: '#f4d6b0',
      hair: '#1d2b64'
    }
  },
  {
    id: '10',
    type: 'character',
    palette: {
      body: '#1f3c88',
      accent: '#f73859',
      outline: '#0a0f24',
      skin: '#f8e1c0',
      hair: '#192e5b'
    }
  },
  {
    id: '11',
    type: 'character',
    palette: {
      body: '#31326f',
      accent: '#f9a620',
      outline: '#0b0d24',
      skin: '#f0d3c1',
      hair: '#2f243a'
    }
  },
  {
    id: '12',
    type: 'character',
    palette: {
      body: '#3f8efc',
      accent: '#7ed957',
      outline: '#0d1427',
      skin: '#f4e2cc',
      hair: '#213547'
    }
  },
  {
    id: '13',
    type: 'character',
    palette: {
      body: '#e07a5f',
      accent: '#f2cc8f',
      outline: '#432818',
      skin: '#f7d8ba',
      hair: '#6f1d1b'
    }
  },
  {
    id: '14',
    type: 'character',
    palette: {
      body: '#6930c3',
      accent: '#64dfdf',
      outline: '#240046',
      skin: '#f6d3b4',
      hair: '#2b2d42'
    }
  },
  {
    id: '15',
    type: 'character',
    palette: {
      body: '#c44536',
      accent: '#ffa69e',
      outline: '#330f0a',
      skin: '#f1d8c5',
      hair: '#7f5539'
    }
  },
  {
    id: '16',
    type: 'vehicle',
    palette: {
      body: '#1e3d59',
      roof: '#13334c',
      stripe: '#ffffff',
      window: '#8fb9aa',
      wheel: '#1b1b1b',
      light: '#f7b801',
      sirenBlue: '#1f8ef1',
      sirenRed: '#ff3b30'
    }
  }
];

const pendingLoads = new Map<string, Promise<void>>();

/**
 * Ensures that all core sprite sheets exist in the runtime sprite manager.
 * The sprites are generated procedurally so the game can run without shipping
 * thousands of raw asset files.
 */
export async function ensureGeneratedSpriteSheets(): Promise<void> {
  await Promise.all(RECIPES.map(recipe => ensureSpriteSheet(recipe)));
}

async function ensureSpriteSheet(recipe: SpriteRecipe): Promise<void> {
  if (spriteManager.getSpriteSheet(recipe.id)) {
    return;
  }

  const existing = pendingLoads.get(recipe.id);
  if (existing) {
    await existing;
    return;
  }

  const promise = (async () => {
    if (typeof document === 'undefined') {
      console.warn(`Skipping sprite generation for "${recipe.id}" because document is not available.`);
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = FRAME_WIDTH * STEP_ORDER.length;
    canvas.height = FRAME_HEIGHT * DIRECTION_ORDER.length;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      console.warn(`Could not acquire 2D context for generated sprite sheet "${recipe.id}".`);
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (recipe.type === 'character') {
      paintCharacterSheet(ctx, recipe.palette);
    } else {
      paintVehicleSheet(ctx, recipe.palette);
    }

    const animations = recipe.type === 'character'
      ? createCharacterAnimations()
      : createVehicleAnimations();

    const dataUrl = canvas.toDataURL('image/png');
    await spriteManager.loadSpriteSheet(
      recipe.id,
      dataUrl,
      FRAME_WIDTH,
      FRAME_HEIGHT,
      animations
    );
  })();

  pendingLoads.set(recipe.id, promise);
  try {
    await promise;
  } finally {
    pendingLoads.delete(recipe.id);
  }
}

function paintCharacterSheet(ctx: CanvasRenderingContext2D, palette: CharacterPalette): void {
  for (let row = 0; row < DIRECTION_ORDER.length; row++) {
    const direction = DIRECTION_ORDER[row];
    for (let col = 0; col < STEP_ORDER.length; col++) {
      const step = STEP_ORDER[col];
      drawCharacterFrame({
        ctx,
        offsetX: col * FRAME_WIDTH,
        offsetY: row * FRAME_HEIGHT,
        direction,
        palette,
        step
      });
    }
  }
}

function paintVehicleSheet(ctx: CanvasRenderingContext2D, palette: VehiclePalette): void {
  for (let row = 0; row < DIRECTION_ORDER.length; row++) {
    const direction = DIRECTION_ORDER[row];
    for (let col = 0; col < STEP_ORDER.length; col++) {
      const step = STEP_ORDER[col];
      drawVehicleFrame({
        ctx,
        offsetX: col * FRAME_WIDTH,
        offsetY: row * FRAME_HEIGHT,
        direction,
        palette,
        step
      });
    }
  }
}

interface CharacterFrameOptions {
  ctx: CanvasRenderingContext2D;
  offsetX: number;
  offsetY: number;
  direction: Direction;
  palette: CharacterPalette;
  step: Step;
}

function drawCharacterFrame({ ctx, offsetX, offsetY, direction, palette, step }: CharacterFrameOptions): void {
  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.clearRect(0, 0, FRAME_WIDTH, FRAME_HEIGHT);

  const mirror = direction === 'west';
  const baseDirection: Direction = mirror ? 'east' : direction;

  if (mirror) {
    ctx.translate(FRAME_WIDTH, 0);
    ctx.scale(-1, 1);
  }

  // Ground shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
  ctx.beginPath();
  ctx.ellipse(FRAME_WIDTH / 2, FRAME_HEIGHT - 2.5, FRAME_WIDTH / 2.4, 2, 0, 0, Math.PI * 2);
  ctx.fill();

  const legSwing = step * 1.3;
  const leftLegX = clamp(Math.round(5.5 - legSwing), 3, 7);
  const rightLegX = clamp(Math.round(9.5 + legSwing), 8, 12);

  // Leg outlines
  ctx.fillStyle = palette.outline;
  ctx.fillRect(leftLegX - 1, 11, 3, 5);
  ctx.fillRect(rightLegX - 1, 11, 3, 5);

  // Leg fill
  ctx.fillStyle = palette.body;
  ctx.fillRect(leftLegX, 12, 1, 4);
  ctx.fillRect(rightLegX, 12, 1, 4);

  // Torso outline
  ctx.fillStyle = palette.outline;
  ctx.fillRect(4, 4, 8, 8);

  // Torso fill
  ctx.fillStyle = palette.body;
  ctx.fillRect(5, 5, 6, 7);

  // Accent band or backpack
  ctx.fillStyle = palette.accent;
  if (baseDirection === 'north') {
    ctx.fillRect(5, 7, 6, 2);
  } else if (baseDirection === 'east') {
    ctx.fillRect(6, 7, 4, 2);
  } else {
    ctx.fillRect(5, 8, 6, 2);
  }

  // Arms
  const armShift = step * 0.6;
  ctx.fillStyle = palette.outline;
  ctx.fillRect(3, 5 + armShift, 2, 5);
  ctx.fillRect(11, 5 - armShift, 2, 5);
  ctx.fillStyle = palette.body;
  ctx.fillRect(3, 6 + armShift, 2, 4);
  ctx.fillRect(11, 6 - armShift, 2, 4);

  // Head outline
  ctx.fillStyle = palette.outline;
  ctx.fillRect(4, 0, 8, 5);

  // Hair layer
  ctx.fillStyle = palette.hair;
  ctx.fillRect(5, 0, 6, 2);

  // Face or back of head
  ctx.fillStyle = baseDirection === 'north' ? palette.hair : palette.skin;
  ctx.fillRect(5, 1, 6, 3);

  // Eyes / facial features
  if (baseDirection === 'south') {
    ctx.fillStyle = '#161616';
    ctx.fillRect(6, 2, 1, 1);
    ctx.fillRect(9, 2, 1, 1);
    ctx.fillRect(7, 3, 2, 1);
  } else if (baseDirection === 'east') {
    ctx.fillStyle = '#161616';
    ctx.fillRect(8, 2, 1, 1);
    ctx.fillRect(8, 3, 1, 1);
  }

  // Shoulder shading for side view
  if (baseDirection === 'east') {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
    ctx.fillRect(5, 5, 2, 7);
  } else if (baseDirection === 'south') {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.fillRect(7, 6, 2, 3);
  }

  ctx.restore();
}

interface VehicleFrameOptions {
  ctx: CanvasRenderingContext2D;
  offsetX: number;
  offsetY: number;
  direction: Direction;
  palette: VehiclePalette;
  step: Step;
}

function drawVehicleFrame({ ctx, offsetX, offsetY, direction, palette, step }: VehicleFrameOptions): void {
  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.clearRect(0, 0, FRAME_WIDTH, FRAME_HEIGHT);

  ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
  ctx.beginPath();
  ctx.ellipse(FRAME_WIDTH / 2, FRAME_HEIGHT - 2, FRAME_WIDTH / 2.6, 1.8, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.translate(FRAME_WIDTH / 2, FRAME_HEIGHT / 2);
  let rotation = 0;
  switch (direction) {
    case 'north':
      rotation = Math.PI;
      break;
    case 'east':
      rotation = -Math.PI / 2;
      break;
    case 'west':
      rotation = Math.PI / 2;
      break;
    default:
      rotation = 0;
      break;
  }
  ctx.rotate(rotation);
  ctx.translate(-FRAME_WIDTH / 2, -FRAME_HEIGHT / 2);

  const wheelOffset = step * 1.2;

  // Wheels
  ctx.fillStyle = palette.wheel;
  ctx.fillRect(2, 3 + wheelOffset, 2, 4);
  ctx.fillRect(12, 3 - wheelOffset, 2, 4);
  ctx.fillRect(2, 9 - wheelOffset, 2, 4);
  ctx.fillRect(12, 9 + wheelOffset, 2, 4);

  // Body
  ctx.fillStyle = palette.body;
  ctx.fillRect(3, 2, 10, 12);
  ctx.fillStyle = palette.roof;
  ctx.fillRect(4, 4, 8, 8);

  // Stripe
  ctx.fillStyle = palette.stripe;
  ctx.fillRect(4, 8, 8, 2);

  // Windows
  ctx.fillStyle = palette.window;
  ctx.fillRect(5, 5, 6, 3);

  // Lights
  ctx.fillStyle = palette.light;
  ctx.fillRect(4, 2, 2, 2);
  ctx.fillRect(10, 2, 2, 2);
  ctx.fillRect(4, 12, 2, 2);
  ctx.fillRect(10, 12, 2, 2);

  // Siren
  ctx.fillStyle = palette.sirenBlue;
  ctx.fillRect(6, 4, 2, 2);
  ctx.fillStyle = palette.sirenRed;
  ctx.fillRect(8, 4, 2, 2);

  ctx.restore();
}

function createCharacterAnimations(): Record<string, SpriteAnimation> {
  const animations: Record<string, SpriteAnimation> = {};

  for (let row = 0; row < DIRECTION_ORDER.length; row++) {
    const direction = DIRECTION_ORDER[row];
    const baseIndex = row * STEP_ORDER.length;

    animations[`idle_${direction}`] = {
      name: `idle_${direction}`,
      frames: [baseIndex + 1],
      duration: 700,
      loop: true
    };

    animations[`walk_${direction}`] = {
      name: `walk_${direction}`,
      frames: [baseIndex + 0, baseIndex + 1, baseIndex + 2, baseIndex + 1],
      duration: 180,
      loop: true
    };
  }

  return animations;
}

function createVehicleAnimations(): Record<string, SpriteAnimation> {
  const animations: Record<string, SpriteAnimation> = {};

  for (let row = 0; row < DIRECTION_ORDER.length; row++) {
    const direction = DIRECTION_ORDER[row];
    const baseIndex = row * STEP_ORDER.length;

    animations[`idle_${direction}`] = {
      name: `idle_${direction}`,
      frames: [baseIndex + 1],
      duration: 800,
      loop: true
    };

    animations[`walk_${direction}`] = {
      name: `walk_${direction}`,
      frames: [baseIndex + 0, baseIndex + 1, baseIndex + 2, baseIndex + 1],
      duration: 220,
      loop: true
    };
  }

  return animations;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
