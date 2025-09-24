# UHO: Fate of the Grid - Modular Architecture with Smooth Scrolling

## Overview

The game has been completely refactored into a modular architecture with smooth scrolling camera, layer-based rendering, and scene management systems.

## New Features

### 🎥 Camera System (`core/camera.ts`)
- **Smooth following**: Camera smoothly follows the player with configurable smoothing
- **Dead zones**: Player can move within a defined area before camera starts following  
- **Multiple modes**: `follow`, `smooth_follow`, `fixed`, `locked`
- **Zoom support**: Smooth zoom transitions with mouse wheel or keyboard
- **Screen shake**: Dynamic screen shake effects for impacts, explosions, etc.
- **Viewport culling**: Only renders what's visible on screen for better performance

### 🎨 Render System (`core/renderer.ts`) 
- **Layer-based rendering**: Background, terrain, buildings, NPCs, player, effects, UI
- **Viewport culling**: Only renders tiles and entities visible on screen
- **Layer opacity control**: Fade layers in/out independently
- **Debug mode**: Press `\` to show camera info overlay
- **Fallback rendering**: Graceful fallback when sprites aren't available

### 🎬 Scene Management (`core/scene.ts`)
- **Scene transitions**: Fade, slide, scale, wipe transitions between screens
- **Scene stacking**: Overlay scenes (menus, dialogs) on top of game
- **Smooth animations**: All transitions use easing functions
- **Input handling**: Scenes can consume or pass-through input

### ⚡ Animation System (`core/animation.ts`)
- **Easing functions**: Linear, quadratic, cubic, elastic, bounce, etc.
- **Tween manager**: Global animation management
- **Utility functions**: Fade, scale, pulse, shake, slide animations
- **Sequence/parallel**: Chain animations or run them simultaneously

## Controls

### Basic Movement
- **WASD / Arrow Keys**: Move player
- **E**: Interact with environment
- **F**: Talk to NPCs
- **I**: Show inventory
- **T**: Rest
- **R**: Buy food (at shops)
- **J**: Buy drink (at shops)

### Camera Controls (Debug/Testing)
- **1**: Zoom out (0.5x)
- **2**: Normal zoom (1x) 
- **3**: Zoom in (2x)
- **C**: Toggle camera mode (smooth_follow ↔ follow)
- **\\**: Show debug info overlay

### Animation Testing (Console)
From browser console, you can test various effects:

```javascript
// Camera shake
game.shakeScreen(20, 1000);

// Zoom animation
game.zoomTo(2, 1500);

// Layer fade effects  
game.fadeCamera(2000);

// Scene transitions
sceneManager.fadeToScene('game', 500);
sceneManager.slideToScene('game', 'left', 800);
sceneManager.scaleToScene('game', 600);

// Manual camera control
camera.shake(15, 500);
camera.setZoom(1.5);
camera.setMode('follow');
```

## Architecture

### Modular Systems
1. **ECS (Entity Component System)**: Core game logic
2. **Camera**: Viewport and scrolling management  
3. **Renderer**: Layer-based rendering with culling
4. **Scene Manager**: Screen transitions and state management
5. **Animation**: Smooth tweening and effects
6. **Audio**: Sound effects and music
7. **Particles**: Visual effects system

### Performance Optimizations
- **Viewport culling**: Only render visible tiles (2-tile margin)
- **Entity culling**: Only process entities near camera
- **Layer rendering**: Separate rendering passes for optimization
- **Smooth interpolation**: 60fps smooth movement between discrete grid positions

### Game Flow
```
Game Class
├── Creates GameScene
├── Sets up SceneManager  
├── Handles global input
└── Runs main game loop

GameScene
├── Contains World (ECS)
├── Camera system
├── RenderSystem  
├── NPCManager
└── Game logic

RenderSystem  
├── Layer-based rendering
├── Camera transforms
├── Viewport culling
└── Sprite/fallback rendering
```

## Visual Effects

### Movement
- **Smooth interpolation**: Player moves smoothly between grid positions
- **Camera following**: Camera smoothly follows with dead zone
- **Footstep particles**: Dust clouds on movement
- **Subtle screen shake**: 1px shake on each step

### Interactions
- **Purchase effects**: Player pulses when buying items
- **Healing effects**: Larger pulse + small shake at hospital
- **Low money shake**: Screen shake when can't afford items
- **Critical needs shake**: Screen shake for hunger/thirst warnings

### Atmospheric
- **Entry effect**: Screen shake when entering game
- **Police encounters**: Strong screen shake when spotted
- **Smooth zoom**: Zoom transitions for dramatic effect

## File Structure
```
core/
├── camera.ts      # Camera system with smooth scrolling
├── renderer.ts    # Layer-based rendering system  
├── scene.ts       # Scene management and transitions
├── animation.ts   # Tweening and easing system
├── ecs.ts         # Entity Component System
├── components.ts  # Game components
├── map.ts         # Map and tile management
├── npc.ts         # NPC behavior and AI
└── ...

src/
├── game.ts        # Main game class (refactored)
└── main.ts        # Entry point

assets/
└── sprites/       # Sprite sheets and images
```

## Development

The modular architecture makes it easy to:

1. **Add new scenes**: Extend Scene class for menus, shops, etc.
2. **Create animations**: Use AnimationUtils or create custom tweens
3. **Add rendering layers**: Register new layers in RenderSystem
4. **Extend camera**: Add new camera modes or effects
5. **Debug visually**: Built-in debug overlays and console access

Try the game and experiment with the camera controls and debug commands to see the smooth scrolling in action!