# UHO: Fate of Grid - Advanced Audio System

This directory contains all audio assets for the game's advanced audio system.

## Directory Structure

```
assets/audio/
├── music/           # Background music tracks
├── ambient/         # Ambient environmental loops
├── sfx/            # Sound effects
├── weather/        # Weather-related audio
├── ui/             # User interface sounds
└── voice/          # Voice acting (future)
```

## Audio Requirements

All audio files should be in OGG Vorbis format for optimal web compatibility and compression.

### Music (assets/audio/music/)
- `city_ambience.ogg` - Urban atmospheric theme with distant traffic
- `industrial_dark.ogg` - Dark industrial theme with machinery sounds  
- `suburban_melancholy.ogg` - Melancholic suburban atmosphere
- `underground_tension.ogg` - Tense underground atmosphere
- `main_menu.ogg` - Main menu atmospheric music

### Ambient Sounds (assets/audio/ambient/)
- `city_traffic.ogg` - Distant city traffic and vehicles
- `distant_crowd.ogg` - Muffled distant voices and crowd murmur
- `urban_electrical.ogg` - Urban electrical hum and HVAC systems
- `factory_machines.ogg` - Industrial machinery and conveyor belts
- `metal_work.ogg` - Random metal clanking and industrial work
- `steam_release.ogg` - Steam vents and pressure release
- `suburban_dogs.ogg` - Occasional distant dog barking
- `tv_muffle.ogg` - Muffled television sounds through walls
- `suburban_wind.ogg` - Quiet suburban atmosphere with wind
- `cave_drips.ogg` - Water dripping in underground spaces
- `distant_steps.ogg` - Echoing footsteps in tunnels
- `underground_wind.ogg` - Wind moving through underground tunnels

### Weather Sounds (assets/audio/weather/)
- `rain_light.ogg` - Light rain on various surfaces
- `rain_heavy.ogg` - Heavy rainfall
- `rain_metal.ogg` - Rain hitting metal roofs and surfaces
- `wind_light.ogg` - Gentle wind through urban environment
- `wind_strong.ogg` - Strong wind with debris
- `wind_howl.ogg` - Howling wind through buildings
- `thunder_far.ogg` - Distant thunder rumble
- `thunder_close.ogg` - Close thunder crack
- `thunder_crack.ogg` - Sharp thunder crack

### Sound Effects (assets/audio/sfx/)
- `door_creak.ogg` - Door opening with creak
- `door_slam.ogg` - Door closing/slamming
- `item_pickup.ogg` - Item pickup sound
- `item_drop.ogg` - Item drop sound
- `money_transaction.ogg` - Money transaction sound
- `alert_notification.ogg` - Alert notification sound
- `siren_distant.ogg` - Distant police siren

### UI Sounds (assets/audio/ui/)
- `button_click.ogg` - UI button click
- `button_hover.ogg` - UI button hover
- `error_beep.ogg` - UI error sound
- `success_chime.ogg` - UI success sound
- `notification_pop.ogg` - UI notification sound

## Audio Features

### 1. Spatial Audio System
- 3D positional audio with distance falloff
- Stereo panning based on position
- Dynamic listener position updates

### 2. Audio Zones
- **City Center**: Urban traffic, distant voices, city hum
- **Industrial District**: Machinery, metal clanking, steam vents
- **Residential Area**: Dogs barking, TV sounds, suburban quiet
- **Underground**: Dripping water, echo footsteps, tunnel wind

### 3. Dynamic Weather System
- Real-time weather intensity changes
- Rain, wind, and thunder effects
- Surface-dependent audio reactions

### 4. Procedural Sound Generation
- Surface-aware footstep synthesis (concrete, grass, metal, water)
- Dynamic UI sound generation
- Real-time audio effects processing

### 5. Advanced Audio Processing
- Reverb system with zone-specific settings
- Dynamic compression and filtering
- Crossfading music system
- Volume mixing for different categories

## Audio Implementation

The audio system uses:
- **Tone.js** for procedural sound generation and effects
- **Howler.js** for audio file playback and 3D positioning
- **Web Audio API** for real-time processing

### Usage Example

```typescript
import { advancedAudioEngine } from '@core/advanced-audio.ts';
import { audioAssetRegistry } from '@core/audio-assets.ts';

// Initialize audio system
await audioAssetRegistry.initialize();

// Play music with mood setting
advancedAudioEngine.playMusic('city_theme', { 
  mood: 'exploration', 
  fadeTime: 3000 
});

// Set listener position for spatial audio
advancedAudioEngine.setListenerPosition({ x: 10, y: 20 });

// Play spatial sound effect
advancedAudioEngine.playSpatialSound('door_open', { x: 15, y: 20 }, {
  volume: 0.8,
  maxDistance: 50
});

// Set weather intensity
advancedAudioEngine.setWeatherIntensity('rain', 0.7);

// Generate procedural footstep
advancedAudioEngine.createFootstepSound('concrete');
```

## Performance Notes

- Audio assets are loaded asynchronously in batches
- Essential sounds (UI, basic SFX) are loaded first
- Spatial audio uses optimized distance calculations
- Weather audio is managed with intensity-based switching
- All audio processing is performed on separate audio thread

## Debug Console Commands

When running in development mode:

```javascript
// Access audio systems in browser console
window.advancedAudio      // Advanced audio engine
window.audioAssets        // Audio asset registry

// Example debug commands
advancedAudio.setVolume('master', 0.5);
audioAssets.getLoadingProgress();
advancedAudio.setWeatherIntensity('rain', 0.8);
```

## Audio Creation Guidelines

### For Music Tracks:
- 44.1kHz sample rate
- Stereo, OGG Vorbis quality 6-8
- Seamless loops for ambient tracks
- 2-4 minute loop lengths for variety

### For Ambient Sounds:
- Mono or stereo depending on source
- Lower quality (OGG Vorbis quality 4-6) for file size
- Perfect loops essential
- Layer multiple sounds for richness

### For SFX:
- Short duration (0.1-2 seconds)
- Higher quality for impact sounds
- Normalize volume levels
- Multiple variations for repeated sounds

### For Weather:
- Seamless loops for rain/wind
- One-shot samples for thunder
- Dynamic range for intensity scaling
- Stereo imaging for immersion