import { Scene } from './scene.ts';
import { inputManager } from './input.ts';
import { audioManager } from './audio.ts';
import { tweenManager, AnimationUtils, Easing } from './animation.ts';
import { assetManager, AssetManager } from './asset-manager.ts';

export interface CharacterBackground {
  id: string;
  name: string;
  description: string;
  statModifiers: Partial<CharacterStats>;
  startingItems: string[];
  startingMoney: number;
}

export interface CharacterStats {
  strength: number;
  endurance: number;
  agility: number;
  intelligence: number;
  perception: number;
  charisma: number;
  willpower: number;
  luck: number;
  reflex: number;
  tolerance: number;
  stress: number;
  technical: number;
  crime: number;
  medical: number;
  cunning: number;
}

export interface CharacterAppearance {
  skinTone: number;
  hairColor: number;
  eyeColor: number;
  clothingStyle: number;
}

export interface CharacterData {
  name: string;
  background: CharacterBackground;
  stats: CharacterStats;
  appearance: CharacterAppearance;
}

enum CreationStep {
  NAME,
  BACKGROUND,
  STATS,
  APPEARANCE,
  CONFIRMATION
}

export class CharacterCreationScene extends Scene {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  
  private currentStep = CreationStep.NAME;
  private selectedIndex = 0;
  private inputBuffer = '';
  private maxNameLength = 20;
  
  // Character data being created
  private characterData: CharacterData = {
    name: '',
    background: this.getBackgrounds()[0],
    stats: this.getDefaultStats(),
    appearance: {
      skinTone: 0,
      hairColor: 0,
      eyeColor: 0,
      clothingStyle: 0
    }
  };
  
  private availablePoints = 15;
  private animationOffset = 0;
  private time = 0;
  
  // Visual elements
  private assetsLoaded = false;
  private loadingProgress = 0;
  private backgroundImage: HTMLImageElement | null = null;
  private characterPortrait: HTMLImageElement | null = null;
  
  // Input handling
  private lastInputTime = 0;
  private inputCooldown = 150;
  
  constructor(canvas: HTMLCanvasElement) {
    super('character-creation');
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
  }
  
  private getDefaultStats(): CharacterStats {
    return {
      strength: 30,
      endurance: 30,
      agility: 30,
      intelligence: 30,
      perception: 30,
      charisma: 30,
      willpower: 30,
      luck: 30,
      reflex: 30,
      tolerance: 30,
      stress: 30,
      technical: 30,
      crime: 30,
      medical: 30,
      cunning: 30
    };
  }
  
  private getBackgrounds(): CharacterBackground[] {
    return [
      {
        id: 'hacker',
        name: 'Hakkeri',
        description: 'Entinen kyberrikollinen, joka hallitsee teknologian mutta on huono sosiaalisissa tilanteissa.',
        statModifiers: {
          technical: 15,
          intelligence: 10,
          cunning: 10,
          charisma: -5,
          crime: 10
        },
        startingItems: ['laptop', 'hacking_tools', 'energy_drink'],
        startingMoney: 500
      },
      {
        id: 'cop',
        name: 'Entinen Poliisi',
        description: 'Korruptoitunut ex-poliisi, jolla on kontakteja rikollisjärjestöihin.',
        statModifiers: {
          perception: 15,
          willpower: 10,
          stress: -10,
          crime: 15,
          medical: 5
        },
        startingItems: ['pistol', 'badge', 'handcuffs'],
        startingMoney: 300
      },
      {
        id: 'addict',
        name: 'Toipuva Narkkari',
        description: 'Entinen huumeidenkäyttäjä, joka tuntee kadun tavat ja kauppiaiden verkostot.',
        statModifiers: {
          tolerance: 20,
          cunning: 15,
          charisma: 10,
          endurance: -5,
          stress: 10
        },
        startingItems: ['contacts_list', 'small_stash', 'dirty_cash'],
        startingMoney: 150
      },
      {
        id: 'medic',
        name: 'Syrjäytetty Lääkäri',
        description: 'Lääkäri, joka menetti lisenssinsä. Osaa hoitaa vammoja ja tuntee lääkkeet.',
        statModifiers: {
          medical: 20,
          intelligence: 15,
          perception: 10,
          charisma: -5,
          stress: 5
        },
        startingItems: ['med_kit', 'prescription_pad', 'medical_supplies'],
        startingMoney: 400
      },
      {
        id: 'street_kid',
        name: 'Katulapsi',
        description: 'Kaduilla kasvanut nuori, joka selviytyy nokkeluudella ja nopeudella.',
        statModifiers: {
          agility: 15,
          reflex: 15,
          cunning: 10,
          luck: 10,
          endurance: -5
        },
        startingItems: ['switchblade', 'stolen_goods', 'street_clothes'],
        startingMoney: 100
      },
      {
        id: 'corpo',
        name: 'Entinen Yritysjohtaja',
        description: 'Korkeasta asemasta pudonnut johtaja, jolla on rahaa mutta ei kadun taitoja.',
        statModifiers: {
          charisma: 15,
          intelligence: 10,
          willpower: 10,
          technical: 5,
          cunning: -10
        },
        startingItems: ['expensive_suit', 'corporate_contacts', 'credit_card'],
        startingMoney: 1000
      }
    ];
  }
  
