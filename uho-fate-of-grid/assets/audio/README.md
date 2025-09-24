# UHO: Fate of the Grid - Audio Implementation Guide

This guide explains how audio assets are organized and integrated into the game.

## Directory Structure

```
assets/audio/
├── ambient/        # Looping environmental sounds
├── music/          # Background music tracks
├── sfx/            # Sound effects (one-shot sounds)
├── ui/             # User interface sounds
├── voice/          # Voice acting and dialogue
├── weather/        # Weather-related sounds
└── README.md       # This file
```

## Audio Assets Registry

All audio assets are centrally managed through `core/audio-assets.ts`. This system:

- 🎵 **Manages Loading**: Handles preloading and on-demand loading
- 🔊 **Controls Playback**: Integration with the advanced audio engine
- ⚙️ **Configures Settings**: Volume, looping, spatial audio
- 📊 **Tracks Progress**: Loading progress and asset status

## Integration Examples

### In game-integrated.ts

```typescript
// Starting dynamic audio when entering gameplay
private startDynamicAudio(): void {
  // Background music with mood system
  advancedAudioEngine.playMusic('city_theme', { 
    mood: 'exploration', 
    fadeTime: 3000 
  });
  
  // Layered ambient sounds for realism
  advancedAudioEngine.playAmbient('city_traffic', 0.4);
  advancedAudioEngine.playAmbient('distant_voices', 0.2);
  advancedAudioEngine.playAmbient('urban_hum', 0.3);
  
  // Dynamic weather
  advancedAudioEngine.setWeatherIntensity('wind', 0.2);
}
```

### Audio Asset Registration

Each audio file is registered with metadata:

```typescript
this.registerAsset({
  id: 'city_theme',                    // Unique identifier
  src: 'assets/audio/music/city_theme.ogg',
  category: 'music',                   // Type classification
  volume: 0.7,                         // Default volume
  loop: true,                          // Looping behavior  
  description: 'Urban atmospheric theme'
});
```

## Asset Categories

### 🎵 Music (`music/`)
- **Purpose**: Background atmospheric tracks
- **Format**: OGG Vorbis (recommended) or MP3
- **Duration**: 2-5 minutes, seamlessly looping
- **Examples**: 
  - `city_theme.ogg` - Urban exploration
  - `character_creation.ogg` - Character creation screen
  - `menu_theme.ogg` - Main menu

### 🌊 Ambient (`ambient/`)
- **Purpose**: Continuous environmental audio
- **Format**: OGG Vorbis, compressed for size
- **Duration**: 30 seconds to 2 minutes, looping
- **Examples**:
  - `city_traffic.ogg` - Distant traffic sounds
  - `urban_hum.ogg` - Electrical/HVAC ambient
  - `machinery.ogg` - Industrial background

### 💥 SFX (`sfx/`)
- **Purpose**: One-shot sound effects
- **Format**: OGG Vorbis or WAV for quality
- **Duration**: 0.1-3 seconds typically
- **Examples**:
  - `door_open.ogg` - Interactive sounds
  - `pickup_item.ogg` - Item interactions
  - `police_siren.ogg` - Event triggers

### 🖱️ UI (`ui/`)
- **Purpose**: User interface feedback
- **Format**: OGG Vorbis, small file size
- **Duration**: Very short (0.1-0.5 seconds)
- **Examples**:
  - `button_click.ogg` - Menu navigation
  - `success_chime.ogg` - Positive feedback
  - `error_beep.ogg` - Error states

### 🌧️ Weather (`weather/`)
- **Purpose**: Dynamic weather system sounds
- **Format**: OGG Vorbis, optimized for looping
- **Duration**: 30 seconds to 1 minute loops
- **Examples**:
  - `rain_light.ogg` - Light precipitation
  - `wind_strong.ogg` - Weather intensity
  - `thunder_crack.ogg` - Storm effects

