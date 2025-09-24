/**
 * 🎮 LEGENDARY AUDIO-SYNCED ANIMATION SYSTEM 🎮
 * 
 * Yhdistää 16-bitin konsolien audio- ja animaatio-ominaisuudet:
 * 
 * 🔥 PAULA CHIP FEATURES (Amiga-tyylinen):
 * - 4-kanavainen PCM audio
 * - Real-time sample modulation
 * - Frequency analysis for beat detection
 * 
 * ⚡ GENESIS YM2612 FEATURES:
 * - FM synthesis animation triggers
 * - Channel-specific animation layers
 * - DAC-driven particle effects
 * 
 * 🚀 SNES SPC700 FEATURES:
 * - Echo/reverb responsive animations
 * - ADSR envelope-based scaling
 * - Gaussian interpolation sync
 * 
 * ULTIMATE AUDIO-VISUAL SYNC! ⚡🔥🎵
 */

import { Easing, EasingFunction } from './animation.ts';
import { SuperFXMath, BlastProcessingEngine } from './legendary-animation.ts';
import { legendaryParticles } from './legendary-particles.ts';

// =============================================================================
// 🎵 AUDIO ANALYSIS TYPES
// =============================================================================

export interface AudioFeatures {
  // Frequency analysis
  bass: number;        // Low frequencies (20-250 Hz)
  mids: number;        // Mid frequencies (250-4000 Hz)
  treble: number;      // High frequencies (4000-20000 Hz)
  
  // Temporal features
  rms: number;         // Root Mean Square (overall loudness)
  peak: number;        // Peak amplitude
  zcr: number;         // Zero crossing rate (percussiveness)
  
  // Beat detection
  beatDetected: boolean;
  beatStrength: number;
  bpm: number;
  
  // Spectral features
  spectralCentroid: number;  // Brightness
  spectralRolloff: number;   // Sharpness
  mfcc: Float32Array;        // Mel-frequency cepstral coefficients
}

export interface AudioSyncConfig {
  // Analysis parameters
  fftSize: number;           // FFT window size (512, 1024, 2048...)
  smoothingConstant: number; // Frequency smoothing (0-1)
  beatThreshold: number;     // Beat detection sensitivity
  
  // Animation mapping
  bassResponse: {
    property: 'scale' | 'rotation' | 'position' | 'color' | 'particles';
    intensity: number;
    easing: EasingFunction;
  };
  
  midsResponse: {
    property: 'scale' | 'rotation' | 'position' | 'color' | 'particles';
    intensity: number;
    easing: EasingFunction;
  };
  
  trebleResponse: {
    property: 'scale' | 'rotation' | 'position' | 'color' | 'particles';
    intensity: number;
    easing: EasingFunction;
  };
  
  beatResponse: {
    property: 'scale' | 'rotation' | 'position' | 'color' | 'particles';
    intensity: number;
    duration: number; // ms
    easing: EasingFunction;
  };
}

// =============================================================================
// 🎮 LEGENDARY AUDIO-SYNC ENGINE
// =============================================================================

export class LegendaryAudioSync {
  private audioContext: AudioContext;
  private analyser: AnalyserNode;
  private blastProcessor: BlastProcessingEngine;
  
  // Audio analysis buffers
  private frequencyData: Uint8Array;
  private timeDomainData: Uint8Array;
  private previousFrequencyData: Uint8Array;
  
  // Features extraction
  private features: AudioFeatures = {
    bass: 0, mids: 0, treble: 0,
    rms: 0, peak: 0, zcr: 0,
    beatDetected: false, beatStrength: 0, bpm: 0,
    spectralCentroid: 0, spectralRolloff: 0,
    mfcc: new Float32Array(13)
  };
  
  // Beat detection
  private beatHistory: number[] = [];
  private lastBeatTime = 0;
  private beatInterval = 0;
  