  onEnter(): void {
    console.log('Entering character creation');
    this.currentStep = CreationStep.NAME;
    this.selectedIndex = 0;
    this.inputBuffer = '';
    this.characterData.name = '';
    
    // Reset stats
    this.characterData.stats = this.getDefaultStats();
    this.availablePoints = 15;
    
    // Load visual assets
    this.loadAssets();
    
    // Play creation music (placeholder for audio manager integration)
    console.log('🎵 Character creation music would play here');
  }
  
  onExit(): void {
    // Stop creation music (placeholder for audio manager integration)
    console.log('🔇 Character creation music would stop here');
  }
  
  override handleInput(keys: Set<string>): boolean {
    inputManager.update(16);
    
    const now = Date.now();
    if (now - this.lastInputTime < this.inputCooldown) {
      return true;
    }
    
    switch (this.currentStep) {
      case CreationStep.NAME:
        return this.handleNameInput();
      case CreationStep.BACKGROUND:
        return this.handleBackgroundInput();
      case CreationStep.STATS:
        return this.handleStatsInput();
      case CreationStep.APPEARANCE:
        return this.handleAppearanceInput();
      case CreationStep.CONFIRMATION:
        return this.handleConfirmationInput();
      default:
        return true;
    }
  }
  
  private handleNameInput(): boolean {
    // Handle text input
    const keys = inputManager['keys']; // Access private keys for text input
    
    for (const key of keys) {
      if (key.length === 1 && /[a-zA-ZäöåÄÖÅ ]/.test(key) && this.inputBuffer.length < this.maxNameLength) {
        this.inputBuffer += key.toUpperCase();
        this.lastInputTime = Date.now();
        this.playInputSound();
      }
    }
    
    // Handle backspace
    if (inputManager.isActionPressed('moveLeft') && this.inputBuffer.length > 0) {
      this.inputBuffer = this.inputBuffer.slice(0, -1);
      this.lastInputTime = Date.now();
      this.playInputSound();
    }
    
    // Handle navigation
    if (inputManager.isActionPressed('interact') && this.inputBuffer.trim().length > 0) {
      this.characterData.name = this.inputBuffer.trim();
      this.nextStep();
      return true;
    }
    
    if (inputManager.isActionPressed('menu')) {
      this.goBack();
      return true;
    }
    
    return true;
  }
  
  private handleBackgroundInput(): boolean {
    const backgrounds = this.getBackgrounds();
    
    if (inputManager.isActionPressed('moveUp')) {
      this.selectedIndex = (this.selectedIndex - 1 + backgrounds.length) % backgrounds.length;
      this.characterData.background = backgrounds[this.selectedIndex];
      this.playNavigationSound();
      this.lastInputTime = Date.now();
    }
    
    if (inputManager.isActionPressed('moveDown')) {
      this.selectedIndex = (this.selectedIndex + 1) % backgrounds.length;
      this.characterData.background = backgrounds[this.selectedIndex];
      this.playNavigationSound();
      this.lastInputTime = Date.now();
    }
    
    if (inputManager.isActionPressed('interact')) {
      this.nextStep();
      return true;
    }
    
    if (inputManager.isActionPressed('menu')) {
      this.previousStep();
      return true;
    }
    
    return true;
  }
  
