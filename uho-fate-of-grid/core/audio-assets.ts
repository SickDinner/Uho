// Audio Asset Registry for UHO: Fate of Grid
// This file manages all audio assets, their loading, and integration with the advanced audio engine

import { advancedAudioEngine } from './advanced-audio.ts';

export interface AudioAsset {
  id: string;
  src: string;
  category: 'music' | 'ambient' | 'sfx' | 'weather' | 'ui' | 'voice';
  volume?: number;
  loop?: boolean;
  preload?: boolean;
  description?: string;
}

export class AudioAssetRegistry {
  private assets: Map<string, AudioAsset> = new Map();
  private loadedAssets: Set<string> = new Set();
  private isInitialized: boolean = false;

  constructor() {
    this.registerAllAssets();
  }

  private registerAllAssets(): void {
    // MUSIC TRACKS - Atmospheric background music
    this.registerAsset({
      id: 'city_theme',
      src: 'assets/audio/music/city_ambience.ogg',
      category: 'music',
      volume: 0.7,
      loop: true,
      description: 'Urban atmospheric theme with distant traffic and city hum'
    });

    this.registerAsset({
      id: 'industrial_theme',
      src: 'assets/audio/music/industrial_dark.ogg',
      category: 'music',
      volume: 0.6,
      loop: true,
      description: 'Dark industrial theme with machinery and metal sounds'
    });

    this.registerAsset({
      id: 'suburban_theme',
      src: 'assets/audio/music/suburban_melancholy.ogg',
      category: 'music',
      volume: 0.5,
      loop: true,
      description: 'Melancholic suburban atmosphere'
    });

    this.registerAsset({
      id: 'underground_theme',
      src: 'assets/audio/music/underground_tension.ogg',
      category: 'music',
      volume: 0.8,
      loop: true,
      description: 'Tense underground atmosphere with echoing sounds'
    });

    this.registerAsset({
      id: 'menu_theme',
      src: 'assets/audio/music/main_menu.ogg',
      category: 'music',
      volume: 0.6,
      loop: true,
      description: 'Main menu atmospheric music'
    });

    this.registerAsset({
      id: 'creation-theme',
      src: 'assets/audio/music/character_creation.ogg',
      category: 'music',
      volume: 0.5,
      loop: true,
      description: 'Character creation atmospheric music'
    });

    // AMBIENT SOUNDS - Looping environmental audio
    this.registerAsset({
      id: 'city_traffic',
      src: 'assets/audio/ambient/city_traffic.ogg',
      category: 'ambient',
      volume: 0.4,
      loop: true,
      description: 'Distant city traffic and vehicle sounds'
    });

    this.registerAsset({
      id: 'distant_voices',
      src: 'assets/audio/ambient/distant_crowd.ogg',
      category: 'ambient',
      volume: 0.3,
      loop: true,
      description: 'Muffled distant voices and crowd murmur'
    });

    this.registerAsset({
      id: 'urban_hum',
      src: 'assets/audio/ambient/urban_electrical.ogg',
      category: 'ambient',
      volume: 0.2,
      loop: true,
      description: 'Urban electrical hum and HVAC systems'
    });

    this.registerAsset({
      id: 'machinery',
      src: 'assets/audio/ambient/factory_machines.ogg',
      category: 'ambient',
      volume: 0.5,
      loop: true,
      description: 'Industrial machinery and conveyor belts'
    });

    this.registerAsset({
      id: 'metal_clanking',
      src: 'assets/audio/ambient/metal_work.ogg',
      category: 'ambient',
      volume: 0.4,
      loop: true,
      description: 'Random metal clanking and industrial work sounds'
    });

    this.registerAsset({
      id: 'steam_vents',
      src: 'assets/audio/ambient/steam_release.ogg',
      category: 'ambient',
      volume: 0.3,
      loop: true,
      description: 'Steam vents and pressure release sounds'
    });

    this.registerAsset({
      id: 'dogs_barking',
      src: 'assets/audio/ambient/suburban_dogs.ogg',
      category: 'ambient',
      volume: 0.3,
      loop: true,
      description: 'Occasional distant dog barking'
    });

    this.registerAsset({
      id: 'tv_distant',
      src: 'assets/audio/ambient/tv_muffle.ogg',
      category: 'ambient',
      volume: 0.2,
      loop: true,
      description: 'Muffled television sounds through walls'
    });

    this.registerAsset({
      id: 'suburban_quiet',
      src: 'assets/audio/ambient/suburban_wind.ogg',
      category: 'ambient',
      volume: 0.4,
      loop: true,
      description: 'Quiet suburban atmosphere with occasional wind'
    });

    this.registerAsset({
      id: 'dripping_water',
      src: 'assets/audio/ambient/cave_drips.ogg',
      category: 'ambient',
      volume: 0.3,
      loop: true,
      description: 'Water dripping in underground spaces'
    });

    this.registerAsset({
      id: 'echo_footsteps',
      src: 'assets/audio/ambient/distant_steps.ogg',
      category: 'ambient',
      volume: 0.2,
      loop: true,
      description: 'Echoing footsteps in tunnels'
    });

    this.registerAsset({
      id: 'tunnel_wind',
      src: 'assets/audio/ambient/underground_wind.ogg',
      category: 'ambient',
      volume: 0.3,
      loop: true,
      description: 'Wind moving through underground tunnels'
    });

    // WEATHER SOUNDS
    this.registerAsset({
      id: 'light_rain',
      src: 'assets/audio/weather/rain_light.ogg',
      category: 'weather',
      volume: 0.4,
      loop: true,
      description: 'Light rain on various surfaces'
    });

    this.registerAsset({
      id: 'heavy_rain',
      src: 'assets/audio/weather/rain_heavy.ogg',
      category: 'weather',
      volume: 0.6,
      loop: true,
      description: 'Heavy rainfall'
    });

    this.registerAsset({
      id: 'rain_on_metal',
      src: 'assets/audio/weather/rain_metal.ogg',
      category: 'weather',
      volume: 0.5,
      loop: true,
      description: 'Rain hitting metal roofs and surfaces'
    });

    this.registerAsset({
      id: 'light_wind',
      src: 'assets/audio/weather/wind_light.ogg',
      category: 'weather',
      volume: 0.3,
      loop: true,
      description: 'Gentle wind through urban environment'
    });

    this.registerAsset({
      id: 'strong_wind',
      src: 'assets/audio/weather/wind_strong.ogg',
      category: 'weather',
      volume: 0.5,
      loop: true,
      description: 'Strong wind with debris'
    });

    this.registerAsset({
      id: 'howling_wind',
      src: 'assets/audio/weather/wind_howl.ogg',
      category: 'weather',
      volume: 0.7,
      loop: true,
      description: 'Howling wind through buildings'
    });

    this.registerAsset({
      id: 'distant_thunder',
      src: 'assets/audio/weather/thunder_far.ogg',
      category: 'weather',
      volume: 0.4,
      loop: false,
      description: 'Distant thunder rumble'
    });

    this.registerAsset({
      id: 'close_thunder',
      src: 'assets/audio/weather/thunder_close.ogg',
      category: 'weather',
      volume: 0.7,
      loop: false,
      description: 'Close thunder crack'
    });

    this.registerAsset({
      id: 'thunder_crack',
      src: 'assets/audio/weather/thunder_crack.ogg',
      category: 'weather',
      volume: 0.8,
      loop: false,
      description: 'Sharp thunder crack'
    });

    // SFX - Sound Effects
    this.registerAsset({
      id: 'door_open',
      src: 'assets/audio/sfx/door_creak.ogg',
      category: 'sfx',
      volume: 0.6,
      loop: false,
      description: 'Door opening with creak'
    });

    this.registerAsset({
      id: 'door_close',
      src: 'assets/audio/sfx/door_slam.ogg',
      category: 'sfx',
      volume: 0.5,
      loop: false,
      description: 'Door closing/slamming'
    });

    this.registerAsset({
      id: 'pickup_item',
      src: 'assets/audio/sfx/item_pickup.ogg',
      category: 'sfx',
      volume: 0.4,
      loop: false,
      description: 'Item pickup sound'
    });

    this.registerAsset({
      id: 'drop_item',
      src: 'assets/audio/sfx/item_drop.ogg',
      category: 'sfx',
      volume: 0.4,
      loop: false,
      description: 'Item drop sound'
    });

    this.registerAsset({
      id: 'cash_register',
      src: 'assets/audio/sfx/money_transaction.ogg',
      category: 'sfx',
      volume: 0.5,
      loop: false,
      description: 'Money transaction sound'
    });

    this.registerAsset({
      id: 'notification_alert',
      src: 'assets/audio/sfx/alert_notification.ogg',
      category: 'sfx',
      volume: 0.6,
      loop: false,
      description: 'Alert notification sound'
    });

    this.registerAsset({
      id: 'police_siren',
      src: 'assets/audio/sfx/siren_distant.ogg',
      category: 'sfx',
      volume: 0.7,
      loop: false,
      description: 'Distant police siren'
    });

    // UI SOUNDS
    this.registerAsset({
      id: 'ui_click',
      src: 'assets/audio/ui/button_click.ogg',
      category: 'ui',
      volume: 0.3,
      loop: false,
      description: 'UI button click'
    });

    this.registerAsset({
      id: 'ui_hover',
      src: 'assets/audio/ui/button_hover.ogg',
      category: 'ui',
      volume: 0.2,
      loop: false,
      description: 'UI button hover'
    });

    this.registerAsset({
      id: 'ui_error',
      src: 'assets/audio/ui/error_beep.ogg',
      category: 'ui',
      volume: 0.4,
      loop: false,
      description: 'UI error sound'
    });

    this.registerAsset({
      id: 'ui_success',
      src: 'assets/audio/ui/success_chime.ogg',
      category: 'ui',
      volume: 0.4,
      loop: false,
      description: 'UI success sound'
    });

    this.registerAsset({
      id: 'ui_notification',
      src: 'assets/audio/ui/notification_pop.ogg',
      category: 'ui',
      volume: 0.3,
      loop: false,
      description: 'UI notification sound'
    });

    console.log(`🎵 Registered ${this.assets.size} audio assets`);
  }

