import { IntegratedGame } from './game-integrated.ts';

// Initialize the integrated game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('Initializing UHO: Fate of the Grid with integrated systems...');
  
  const game = new IntegratedGame();
  game.start();
  
  // Expose game instance for debugging
  (window as any).integratedGame = game;
  
  console.log('Game initialized successfully!');
  console.log('To test the new features:');
  console.log('1. Connect an Xbox controller for gamepad support');
  console.log('2. Use keyboard/mouse or gamepad to navigate menus');
  console.log('3. Try the character creation system');
  console.log('4. Configure settings including control remapping');
  console.log('5. Experience seamless transitions between all scenes');
});