  private handleStatsInput(): boolean {
    const statKeys = Object.keys(this.characterData.stats) as Array<keyof CharacterStats>;
    
    if (inputManager.isActionPressed('moveUp')) {
      this.selectedIndex = (this.selectedIndex - 1 + statKeys.length) % statKeys.length;
      this.playNavigationSound();
      this.lastInputTime = Date.now();
    }
    
    if (inputManager.isActionPressed('moveDown')) {
      this.selectedIndex = (this.selectedIndex + 1) % statKeys.length;
      this.playNavigationSound();
      this.lastInputTime = Date.now();
    }
    
    const currentStat = statKeys[this.selectedIndex];
    
    if (inputManager.isActionPressed('moveRight') && this.availablePoints > 0 && this.characterData.stats[currentStat] < 80) {
      this.characterData.stats[currentStat] += 1;
      this.availablePoints -= 1;
      this.playInputSound();
      this.lastInputTime = Date.now();
    }
    
    if (inputManager.isActionPressed('moveLeft') && this.characterData.stats[currentStat] > 10) {
      this.characterData.stats[currentStat] -= 1;
      this.availablePoints += 1;
      this.playInputSound();
      this.lastInputTime = Date.now();
    }
    
    if (inputManager.isActionPressed('interact')) {
      this.nextStep();
      return true;
    }
    
    if (inputManager.isActionPressed('menu')) {
      this.previousStep();
      return true;
    }
    
    return true;
  }
  
  private handleAppearanceInput(): boolean {
    const appearanceOptions = ['skinTone', 'hairColor', 'eyeColor', 'clothingStyle'];
    const maxValues = [5, 8, 6, 4]; // Max values for each appearance option
    
    if (inputManager.isActionPressed('moveUp')) {
      this.selectedIndex = (this.selectedIndex - 1 + appearanceOptions.length) % appearanceOptions.length;
      this.playNavigationSound();
      this.lastInputTime = Date.now();
    }
    
    if (inputManager.isActionPressed('moveDown')) {
      this.selectedIndex = (this.selectedIndex + 1) % appearanceOptions.length;
      this.playNavigationSound();
      this.lastInputTime = Date.now();
    }
    
    const currentOption = appearanceOptions[this.selectedIndex] as keyof CharacterAppearance;
    const maxValue = maxValues[this.selectedIndex];
    
    if (inputManager.isActionPressed('moveRight')) {
      this.characterData.appearance[currentOption] = (this.characterData.appearance[currentOption] + 1) % maxValue;
      this.playInputSound();
      this.lastInputTime = Date.now();
    }
    
    if (inputManager.isActionPressed('moveLeft')) {
      this.characterData.appearance[currentOption] = (this.characterData.appearance[currentOption] - 1 + maxValue) % maxValue;
      this.playInputSound();
      this.lastInputTime = Date.now();
    }
    
    if (inputManager.isActionPressed('interact')) {
      this.nextStep();
      return true;
    }
    
    if (inputManager.isActionPressed('menu')) {
      this.previousStep();
      return true;
    }
    
    return true;
  }
  
  private handleConfirmationInput(): boolean {
    if (inputManager.isActionPressed('interact')) {
      this.finishCharacterCreation();
      return true;
    }
    
    if (inputManager.isActionPressed('menu')) {
      this.previousStep();
      return true;
    }
    
    return true;
  }
  
  private nextStep(): void {
    if (this.currentStep < CreationStep.CONFIRMATION) {
      this.currentStep += 1;
      this.selectedIndex = 0;
      this.playSelectionSound();
      inputManager.vibrate(0.2, 100);
    }
  }
  
  private previousStep(): void {
    if (this.currentStep > CreationStep.NAME) {
      this.currentStep -= 1;
      this.selectedIndex = 0;
      this.playNavigationSound();
    } else {
      this.goBack();
    }
  }
  
  private goBack(): void {
    // Return to main menu
    console.log('Returning to main menu from character creation');
    // This will be implemented when we integrate with scene manager
    alert('Returning to main menu...');
  }
  
  private async loadAssets(): Promise<void> {
    try {
      console.log('Loading character creation assets...');
      const assets = AssetManager.getCharacterCreationAssets();
      await assetManager.preloadAssets(assets);
      
      // Get loaded images
      this.backgroundImage = assetManager.getAsset<HTMLImageElement>('cc-bg-machine-prayer');
      this.characterPortrait = assetManager.getAsset<HTMLImageElement>('cc-portrait-wasteland');
      
      this.assetsLoaded = true;
      console.log('Character creation assets loaded successfully');
    } catch (error) {
      console.warn('Failed to load some character creation assets:', error);
      this.assetsLoaded = true; // Continue anyway
    }
  }
  
