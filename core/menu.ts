import { Scene } from './scene.ts';
import { inputManager } from './input.ts';
import { audioManager } from './audio.ts';
import { particleSystem } from './particles.ts';
import { tweenManager, AnimationUtils, Easing } from './animation.ts';

export interface MenuOption {
  id: string;
  text: string;
  action: () => void;
  enabled: boolean;
  description?: string;
}

export class MenuScene extends Scene {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private selectedIndex = 0;
  private options: MenuOption[] = [];
  private title = "UHO: Fate of the Grid";
  private subtitle = "Survival in the Digital Wasteland";
  
  // Visual effects
  private backgroundParticles: Array<{
    x: number;
    y: number;
    speed: number;
    size: number;
    alpha: number;
    color: string;
  }> = [];
  
  private titleAnimation = {
    scale: 1,
    glow: 0,
    offset: 0
  };
  
  private menuAnimation = {
    fade: 0,
    slideOffset: 50
  };
  
  private time = 0;
  
  // Save game detection
  private hasSaveGame = false;
  
  constructor(canvas: HTMLCanvasElement) {
    super('menu');
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    
    this.initializeMenu();
    this.initializeBackgroundEffects();
    this.checkForSaveGame();
  }
  
  private initializeMenu(): void {
    this.options = [
      {
        id: 'new-game',
        text: 'Uusi Peli',
        action: () => this.startNewGame(),
        enabled: true,
        description: 'Aloita uusi seikkailu digitaalisessa autiomaassa'
      },
      {
        id: 'continue',
        text: 'Jatka',
        action: () => this.continueGame(),
        enabled: this.hasSaveGame,
        description: 'Jatka tallennettua peliä'
      },
      {
        id: 'character-creation',
        text: 'Luo Hahmo',
        action: () => this.openCharacterCreation(),
        enabled: true,
        description: 'Mukauta hahmosi ominaisuuksia ja taustatarinaa'
      },
      {
        id: 'settings',
        text: 'Asetukset',
        action: () => this.openSettings(),
        enabled: true,
        description: 'Mukauta pelin asetuksia ja ohjaimia'
      },
      {
        id: 'credits',
        text: 'Tekijätiedot',
        action: () => this.showCredits(),
        enabled: true,
        description: 'Katso pelin tekijätiedot ja kiitokset'
      },
      {
        id: 'exit',
        text: 'Lopeta',
        action: () => this.exitGame(),
        enabled: true,
        description: 'Sulje peli'
      }
    ];
  }
  
