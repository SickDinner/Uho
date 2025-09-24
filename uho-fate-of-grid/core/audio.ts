export interface SoundDefinition {
  id: string;
  src: string;
  volume: number;
  loop: boolean;
  preload: boolean;
}

export class AudioManager {
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private masterVolume = 1.0;
  private sfxVolume = 0.7;
  private musicVolume = 0.5;
  private muted = false;

  constructor() {
    // Check for audio context support
    this.initializeAudioContext();
  }

  private initializeAudioContext(): void {
    // Modern browsers require user interaction before playing audio
    document.addEventListener('click', () => {
      this.resumeAudioContext();
    }, { once: true });
    
    document.addEventListener('keydown', () => {
      this.resumeAudioContext();
    }, { once: true });
  }

  private resumeAudioContext(): void {
    // Resume any suspended audio contexts
    if (window.AudioContext) {
      const audioContext = new AudioContext();
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
    }
  }

  async loadSound(definition: SoundDefinition): Promise<void> {
    if (this.sounds.has(definition.id)) {
      return; // Already loaded
    }

    return new Promise((resolve, reject) => {
      const audio = new Audio();
      audio.preload = definition.preload ? 'auto' : 'metadata';
      audio.volume = definition.volume * this.sfxVolume * this.masterVolume;
      audio.loop = definition.loop;

      audio.oncanplaythrough = () => {
        this.sounds.set(definition.id, audio);
        resolve();
      };

      audio.onerror = () => {
        console.warn(`Failed to load sound: ${definition.id} from ${definition.src}`);
        resolve(); // Don't reject, just continue without the sound
      };

      audio.src = definition.src;
    });
  }

  async loadSounds(definitions: SoundDefinition[]): Promise<void> {
    const promises = definitions.map(def => this.loadSound(def));
    await Promise.all(promises);
  }

  playSound(soundId: string, volume: number = 1.0): void {
    if (this.muted) return;

    const sound = this.sounds.get(soundId);
    if (!sound) {
      console.warn(`Sound not found: ${soundId}`);
      return;
    }

    try {
      // Clone the audio element to allow overlapping plays
      const audioClone = sound.cloneNode() as HTMLAudioElement;
      audioClone.volume = volume * this.sfxVolume * this.masterVolume;
      audioClone.play().catch(error => {
        console.warn(`Failed to play sound ${soundId}:`, error);
      });
    } catch (error) {
      console.warn(`Error playing sound ${soundId}:`, error);
    }
  }

  stopSound(soundId: string): void {
    const sound = this.sounds.get(soundId);
    if (sound) {
      sound.pause();
      sound.currentTime = 0;
    }
  }

  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    this.updateAllVolumes();
  }

  setSfxVolume(volume: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    this.updateAllVolumes();
  }

  setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    this.updateAllVolumes();
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (muted) {
      this.sounds.forEach(sound => {
        if (!sound.paused) {
          sound.pause();
        }
      });
    }
  }

  private updateAllVolumes(): void {
    this.sounds.forEach(sound => {
      sound.volume = this.sfxVolume * this.masterVolume;
    });
  }

  // Create simple procedural sounds using Web Audio API
  createFootstepSound(): void {
    if (this.muted) return;

    try {
      const audioContext = new AudioContext();
      
      // Create a short noise burst for footstep
      const duration = 0.1;
      const sampleRate = audioContext.sampleRate;
      const frameCount = duration * sampleRate;
      
      const audioBuffer = audioContext.createBuffer(1, frameCount, sampleRate);
      const channelData = audioBuffer.getChannelData(0);
      
      // Generate filtered noise
      for (let i = 0; i < frameCount; i++) {
        const t = i / frameCount;
        const envelope = Math.exp(-t * 8); // Quick decay
        channelData[i] = (Math.random() * 2 - 1) * envelope * 0.1;
      }
      
      // Create and play the sound
      const source = audioContext.createBufferSource();
      const gainNode = audioContext.createGain();
      
      source.buffer = audioBuffer;
      gainNode.gain.value = this.sfxVolume * this.masterVolume;
      
      source.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      source.start();
    } catch (error) {
      // Fallback: silent operation if Web Audio API fails
      console.warn('Web Audio API not available for procedural sounds');
    }
  }
}

// Global audio manager instance
export const audioManager = new AudioManager();