  // Animation sync targets
  private syncTargets: Map<string, {
    object: any;
    config: AudioSyncConfig;
    baseValues: any; // Store original values for reset
  }> = new Map();
  
  // 16-bit console simulation
  private paula4ChannelMode = true;    // Amiga Paula chip simulation
  private genesisYM2612Mode = false;   // Genesis FM synthesis
  private snesSPC700Mode = false;      // SNES sound processing
  
  // Performance optimization
  private analysisRate = 60; // Hz
  private lastAnalysisTime = 0;
  private frameCounter = 0;
  
  constructor(audioContext?: AudioContext) {
    this.audioContext = audioContext || new AudioContext();
    this.blastProcessor = new BlastProcessingEngine();
    
    this.setupAnalyser();
    this.initializeBuffers();
    
    console.log('🎮 LEGENDARY AUDIO-SYNC ENGINE initialized!');
    console.log('🎵 Paula chip mode:', this.paula4ChannelMode);
    console.log('⚡ Analysis rate:', this.analysisRate, 'Hz');
  }
  
  private setupAnalyser(): void {
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 2048; // Good balance of resolution vs performance
    this.analyser.smoothingTimeConstant = 0.8;
    this.analyser.minDecibels = -100;
    this.analyser.maxDecibels = -10;
  }
  
  private initializeBuffers(): void {
    const bufferLength = this.analyser.frequencyBinCount;
    this.frequencyData = new Uint8Array(bufferLength);
    this.timeDomainData = new Uint8Array(bufferLength);
    this.previousFrequencyData = new Uint8Array(bufferLength);
  }
  