  private finishCharacterCreation(): void {
    // Apply background modifiers to stats
    for (const [stat, modifier] of Object.entries(this.characterData.background.statModifiers)) {
      if (stat in this.characterData.stats) {
        const key = stat as keyof CharacterStats;
        this.characterData.stats[key] = Math.max(1, Math.min(100, this.characterData.stats[key] + modifier));
      }
    }
    
    // Save character data
    const characterSave = {
      character: this.characterData,
      createdAt: Date.now()
    };
    
    localStorage.setItem('uho-fate-character', JSON.stringify(characterSave));
    
    console.log('Character created:', this.characterData);
    this.playSelectionSound();
    inputManager.vibrate(0.5, 300);
    
    // Transition to game
    alert(`Character "${this.characterData.name}" created! Starting game...`);
  }
  
  private playInputSound(): void {
    // Placeholder for audio integration
    console.log('🔊 Input sound would play here');
  }
  
  private playNavigationSound(): void {
    // Placeholder for audio integration
    console.log('🔊 Navigation sound would play here');
  }
  
  private playSelectionSound(): void {
    // Placeholder for audio integration
    console.log('🔊 Selection sound would play here');
  }
  
  update(deltaTime: number): void {
    this.time += deltaTime;
    this.animationOffset = Math.sin(this.time / 1000) * 3;
  }
  
  render(ctx: CanvasRenderingContext2D): void {
    // Clear canvas with dark background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Show loading screen if assets not loaded
    if (!this.assetsLoaded) {
      this.drawLoadingScreen(ctx);
      return;
    }
    
    // Draw background image with overlay
    this.drawBackgroundImage(ctx);
    
    // Draw background pattern (lighter now)
    this.drawBackgroundPattern(ctx);
    
    // Draw current step
    switch (this.currentStep) {
      case CreationStep.NAME:
        this.drawNameStep(ctx);
        break;
      case CreationStep.BACKGROUND:
        this.drawBackgroundStep(ctx);
        break;
      case CreationStep.STATS:
        this.drawStatsStep(ctx);
        break;
      case CreationStep.APPEARANCE:
        this.drawAppearanceStep(ctx);
        break;
      case CreationStep.CONFIRMATION:
        this.drawConfirmationStep(ctx);
        break;
    }
    
    // Draw step indicator
    this.drawStepIndicator(ctx);
    
    // Draw instructions
    this.drawInstructions(ctx);
  }
  
  private drawBackgroundPattern(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = 'rgba(0, 100, 255, 0.05)';
    ctx.lineWidth = 1;
    
    for (let x = -50; x < this.canvas.width + 50; x += 100) {
      ctx.beginPath();
      ctx.moveTo(x + this.animationOffset, 0);
      ctx.lineTo(x + this.animationOffset, this.canvas.height);
      ctx.stroke();
    }
  }
  
