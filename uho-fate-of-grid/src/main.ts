import { IntegratedGame } from './game-integrated.ts';

// Initialize the integrated game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('🎮 Initializing UHO: Fate of the Grid with integrated systems...');
  
  const game = new IntegratedGame();
  game.start();
  
  // Expose game instance for debugging
  (window as any).game = game;
  (window as any).integratedGame = game;
  
  // Add helpful console commands for the integrated game
  (window as any).getCurrentScene = () => game.getCurrentScene()?.name;
  (window as any).getCamera = () => game.getGameplayCamera();
  (window as any).inputManager = (window as any).inputManager; // Already exposed by IntegratedGame
  (window as any).sceneManager = (window as any).sceneManager; // Already exposed by IntegratedGame
  
  console.log('✅ Game initialized successfully!');
  console.log('🎯 New Features Available:');
  console.log('1. 🎮 Connect an Xbox controller for gamepad support with haptic feedback');
  console.log('2. 🖱️ Use keyboard/mouse or gamepad to navigate menus');
  console.log('3. 👤 Try the character creation system with 6 unique backgrounds');
  console.log('4. ⚙️ Configure settings including complete control remapping');
  console.log('5. 🎭 Experience seamless transitions between all scenes');
  console.log('');
  console.log('🔧 Console commands:');
  console.log('- getCurrentScene() - Get current scene ID');
  console.log('- getCamera() - Get gameplay camera (when in game)');
  console.log('- inputManager - Access input system');
  console.log('- sceneManager - Access scene management');
  console.log('');
  console.log('🎲 Have fun playing!');
});
