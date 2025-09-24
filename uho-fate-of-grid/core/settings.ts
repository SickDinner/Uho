import { Scene } from './scene.ts';
import { inputManager, InputBinding } from './input.ts';
import { audioManager } from './audio.ts';
import { tweenManager, AnimationUtils, Easing } from './animation.ts';

export interface GameSettings {
  audio: {
    masterVolume: number;
    musicVolume: number;
    soundVolume: number;
    muteAudio: boolean;
  };
  graphics: {
    pixelPerfect: boolean;
    screenShake: boolean;
    particles: boolean;
    vsync: boolean;
    fullscreen: boolean;
  };
  gameplay: {
    showFPS: boolean;
    pauseOnFocusLoss: boolean;
    autosave: boolean;
    autosaveInterval: number; // minutes
  };
  controls: {
    inputBindings: InputBinding;
    gamepadVibration: boolean;
    mouseSensitivity: number;
  };
}

enum SettingsCategory {
  AUDIO,
  GRAPHICS,
  GAMEPLAY,
  CONTROLS
}

enum ControlsSubMenu {
  NONE,
  REMAPPING
}

export class SettingsScene extends Scene {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  
  private currentCategory = SettingsCategory.AUDIO;
  private selectedIndex = 0;
  private controlsSubMenu = ControlsSubMenu.NONE;
  private remappingAction: string | null = null;
  private waitingForInput = false;
  
  // Settings data
  private settings: GameSettings;
  private originalSettings: GameSettings; // For canceling changes
  
  // Visual effects
  private time = 0;
  private animationOffset = 0;
  private categoryAnimations: number[] = [0, 0, 0, 0];
  
  // Input handling
  private lastInputTime = 0;
  private inputCooldown = 150;
  
  private readonly categories = ['Audio', 'Graphics', 'Gameplay', 'Controls'];
  
  constructor(canvas: HTMLCanvasElement) {
    super('settings');
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    
    // Load or initialize settings
    this.settings = this.loadSettings();
    this.originalSettings = JSON.parse(JSON.stringify(this.settings));
  }
  
  private getDefaultSettings(): GameSettings {
    return {
      audio: {
        masterVolume: 0.7,
        musicVolume: 0.5,
        soundVolume: 0.6,
        muteAudio: false
      },
      graphics: {
        pixelPerfect: true,
        screenShake: true,
        particles: true,
        vsync: true,
        fullscreen: false
      },
      gameplay: {
        showFPS: false,
        pauseOnFocusLoss: true,
        autosave: true,
        autosaveInterval: 5
      },
      controls: {
        inputBindings: inputManager.getAllBindings(),
        gamepadVibration: true,
        mouseSensitivity: 1.0
      }
    };
  }
  
  private loadSettings(): GameSettings {
    try {
      const saved = localStorage.getItem('uho-fate-settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge with defaults to ensure all properties exist
        return { ...this.getDefaultSettings(), ...parsed };
      }
    } catch (error) {
      console.warn('Failed to load settings:', error);
    }
    return this.getDefaultSettings();
  }
  