  private initializeBackgroundEffects(): void {
    // Create floating particles for atmosphere
    for (let i = 0; i < 30; i++) {
      this.backgroundParticles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        speed: 0.2 + Math.random() * 0.8,
        size: 1 + Math.random() * 3,
        alpha: 0.1 + Math.random() * 0.4,
        color: Math.random() > 0.7 ? '#00ff00' : (Math.random() > 0.5 ? '#0088ff' : '#ffffff')
      });
    }
  }
  
  private checkForSaveGame(): void {
    // Check if there's a saved game in localStorage
    const saveData = localStorage.getItem('uho-fate-save');
    this.hasSaveGame = saveData !== null;
    
    // Update continue option
    const continueOption = this.options.find(opt => opt.id === 'continue');
    if (continueOption) {
      continueOption.enabled = this.hasSaveGame;
    }
  }
  
  onEnter(): void {
    console.log('Entering main menu');
    
    // Reset animations
    this.menuAnimation.fade = 0;
    this.menuAnimation.slideOffset = 50;
    this.titleAnimation.scale = 0.8;
    this.titleAnimation.glow = 0;
    
    // Animate menu entrance (placeholder for animation system integration)
    console.log('🎨 Menu entrance animation would play here');
    this.menuAnimation.fade = 1;
    this.menuAnimation.slideOffset = 0;
    this.titleAnimation.scale = 1;
    
    // Play menu background music (placeholder for audio integration)
    console.log('🎵 Menu music would play here');
    
    // Check for gamepad connection on menu entry
    const connectedGamepads = inputManager.getConnectedGamepads();
    if (connectedGamepads.length > 0) {
      console.log(`Gamepad detected: ${connectedGamepads.length} controller(s) connected`);
      // Brief vibration to acknowledge gamepad
      inputManager.vibrate(0.3, 100);
    }
  }
  
  onExit(): void {
    // Stop menu music (placeholder for audio integration)
    console.log('🔇 Menu music would stop here');
  }
  
  override handleInput(keys: Set<string>): boolean {
    // Update input manager
    inputManager.update(16); // Assume 60fps for menu
    
    // Handle navigation
    if (inputManager.isActionPressed('moveUp')) {
      this.navigateUp();
      return true;
    }
    
    if (inputManager.isActionPressed('moveDown')) {
      this.navigateDown();
      return true;
    }
    
    // Handle selection
    if (inputManager.isActionPressed('interact') || inputManager.isActionPressed('menu')) {
      this.selectCurrentOption();
      return true;
    }
    
    // Handle analog stick navigation (gamepad)
    const leftStick = inputManager.getAnalogInput('leftStick');
    if (Math.abs(leftStick.y) > 0.7) {
      if (leftStick.y < -0.7) {
        this.navigateUp();
      } else if (leftStick.y > 0.7) {
        this.navigateDown();
      }
    }
    
    // Handle mouse input
    const mousePos = inputManager.getMousePosition();
    this.handleMouseInput(mousePos);
    
    if (inputManager.isMouseButtonPressed(0)) {
      this.handleMouseClick(mousePos);
    }
    
    return true;
  }
  
  private navigateUp(): void {
    const enabledOptions = this.options.filter(opt => opt.enabled);
    const currentEnabledIndex = enabledOptions.findIndex(opt => opt.id === this.options[this.selectedIndex].id);
    
    if (currentEnabledIndex > 0) {
      const newOption = enabledOptions[currentEnabledIndex - 1];
      this.selectedIndex = this.options.findIndex(opt => opt.id === newOption.id);
    } else {
      // Wrap to last enabled option
      const lastEnabledOption = enabledOptions[enabledOptions.length - 1];
      this.selectedIndex = this.options.findIndex(opt => opt.id === lastEnabledOption.id);
    }
    
    this.playNavigationSound();
    inputManager.vibrate(0.1, 50);
  }
  
  private navigateDown(): void {
    const enabledOptions = this.options.filter(opt => opt.enabled);
    const currentEnabledIndex = enabledOptions.findIndex(opt => opt.id === this.options[this.selectedIndex].id);
    
    if (currentEnabledIndex < enabledOptions.length - 1) {
      const newOption = enabledOptions[currentEnabledIndex + 1];
      this.selectedIndex = this.options.findIndex(opt => opt.id === newOption.id);
    } else {
      // Wrap to first enabled option
      const firstEnabledOption = enabledOptions[0];
      this.selectedIndex = this.options.findIndex(opt => opt.id === firstEnabledOption.id);
    }
    
    this.playNavigationSound();
    inputManager.vibrate(0.1, 50);
  }
  
  private selectCurrentOption(): void {
    const selectedOption = this.options[this.selectedIndex];
    if (selectedOption && selectedOption.enabled) {
      this.playSelectionSound();
      inputManager.vibrate(0.3, 150);
      selectedOption.action();
    }
  }
  
  private handleMouseInput(mousePos: { x: number, y: number }): void {
    // Check if mouse is over any menu option
    const menuStartY = this.canvas.height / 2 + 50;
    const optionHeight = 40;
    const enabledOptions = this.options.filter(opt => opt.enabled);
    
    for (let i = 0; i < enabledOptions.length; i++) {
      const optionY = menuStartY + i * optionHeight;
      if (mousePos.y >= optionY && mousePos.y <= optionY + optionHeight) {
        const optionIndex = this.options.findIndex(opt => opt.id === enabledOptions[i].id);
        if (optionIndex !== this.selectedIndex) {
          this.selectedIndex = optionIndex;
          this.playNavigationSound();
        }
        break;
      }
    }
  }
  
  private handleMouseClick(mousePos: { x: number, y: number }): void {
    // Check if click is on current selected option
    const menuStartY = this.canvas.height / 2 + 50;
    const optionHeight = 40;
    const enabledOptions = this.options.filter(opt => opt.enabled);
    const currentEnabledIndex = enabledOptions.findIndex(opt => opt.id === this.options[this.selectedIndex].id);
    
    if (currentEnabledIndex >= 0) {
      const optionY = menuStartY + currentEnabledIndex * optionHeight;
      if (mousePos.y >= optionY && mousePos.y <= optionY + optionHeight) {
        this.selectCurrentOption();
      }
    }
  }
  
  private playNavigationSound(): void {
    // Placeholder for audio integration
    console.log('🔊 Menu navigation sound would play here');
  }
  
  private playSelectionSound(): void {
    // Placeholder for audio integration
    console.log('🔊 Menu selection sound would play here');
  }
  
  update(deltaTime: number): void {
    this.time += deltaTime;
    
    // Update background particles
    for (const particle of this.backgroundParticles) {
      particle.y -= particle.speed * deltaTime / 16;
      
      // Wrap particles
      if (particle.y < -10) {
        particle.y = this.canvas.height + 10;
        particle.x = Math.random() * this.canvas.width;
      }
      
      // Subtle floating motion
      particle.x += Math.sin(this.time / 1000 + particle.y / 100) * 0.1;
    }
    
    // Update title glow effect
    this.titleAnimation.glow = Math.sin(this.time / 1000) * 0.3 + 0.7;
    this.titleAnimation.offset = Math.sin(this.time / 2000) * 2;
  }
  
  render(ctx: CanvasRenderingContext2D): void {
    // Clear canvas with dark background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw background grid effect
    this.drawBackgroundGrid(ctx);
    
    // Draw floating particles
    this.drawBackgroundParticles(ctx);
    
    // Draw title
    this.drawTitle(ctx);
    
    // Draw menu options
    this.drawMenuOptions(ctx);
    
    // Draw gamepad status
    this.drawGamepadStatus(ctx);
    
    // Draw description for selected option
    this.drawOptionDescription(ctx);
  }
  
  private drawBackgroundGrid(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.1)';
    ctx.lineWidth = 1;
    
    const gridSize = 50;
    
    // Vertical lines
    for (let x = 0; x < this.canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.canvas.height);
      ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = 0; y < this.canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.canvas.width, y);
      ctx.stroke();
    }
  }
  
  private drawBackgroundParticles(ctx: CanvasRenderingContext2D): void {
    for (const particle of this.backgroundParticles) {
      ctx.fillStyle = particle.color + Math.floor(particle.alpha * 255).toString(16).padStart(2, '0');
      ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
    }
  }
  
  private drawTitle(ctx: CanvasRenderingContext2D): void {
    const centerX = this.canvas.width / 2;
    const titleY = this.canvas.height / 4;
    
    ctx.save();
    ctx.translate(centerX, titleY + this.titleAnimation.offset);
    ctx.scale(this.titleAnimation.scale, this.titleAnimation.scale);
    
    // Draw title glow
    ctx.shadowColor = '#00ff00';
    ctx.shadowBlur = 20 * this.titleAnimation.glow;
    
    ctx.fillStyle = '#00ff00';
    ctx.font = 'bold 48px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(this.title, 0, 0);
    
    // Draw subtitle
    ctx.shadowBlur = 10 * this.titleAnimation.glow;
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px "Courier New", monospace';
    ctx.fillText(this.subtitle, 0, 40);
    
    ctx.restore();
  }
  
  private drawMenuOptions(ctx: CanvasRenderingContext2D): void {
    const centerX = this.canvas.width / 2;
    const startY = this.canvas.height / 2 + 50;
    const optionHeight = 40;
    
    const enabledOptions = this.options.filter(opt => opt.enabled);
    
    ctx.font = '24px "Courier New", monospace';
    ctx.textAlign = 'center';
    
    enabledOptions.forEach((option, index) => {
      const y = startY + index * optionHeight;
      const optionIndex = this.options.findIndex(opt => opt.id === option.id);
      const isSelected = optionIndex === this.selectedIndex;
      
      ctx.save();
      ctx.translate(centerX - this.menuAnimation.slideOffset, y);
      ctx.globalAlpha = this.menuAnimation.fade;
      
      if (isSelected) {
        // Draw selection background
        ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
        ctx.fillRect(-150, -15, 300, 30);
        
        // Draw selection border
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.strokeRect(-150, -15, 300, 30);
        
        // Draw selection arrow
        ctx.fillStyle = '#00ff00';
        ctx.fillText('>', -180, 8);
        ctx.fillText('<', 180, 8);
      }
      
      // Draw option text
      ctx.fillStyle = isSelected ? '#ffffff' : (option.enabled ? '#cccccc' : '#666666');
      if (isSelected) {
        ctx.shadowColor = '#00ff00';
        ctx.shadowBlur = 5;
      }
      
      ctx.fillText(option.text, 0, 8);
      
      ctx.restore();
    });
  }
  
  private drawGamepadStatus(ctx: CanvasRenderingContext2D): void {
    const connectedGamepads = inputManager.getConnectedGamepads();
    
    if (connectedGamepads.length > 0) {
      ctx.fillStyle = '#00ff00';
      ctx.font = '12px "Courier New", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`🎮 ${connectedGamepads.length} Controller(s) Connected`, this.canvas.width - 10, 20);
    }
  }
  
  private drawOptionDescription(ctx: CanvasRenderingContext2D): void {
    const selectedOption = this.options[this.selectedIndex];
    if (selectedOption && selectedOption.description) {
      const descY = this.canvas.height - 60;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(20, descY - 20, this.canvas.width - 40, 40);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '14px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(selectedOption.description, this.canvas.width / 2, descY);
    }
  }
  
  // Menu actions
  private startNewGame(): void {
    console.log('Starting new game...');
    // This will be implemented when we integrate with scene manager
    alert('New Game - Will transition to character creation and then game');
  }
  
  private continueGame(): void {
    console.log('Continuing saved game...');
    // Load saved game data
    const saveData = localStorage.getItem('uho-fate-save');
    if (saveData) {
      try {
        const gameState = JSON.parse(saveData);
        console.log('Loaded save data:', gameState);
        // Transition directly to game scene
        alert('Continue Game - Will load saved game state');
      } catch (error) {
        console.error('Failed to load save data:', error);
        alert('Failed to load saved game');
      }
    }
  }
  
  private openCharacterCreation(): void {
    console.log('Opening character creation...');
    // This will transition to character creation scene
    alert('Character Creation - Will transition to character creation scene');
  }
  
  private openSettings(): void {
    console.log('Opening settings...');
    // This will transition to settings scene
    alert('Settings - Will transition to settings scene');
  }
  
  private showCredits(): void {
    console.log('Showing credits...');
    // Show credits overlay or transition to credits scene
    alert('Credits:\n\nUHO: Fate of the Grid\nDeveloped by Ville Peuho\n\nBuilt with TypeScript and HTML5 Canvas\nGamepad support via Gamepad API');
  }
  
  private exitGame(): void {
    console.log('Exiting game...');
    if (confirm('Haluatko varmasti lopettaa pelin?')) {
      // Close the browser tab/window if possible
      window.close();
    }
  }
}