### 🗣️ Voice (`voice/`)
- **Purpose**: Character dialogue and narration
- **Format**: OGG Vorbis with good quality settings
- **Duration**: Variable based on content
- **Examples**:
  - `npc_greetings/` - NPC dialogue variations
  - `system_announcements/` - Game state notifications

## Technical Requirements

### File Formats
- **Primary**: OGG Vorbis (`.ogg`) - Best compression and browser support
- **Alternative**: MP3 (`.mp3`) - Wider compatibility
- **High Quality**: WAV (`.wav`) - For critical SFX only

### Audio Quality Settings
- **Music**: 128-192 kbps OGG Vorbis
- **Ambient**: 96-128 kbps OGG Vorbis  
- **SFX**: 128-256 kbps (depending on importance)
- **UI**: 64-96 kbps (small, frequent sounds)

### Conversion Commands
```bash
# Convert to OGG Vorbis with good quality
ffmpeg -i input.wav -c:a libvorbis -q:a 4 output.ogg

# Convert with specific bitrate
ffmpeg -i input.wav -c:a libvorbis -b:a 128k output.ogg

# Batch convert all WAV files in directory
for f in *.wav; do ffmpeg -i "$f" -c:a libvorbis -q:a 4 "${f%.wav}.ogg"; done
```

## Audio Source Recommendations

### Free Sources
- **[Kenney.nl](https://kenney.nl/assets?q=audio)** - High-quality game audio packs
- **[Freesound.org](https://freesound.org)** - Community-uploaded sounds (check licenses)
- **[Zapsplat.com](https://zapsplat.com)** - Professional SFX (free account required)
- **[BBC Sound Effects](https://sound-effects.bbcrewind.co.uk/)** - Archive of BBC sounds

### Audio Tools
- **[Audacity](https://audacityteam.org/)** - Free, open-source editor
- **[Reaper](https://reaper.fm/)** - Professional DAW with affordable license
- **[FL Studio](https://flstudio.com/)** - Popular music production software
- **[Logic Pro](https://apple.com/logic-pro/)** - Mac-exclusive professional DAW

## Implementation Checklist

### For New Audio Assets:
- [ ] Convert to OGG Vorbis format
- [ ] Place in appropriate `/assets/audio/` subdirectory  
- [ ] Add entry to `core/audio-assets.ts` registry
- [ ] Set appropriate volume and loop settings
- [ ] Test loading and playback in game
- [ ] Verify performance impact

### For Audio Integration:
- [ ] Use `advancedAudioEngine` for playback
- [ ] Handle loading errors gracefully
- [ ] Implement spatial audio where appropriate
- [ ] Consider dynamic mixing based on game state
- [ ] Test across different browsers/devices

## Performance Considerations

### Loading Strategy
1. **Essential First**: UI sounds load immediately
2. **Atmospheric Second**: Music and ambient for current scene
3. **On-Demand**: Other assets as needed
4. **Background Loading**: Preload next scene's audio

### Memory Management
- Unload unused music tracks when changing scenes
- Keep UI sounds always loaded (small size)
- Cache recently played sounds for performance
- Monitor total memory usage

### Network Optimization
- Compress audio files appropriately
- Use audio sprites for small UI sounds
- Implement progressive loading for large files
- Consider CDN deployment for audio assets

## Debugging

Access the audio registry in browser console:
```javascript
// Check loading progress
window.audioAssets.getLoadingProgress()

// List all registered assets
window.audioAssets.getAssetsByCategory('music')

// Check if specific asset is loaded
window.audioAssets.isAssetLoaded('city_theme')
```

## Future Enhancements

- 🎚️ **Audio Mixer**: Real-time volume controls for categories
- 🔄 **Dynamic Loops**: Seamless transitions between music tracks  
- 📍 **3D Spatial Audio**: Position-based sound in game world
- 🎭 **Emotional Scoring**: Music that adapts to player actions
- 📱 **Adaptive Quality**: Adjust bitrate based on connection
- 🔊 **Audio Occlusion**: Realistic sound blocking by obstacles