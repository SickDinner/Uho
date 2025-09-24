export interface Asset {
  id: string;
  type: 'image' | 'audio' | 'json';
  url: string;
  data?: any;
  loaded: boolean;
  error?: string;
}

export class AssetManager {
  private static instance: AssetManager;
  private assets: Map<string, Asset> = new Map();
  private loadingPromises: Map<string, Promise<any>> = new Map();

  static getInstance(): AssetManager {
    if (!AssetManager.instance) {
      AssetManager.instance = new AssetManager();
    }
    return AssetManager.instance;
  }

  async preloadAssets(assetList: Omit<Asset, 'loaded' | 'data'>[]): Promise<void> {
    const loadPromises = assetList.map(asset => this.loadAsset(asset));
    await Promise.allSettled(loadPromises);
  }

  async loadAsset(asset: Omit<Asset, 'loaded' | 'data'>): Promise<any> {
    if (this.assets.has(asset.id)) {
      const existingAsset = this.assets.get(asset.id)!;
      if (existingAsset.loaded) {
        return existingAsset.data;
      }
    }

    // If already loading, return the existing promise
    if (this.loadingPromises.has(asset.id)) {
      return this.loadingPromises.get(asset.id);
    }

    const loadPromise = this.performLoad(asset);
    this.loadingPromises.set(asset.id, loadPromise);

    try {
      const data = await loadPromise;
      this.assets.set(asset.id, {
        ...asset,
        data,
        loaded: true
      });
      return data;
    } catch (error) {
      this.assets.set(asset.id, {
        ...asset,
        loaded: false,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    } finally {
      this.loadingPromises.delete(asset.id);
    }
  }

  private async performLoad(asset: Omit<Asset, 'loaded' | 'data'>): Promise<any> {
    switch (asset.type) {
      case 'image':
        return this.loadImage(asset.url);
      case 'audio':
        return this.loadAudio(asset.url);
      case 'json':
        return this.loadJSON(asset.url);
      default:
        throw new Error(`Unsupported asset type: ${asset.type}`);
    }
  }

  private loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
      img.src = url;
    });
  }

  private async loadAudio(url: string): Promise<HTMLAudioElement> {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      audio.oncanplaythrough = () => resolve(audio);
      audio.onerror = () => reject(new Error(`Failed to load audio: ${url}`));
      audio.src = url;
    });
  }

  private async loadJSON(url: string): Promise<any> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load JSON: ${url} (${response.status})`);
    }
    return response.json();
  }

  getAsset<T = any>(id: string): T | null {
    const asset = this.assets.get(id);
    return asset?.loaded ? asset.data : null;
  }

  isLoaded(id: string): boolean {
    const asset = this.assets.get(id);
    return asset?.loaded ?? false;
  }

  getLoadingProgress(): { loaded: number; total: number; percentage: number } {
    const total = this.assets.size;
    const loaded = Array.from(this.assets.values()).filter(asset => asset.loaded).length;
    return {
      loaded,
      total,
      percentage: total > 0 ? (loaded / total) * 100 : 100
    };
  }

  // Character creation specific assets
  static getCharacterCreationAssets(): Omit<Asset, 'loaded' | 'data'>[] {
    return [
      {
        id: 'cc-bg-machine-prayer',
        type: 'image',
        url: './assets/images/character-creation/machine-of-prayer-bg.png'
      },
      {
        id: 'cc-portrait-wasteland',
        type: 'image', 
        url: './assets/images/character-creation/wasteland-character.png'
      },
      {
        id: 'cc-bg-isometric',
        type: 'image',
        url: './assets/images/character-creation/isometric-room.jpg'
      }
    ];
  }
}

// Export singleton instance
export const assetManager = AssetManager.getInstance();