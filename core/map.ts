import type { Vector2, TileType, GameMap } from './types.ts';

// Define tile types for the game world
export const TILE_TYPES: Record<string, TileType> = {
  empty: {
    id: 'empty',
    name: 'Tyhjä',
    walkable: true,
    sprite: 0,
    description: 'Tyhjä alue'
  },
  street: {
    id: 'street',
    name: 'Katu',
    walkable: true,
    sprite: 1,
    description: 'Asfaltittu katu'
  },
  sidewalk: {
    id: 'sidewalk',
    name: 'Jalkakäytävä',
    walkable: true,
    sprite: 2,
    description: 'Betoninen jalkakäytävä'
  },
  building: {
    id: 'building',
    name: 'Rakennus',
    walkable: false,
    sprite: 3,
    description: 'Tavallinen rakennus'
  },
  shop: {
    id: 'shop',
    name: 'Kauppa',
    walkable: false,
    sprite: 4,
    description: 'Kauppa - paina E avataksesi'
  },
  hospital: {
    id: 'hospital',
    name: 'Sairaala',
    walkable: false,
    sprite: 5,
    description: 'Sairaala - paina E hoitaaksesi itsesi'
  },
  bank: {
    id: 'bank',
    name: 'Pankki',
    walkable: false,
    sprite: 6,
    description: 'Pankki - paina E käyttääksesi palveluja'
  },
  dealer_spot: {
    id: 'dealer_spot',
    name: 'Epäilyttävä paikka',
    walkable: true,
    sprite: 7,
    description: 'Täällä voi olla jotain mielenkiintoista...'
  },
  safe_house: {
    id: 'safe_house',
    name: 'Turvapaikka',
    walkable: false,
    sprite: 8,
    description: 'Turvallinen paikka lepäämiseen - paina E'
  },
  police_station: {
    id: 'police_station',
    name: 'Poliisiasema',
    walkable: false,
    sprite: 9,
    description: 'Poliisiasema - pidä matala profiili'
  }
};

export class MapManager {
  private currentMap: GameMap;
  
  constructor() {
    this.currentMap = this.generateTestMap();
  }
  
  private generateTestMap(): GameMap {
    const width = 80;
    const height = 60;
    const tiles: number[][] = [];
    
    // Initialize with empty tiles
    for (let y = 0; y < height; y++) {
      tiles[y] = [];
      for (let x = 0; x < width; x++) {
        tiles[y][x] = 0; // empty
      }
    }
    
    // Create some streets
    for (let x = 0; x < width; x++) {
      tiles[20][x] = 1; // horizontal street
      tiles[40][x] = 1; // another horizontal street
    }
    
    for (let y = 0; y < height; y++) {
      tiles[y][20] = 1; // vertical street
      tiles[y][40] = 1; // another vertical street
      tiles[y][60] = 1; // another vertical street
    }
    
    // Add sidewalks next to streets
    for (let x = 0; x < width; x++) {
      if (tiles[19][x] === 0) tiles[19][x] = 2; // sidewalk above street
      if (tiles[21][x] === 0) tiles[21][x] = 2; // sidewalk below street
      if (tiles[39][x] === 0) tiles[39][x] = 2; // sidewalk above street
      if (tiles[41][x] === 0) tiles[41][x] = 2; // sidewalk below street
    }
    
    for (let y = 0; y < height; y++) {
      if (tiles[y][19] === 0) tiles[y][19] = 2; // sidewalk left of street
      if (tiles[y][21] === 0) tiles[y][21] = 2; // sidewalk right of street
      if (tiles[y][39] === 0) tiles[y][39] = 2; // sidewalk left of street
      if (tiles[y][41] === 0) tiles[y][41] = 2; // sidewalk right of street
      if (tiles[y][59] === 0) tiles[y][59] = 2; // sidewalk left of street
      if (tiles[y][61] === 0) tiles[y][61] = 2; // sidewalk right of street
    }
    
    // Add buildings in blocks
    this.addBuilding(tiles, 5, 5, 10, 8, 3); // Regular building
    this.addBuilding(tiles, 25, 5, 8, 6, 4); // Shop
    this.addBuilding(tiles, 45, 5, 12, 10, 5); // Hospital
    this.addBuilding(tiles, 65, 5, 10, 8, 6); // Bank
    
    this.addBuilding(tiles, 5, 25, 8, 6, 3); // Regular building
    this.addBuilding(tiles, 25, 25, 6, 6, 8); // Safe house
    this.addBuilding(tiles, 45, 25, 10, 8, 9); // Police station
    this.addBuilding(tiles, 65, 25, 8, 6, 3); // Regular building
    
    this.addBuilding(tiles, 5, 45, 10, 8, 3); // Regular building
    this.addBuilding(tiles, 25, 45, 8, 6, 3); // Regular building
    this.addBuilding(tiles, 45, 45, 12, 8, 3); // Regular building
    this.addBuilding(tiles, 65, 45, 8, 6, 3); // Regular building
    
    // Add some dealer spots in alleys
    tiles[15][10] = 7; // dealer spot
    tiles[35][15] = 7; // dealer spot
    tiles[50][30] = 7; // dealer spot
    
    return {
      id: 'test_city',
      name: 'Testikaupunki',
      width,
      height,
      tiles,
      spawns: {
        player: { x: 10, y: 10 }
      }
    };
  }
  
  private addBuilding(tiles: number[][], x: number, y: number, width: number, height: number, tileType: number): void {
    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) {
        if (x + dx < tiles[0].length && y + dy < tiles.length) {
          tiles[y + dy][x + dx] = tileType;
        }
      }
    }
  }
  
  getCurrentMap(): GameMap {
    return this.currentMap;
  }
  
  getTileAt(x: number, y: number): TileType | null {
    const map = this.currentMap;
    if (x < 0 || y < 0 || x >= map.width || y >= map.height) {
      return null;
    }
    
    const tileId = map.tiles[y][x];
    const tileTypes = Object.values(TILE_TYPES);
    return tileTypes[tileId] || TILE_TYPES.empty;
  }
  
  isWalkable(x: number, y: number): boolean {
    const tile = this.getTileAt(x, y);
    return tile ? tile.walkable : false;
  }
  
  getTileTypeId(x: number, y: number): string {
    const tile = this.getTileAt(x, y);
    return tile ? tile.id : 'empty';
  }
}