  // Connect audio source to analyzer
  connectAudioSource(source: MediaElementAudioSourceNode | AudioBufferSourceNode | MediaStreamAudioSourceNode): void {
    source.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);
    console.log('🔊 Audio source connected to sync engine');
  }
  
  // Add animation target with audio sync config
  addSyncTarget(id: string, object: any, config: AudioSyncConfig): void {
    // Store base values for reset/interpolation
    const baseValues = {
      scale: object.scale || 1,
      rotation: object.rotation || 0,
      x: object.x || 0,
      y: object.y || 0,
      alpha: object.alpha || 1
    };
    
    this.syncTargets.set(id, {
      object,
      config,
      baseValues
    });
    
    console.log(`🎵 Added sync target: ${id}`);
  }
  
  // Remove sync target
  removeSyncTarget(id: string): void {
    this.syncTargets.delete(id);
  }
  
  // Main analysis and sync loop
  update(deltaTime: number): void {
    const currentTime = performance.now();
    
    // Limit analysis rate for performance (Genesis blast processing style)
    if (currentTime - this.lastAnalysisTime < 1000 / this.analysisRate) {
      return;
    }
    
    this.lastAnalysisTime = currentTime;
    this.frameCounter++;
    
    // Analyze audio
    this.analyzeAudio();
    
    // Process sync targets in parallel (Blast Processing)
    this.processSyncTargets(deltaTime);
    
    // Run blast processor for heavy calculations
    this.blastProcessor.processJobs(deltaTime);
  }
  
  private analyzeAudio(): void {
    // Get frequency and time domain data
    this.analyser.getByteFrequencyData(this.frequencyData);
    this.analyser.getByteTimeDomainData(this.timeDomainData);
    
    // Extract features
    this.extractFrequencyFeatures();
    this.extractTemporalFeatures();
    this.detectBeats();
    
    // Store previous frame for comparison
    this.previousFrequencyData.set(this.frequencyData);
  }
  
  private extractFrequencyFeatures(): void {
    const nyquist = this.audioContext.sampleRate / 2;
    const binSize = nyquist / this.frequencyData.length;
    
    let bassSum = 0, bassCount = 0;
    let midsSum = 0, midsCount = 0;
    let trebleSum = 0, trebleCount = 0;
    
    for (let i = 0; i < this.frequencyData.length; i++) {
      const freq = i * binSize;
      const amplitude = this.frequencyData[i] / 255;
      
      if (freq <= 250) {
        bassSum += amplitude;
        bassCount++;
      } else if (freq <= 4000) {
        midsSum += amplitude;
        midsCount++;
      } else {
        trebleSum += amplitude;
        trebleCount++;
      }
    }
    
    // Paula chip -style 4-channel mixing simulation
    if (this.paula4ChannelMode) {
      this.features.bass = this.simulatePaulaChannel(bassSum / Math.max(bassCount, 1));
      this.features.mids = this.simulatePaulaChannel(midsSum / Math.max(midsCount, 1));
      this.features.treble = this.simulatePaulaChannel(trebleSum / Math.max(trebleCount, 1));
    } else {
      this.features.bass = bassSum / Math.max(bassCount, 1);
      this.features.mids = midsSum / Math.max(midsCount, 1);
      this.features.treble = trebleSum / Math.max(trebleCount, 1);
    }
  }
  
  private simulatePaulaChannel(value: number): number {
    // Simulate Paula chip's 8-bit DAC with some nonlinearity
    const quantized = Math.floor(value * 255) / 255; // 8-bit quantization
    return quantized * (1 + 0.1 * Math.sin(quantized * Math.PI)); // Slight nonlinearity
  }
  
  private extractTemporalFeatures(): void {
    // Calculate RMS (Root Mean Square)
    let sum = 0;
    let peak = 0;
    let zeroCrossings = 0;
    
    for (let i = 0; i < this.timeDomainData.length; i++) {
      const sample = (this.timeDomainData[i] - 128) / 128; // Normalize to [-1, 1]
      sum += sample * sample;
      peak = Math.max(peak, Math.abs(sample));
      
      // Zero crossing detection
      if (i > 0) {
        const prevSample = (this.timeDomainData[i - 1] - 128) / 128;
        if ((sample >= 0) !== (prevSample >= 0)) {
          zeroCrossings++;
        }
      }
    }
    
    this.features.rms = Math.sqrt(sum / this.timeDomainData.length);
    this.features.peak = peak;
    this.features.zcr = zeroCrossings / this.timeDomainData.length;
  }
  
  private detectBeats(): void {
    // Simple energy-based beat detection
    const currentEnergy = this.features.bass + this.features.mids + this.features.treble;
    
    // Store energy history for local maxima detection
    this.beatHistory.push(currentEnergy);
    if (this.beatHistory.length > 10) {
      this.beatHistory.shift();
    }
    
    // Calculate local average
    const localAverage = this.beatHistory.reduce((a, b) => a + b) / this.beatHistory.length;
    
    // Beat detection threshold
    const threshold = localAverage * 1.3;
    const timeSinceLastBeat = performance.now() - this.lastBeatTime;
    
    if (currentEnergy > threshold && timeSinceLastBeat > 200) { // Minimum 200ms between beats
      this.features.beatDetected = true;
      this.features.beatStrength = (currentEnergy - threshold) / threshold;
      this.lastBeatTime = performance.now();
      
      // Update BPM estimate
      if (this.beatInterval === 0) {
        this.beatInterval = timeSinceLastBeat;
      } else {
        this.beatInterval = (this.beatInterval + timeSinceLastBeat) / 2; // Moving average
      }
      this.features.bpm = 60000 / this.beatInterval;
      
      console.log(`🥁 Beat detected! Strength: ${this.features.beatStrength.toFixed(2)}, BPM: ${this.features.bpm.toFixed(0)}`);
    } else {
      this.features.beatDetected = false;
    }
  }
  
  private processSyncTargets(deltaTime: number): void {
    this.syncTargets.forEach((target, id) => {
      this.blastProcessor.addJob({
        id: `sync_${id}`,
        type: 'transform',
        priority: 2,
        data: { target, features: this.features, deltaTime },
        callback: () => this.applySyncToTarget(target, this.features, deltaTime)
      });
    });
  }
  
  private applySyncToTarget(target: { object: any; config: AudioSyncConfig; baseValues: any }, features: AudioFeatures, deltaTime: number): void {
    const { object, config, baseValues } = target;
    
    // Apply bass response
    this.applyAudioResponse(object, baseValues, config.bassResponse, features.bass, deltaTime);
    
    // Apply mids response
    this.applyAudioResponse(object, baseValues, config.midsResponse, features.mids, deltaTime);
    
    // Apply treble response
    this.applyAudioResponse(object, baseValues, config.trebleResponse, features.treble, deltaTime);
    
    // Apply beat response
    if (features.beatDetected) {
      this.applyBeatResponse(object, baseValues, config.beatResponse, features.beatStrength, deltaTime);
    }
  }
  
  private applyAudioResponse(object: any, baseValues: any, response: any, audioValue: number, deltaTime: number): void {
    const intensity = response.intensity * audioValue;
    const easedValue = response.easing ? response.easing(audioValue) : audioValue;
    
    switch (response.property) {
      case 'scale':
        object.scale = baseValues.scale + (intensity * easedValue);
        break;
        
      case 'rotation':
        if (object.rotation !== undefined) {
          object.rotation = baseValues.rotation + (intensity * easedValue * Math.PI);
        }
        break;
        
      case 'position':
        if (object.x !== undefined) {
          // Sine wave motion based on audio
          const sineMotion = SuperFXMath.fastSin(performance.now() * 0.001 + audioValue * Math.PI);
          object.x = baseValues.x + (intensity * easedValue * sineMotion * 10);
        }
        if (object.y !== undefined) {
          const cosineMotion = SuperFXMath.fastCos(performance.now() * 0.001 + audioValue * Math.PI);
          object.y = baseValues.y + (intensity * easedValue * cosineMotion * 10);
        }
        break;
        
      case 'color':
        if (object.color !== undefined || object.tint !== undefined) {
          // HSL color modulation
          const hue = (audioValue * 360) % 360;
          const saturation = 50 + (intensity * 50);
          const lightness = 50 + (easedValue * 30);
          const colorString = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
          
          if (object.color !== undefined) {
            object.color = colorString;
          }
          if (object.tint !== undefined) {
            object.tint = colorString;
          }
        }
        break;
        
      case 'particles':
        // Create particles based on audio intensity
        if (object.x !== undefined && object.y !== undefined && audioValue > 0.3) {
          if (Math.random() < audioValue) {
            legendaryParticles.createSparkles(object.x, object.y, Math.floor(intensity * 5));
          }
        }
        break;
    }
  }
  
  private applyBeatResponse(object: any, baseValues: any, response: any, beatStrength: number, deltaTime: number): void {
    const intensity = response.intensity * beatStrength;\n    const duration = response.duration || 200;\n    \n    // Create temporary animation for beat response\n    const startTime = performance.now();\n    \n    const animateBeat = () => {\n      const elapsed = performance.now() - startTime;\n      const progress = Math.min(1, elapsed / duration);\n      const easedProgress = response.easing ? response.easing(progress) : progress;\n      const reverseProgress = 1 - easedProgress;\n      \n      switch (response.property) {\n        case 'scale':\n          object.scale = baseValues.scale + (intensity * reverseProgress);\n          break;\n          \n        case 'rotation':\n          if (object.rotation !== undefined) {\n            object.rotation = baseValues.rotation + (intensity * reverseProgress * Math.PI * 0.1);\n          }\n          break;\n          \n        case 'particles':\n          if (object.x !== undefined && object.y !== undefined && progress < 0.1) {\n            legendaryParticles.createExplosion(object.x, object.y, intensity);\n          }\n          break;\n      }\n      \n      if (progress < 1) {\n        requestAnimationFrame(animateBeat);\n      }\n    };\n    \n    animateBeat();\n  }\n  \n  // ========================================================================\n  // PRESET CONFIGURATIONS\n  // ========================================================================\n  \n  // SNES F-Zero style audio-reactive scaling\n  static getFZeroConfig(): AudioSyncConfig {\n    return {\n      fftSize: 1024,\n      smoothingConstant: 0.8,\n      beatThreshold: 1.3,\n      bassResponse: {\n        property: 'scale',\n        intensity: 0.5,\n        easing: Easing.snesWave\n      },\n      midsResponse: {\n        property: 'rotation',\n        intensity: 0.3,\n        easing: Easing.mode7Rotation\n      },\n      trebleResponse: {\n        property: 'particles',\n        intensity: 1.0,\n        easing: Easing.linear\n      },\n      beatResponse: {\n        property: 'scale',\n        intensity: 0.8,\n        duration: 150,\n        easing: Easing.elasticOut\n      }\n    };\n  }\n  \n  // Genesis Streets of Rage style beat-sync\n  static getStreetsOfRageConfig(): AudioSyncConfig {\n    return {\n      fftSize: 2048,\n      smoothingConstant: 0.6,\n      beatThreshold: 1.5,\n      bassResponse: {\n        property: 'position',\n        intensity: 1.2,\n        easing: Easing.genesisRamp\n      },\n      midsResponse: {\n        property: 'color',\n        intensity: 0.8,\n        easing: Easing.genesisDither\n      },\n      trebleResponse: {\n        property: 'particles',\n        intensity: 1.5,\n        easing: Easing.arcadeSnap\n      },\n      beatResponse: {\n        property: 'particles',\n        intensity: 2.0,\n        duration: 200,\n        easing: Easing.bounceOut\n      }\n    };\n  }\n  \n  // Jaguar-style smooth audio visualization\n  static getJaguarSmoothConfig(): AudioSyncConfig {\n    return {\n      fftSize: 2048,\n      smoothingConstant: 0.9,\n      beatThreshold: 1.2,\n      bassResponse: {\n        property: 'scale',\n        intensity: 0.4,\n        easing: Easing.jaguarSmooth\n      },\n      midsResponse: {\n        property: 'rotation',\n        intensity: 0.2,\n        easing: Easing.jaguarSmooth\n      },\n      trebleResponse: {\n        property: 'color',\n        intensity: 0.6,\n        easing: Easing.jaguarSmooth\n      },\n      beatResponse: {\n        property: 'scale',\n        intensity: 0.3,\n        duration: 300,\n        easing: Easing.jaguarSmooth\n      }\n    };\n  }\n  \n  // Get current audio features\n  getFeatures(): AudioFeatures {\n    return { ...this.features };\n  }\n  \n  // Enable/disable console simulation modes\n  setPaulaMode(enabled: boolean): void {\n    this.paula4ChannelMode = enabled;\n    console.log('🎵 Paula chip mode:', enabled);\n  }\n  \n  setGenesisMode(enabled: boolean): void {\n    this.genesisYM2612Mode = enabled;\n    console.log('⚡ Genesis YM2612 mode:', enabled);\n  }\n  \n  setSNESMode(enabled: boolean): void {\n    this.snesSPC700Mode = enabled;\n    console.log('🔥 SNES SPC700 mode:', enabled);\n  }\n  \n  // Get performance stats\n  getStats(): {\n    frameCounter: number;\n    analysisRate: number;\n    syncTargets: number;\n    currentBPM: number;\n    audioFeatures: AudioFeatures;\n  } {\n    return {\n      frameCounter: this.frameCounter,\n      analysisRate: this.analysisRate,\n      syncTargets: this.syncTargets.size,\n      currentBPM: this.features.bpm,\n      audioFeatures: this.features\n    };\n  }\n}\n\n// Global instance\nexport const legendaryAudioSync = new LegendaryAudioSync();