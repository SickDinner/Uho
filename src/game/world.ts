import type { RenderCell } from '../core/renderer';
import type { RNG } from '../core/rng';

export type TileType = 'wall' | 'floor' | 'fog' | 'exit';

export interface ZoneExit {
  x: number;
  y: number;
  to: string;
  spawn: { x: number; y: number };
  label: string;
}

export interface ZoneDefinition {
  id: string;
  name: string;
  description: string;
  layout: string[];
  exits: ZoneExit[];
  ambient: string[];
  boss?: string;
}

interface Tile {
  type: TileType;
  char: string;
  fg: string;
  bg?: string;
  exit?: ZoneExit;
}

export interface Zone {
  id: string;
  name: string;
  description: string;
  width: number;
  height: number;
  tiles: Tile[][];
  exits: ZoneExit[];
  ambient: string[];
  boss?: string;
}

export class World {
  private zones = new Map<string, Zone>();

  constructor(definitions: ZoneDefinition[]) {
    definitions.forEach((definition) => {
      this.zones.set(definition.id, this.createZone(definition));
    });
  }

  getZone(id: string): Zone {
    const zone = this.zones.get(id);
    if (!zone) {
      throw new Error(`Zone ${id} not found`);
    }
    return zone;
  }

  getBaseRenderGrid(zoneId: string): RenderCell[][] {
    const zone = this.getZone(zoneId);
    return zone.tiles.map((row) =>
      row.map((tile) => {
        const cell: RenderCell = {
          char: tile.char,
          fg: tile.fg
        };
        if (tile.bg) {
          cell.bg = tile.bg;
        }
        return cell;
      })
    );
  }

  isWalkable(zoneId: string, x: number, y: number): boolean {
    const zone = this.getZone(zoneId);
    if (x < 0 || y < 0 || y >= zone.tiles.length || x >= zone.tiles[0].length) {
      return false;
    }

    const tile = zone.tiles[y][x];
    return tile.type === 'floor' || tile.type === 'exit';
  }

  getExit(zoneId: string, x: number, y: number): ZoneExit | undefined {
    const zone = this.getZone(zoneId);
    return zone.exits.find((exit) => exit.x === x && exit.y === y);
  }

  randomAmbient(zoneId: string, rng: RNG): string | undefined {
    const zone = this.getZone(zoneId);
    if (zone.ambient.length === 0) {
      return undefined;
    }
    return rng.pick(zone.ambient);
  }


  private validateLayout(definition: ZoneDefinition): void {
    if (definition.layout.length === 0) {
      throw new Error(`Zone ${definition.id} has no layout rows`);
    }

    const width = definition.layout[0].length;
    if (width === 0) {
      throw new Error(`Zone ${definition.id} has an empty layout row`);
    }

    const nonRectangular = definition.layout.some((row) => row.length !== width);
    if (nonRectangular) {
      throw new Error(`Zone ${definition.id} layout must be rectangular`);
    }

    definition.exits.forEach((exit) => {
      if (exit.x < 0 || exit.y < 0 || exit.x >= width || exit.y >= definition.layout.length) {
        throw new Error(`Zone ${definition.id} has an out-of-bounds exit (${exit.x}, ${exit.y})`);
      }
    });
  }

  private createZone(definition: ZoneDefinition): Zone {
    this.validateLayout(definition);
    const tiles: Tile[][] = definition.layout.map((row, y) =>
      row.split('').map((char, x) => this.createTile(char, definition.exits, x, y))
    );

    const width = definition.layout[0]?.length ?? 0;
    const height = definition.layout.length;

    const zone: Zone = {
      id: definition.id,
      name: definition.name,
      description: definition.description,
      tiles,
      exits: definition.exits,
      ambient: definition.ambient,
      width,
      height
    };
    if (definition.boss) {
      zone.boss = definition.boss;
    }
    return zone;
  }

  private createTile(char: string, exits: ZoneExit[], x: number, y: number): Tile {
    const exit = exits.find((candidate) => candidate.x === x && candidate.y === y);

    if (char === '#') {
      return { type: 'wall', char: '#', fg: '#6f6f8c' };
    }

    if (char === '~') {
      return { type: 'fog', char: '~', fg: '#5ddad8' };
    }

    if (exit || char === 'X') {
      const tile: Tile = {
        type: 'exit',
        char: 'X',
        fg: '#ffd166',
        bg: 'rgba(255, 209, 102, 0.15)'
      };
      if (exit) {
        tile.exit = exit;
      }
      return tile;
    }

    return { type: 'floor', char: '·', fg: '#d6dff5' };
  }
}
