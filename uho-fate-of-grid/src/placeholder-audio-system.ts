// 🎵 PLACEHOLDER AUDIO SYSTEM
// Toimii ilman oikeita äänitiedostoja - luo synteettisiä ääniä

export interface AudioConfig {
  volume: number;
  loop: boolean;
  fadeIn?: number;
  fadeOut?: number;
  pitch?: number;
  reverb?: number;
}

export interface SyntheticSound {
  type: 'tone' | 'noise' | 'chord' | 'drum' | 'melody';
  frequency: number;
  duration: number;
  volume: number;
  waveform: 'sine' | 'square' | 'triangle' | 'sawtooth';
  envelope?: {
    attack: number;
    decay: number;
    sustain: number;
    release: number;
  };
}

export class PlaceholderAudioSystem {
  private audioContext: AudioContext | null = null;
  private masterVolume: number = 0.7;
  private soundLibrary: Map<string, SyntheticSound> = new Map();
  private activeSounds: Map<string, AudioBufferSourceNode> = new Map();
  private musicLoops: Map<string, AudioBufferSourceNode> = new Map();
  private reverb: ConvolverNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  
  constructor() {
    this.initializeAudioContext();
    this.createSoundLibrary();
  }
  
  private async initializeAudioContext(): Promise<void> {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create audio effects
      await this.createAudioEffects();
      
      console.log('🎵 Placeholder audio system initialized');
    } catch (error) {
      console.warn('Failed to initialize audio context:', error);
    }
  }
  
  private async createAudioEffects(): Promise<void> {
    if (!this.audioContext) return;
    
    // Create compressor for audio normalization
    this.compressor = this.audioContext.createDynamicsCompressor();
    this.compressor.threshold.value = -24;
    this.compressor.knee.value = 30;
    this.compressor.ratio.value = 12;
    this.compressor.attack.value = 0.003;
    this.compressor.release.value = 0.25;
    
    // Create reverb effect
    this.reverb = this.audioContext.createConvolver();
    this.reverb.buffer = await this.createReverbBuffer();
    
    // Connect effects chain
    this.compressor.connect(this.reverb);
    this.reverb.connect(this.audioContext.destination);
  }
  
  private async createReverbBuffer(): Promise<AudioBuffer> {
    if (!this.audioContext) throw new Error('No audio context');
    
    const length = this.audioContext.sampleRate * 3; // 3 seconds of reverb
    const impulse = this.audioContext.createBuffer(2, length, this.audioContext.sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
      }
    }
    
    return impulse;
  }
  
  private createSoundLibrary(): void {
    // 🎮 UI SOUNDS
    this.soundLibrary.set('ui_click', {
      type: 'tone',
      frequency: 800,
      duration: 0.1,
      volume: 0.3,
      waveform: 'square',
      envelope: { attack: 0.01, decay: 0.05, sustain: 0.3, release: 0.04 }
    });
    
    this.soundLibrary.set('ui_success', {
      type: 'chord',
      frequency: 523, // C5
      duration: 0.5,
      volume: 0.4,
      waveform: 'sine',
      envelope: { attack: 0.1, decay: 0.1, sustain: 0.7, release: 0.3 }
    });
    
    this.soundLibrary.set('ui_notification', {
      type: 'tone',
      frequency: 1047, // C6
      duration: 0.3,
      volume: 0.35,
      waveform: 'triangle',
      envelope: { attack: 0.05, decay: 0.1, sustain: 0.5, release: 0.15 }
    });
    
    // 🚶 MOVEMENT SOUNDS
    this.soundLibrary.set('player_footstep', {
      type: 'noise',
      frequency: 200,
      duration: 0.15,
      volume: 0.2,
      waveform: 'sawtooth',
      envelope: { attack: 0.01, decay: 0.1, sustain: 0.2, release: 0.04 }
    });
    
    this.soundLibrary.set('world_door_open', {
      type: 'tone',
      frequency: 300,
      duration: 0.8,
      volume: 0.3,
      waveform: 'sawtooth',
      envelope: { attack: 0.2, decay: 0.3, sustain: 0.4, release: 0.3 }
    });
    
    // 💰 ITEM SOUNDS
    this.soundLibrary.set('item_pickup', {
      type: 'melody',
      frequency: 659, // E5
      duration: 0.4,
      volume: 0.35,
      waveform: 'sine',
      envelope: { attack: 0.02, decay: 0.1, sustain: 0.6, release: 0.28 }
    });
    
    this.soundLibrary.set('coin_drop', {
      type: 'tone',
      frequency: 1319, // E6
      duration: 0.3,
      volume: 0.4,
      waveform: 'triangle',
      envelope: { attack: 0.01, decay: 0.05, sustain: 0.4, release: 0.24 }
    });
    
    // ⚔️ COMBAT SOUNDS
    this.soundLibrary.set('combat_sword', {
      type: 'noise',
      frequency: 400,
      duration: 0.2,
      volume: 0.5,
      waveform: 'sawtooth',
      envelope: { attack: 0.01, decay: 0.08, sustain: 0.1, release: 0.11 }
    });
    
    this.soundLibrary.set('magic_cast', {
      type: 'chord',
      frequency: 220,
      volume: 0.4,
      waveform: 'sine',
      duration: 1.5,
      envelope: { attack: 0.3, decay: 0.2, sustain: 0.3, release: 0.5 }
    });
    
    // 🌧️ AMBIENT SOUNDS
    this.soundLibrary.set('weather_wind', {
      type: 'noise',
      frequency: 150,
      duration: 5.0,
      volume: 0.15,
      waveform: 'sawtooth',
      envelope: { attack: 1.0, decay: 1.0, sustain: 0.8, release: 2.0 }
    });
    
    this.soundLibrary.set('weather_rain', {
      type: 'noise',
      frequency: 800,
      duration: 3.0,
      volume: 0.2,
      waveform: 'square',
      envelope: { attack: 0.5, decay: 0.5, sustain: 0.9, release: 1.5 }
    });
    
    this.soundLibrary.set('weather_thunder', {
      type: 'noise',
      frequency: 60,
      duration: 2.0,
      volume: 0.7,
      waveform: 'sawtooth',
      envelope: { attack: 0.01, decay: 0.5, sustain: 0.3, release: 1.5 }
    });
    
    // 🎵 MUSIC THEMES (simplified melodies)
    this.soundLibrary.set('city_theme', {
      type: 'melody',
      frequency: 440, // A4
      duration: 8.0,
      volume: 0.25,
      waveform: 'triangle',
      envelope: { attack: 0.5, decay: 1.0, sustain: 0.7, release: 1.5 }
    });
    
    this.soundLibrary.set('battle_theme', {
      type: 'chord',
      frequency: 330, // E4
      duration: 6.0,
      volume: 0.35,
      waveform: 'square',
      envelope: { attack: 0.1, decay: 0.5, sustain: 0.8, release: 1.0 }
    });
    
    this.soundLibrary.set('menu_theme', {
      type: 'melody',
      frequency: 523, // C5
      duration: 10.0,
      volume: 0.2,
      waveform: 'sine',
      envelope: { attack: 1.0, decay: 1.5, sustain: 0.6, release: 2.0 }
    });
    
    console.log(`🎵 Created ${this.soundLibrary.size} synthetic sounds`);
  }
  
  private async createSyntheticBuffer(sound: SyntheticSound): Promise<AudioBuffer> {
    if (!this.audioContext) throw new Error('No audio context');
    
    const sampleRate = this.audioContext.sampleRate;
    const length = Math.floor(sound.duration * sampleRate);
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    
    const envelope = sound.envelope || { attack: 0.1, decay: 0.1, sustain: 0.7, release: 0.2 };
    
    for (let i = 0; i < length; i++) {
      const time = i / sampleRate;
      const progress = i / length;
      
      // Generate waveform
      let sample = 0;
      const freq = sound.frequency;
      
      switch (sound.waveform) {
        case 'sine':
          sample = Math.sin(2 * Math.PI * freq * time);
          break;
        case 'square':
          sample = Math.sign(Math.sin(2 * Math.PI * freq * time));
          break;
        case 'triangle':
          sample = (2 / Math.PI) * Math.asin(Math.sin(2 * Math.PI * freq * time));
          break;
        case 'sawtooth':
          sample = 2 * (freq * time - Math.floor(freq * time + 0.5));
          break;
      }
      
      // Apply special effects based on sound type
      if (sound.type === 'noise') {
        sample = (Math.random() * 2 - 1) * 0.5 + sample * 0.5;
      } else if (sound.type === 'chord') {
        // Add harmonics
        sample += 0.5 * Math.sin(2 * Math.PI * freq * 1.5 * time); // Fifth
        sample += 0.3 * Math.sin(2 * Math.PI * freq * 2 * time);   // Octave
      } else if (sound.type === 'melody') {
        // Add vibrato
        const vibrato = 1 + 0.1 * Math.sin(2 * Math.PI * 5 * time);
        sample = Math.sin(2 * Math.PI * freq * vibrato * time);
      }
      
      // Apply envelope
      let amplitude = sound.volume;
      const attackTime = envelope.attack;
      const decayTime = envelope.attack + envelope.decay;
      const releaseStart = 1 - envelope.release;
      
      if (progress < attackTime / sound.duration) {
        amplitude *= progress / (attackTime / sound.duration);
      } else if (progress < decayTime / sound.duration) {
        const decayProgress = (progress - attackTime / sound.duration) / (envelope.decay / sound.duration);
        amplitude *= envelope.sustain + (1 - envelope.sustain) * (1 - decayProgress);
      } else if (progress > releaseStart) {
        const releaseProgress = (progress - releaseStart) / (envelope.release);
        amplitude *= envelope.sustain * (1 - releaseProgress);
      } else {
        amplitude *= envelope.sustain;
      }
      
      data[i] = sample * amplitude * this.masterVolume;
    }
    
    return buffer;
  }
  
  public async playSound(soundId: string, config: Partial<AudioConfig> = {}): Promise<void> {
    if (!this.audioContext || this.audioContext.state === 'suspended') {
      await this.resumeAudioContext();
    }
    
    if (!this.audioContext) return;
    
    const sound = this.soundLibrary.get(soundId);
    if (!sound) {
      console.warn(`Sound not found: ${soundId}`);
      return;
    }
    
    try {
      const buffer = await this.createSyntheticBuffer(sound);
      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();
      
      source.buffer = buffer;
      source.loop = config.loop || false;
      
      // Configure gain
      gainNode.gain.value = config.volume !== undefined ? config.volume : 1.0;
      
      // Connect audio nodes
      source.connect(gainNode);
      gainNode.connect(this.compressor || this.audioContext.destination);
      
      // Start playing
      source.start();
      
      // Store reference for potential cleanup
      this.activeSounds.set(`${soundId}_${Date.now()}`, source);
      
      // Auto-cleanup
      source.onended = () => {
        for (const [key, storedSource] of this.activeSounds.entries()) {
          if (storedSource === source) {
            this.activeSounds.delete(key);
            break;
          }
        }
      };
      
    } catch (error) {
      console.warn(`Failed to play sound ${soundId}:`, error);
    }
  }
  
  public async playMusic(musicId: string, config: Partial<AudioConfig> = {}): Promise<void> {
    // Stop previous music
    this.stopMusic();
    
    // Play new music with loop enabled
    await this.playSound(musicId, { ...config, loop: true });
  }
  
  public stopMusic(): void {
    for (const [key, source] of this.musicLoops.entries()) {
      try {
        source.stop();
      } catch (error) {
        // Source might already be stopped
      }
      this.musicLoops.delete(key);
    }
  }
  
  public setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }
  
  public getMasterVolume(): number {
    return this.masterVolume;
  }
  
  private async resumeAudioContext(): Promise<void> {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }
  
  // 🎮 GAME-SPECIFIC CONVENIENCE METHODS
  
  public playUISound(type: 'click' | 'success' | 'notification' | 'error'): void {
    const soundMap = {
      'click': 'ui_click',
      'success': 'ui_success',
      'notification': 'ui_notification',
      'error': 'ui_notification' // Use notification for error (could create specific error sound)
    };
    
    this.playSound(soundMap[type], { volume: 0.7 });
  }
  
  public playFootstepSound(surface: 'grass' | 'stone' | 'water' | 'metal'): void {
    // Modify footstep sound based on surface
    const soundId = 'player_footstep';
    const configs = {
      'grass': { volume: 0.4, pitch: 1.0 },
      'stone': { volume: 0.6, pitch: 1.2 },
      'water': { volume: 0.3, pitch: 0.8 },
      'metal': { volume: 0.7, pitch: 1.5 }
    };
    
    this.playSound(soundId, configs[surface]);
  }
  
  public playWeatherSound(type: 'wind' | 'rain' | 'thunder', intensity: number = 1.0): void {
    const soundId = `weather_${type}`;
    this.playSound(soundId, { 
      volume: intensity * 0.5,
      loop: type !== 'thunder' // Thunder doesn't loop, wind and rain do
    });
  }
  
  public playItemSound(type: 'pickup' | 'drop' | 'use' | 'equip'): void {
    const soundMap = {
      'pickup': 'item_pickup',
      'drop': 'coin_drop',
      'use': 'ui_success',
      'equip': 'ui_click'
    };
    
    this.playSound(soundMap[type], { volume: 0.5 });
  }
  
  public playCombatSound(type: 'sword' | 'magic' | 'hit' | 'block'): void {
    const soundMap = {
      'sword': 'combat_sword',
      'magic': 'magic_cast',
      'hit': 'combat_sword', // Could create separate hit sound
      'block': 'ui_click'     // Could create separate block sound
    };
    
    this.playSound(soundMap[type], { volume: 0.6 });
  }
  
  // 🌟 AUDIO SYSTEM STATUS
  
  public getAudioStatus(): {
    initialized: boolean;
    activeSounds: number;
    musicPlaying: boolean;
    masterVolume: number;
    soundLibrarySize: number;
  } {
    return {
      initialized: !!this.audioContext,
      activeSounds: this.activeSounds.size,
      musicPlaying: this.musicLoops.size > 0,
      masterVolume: this.masterVolume,
      soundLibrarySize: this.soundLibrary.size
    };
  }
  
  public listAvailableSounds(): string[] {
    return Array.from(this.soundLibrary.keys());
  }
  
  public stopAllSounds(): void {
    // Stop all active sounds
    for (const [key, source] of this.activeSounds.entries()) {
      try {
        source.stop();
      } catch (error) {
        // Source might already be stopped
      }
    }
    this.activeSounds.clear();
    
    // Stop music
    this.stopMusic();
  }
}

// 🌟 GLOBAL PLACEHOLDER AUDIO SYSTEM INSTANCE
export const placeholderAudioSystem = new PlaceholderAudioSystem();

// 🎵 CONVENIENCE FUNCTIONS
export function playSound(soundId: string, config?: Partial<AudioConfig>): void {
  placeholderAudioSystem.playSound(soundId, config);
}

export function playUISound(type: 'click' | 'success' | 'notification' | 'error'): void {
  placeholderAudioSystem.playUISound(type);
}

export function playMusic(musicId: string, config?: Partial<AudioConfig>): void {
  placeholderAudioSystem.playMusic(musicId, config);
}

export function setMasterVolume(volume: number): void {
  placeholderAudioSystem.setMasterVolume(volume);
}