  private drawLoadingScreen(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Ladataan visuaalista materiaalia...', this.canvas.width / 2, this.canvas.height / 2);
    
    // Loading progress
    const progress = assetManager.getLoadingProgress();
    const barWidth = 400;
    const barHeight = 20;
    const x = this.canvas.width / 2 - barWidth / 2;
    const y = this.canvas.height / 2 + 50;
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(x, y, barWidth, barHeight);
    
    ctx.fillStyle = '#0088ff';
    ctx.fillRect(x, y, (progress.percentage / 100) * barWidth, barHeight);
    
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, barWidth, barHeight);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px "Courier New", monospace';
    ctx.fillText(`${Math.round(progress.percentage)}%`, this.canvas.width / 2, y + 45);
  }
  
  private drawBackgroundImage(ctx: CanvasRenderingContext2D): void {
    if (this.backgroundImage) {
      // Draw background image, scaled and centered
      const scale = Math.max(
        this.canvas.width / this.backgroundImage.width,
        this.canvas.height / this.backgroundImage.height
      );
      
      const scaledWidth = this.backgroundImage.width * scale;
      const scaledHeight = this.backgroundImage.height * scale;
      const x = (this.canvas.width - scaledWidth) / 2;
      const y = (this.canvas.height - scaledHeight) / 2;
      
      ctx.globalAlpha = 0.3; // Make it subtle
      ctx.drawImage(this.backgroundImage, x, y, scaledWidth, scaledHeight);
      ctx.globalAlpha = 1;
      
      // Dark overlay to ensure text readability
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
  
  private drawNameStep(ctx: CanvasRenderingContext2D): void {
    // Draw title with glow effect
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px "Courier New", monospace';
    ctx.textAlign = 'center';
    
    // Add subtle glow
    ctx.shadowColor = '#0088ff';
    ctx.shadowBlur = 10;
    ctx.fillText('Anna hahmollesi nimi', this.canvas.width / 2, 150);
    ctx.shadowBlur = 0;
    
    // Small character portrait in corner if available
    if (this.characterPortrait) {
      const smallSize = 100;
      const x = this.canvas.width - smallSize - 30;
      const y = 30;
      
      ctx.globalAlpha = 0.5;
      ctx.drawImage(this.characterPortrait, x, y, smallSize, smallSize);
      ctx.globalAlpha = 1;
      
      ctx.strokeStyle = 'rgba(0, 136, 255, 0.5)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, smallSize, smallSize);
    }
    
    // Enhanced input field
    const inputY = 250;
    const fieldWidth = 350;
    const fieldHeight = 50;
    const fieldX = this.canvas.width / 2 - fieldWidth / 2;
    
    // Field background with gradient effect
    const gradient = ctx.createLinearGradient(fieldX, inputY - 25, fieldX, inputY + 25);
    gradient.addColorStop(0, 'rgba(0, 136, 255, 0.1)');
    gradient.addColorStop(0.5, 'rgba(0, 136, 255, 0.2)');
    gradient.addColorStop(1, 'rgba(0, 136, 255, 0.1)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(fieldX, inputY - 25, fieldWidth, fieldHeight);
    
    // Outer border
    ctx.strokeStyle = '#0088ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(fieldX, inputY - 25, fieldWidth, fieldHeight);
    
    // Inner border with glow
    ctx.strokeStyle = 'rgba(0, 136, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(fieldX + 2, inputY - 23, fieldWidth - 4, fieldHeight - 4);
    
    // Display input text with enhanced styling
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px "Courier New", monospace';
    const displayText = this.inputBuffer + (Math.floor(this.time / 500) % 2 ? '|' : '');
    
    // Add text shadow for better readability
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 2;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    ctx.fillText(displayText, this.canvas.width / 2, inputY + 8);
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Enhanced character counter
    const counterColor = this.inputBuffer.length === this.maxNameLength ? '#ff4444' : '#888888';
    ctx.fillStyle = counterColor;
    ctx.font = '14px "Courier New", monospace';
    ctx.fillText(`${this.inputBuffer.length}/${this.maxNameLength}`, this.canvas.width / 2, inputY + 45);
    
    // Instruction text
    ctx.fillStyle = '#cccccc';
    ctx.font = '16px "Courier New", monospace';
    ctx.fillText('Kirjoita hahmosi nimi yllä olevaan kenttään', this.canvas.width / 2, inputY + 80);
  }
  
  private drawBackgroundStep(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Valitse taustasi', this.canvas.width / 2, 80);
    
    // Draw character portrait on the right if available
    if (this.characterPortrait) {
      const portraitSize = 200;
      const portraitX = this.canvas.width - portraitSize - 50;
      const portraitY = 120;
      
      // Portrait background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(portraitX - 10, portraitY - 10, portraitSize + 20, portraitSize + 20);
      
      ctx.strokeStyle = '#0088ff';
      ctx.lineWidth = 2;
      ctx.strokeRect(portraitX - 10, portraitY - 10, portraitSize + 20, portraitSize + 20);
      
      // Draw portrait
      ctx.drawImage(this.characterPortrait, portraitX, portraitY, portraitSize, portraitSize);
      
      // Character name overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(portraitX - 10, portraitY + portraitSize - 30, portraitSize + 20, 30);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '14px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Wasteland Survivor', portraitX + portraitSize / 2, portraitY + portraitSize - 10);
    }
    
    const backgrounds = this.getBackgrounds();
    const startY = 150;
    const itemHeight = 70;
    const maxWidth = this.characterPortrait ? this.canvas.width - 300 : this.canvas.width - 100;
    
    backgrounds.forEach((background, index) => {
      const y = startY + index * itemHeight;
      const isSelected = index === this.selectedIndex;
      
      if (isSelected) {
        ctx.fillStyle = 'rgba(0, 136, 255, 0.3)';
        ctx.fillRect(50, y - 25, maxWidth - 50, itemHeight - 10);
        
        ctx.strokeStyle = '#0088ff';
        ctx.lineWidth = 2;
        ctx.strokeRect(50, y - 25, maxWidth - 50, itemHeight - 10);
      }
      
      ctx.fillStyle = isSelected ? '#ffffff' : '#cccccc';
      ctx.font = 'bold 20px "Courier New", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(background.name, 70, y);
      
      ctx.fillStyle = isSelected ? '#ffffff' : '#888888';
      ctx.font = '14px "Courier New", monospace';
      
      // Wrap description text if needed
      const maxDescWidth = maxWidth - 120;
      this.wrapText(ctx, background.description, 70, y + 20, maxDescWidth, 14);
    });
  }
  
  private drawStatsStep(ctx: CanvasRenderingContext2D): void {
    // Title with glow
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#0088ff';
    ctx.shadowBlur = 8;
    ctx.fillText('Jaa pisteet', this.canvas.width / 2, 50);
    ctx.shadowBlur = 0;
    
    // Available points with enhanced styling
    const pointsColor = this.availablePoints > 0 ? '#00ff00' : '#ffaa00';
    ctx.fillStyle = pointsColor;
    ctx.font = 'bold 20px "Courier New", monospace';
    ctx.fillText(`Jäljellä: ${this.availablePoints} pistettä`, this.canvas.width / 2, 85);
    
    const statKeys = Object.keys(this.characterData.stats) as Array<keyof CharacterStats>;
    const startY = 120;
    const itemHeight = 30;
    const cols = 2;
    const itemsPerCol = Math.ceil(statKeys.length / cols);
    
    statKeys.forEach((statKey, index) => {
      const col = Math.floor(index / itemsPerCol);
      const row = index % itemsPerCol;
      const x = 100 + col * 350;
      const y = startY + row * itemHeight;
      
      const isSelected = index === this.selectedIndex;
      const statValue = this.characterData.stats[statKey];
      
      if (isSelected) {
        ctx.fillStyle = 'rgba(0, 136, 255, 0.3)';
        ctx.fillRect(x - 10, y - 15, 320, 25);
      }
      
      // Stat name
      ctx.fillStyle = isSelected ? '#ffffff' : '#cccccc';
      ctx.font = '16px "Courier New", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(this.getStatDisplayName(statKey), x, y);
      
      // Stat value and bar
      const barX = x + 150;
      const barWidth = 100;
      
      ctx.fillStyle = '#333333';
      ctx.fillRect(barX, y - 10, barWidth, 12);
      
      ctx.fillStyle = this.getStatColor(statValue);
      ctx.fillRect(barX, y - 10, (statValue / 100) * barWidth, 12);
      
      ctx.fillStyle = isSelected ? '#ffffff' : '#cccccc';
      ctx.textAlign = 'right';
      ctx.fillText(statValue.toString(), barX + barWidth + 30, y);
    });
  }
  
  private drawAppearanceStep(ctx: CanvasRenderingContext2D): void {
    // Title with glow effect
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#0088ff';
    ctx.shadowBlur = 8;
    ctx.fillText('Ulkonäkö', this.canvas.width / 2, 100);
    ctx.shadowBlur = 0;
    
    // Character preview if available
    if (this.characterPortrait) {
      const previewSize = 150;
      const previewX = this.canvas.width - previewSize - 50;
      const previewY = 120;
      
      // Preview background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(previewX - 10, previewY - 10, previewSize + 20, previewSize + 20);
      
      ctx.strokeStyle = '#0088ff';
      ctx.lineWidth = 2;
      ctx.strokeRect(previewX - 10, previewY - 10, previewSize + 20, previewSize + 20);
      
      // Draw preview
      ctx.drawImage(this.characterPortrait, previewX, previewY, previewSize, previewSize);
      
      // Preview label
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Esikatselu', previewX + previewSize / 2, previewY + previewSize + 25);
    }
    
    const options = [
      { key: 'skinTone', name: 'Ihonväri', values: ['Vaalea', 'Keltainen', 'Ruskea', 'Tumma', 'Vihertävä'] },
      { key: 'hairColor', name: 'Hiusten väri', values: ['Musta', 'Ruskea', 'Blondi', 'Punainen', 'Valkoinen', 'Sininen', 'Vihreä', 'Violetti'] },
      { key: 'eyeColor', name: 'Silmien väri', values: ['Ruskea', 'Sininen', 'Vihreä', 'Harmaa', 'Violetti', 'Punainen'] },
      { key: 'clothingStyle', name: 'Vaatetyyli', values: ['Katutyyli', 'Bisnestyyli', 'Punk', 'Tekno'] }
    ];
    
    const startY = 180;
    const itemHeight = 60;
    
    options.forEach((option, index) => {
      const y = startY + index * itemHeight;
      const isSelected = index === this.selectedIndex;
      
      if (isSelected) {
        ctx.fillStyle = 'rgba(0, 136, 255, 0.3)';
        ctx.fillRect(100, y - 20, this.canvas.width - 200, itemHeight - 10);
      }
      
      ctx.fillStyle = isSelected ? '#ffffff' : '#cccccc';
      ctx.font = '18px "Courier New", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(option.name, 120, y);
      
      // Current selection
      const currentValue = this.characterData.appearance[option.key as keyof CharacterAppearance];
      ctx.fillStyle = '#00ff00';
      ctx.textAlign = 'right';
      ctx.fillText(option.values[currentValue] || 'N/A', this.canvas.width - 120, y);
      
      if (isSelected) {
        ctx.fillStyle = '#0088ff';
        ctx.fillText('< >', this.canvas.width - 80, y);
      }
    });
  }
  
  private drawConfirmationStep(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Vahvista hahmo', this.canvas.width / 2, 80);
    
    // Draw character portrait on the left
    if (this.characterPortrait) {
      const portraitSize = 180;
      const portraitX = 50;
      const portraitY = 120;
      
      // Portrait background with glow effect
      ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
      ctx.fillRect(portraitX - 15, portraitY - 15, portraitSize + 30, portraitSize + 30);
      
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 3;
      ctx.strokeRect(portraitX - 15, portraitY - 15, portraitSize + 30, portraitSize + 30);
      
      // Inner border
      ctx.strokeStyle = '#0088ff';
      ctx.lineWidth = 1;
      ctx.strokeRect(portraitX - 5, portraitY - 5, portraitSize + 10, portraitSize + 10);
      
      // Draw portrait
      ctx.drawImage(this.characterPortrait, portraitX, portraitY, portraitSize, portraitSize);
      
      // Character name overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
      ctx.fillRect(portraitX - 15, portraitY + portraitSize - 35, portraitSize + 30, 35);
      
      ctx.fillStyle = '#00ff00';
      ctx.font = 'bold 16px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(this.characterData.name, portraitX + portraitSize / 2, portraitY + portraitSize - 15);
    }
    
    // Character summary on the right
    const summaryX = this.characterPortrait ? 300 : this.canvas.width / 2 - 200;
    const summaryY = 150;
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('HAHMON TIEDOT', summaryX, summaryY);
    
    ctx.fillStyle = '#cccccc';
    ctx.font = '16px "Courier New", monospace';
    ctx.fillText(`Nimi: ${this.characterData.name}`, summaryX, summaryY + 30);
    ctx.fillText(`Tausta: ${this.characterData.background.name}`, summaryX, summaryY + 55);
    
    // Background description
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '12px "Courier New", monospace';
    this.wrapText(ctx, this.characterData.background.description, summaryX, summaryY + 80, 350, 16);
    
    // Show key stats with visual bars
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px "Courier New", monospace';
    ctx.fillText('PÄÄOMINAISUUDET', summaryX, summaryY + 140);
    
    const keyStats = ['strength', 'intelligence', 'charisma', 'cunning'];
    keyStats.forEach((stat, index) => {
      const value = this.characterData.stats[stat as keyof CharacterStats];
      const y = summaryY + 170 + index * 25;
      
      // Stat name
      ctx.fillStyle = '#cccccc';
      ctx.font = '12px "Courier New", monospace';
      ctx.fillText(this.getStatDisplayName(stat as keyof CharacterStats), summaryX, y);
      
      // Stat bar
      const barX = summaryX + 120;
      const barWidth = 100;
      const barHeight = 8;
      
      ctx.fillStyle = '#333333';
      ctx.fillRect(barX, y - 8, barWidth, barHeight);
      
      ctx.fillStyle = this.getStatColor(value);
      ctx.fillRect(barX, y - 8, (value / 100) * barWidth, barHeight);
      
      // Stat value
      ctx.fillStyle = '#ffffff';
      ctx.fillText(value.toString(), barX + barWidth + 10, y);
    });
    
    // Confirmation button with enhanced styling
    const buttonY = this.canvas.height - 100;
    const pulseAlpha = 0.3 + Math.sin(this.time / 200) * 0.2;
    
    ctx.fillStyle = `rgba(0, 255, 0, ${pulseAlpha})`;
    ctx.fillRect(this.canvas.width / 2 - 120, buttonY, 240, 50);
    
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 3;
    ctx.strokeRect(this.canvas.width / 2 - 120, buttonY, 240, 50);
    
    // Inner glow
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(this.canvas.width / 2 - 115, buttonY + 5, 230, 40);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('LUO HAHMO', this.canvas.width / 2, buttonY + 32);
  }
  
  private drawStepIndicator(ctx: CanvasRenderingContext2D): void {
    const steps = ['Nimi', 'Tausta', 'Pisteet', 'Ulkonäkö', 'Vahvista'];
    const stepWidth = 100;
    const startX = this.canvas.width / 2 - (steps.length * stepWidth) / 2;
    
    steps.forEach((step, index) => {
      const x = startX + index * stepWidth;
      const y = 30;
      const isActive = index === this.currentStep;
      const isCompleted = index < this.currentStep;
      
      // Step circle
      ctx.fillStyle = isActive ? '#0088ff' : (isCompleted ? '#00ff00' : '#333333');
      ctx.beginPath();
      ctx.arc(x + stepWidth / 2, y, 15, 0, Math.PI * 2);
      ctx.fill();
      
      // Step number
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText((index + 1).toString(), x + stepWidth / 2, y + 4);
      
      // Step label
      ctx.fillStyle = isActive ? '#ffffff' : '#888888';
      ctx.font = '10px "Courier New", monospace';
      ctx.fillText(step, x + stepWidth / 2, y + 30);
      
      // Connection line
      if (index < steps.length - 1) {
        ctx.strokeStyle = isCompleted ? '#00ff00' : '#333333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + stepWidth / 2 + 15, y);
        ctx.lineTo(x + stepWidth / 2 + stepWidth - 15, y);
        ctx.stroke();
      }
    });
  }
  
  private drawInstructions(ctx: CanvasRenderingContext2D): void {
    let instructions = '';
    
    switch (this.currentStep) {
      case CreationStep.NAME:
        instructions = 'Kirjoita nimi | ENTER: Jatka | ESC: Takaisin';
        break;
      case CreationStep.BACKGROUND:
        instructions = 'Nuolet: Valitse | ENTER: Jatka | ESC: Takaisin';
        break;
      case CreationStep.STATS:
        instructions = 'Nuolet: Navigoi | A/D: Muuta arvoa | ENTER: Jatka | ESC: Takaisin';
        break;
      case CreationStep.APPEARANCE:
        instructions = 'Nuolet: Navigoi | A/D: Muuta | ENTER: Jatka | ESC: Takaisin';
        break;
      case CreationStep.CONFIRMATION:
        instructions = 'ENTER: Luo hahmo | ESC: Takaisin';
        break;
    }
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, this.canvas.height - 40, this.canvas.width, 40);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(instructions, this.canvas.width / 2, this.canvas.height - 15);
  }
  
  private getStatDisplayName(stat: keyof CharacterStats): string {
    const names: Record<keyof CharacterStats, string> = {
      strength: 'Voima',
      endurance: 'Kestävyys',
      agility: 'Ketteryys',
      intelligence: 'Äly',
      perception: 'Havaintokyky',
      charisma: 'Karisma',
      willpower: 'Tahdonvoima',
      luck: 'Tuuri',
      reflex: 'Refleksi',
      tolerance: 'Toleranssi',
      stress: 'Stressinsietokyky',
      technical: 'Tekninen taito',
      crime: 'Rikollisuus',
      medical: 'Lääketiede',
      cunning: 'Oveluus'
    };
    return names[stat] || stat;
  }
  
  private getStatColor(value: number): string {
    if (value < 30) return '#ff4444';
    if (value < 50) return '#ffaa44';
    if (value < 70) return '#ffff44';
    return '#44ff44';
  }
  
  private wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number): void {
    const words = text.split(' ');
    let line = '';
    let currentY = y;
    
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      
      if (testWidth > maxWidth && i > 0) {
        ctx.fillText(line, x, currentY);
        line = words[i] + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, currentY);
  }
}