  private saveSettings(): void {
    try {
      localStorage.setItem('uho-fate-settings', JSON.stringify(this.settings));
      this.applySettings();
      console.log('Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }
  
  private applySettings(): void {
    // Apply audio settings
    if (audioManager.setMasterVolume) {
      audioManager.setMasterVolume(this.settings.audio.muteAudio ? 0 : this.settings.audio.masterVolume);
    }
    
    // Apply graphics settings
    if (this.settings.graphics.pixelPerfect) {
      this.ctx.imageSmoothingEnabled = false;
    } else {
      this.ctx.imageSmoothingEnabled = true;
    }
    
    // Apply control settings
    for (const [action, binding] of Object.entries(this.settings.controls.inputBindings)) {
      inputManager.updateBinding(action, binding);
    }
  }
  
  onEnter(): void {
    console.log('Entering settings');
    this.currentCategory = SettingsCategory.AUDIO;
    this.selectedIndex = 0;
    this.controlsSubMenu = ControlsSubMenu.NONE;
    this.remappingAction = null;
    this.waitingForInput = false;
    
    // Save original settings for potential cancellation
    this.originalSettings = JSON.parse(JSON.stringify(this.settings));
    
    // Play settings music (placeholder for audio integration)
    console.log('🎵 Settings music would play here');
    
    // Animate category tabs (placeholder for animation integration)
    console.log('🎨 Settings animation would play here');
    this.categoryAnimations = [1, 1, 1, 1];
  }
  
  onExit(): void {
    // Stop settings music (placeholder for audio integration)
    console.log('🔇 Settings music would stop here');
    
    this.applySettings();
  }
  
  override handleInput(keys: Set<string>): boolean {
    inputManager.update(16);
    
    const now = Date.now();
    if (now - this.lastInputTime < this.inputCooldown) {
      return true;
    }
    
    if (this.waitingForInput) {
      return this.handleRemappingInput();
    }
    
    if (this.controlsSubMenu === ControlsSubMenu.REMAPPING) {
      return this.handleControlsRemapping();
    }
    
    // Category navigation
    if (inputManager.isActionPressed('moveLeft')) {
      this.currentCategory = (this.currentCategory - 1 + 4) % 4;
      this.selectedIndex = 0;
      this.playNavigationSound();
      this.lastInputTime = now;
      return true;
    }
    
    if (inputManager.isActionPressed('moveRight')) {
      this.currentCategory = (this.currentCategory + 1) % 4;
      this.selectedIndex = 0;
      this.playNavigationSound();
      this.lastInputTime = now;
      return true;
    }
    
    // Option navigation within category
    if (inputManager.isActionPressed('moveUp')) {
      this.navigateUp();
      this.lastInputTime = now;
      return true;
    }
    
    if (inputManager.isActionPressed('moveDown')) {
      this.navigateDown();
      this.lastInputTime = now;
      return true;
    }
    
    // Value modification
    if (inputManager.isActionPressed('moveLeft')) {
      this.modifyValue(-1);
      this.lastInputTime = now;
      return true;
    }
    
    if (inputManager.isActionPressed('moveRight')) {
      this.modifyValue(1);
      this.lastInputTime = now;
      return true;
    }
    
    // Selection/interaction
    if (inputManager.isActionPressed('interact')) {
      this.selectCurrentOption();
      this.lastInputTime = now;
      return true;
    }
    
    // Back/cancel
    if (inputManager.isActionPressed('menu')) {
      this.goBack();
      return true;
    }
    
    // Reset to defaults
    if (inputManager.isActionPressed('quickAction1')) { // R key or LB
      this.resetCategoryToDefaults();
      this.lastInputTime = now;
      return true;
    }
    
    return true;
  }
  
  private handleRemappingInput(): boolean {
    // Wait for any input and assign it to the current action
    const keys = inputManager['keys']; // Access private keys
    
    for (const key of keys) {
      if (this.remappingAction) {
        // Update binding for keyboard
        const binding = this.settings.controls.inputBindings[this.remappingAction];
        if (binding) {
          binding.keyboard = [key];
          this.playSelectionSound();
          inputManager.vibrate(0.2, 100);
          this.waitingForInput = false;
          this.remappingAction = null;
          this.lastInputTime = Date.now();
          return true;
        }
      }
    }
    
    // Check for gamepad input
    const connectedGamepads = inputManager.getConnectedGamepads();
    if (connectedGamepads.length > 0) {
      // Check for any pressed gamepad button
      const gamepadStates = inputManager['gamepadStates'];
      for (const [index, state] of gamepadStates) {
        if (!state.connected) continue;
        
        for (let i = 0; i < state.buttons.length; i++) {
          if (state.buttons[i] && !state.lastButtonStates[i]) {
            // Button was just pressed
            if (this.remappingAction) {
              const binding = this.settings.controls.inputBindings[this.remappingAction];
              if (binding) {
                binding.gamepad = [i];
                this.playSelectionSound();
                inputManager.vibrate(0.3, 150);
                this.waitingForInput = false;
                this.remappingAction = null;
                this.lastInputTime = Date.now();
                return true;
              }
            }
          }
        }
      }
    }
    
    // Cancel remapping with Escape
    if (inputManager.isActionPressed('menu')) {
      this.waitingForInput = false;
      this.remappingAction = null;
      this.playNavigationSound();
      return true;
    }
    
    return true;
  }
  
  private handleControlsRemapping(): boolean {
    const actions = Object.keys(this.settings.controls.inputBindings);
    
    if (inputManager.isActionPressed('moveUp')) {
      this.selectedIndex = (this.selectedIndex - 1 + actions.length) % actions.length;
      this.playNavigationSound();
      this.lastInputTime = Date.now();
    }
    
    if (inputManager.isActionPressed('moveDown')) {
      this.selectedIndex = (this.selectedIndex + 1) % actions.length;
      this.playNavigationSound();
      this.lastInputTime = Date.now();
    }
    
    if (inputManager.isActionPressed('interact')) {
      const actionName = actions[this.selectedIndex];
      this.remappingAction = actionName;
      this.waitingForInput = true;
      this.playInputSound();
      return true;
    }
    
    if (inputManager.isActionPressed('menu')) {
      this.controlsSubMenu = ControlsSubMenu.NONE;
      this.selectedIndex = 0;
      this.playNavigationSound();
      return true;
    }
    
    return true;
  }
  
  private navigateUp(): void {
    const optionCount = this.getOptionsForCurrentCategory().length;
    this.selectedIndex = (this.selectedIndex - 1 + optionCount) % optionCount;
    this.playNavigationSound();
  }
  
  private navigateDown(): void {
    const optionCount = this.getOptionsForCurrentCategory().length;
    this.selectedIndex = (this.selectedIndex + 1) % optionCount;
    this.playNavigationSound();
  }
  
  private modifyValue(direction: number): void {
    const options = this.getOptionsForCurrentCategory();
    const currentOption = options[this.selectedIndex];
    
    if (!currentOption) return;
    
    switch (this.currentCategory) {
      case SettingsCategory.AUDIO:
        this.modifyAudioSetting(currentOption.key, direction);
        break;
      case SettingsCategory.GRAPHICS:
        this.modifyGraphicsSetting(currentOption.key, direction);
        break;
      case SettingsCategory.GAMEPLAY:
        this.modifyGameplaySetting(currentOption.key, direction);
        break;
      case SettingsCategory.CONTROLS:
        this.modifyControlsSetting(currentOption.key, direction);
        break;
    }
    
    this.playInputSound();
    inputManager.vibrate(0.1, 50);
  }
  
  private selectCurrentOption(): void {
    if (this.currentCategory === SettingsCategory.CONTROLS) {
      const options = this.getOptionsForCurrentCategory();
      const currentOption = options[this.selectedIndex];
      
      if (currentOption && currentOption.key === 'remapControls') {
        this.controlsSubMenu = ControlsSubMenu.REMAPPING;
        this.selectedIndex = 0;
        this.playSelectionSound();
        return;
      }
    }
    
    // For boolean values, toggle them
    this.modifyValue(1);
  }
  
  private modifyAudioSetting(key: string, direction: number): void {
    switch (key) {
      case 'masterVolume':
        this.settings.audio.masterVolume = Math.max(0, Math.min(1, this.settings.audio.masterVolume + direction * 0.1));
        break;
      case 'musicVolume':
        this.settings.audio.musicVolume = Math.max(0, Math.min(1, this.settings.audio.musicVolume + direction * 0.1));
        break;
      case 'soundVolume':
        this.settings.audio.soundVolume = Math.max(0, Math.min(1, this.settings.audio.soundVolume + direction * 0.1));
        break;
      case 'muteAudio':
        this.settings.audio.muteAudio = !this.settings.audio.muteAudio;
        break;
    }
  }
  
  private modifyGraphicsSetting(key: string, direction: number): void {
    switch (key) {
      case 'pixelPerfect':
        this.settings.graphics.pixelPerfect = !this.settings.graphics.pixelPerfect;
        break;
      case 'screenShake':
        this.settings.graphics.screenShake = !this.settings.graphics.screenShake;
        break;
      case 'particles':
        this.settings.graphics.particles = !this.settings.graphics.particles;
        break;
      case 'vsync':
        this.settings.graphics.vsync = !this.settings.graphics.vsync;
        break;
      case 'fullscreen':
        this.settings.graphics.fullscreen = !this.settings.graphics.fullscreen;
        // Note: Actual fullscreen implementation would require additional code
        break;
    }
  }
  
  private modifyGameplaySetting(key: string, direction: number): void {
    switch (key) {
      case 'showFPS':
        this.settings.gameplay.showFPS = !this.settings.gameplay.showFPS;
        break;
      case 'pauseOnFocusLoss':
        this.settings.gameplay.pauseOnFocusLoss = !this.settings.gameplay.pauseOnFocusLoss;
        break;
      case 'autosave':
        this.settings.gameplay.autosave = !this.settings.gameplay.autosave;
        break;
      case 'autosaveInterval':
        this.settings.gameplay.autosaveInterval = Math.max(1, Math.min(30, this.settings.gameplay.autosaveInterval + direction));
        break;
    }
  }
  
  private modifyControlsSetting(key: string, direction: number): void {
    switch (key) {
      case 'gamepadVibration':
        this.settings.controls.gamepadVibration = !this.settings.controls.gamepadVibration;
        break;
      case 'mouseSensitivity':
        this.settings.controls.mouseSensitivity = Math.max(0.1, Math.min(3.0, this.settings.controls.mouseSensitivity + direction * 0.1));
        break;
    }
  }
  
  private getOptionsForCurrentCategory(): Array<{key: string, name: string, type: string}> {
    switch (this.currentCategory) {
      case SettingsCategory.AUDIO:
        return [
          { key: 'masterVolume', name: 'Master Volume', type: 'slider' },
          { key: 'musicVolume', name: 'Music Volume', type: 'slider' },
          { key: 'soundVolume', name: 'Sound Volume', type: 'slider' },
          { key: 'muteAudio', name: 'Mute Audio', type: 'boolean' }
        ];
      case SettingsCategory.GRAPHICS:
        return [
          { key: 'pixelPerfect', name: 'Pixel Perfect', type: 'boolean' },
          { key: 'screenShake', name: 'Screen Shake', type: 'boolean' },
          { key: 'particles', name: 'Particles', type: 'boolean' },
          { key: 'vsync', name: 'V-Sync', type: 'boolean' },
          { key: 'fullscreen', name: 'Fullscreen', type: 'boolean' }
        ];
      case SettingsCategory.GAMEPLAY:
        return [
          { key: 'showFPS', name: 'Show FPS', type: 'boolean' },
          { key: 'pauseOnFocusLoss', name: 'Pause on Focus Loss', type: 'boolean' },
          { key: 'autosave', name: 'Autosave', type: 'boolean' },
          { key: 'autosaveInterval', name: 'Autosave Interval (min)', type: 'number' }
        ];
      case SettingsCategory.CONTROLS:
        return [
          { key: 'gamepadVibration', name: 'Gamepad Vibration', type: 'boolean' },
          { key: 'mouseSensitivity', name: 'Mouse Sensitivity', type: 'slider' },
          { key: 'remapControls', name: 'Remap Controls', type: 'action' }
        ];
      default:
        return [];
    }
  }
  
  private resetCategoryToDefaults(): void {
    const defaults = this.getDefaultSettings();
    
    switch (this.currentCategory) {
      case SettingsCategory.AUDIO:
        this.settings.audio = { ...defaults.audio };
        break;
      case SettingsCategory.GRAPHICS:
        this.settings.graphics = { ...defaults.graphics };
        break;
      case SettingsCategory.GAMEPLAY:
        this.settings.gameplay = { ...defaults.gameplay };
        break;
      case SettingsCategory.CONTROLS:
        this.settings.controls = { ...defaults.controls };
        break;
    }
    
    this.playSelectionSound();
    inputManager.vibrate(0.3, 200);
  }
  
  private goBack(): void {
    if (this.controlsSubMenu === ControlsSubMenu.REMAPPING) {
      this.controlsSubMenu = ControlsSubMenu.NONE;
      this.selectedIndex = 0;
      this.playNavigationSound();
      return;
    }
    
    // Save settings and return to main menu
    this.saveSettings();
    console.log('Returning to main menu from settings');
    // This will be implemented when we integrate with scene manager
    alert('Settings saved! Returning to main menu...');
  }
  
  private playInputSound(): void {
    try {
      // Placeholder for audio effect creation - method not available
      console.log('Input sound would be played here (type: sine, frequency: 350Hz)');
    } catch (error) {
      console.warn('Could not play input sound:', error);
    }
  }
  
  private playNavigationSound(): void {
    // Placeholder for audio integration
    console.log('🔊 Settings navigation sound would play here');
  }
  
  private playSelectionSound(): void {
    // Placeholder for audio integration
    console.log('🔊 Settings selection sound would play here');
  }
  
  update(deltaTime: number): void {
    this.time += deltaTime;
    this.animationOffset = Math.sin(this.time / 1500) * 2;
  }
  
  render(ctx: CanvasRenderingContext2D): void {
    // Clear canvas with dark background
    ctx.fillStyle = '#0f0f0f';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw background pattern
    this.drawBackgroundPattern(ctx);
    
    // Draw category tabs
    this.drawCategoryTabs(ctx);
    
    // Draw current category content
    if (this.controlsSubMenu === ControlsSubMenu.REMAPPING) {
      this.drawControlsRemapping(ctx);
    } else {
      this.drawCategoryContent(ctx);
    }
    
    // Draw instructions
    this.drawInstructions(ctx);
    
    // Draw gamepad status
    this.drawGamepadStatus(ctx);
  }
  
  private drawBackgroundPattern(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = 'rgba(100, 100, 100, 0.1)';
    ctx.lineWidth = 1;
    
    for (let x = -100; x < this.canvas.width + 100; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x + this.animationOffset, 0);
      ctx.lineTo(x + this.animationOffset + 40, this.canvas.height);
      ctx.stroke();
    }
  }
  
  private drawCategoryTabs(ctx: CanvasRenderingContext2D): void {
    const tabWidth = this.canvas.width / this.categories.length;
    const tabHeight = 50;
    
    this.categories.forEach((category, index) => {
      const x = index * tabWidth;
      const isActive = index === this.currentCategory;
      const animation = this.categoryAnimations[index] || 0;
      
      ctx.save();
      ctx.translate(0, -tabHeight * (1 - animation));
      ctx.globalAlpha = animation;
      
      // Tab background
      ctx.fillStyle = isActive ? 'rgba(0, 136, 255, 0.3)' : 'rgba(100, 100, 100, 0.2)';
      ctx.fillRect(x, 0, tabWidth, tabHeight);
      
      // Tab border
      ctx.strokeStyle = isActive ? '#0088ff' : '#666666';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, 0, tabWidth, tabHeight);
      
      // Tab text
      ctx.fillStyle = isActive ? '#ffffff' : '#cccccc';
      ctx.font = 'bold 16px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(category, x + tabWidth / 2, 30);
      
      ctx.restore();
    });
  }
  
  private drawCategoryContent(ctx: CanvasRenderingContext2D): void {
    const options = this.getOptionsForCurrentCategory();
    const startY = 80;
    const itemHeight = 45;
    
    // Category title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(this.categories[this.currentCategory], this.canvas.width / 2, startY);
    
    // Options list
    options.forEach((option, index) => {
      const y = startY + 40 + index * itemHeight;
      const isSelected = index === this.selectedIndex;
      
      if (isSelected) {
        ctx.fillStyle = 'rgba(0, 136, 255, 0.3)';
        ctx.fillRect(50, y - 20, this.canvas.width - 100, itemHeight - 5);
        
        ctx.strokeStyle = '#0088ff';
        ctx.lineWidth = 2;
        ctx.strokeRect(50, y - 20, this.canvas.width - 100, itemHeight - 5);
      }
      
      // Option name
      ctx.fillStyle = isSelected ? '#ffffff' : '#cccccc';
      ctx.font = '18px "Courier New", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(option.name, 70, y);
      
      // Option value
      const value = this.getSettingValue(option.key);
      ctx.fillStyle = isSelected ? '#00ff00' : '#888888';
      ctx.textAlign = 'right';
      
      if (option.type === 'slider') {
        // Draw slider bar
        const barWidth = 150;
        const barHeight = 8;
        const barX = this.canvas.width - 200;
        const barY = y - 4;
        
        ctx.fillStyle = '#333333';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        ctx.fillStyle = isSelected ? '#00ff00' : '#0088ff';
        ctx.fillRect(barX, barY, barWidth * (value as number), barHeight);
        
        // Value text
        ctx.fillStyle = isSelected ? '#ffffff' : '#cccccc';
        ctx.fillText(Math.round((value as number) * 100) + '%', this.canvas.width - 30, y);
      } else if (option.type === 'boolean') {
        ctx.fillText(value ? 'ON' : 'OFF', this.canvas.width - 70, y);
      } else if (option.type === 'number') {
        ctx.fillText(value.toString(), this.canvas.width - 70, y);
      } else if (option.type === 'action') {
        ctx.fillText('PRESS ENTER', this.canvas.width - 70, y);
      }
    });
  }
  
  private drawControlsRemapping(ctx: CanvasRenderingContext2D): void {
    const actions = Object.keys(this.settings.controls.inputBindings);
    const startY = 80;
    const itemHeight = 30;
    
    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Remap Controls', this.canvas.width / 2, startY);
    
    if (this.waitingForInput) {
      // Show waiting for input message
      ctx.fillStyle = '#ffff00';
      ctx.font = '18px "Courier New", monospace';
      ctx.fillText(`Press key/button for "${this.remappingAction}"`, this.canvas.width / 2, startY + 40);
      
      const blink = Math.sin(this.time / 200) > 0;
      if (blink) {
        ctx.fillText('Waiting for input...', this.canvas.width / 2, startY + 70);
      }
    } else {
      // Show actions list
      const visibleStart = Math.max(0, this.selectedIndex - 8);
      const visibleEnd = Math.min(actions.length, visibleStart + 16);
      
      for (let i = visibleStart; i < visibleEnd; i++) {
        const action = actions[i];
        const binding = this.settings.controls.inputBindings[action];
        const y = startY + 40 + (i - visibleStart) * itemHeight;
        const isSelected = i === this.selectedIndex;
        
        if (isSelected) {
          ctx.fillStyle = 'rgba(0, 136, 255, 0.3)';
          ctx.fillRect(50, y - 12, this.canvas.width - 100, itemHeight - 5);
        }
        
        // Action name
        ctx.fillStyle = isSelected ? '#ffffff' : '#cccccc';
        ctx.font = '14px "Courier New", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(action, 70, y);
        
        // Binding display
        ctx.textAlign = 'right';
        let bindingText = '';
        if (binding.keyboard && binding.keyboard.length > 0) {
          bindingText += binding.keyboard[0].toUpperCase();
        }
        if (binding.gamepad && binding.gamepad.length > 0) {
          if (bindingText) bindingText += ' / ';
          bindingText += `GP${binding.gamepad[0]}`;
        }
        
        ctx.fillStyle = isSelected ? '#00ff00' : '#888888';
        ctx.fillText(bindingText || 'UNBOUND', this.canvas.width - 70, y);
      }
    }
  }
  
  private drawInstructions(ctx: CanvasRenderingContext2D): void {
    let instructions = '';
    
    if (this.waitingForInput) {
      instructions = 'Press any key/button to bind | ESC: Cancel';
    } else if (this.controlsSubMenu === ControlsSubMenu.REMAPPING) {
      instructions = 'Arrows: Navigate | ENTER: Remap | ESC: Back';
    } else {
      instructions = 'Arrows: Navigate | A/D: Change Value | ENTER: Select | R: Reset Category | ESC: Back';
    }
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, this.canvas.height - 40, this.canvas.width, 40);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(instructions, this.canvas.width / 2, this.canvas.height - 15);
  }
  
  private drawGamepadStatus(ctx: CanvasRenderingContext2D): void {
    const connectedGamepads = inputManager.getConnectedGamepads();
    
    if (connectedGamepads.length > 0) {
      ctx.fillStyle = '#00ff00';
      ctx.font = '12px "Courier New", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`🎮 ${connectedGamepads.length} Controller(s)`, 10, 25);
      
      // Show vibration setting
      if (this.settings.controls.gamepadVibration) {
        ctx.fillText('Vibration: ON', 10, 40);
      }
    }
  }
  
  private getSettingValue(key: string): any {
    switch (this.currentCategory) {
      case SettingsCategory.AUDIO:
        return (this.settings.audio as any)[key];
      case SettingsCategory.GRAPHICS:
        return (this.settings.graphics as any)[key];
      case SettingsCategory.GAMEPLAY:
        return (this.settings.gameplay as any)[key];
      case SettingsCategory.CONTROLS:
        return (this.settings.controls as any)[key];
      default:
        return null;
    }
  }
  
  public getSettings(): GameSettings {
    return this.settings;
  }
}
