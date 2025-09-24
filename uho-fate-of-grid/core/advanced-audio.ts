import * as Tone from 'tone';
import { Howl, Howler } from 'howler';
import type { Vector2 } from './types.ts';

// Enhanced Audio Types
export interface AudioZone {
  id: string;
  name: string;
  bounds: { x: number; y: number; width: number; height: number };
  ambientSounds: string[];
  musicTrack?: string;
  reverbLevel: number;
  weatherEffects: boolean;
}

export interface SpatialSound {
  id: string;
  position: Vector2;
  maxDistance: number;
  rolloffFactor: number;
  volume: number;
  loop: boolean;
}

export interface WeatherAudio {
  rain: { intensity: number; sounds: string[] };
  wind: { intensity: number; sounds: string[] };
  thunder: { chance: number; sounds: string[] };
}

export interface MusicState {
  track: string;
  mood: 'calm' | 'tense' | 'combat' | 'exploration' | 'ambient';
  fadeTime: number;
}

export class AdvancedAudioEngine {
  private howlSounds: Map<string, Howl> = new Map();
  private toneSynths: Map<string, Tone.Synth | Tone.PolySynth> = new Map();
  private currentMusicTrack?: Howl;
  
  // Audio processing nodes
  private masterGain!: Tone.Gain;
  private musicGain!: Tone.Gain;
  private sfxGain!: Tone.Gain;
  private ambientGain!: Tone.Gain;
  private reverbNode!: Tone.Reverb;
  private filterNode!: Tone.Filter;
  private compressor!: Tone.Compressor;
  
  // Spatial audio
  private listenerPosition: Vector2 = { x: 0, y: 0 };
  private spatialSounds: Map<string, SpatialSound> = new Map();
  
  // Dynamic audio zones
  private audioZones: Map<string, AudioZone> = new Map();
  private currentZone?: AudioZone;
  
  // Weather and ambient systems
  private weatherAudio!: WeatherAudio;
  private ambientLoop?: Howl;
  private windNoise?: Tone.Noise;
  
  // Music system
  private musicState!: MusicState;
  private musicCrossfader: number = 0;
  
  // Procedural sound generation
  private footstepSynth!: Tone.NoiseSynth;
  private glitchSynth!: Tone.FMSynth;
  
  // Volume controls
  private volumes = {
    master: 1.0,
    music: 0.7,
    sfx: 0.8,
    ambient: 0.6,
    voice: 1.0
  };

  constructor() {
    this.initializeAudioContext();
    this.setupAudioNodes();
    this.initializeSynths();
    this.loadAudioZones();
    this.setupWeatherAudio();
    
    this.musicState = {
      track: '',
      mood: 'ambient',
      fadeTime: 2000
    };
    
    console.log('🎵 Advanced Audio Engine initialized!');
  }

  private async initializeAudioContext(): Promise<void> {
    await Tone.start();
    console.log('Tone.js audio context started');
  }

  private setupAudioNodes(): void {
    // Create master audio chain
    this.masterGain = new Tone.Gain(this.volumes.master);
    this.musicGain = new Tone.Gain(this.volumes.music);
    this.sfxGain = new Tone.Gain(this.volumes.sfx);
    this.ambientGain = new Tone.Gain(this.volumes.ambient);
    
    // Effects processing
    this.reverbNode = new Tone.Reverb({
      decay: 2.5,
      wet: 0.7
    });
    
    this.filterNode = new Tone.Filter({
      frequency: 8000,
      type: 'lowpass',
      rolloff: -12
    });
    
    this.compressor = new Tone.Compressor({
      threshold: -24,
      ratio: 3,
      attack: 0.003,
      release: 0.1
    });
    
    // Connect the audio chain
    this.musicGain.connect(this.reverbNode);
    this.sfxGain.connect(this.filterNode);
    this.ambientGain.connect(this.reverbNode);
    
    this.reverbNode.connect(this.compressor);
    this.filterNode.connect(this.compressor);
    this.compressor.connect(this.masterGain);
    this.masterGain.toDestination();
  }

