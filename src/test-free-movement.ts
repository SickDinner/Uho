// Test entry point specifically for free movement demo
// Run this instead of main.ts to test the new free physics system

import { EnhancedGame } from './enhanced-game.ts';

// Initialize the enhanced game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const game = new EnhancedGame();
  game.start();
  
  // Expose game instance for debugging
  (window as any).game = game;
  (window as any).enhancedGame = game;
  
  // Add helpful console commands
  (window as any).showScaling = () => game.showScalingInfo();
  (window as any).createItem = (type: string, x: number, y: number) => game.createItem(type, x, y);
  (window as any).toggleFreeMovement = () => game.toggleFreeMovement();
  (window as any).getFreeDemo = () => game.getFreeMovementDemo();
  
  console.log('🎮 Enhanced UHO: Fate of the Grid loaded!');
  console.log('🆓 Press F1 to activate Free Movement Demo');
  console.log('Console commands:');
  console.log('- window.game - Access game instance');
  console.log('- showScaling() - Show sprite scaling info');
  console.log('- createItem("needle", 100, 200) - Create physics items');
  console.log('- toggleFreeMovement() - Toggle free movement mode');
  console.log('- getFreeDemo() - Access free movement demo object');
  console.log('');
  console.log('Free Movement Controls (when active):');
  console.log('- WASD/Arrows: 360° movement');
  console.log('- Shift: Sprint');
  console.log('- T: Toggle between tile/free movement');
  console.log('- Space: Camera shake');
  console.log('- +/-: Zoom in/out');
  console.log('- R: Reset position');
  console.log('- F1: Return to original game');
});