  private registerAsset(asset: AudioAsset): void {
    this.assets.set(asset.id, asset);
  }

  // Initialize the audio system and load essential sounds
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🎵 Initializing Audio Asset Registry...');

    // Load essential sounds first (UI, basic SFX)
    const essentialSounds = Array.from(this.assets.values()).filter(asset => 
      asset.category === 'ui' || 
      (asset.category === 'sfx' && ['pickup_item', 'drop_item'].includes(asset.id))
    );

    await this.loadAssets(essentialSounds);

    // Load music and ambient sounds
    const atmosphericSounds = Array.from(this.assets.values()).filter(asset => 
      asset.category === 'music' || asset.category === 'ambient'
    );

    await this.loadAssets(atmosphericSounds);

    // Load weather sounds
    const weatherSounds = Array.from(this.assets.values()).filter(asset => 
      asset.category === 'weather'
    );

    await this.loadAssets(weatherSounds);

    // Load remaining SFX
    const remainingSfx = Array.from(this.assets.values()).filter(asset => 
      asset.category === 'sfx' && !['pickup_item', 'drop_item'].includes(asset.id)
    );

    await this.loadAssets(remainingSfx);

    this.isInitialized = true;
    console.log('✅ Audio Asset Registry initialized successfully!');
  }

  private async loadAssets(assets: AudioAsset[]): Promise<void> {
    const loadPromises = assets.map(asset => this.loadAsset(asset));
    await Promise.all(loadPromises);
  }

  private async loadAsset(asset: AudioAsset): Promise<void> {
    if (this.loadedAssets.has(asset.id)) return;

    try {
      await advancedAudioEngine.loadSound(asset.id, asset.src, {
        volume: asset.volume || 1.0,
        loop: asset.loop || false,
        preload: asset.preload !== false
      });
      
      this.loadedAssets.add(asset.id);
      console.log(`🔊 Loaded audio: ${asset.id} (${asset.description})`);
    } catch (error) {
      console.warn(`⚠️ Failed to load audio asset: ${asset.id}`, error);
    }
  }

  // Get asset information
  getAsset(id: string): AudioAsset | undefined {
    return this.assets.get(id);
  }

  // Get all assets by category
  getAssetsByCategory(category: AudioAsset['category']): AudioAsset[] {
    return Array.from(this.assets.values()).filter(asset => asset.category === category);
  }

  // Check if an asset is loaded
  isAssetLoaded(id: string): boolean {
    return this.loadedAssets.has(id);
  }

  // Get loading progress
  getLoadingProgress(): { loaded: number; total: number; percentage: number } {
    const loaded = this.loadedAssets.size;
    const total = this.assets.size;
    const percentage = total > 0 ? Math.round((loaded / total) * 100) : 0;
    
    return { loaded, total, percentage };
  }

  // Load assets on demand
  async loadAssetsByCategory(category: AudioAsset['category']): Promise<void> {
    const assets = this.getAssetsByCategory(category);
    await this.loadAssets(assets);
  }

  // Preload specific assets
  async preloadAssets(assetIds: string[]): Promise<void> {
    const assets = assetIds
      .map(id => this.assets.get(id))
      .filter((asset): asset is AudioAsset => asset !== undefined);
    
    await this.loadAssets(assets);
  }
}

// Global audio asset registry
export const audioAssetRegistry = new AudioAssetRegistry();

// Auto-initialize when imported
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready, then initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      audioAssetRegistry.initialize().catch(console.error);
    });
  } else {
    audioAssetRegistry.initialize().catch(console.error);
  }
  
  // Expose for debugging
  (window as any).audioAssets = audioAssetRegistry;
  console.log('🎵 Audio Asset Registry available at window.audioAssets');
}