  private initializeSynths(): void {
    // Footstep synthesis
    this.footstepSynth = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: {
        attack: 0.005,
        decay: 0.1,
        sustain: 0,
        release: 0.1
      }
    }).connect(this.sfxGain);
    
    // Glitch effects for UI and environmental sounds
    this.glitchSynth = new Tone.FMSynth({
      harmonicity: 0.5,
      modulationIndex: 2,
      envelope: {
        attack: 0.01,
        decay: 0.2,
        sustain: 0.1,
        release: 0.3
      },
      modulation: {
        type: 'sine'
      }
    }).connect(this.sfxGain);
    
    // Wind noise generator
    this.windNoise = new Tone.Noise({
      type: 'brown',
      volume: -20
    }).connect(this.ambientGain);
  }

  private loadAudioZones(): void {
    // Define audio zones for different areas
    this.audioZones.set('city_center', {
      id: 'city_center',
      name: 'City Center',
      bounds: { x: 0, y: 0, width: 100, height: 100 },
      ambientSounds: ['city_traffic', 'distant_voices', 'urban_hum'],
      musicTrack: 'city_theme',
      reverbLevel: 0.3,
      weatherEffects: true
    });
    
    this.audioZones.set('industrial', {
      id: 'industrial',
      name: 'Industrial District',
      bounds: { x: 100, y: 0, width: 80, height: 120 },
      ambientSounds: ['machinery', 'metal_clanking', 'steam_vents'],
      musicTrack: 'industrial_theme',
      reverbLevel: 0.8,
      weatherEffects: true
    });
    
    this.audioZones.set('residential', {
      id: 'residential',
      name: 'Residential Area',
      bounds: { x: 0, y: 100, width: 150, height: 80 },
      ambientSounds: ['dogs_barking', 'tv_distant', 'suburban_quiet'],
      musicTrack: 'suburban_theme',
      reverbLevel: 0.2,
      weatherEffects: true
    });
    
    this.audioZones.set('underground', {
      id: 'underground',
      name: 'Underground',
      bounds: { x: 50, y: 50, width: 60, height: 60 },
      ambientSounds: ['dripping_water', 'echo_footsteps', 'tunnel_wind'],
      musicTrack: 'underground_theme',
      reverbLevel: 1.0,
      weatherEffects: false
    });
  }

  private setupWeatherAudio(): void {
    this.weatherAudio = {
      rain: {
        intensity: 0,
        sounds: ['light_rain', 'heavy_rain', 'rain_on_metal']
      },
      wind: {
        intensity: 0,
        sounds: ['light_wind', 'strong_wind', 'howling_wind']
      },
      thunder: {
        chance: 0.1,
        sounds: ['distant_thunder', 'close_thunder', 'thunder_crack']
      }
    };
  }

  // Load sound assets
  async loadSound(id: string, src: string, options?: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const howl = new Howl({
        src: [src],
        volume: options?.volume || 1.0,
        loop: options?.loop || false,
        html5: options?.html5 || false,
        preload: true,
        onload: () => {
          this.howlSounds.set(id, howl);
          resolve();
        },
        onloaderror: (soundId, error) => {
          console.warn(`Failed to load sound ${soundId}:`, error);
          resolve(); // Continue without the sound
        }
      });
    });
  }

  // Batch load sounds
  async loadSoundBank(sounds: { id: string; src: string; options?: any }[]): Promise<void> {
    const promises = sounds.map(sound => this.loadSound(sound.id, sound.src, sound.options));
    await Promise.all(promises);
    console.log(`🔊 Loaded ${sounds.length} sounds`);
  }

  // Spatial audio system
  playSpatialSound(soundId: string, position: Vector2, options?: {
    volume?: number;
    maxDistance?: number;
    rolloffFactor?: number;
    loop?: boolean;
  }): string {
    const sound = this.howlSounds.get(soundId);
    if (!sound) {
      console.warn(`Spatial sound not found: ${soundId}`);
      return '';
    }

    const spatialId = `${soundId}_${Date.now()}`;
    const spatialSound: SpatialSound = {
      id: spatialId,
      position: { ...position },
      maxDistance: options?.maxDistance || 100,
      rolloffFactor: options?.rolloffFactor || 1,
      volume: options?.volume || 1,
      loop: options?.loop || false
    };

    this.spatialSounds.set(spatialId, spatialSound);

    const soundInstance = sound.play();
    this.updateSpatialAudio(spatialId, soundInstance);

    return spatialId;
  }

  private updateSpatialAudio(spatialId: string, soundInstance: number): void {
    const spatialSound = this.spatialSounds.get(spatialId);
    if (!spatialSound) return;

    const sound = this.howlSounds.get(spatialSound.id.split('_')[0]);
    if (!sound) return;

    // Calculate distance and volume
    const dx = spatialSound.position.x - this.listenerPosition.x;
    const dy = spatialSound.position.y - this.listenerPosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Apply distance-based volume falloff
    let volume = spatialSound.volume;
    if (distance > spatialSound.maxDistance) {
      volume = 0;
    } else if (distance > 0) {
      volume *= Math.pow(1 - (distance / spatialSound.maxDistance), spatialSound.rolloffFactor);
    }

    // Apply stereo panning based on position
    const pan = Math.max(-1, Math.min(1, dx / spatialSound.maxDistance));

    sound.volume(volume, soundInstance);
    sound.stereo(pan, soundInstance);
  }

  // Update listener position for spatial audio
  setListenerPosition(position: Vector2): void {
    this.listenerPosition = { ...position };
    
    // Update all spatial sounds
    for (const [spatialId, spatialSound] of this.spatialSounds.entries()) {
      this.updateSpatialAudio(spatialId, 0); // Update all instances
    }
    
    // Check for zone transitions
    this.checkAudioZoneTransition();
  }

  private checkAudioZoneTransition(): void {
    const newZone = Array.from(this.audioZones.values()).find(zone => 
      this.listenerPosition.x >= zone.bounds.x &&
      this.listenerPosition.x < zone.bounds.x + zone.bounds.width &&
      this.listenerPosition.y >= zone.bounds.y &&
      this.listenerPosition.y < zone.bounds.y + zone.bounds.height
    );

    if (newZone !== this.currentZone) {
      this.transitionToZone(newZone);
      this.currentZone = newZone || this.currentZone;
    }
  }

  private transitionToZone(zone?: AudioZone): void {
    if (!zone) return;

    console.log(`🌍 Transitioning to audio zone: ${zone.name}`);

    // Update reverb level
    this.reverbNode.wet.rampTo(zone.reverbLevel, 1);

    // Change music if needed
    if (zone.musicTrack && zone.musicTrack !== this.musicState.track) {
      this.playMusic(zone.musicTrack, { mood: 'ambient', fadeTime: 3000 });
    }

    // Start ambient sounds
    this.playAmbientSounds(zone.ambientSounds);
  }

  private playAmbientSounds(soundIds: string[]): void {
    // Stop current ambient
    if (this.ambientLoop) {
      this.ambientLoop.fade(this.ambientLoop.volume(), 0, 1000);
      setTimeout(() => this.ambientLoop?.stop(), 1000);
    }

    // Play new ambient sounds randomly
    const selectedAmbient = soundIds[Math.floor(Math.random() * soundIds.length)];
    const sound = this.howlSounds.get(selectedAmbient);
    
    if (sound) {
      this.ambientLoop = sound;
      sound.loop(true);
      sound.volume(0);
      sound.play();
      sound.fade(0, this.volumes.ambient, 2000);
    }
  }

  // Dynamic music system
  playMusic(trackId: string, options?: {
    mood?: MusicState['mood'];
    fadeTime?: number;
    crossfade?: boolean;
  }): void {
    const sound = this.howlSounds.get(trackId);
    if (!sound) {
      console.warn(`Music track not found: ${trackId}`);
      return;
    }

    const fadeTime = options?.fadeTime || this.musicState.fadeTime;

    // Fade out current track
    if (this.currentMusicTrack && this.currentMusicTrack.playing()) {
      this.currentMusicTrack.fade(this.currentMusicTrack.volume(), 0, fadeTime);
      setTimeout(() => this.currentMusicTrack?.stop(), fadeTime);
    }

    // Start new track
    sound.volume(0);
    sound.loop(true);
    const instance = sound.play();
    sound.fade(0, this.volumes.music, fadeTime, instance);
    
    this.currentMusicTrack = sound;
    this.musicState.track = trackId;
    this.musicState.mood = options?.mood || 'ambient';
  }

  // Procedural sound generation
  createFootstepSound(surface: 'concrete' | 'grass' | 'metal' | 'water' = 'concrete'): void {
    const surfaceSettings = {
      concrete: { frequency: 80, decay: 0.1, volume: 0.3 },
      grass: { frequency: 120, decay: 0.2, volume: 0.2 },
      metal: { frequency: 200, decay: 0.05, volume: 0.4 },
      water: { frequency: 60, decay: 0.3, volume: 0.25 }
    };

    const settings = surfaceSettings[surface];
    
    this.footstepSynth.envelope.decay = settings.decay;
    this.footstepSynth.volume.value = Tone.gainToDb(settings.volume * this.volumes.sfx);
    
    // Add slight pitch variation
    const pitchVariation = Math.random() * 0.2 - 0.1;
    this.footstepSynth.triggerAttackRelease('16n', Tone.now(), 1 + pitchVariation);
  }

  createUISound(type: 'click' | 'hover' | 'error' | 'success' | 'notification'): void {
    const soundSettings = {
      click: { frequency: 800, duration: '32n' },
      hover: { frequency: 1200, duration: '64n' },
      error: { frequency: 200, duration: '16n' },
      success: { frequency: 1600, duration: '8n' },
      notification: { frequency: 1000, duration: '4n' }
    };

    const settings = soundSettings[type];
    this.glitchSynth.triggerAttackRelease(settings.frequency, settings.duration);
  }

  // Weather audio system
  setWeatherIntensity(type: 'rain' | 'wind' | 'thunder', intensity: number): void {
    intensity = Math.max(0, Math.min(1, intensity));
    
    if (type === 'rain') {
      this.weatherAudio.rain.intensity = intensity;
      this.updateRainAudio();
    } else if (type === 'wind') {
      this.weatherAudio.wind.intensity = intensity;
      this.updateWindAudio();
    } else if (type === 'thunder') {
      this.weatherAudio.thunder.chance = intensity;
    }
  }

  private updateRainAudio(): void {
    const intensity = this.weatherAudio.rain.intensity;
    
    if (intensity === 0) {
      // Stop rain sounds
      const rainSounds = ['light_rain', 'heavy_rain', 'rain_on_metal'];
      rainSounds.forEach(soundId => {
        const sound = this.howlSounds.get(soundId);
        if (sound && sound.playing()) {
          sound.fade(sound.volume(), 0, 1000);
          setTimeout(() => sound.stop(), 1000);
        }
      });
      return;
    }

    // Select appropriate rain sound based on intensity
    let rainSound: string;
    if (intensity < 0.3) rainSound = 'light_rain';
    else if (intensity < 0.7) rainSound = 'heavy_rain';
    else rainSound = 'rain_on_metal';

    const sound = this.howlSounds.get(rainSound);
    if (sound && !sound.playing()) {
      sound.loop(true);
      sound.volume(intensity * this.volumes.ambient);
      sound.play();
    }
  }

  private updateWindAudio(): void {
    const intensity = this.weatherAudio.wind.intensity;
    
    if (this.windNoise) {
      this.windNoise.volume.value = Tone.gainToDb(intensity * this.volumes.ambient * 0.5);
      
      if (intensity > 0 && this.windNoise.state !== 'started') {
        this.windNoise.start();
      } else if (intensity === 0 && this.windNoise.state === 'started') {
        this.windNoise.stop();
      }
    }
  }

  // Audio analysis and reactive systems
  getMusicAnalyzer(): Tone.Analyser | null {
    if (!this.currentMusicTrack) return null;
    
    const analyzer = new Tone.Analyser('fft', 256);
    this.musicGain.connect(analyzer);
    return analyzer;
  }

  // Volume controls
  setVolume(type: keyof typeof this.volumes, volume: number): void {
    volume = Math.max(0, Math.min(1, volume));
    this.volumes[type] = volume;

    switch (type) {
      case 'master':
        this.masterGain.gain.value = volume;
        break;
      case 'music':
        this.musicGain.gain.value = volume;
        break;
      case 'sfx':
        this.sfxGain.gain.value = volume;
        break;
      case 'ambient':
        this.ambientGain.gain.value = volume;
        break;
    }
  }

  getVolume(type: keyof typeof this.volumes): number {
    return this.volumes[type];
  }

  // Cleanup
  dispose(): void {
    // Stop all sounds
    this.howlSounds.forEach(sound => sound.unload());
    this.howlSounds.clear();
    
    // Dispose Tone.js nodes
    this.masterGain.dispose();
    this.musicGain.dispose();
    this.sfxGain.dispose();
    this.ambientGain.dispose();
    this.reverbNode.dispose();
    this.filterNode.dispose();
    this.compressor.dispose();
    
    // Dispose synths
    this.footstepSynth.dispose();
    this.glitchSynth.dispose();
    if (this.windNoise) this.windNoise.dispose();
    
    console.log('🔇 Advanced Audio Engine disposed');
  }
}

// Global advanced audio engine instance
export const advancedAudioEngine = new AdvancedAudioEngine();

// Debug helper
if (typeof window !== 'undefined') {
  (window as any).advancedAudio = advancedAudioEngine;
  console.log('🎵 Advanced Audio available at window.advancedAudio');
}