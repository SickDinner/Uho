// UHO: Fate of the Grid - Pääpeliluokka
// Yhdistää kaikki järjestelmät toimivaksi peliksi

import { World } from '@core/ecs.ts';
import { 
  Transform, Sprite, Stats, Needs, Inventory, Wallet, Skills, 
  Addiction, LawEnforcement, AI, Vehicle 
} from '@core/components.ts';
import {
  MovementSystem, CollisionSystem, NeedsSystem, AddictionSystem,
  PoliceAISystem, VehicleSystem, EconomySystem, CombatSystem, SaveLoadSystem
} from '@core/systems.ts';
import { MapManager, TILE_TYPES } from '@core/map.ts';
import { NPCManager } from '@core/npc.ts';
import { sceneManager, Scene } from '@core/scene.ts';
import { inputManager } from '@core/input.ts';
import { tweenManager } from '@core/animation.ts';
import { getDrug } from '@data/drugs.ts';
import type { Direction, MessageType, StatKey, NeedKey } from '@core/types.ts';

// Pelin tilat
enum GameState {
  MENU = 'menu',
  PLAYING = 'playing',
  PAUSED = 'paused',
  INVENTORY = 'inventory',
  DIALOGUE = 'dialogue',
  COMBAT = 'combat'
}

// UHO:n pääpeliluokka
export class UHOGame {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  
  // ECS Core
  private world: World;
  private systems: {
    movement: MovementSystem;
    collision: CollisionSystem;
    needs: NeedsSystem;
    addiction: AddictionSystem;
    police: PoliceAISystem;
    vehicle: VehicleSystem;
    economy: EconomySystem;
    combat: CombatSystem;
    saveLoad: SaveLoadSystem;
  };
  
  // Maailma ja NPCt
  private mapManager: MapManager;
  private npcManager: NPCManager;
  
  // Pelin tila
  private gameState: GameState = GameState.MENU;
  private playerId?: number;
  private isRunning: boolean = false;
  private lastTime: number = 0;
  private turn: number = 0;
  
  // UI ja viestit
  private messages: Array<{text: string; type: 'normal' | 'system' | 'combat' | 'drug' | 'police'; timestamp: number}> = [];
  private maxMessages = 50;
  private keys: Set<string> = new Set();
  
  // UI Elementit
  private messageLog: HTMLElement;
  private statsPanel: HTMLElement;
  private needsPanel: HTMLElement;
  private cashElement: HTMLElement;
  private bankElement: HTMLElement;
  private heatElement: HTMLElement;
  
  // Dialogijärjestelmä
  private currentDialogue: {
    npcId: number;
    text: string[];
    options: { text: string; action: () => void }[];
    currentIndex: number;
  } | undefined;
  
  // Inventaariokatseluun
  private inventoryVisible: boolean = false;
  private selectedInventoryIndex: number = 0;
  
  constructor() {
    console.log('🎮 Alustamme UHO: Fate of the Grid peliä...');
    
    // Hae UI elementit
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.messageLog = document.getElementById('messageLog')!;
    this.statsPanel = document.getElementById('statsPanel')!;
    this.needsPanel = document.getElementById('needsPanel')!;
    this.cashElement = document.getElementById('cash')!;
    this.bankElement = document.getElementById('bank')!;
    this.heatElement = document.getElementById('heat')!;
    
    // Alusta ECS
    this.world = new World();
    
    // Alusta systems-objekti tyhjänä ennen initializeSystems()-kutsua
    this.systems = {} as any;
    this.initializeSystems();
    
    // Alusta maailma
    this.mapManager = new MapManager();
    this.npcManager = new NPCManager(this.world, this.mapManager);
    
    // Aseta canvas ja input
    this.setupCanvas();
    this.setupInput();
    
    // Luo pelaaja heti
    this.createPlayer();
    
    console.log('✅ UHO Game alustus valmis!');
  }
  
  private initializeSystems(): void {
    this.systems = {
      movement: new MovementSystem(this.world.componentManager),
      collision: new CollisionSystem(this.world.componentManager, this.mapManager),
      needs: new NeedsSystem(this.world.componentManager),
      addiction: new AddictionSystem(this.world.componentManager),
      police: new PoliceAISystem(this.world.componentManager),
      vehicle: new VehicleSystem(this.world.componentManager),
      economy: new EconomySystem(this.world.componentManager),
      combat: new CombatSystem(this.world.componentManager),
      saveLoad: new SaveLoadSystem(this.world.componentManager)
    };
    
    // Lisää kaikki systeemit maailmaan
    Object.values(this.systems).forEach(system => {
      this.world.addSystem(system);
    });
  }
  
  private setupCanvas(): void {
    this.canvas.width = 800;
    this.canvas.height = 600;
    this.canvas.tabIndex = 0; // Fokusta varten
    this.canvas.focus();
    
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';
  }
  
  private setupInput(): void {
    // Käytä inputManageria jos halutaan, mutta pidetään myös suora input
    document.addEventListener('keydown', (e) => {
      this.keys.add(e.key.toLowerCase());
      this.handleKeyDown(e);
      e.preventDefault();
    });
    
    document.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase());
    });
  }
  
  private handleKeyDown(e: KeyboardEvent): void {
    if (this.gameState !== GameState.PLAYING) {
      this.handleMenuInput(e);
      return;
    }
    
    const key = e.key.toLowerCase();
    
    // Dialogivalikko
    if (this.currentDialogue) {
      this.handleDialogueInput(key);
      return;
    }
    
    // Inventaario
    if (this.inventoryVisible) {
      this.handleInventoryInput(key);
      return;
    }
    
    // Pelinaikainen input
    switch (key) {
      // Liikkuminen
      case 'w':
      case 'arrowup':
        this.movePlayer('north');
        break;
      case 's':
      case 'arrowdown':
        this.movePlayer('south');
        break;
      case 'a':
      case 'arrowleft':
        this.movePlayer('west');
        break;
      case 'd':
      case 'arrowright':
        this.movePlayer('east');
        break;
      
      // Toiminnot
      case 'e':
        this.interact();
        break;
      case 'i':
        this.toggleInventory();
        break;
      case 't':
        this.rest();
        break;
      case 'f':
        this.steal();
        break;
      case ' ':
        this.contextAction();
        break;
      case 'escape':
        this.gameState = GameState.PAUSED;
        break;
        
      // Testikäyttöön päihteet
      case '1':
        this.useDrug('alkoholi');
        break;
      case '2':
        this.useDrug('kannabis');
        break;
      case '3':
        this.useDrug('amfetamiini');
        break;
    }
  }
  
  private handleMenuInput(e: KeyboardEvent): void {
    // Tämä integroitaisiin scene managerin kanssa
    if (e.key === 'Enter') {
      this.startGame();
    }
  }
  
  private handleDialogueInput(key: string): void {
    if (!this.currentDialogue) return;
    
    switch (key) {
      case 'arrowup':
        if (this.currentDialogue.currentIndex > 0) {
          this.currentDialogue.currentIndex--;
        }
        break;
      case 'arrowdown':
        if (this.currentDialogue.currentIndex < this.currentDialogue.options.length - 1) {
          this.currentDialogue.currentIndex++;
        }
        break;
      case 'enter':
        const selectedOption = this.currentDialogue.options[this.currentDialogue.currentIndex];
        selectedOption.action();
        this.currentDialogue = undefined;
        break;
      case 'escape':
        this.currentDialogue = undefined;
        break;
    }
  }
  
  private handleInventoryInput(key: string): void {
    const inventory = this.world.componentManager.getComponent(this.playerId!, Inventory);
    if (!inventory) return;
    
    switch (key) {
      case 'arrowup':
        if (this.selectedInventoryIndex > 0) {
          this.selectedInventoryIndex--;
        }
        break;
      case 'arrowdown':
        // Yksinkertainen navigointi - inventaario tulossa
        this.selectedInventoryIndex = Math.max(0, this.selectedInventoryIndex + 1);
        break;
      case 'enter':
        this.useInventoryItem(this.selectedInventoryIndex);
        break;
      case 'i':
      case 'escape':
        this.toggleInventory();
        break;
    }
  }
  
  private createPlayer(): void {
    const player = this.world.createEntity();
    this.playerId = player.id;
    
    // Lisää komponentit
    this.world.componentManager.addComponent(new Transform(player.id, 40, 30, 'south'));
    this.world.componentManager.addComponent(new Sprite(player.id, 'player'));
    
    // Alusta tilastot
    const stats = new Stats(player.id);
    stats.modifyStat('strength', 50);
    stats.modifyStat('endurance', 50);
    stats.modifyStat('agility', 50);
    stats.modifyStat('intelligence', 50);
    stats.modifyStat('perception', 50);
    stats.modifyStat('charisma', 50);
    stats.modifyStat('willpower', 50);
    stats.modifyStat('luck', 50);
    stats.modifyStat('reflex', 50);
    stats.modifyStat('tolerance', 50);
    stats.modifyStat('stress', 50);
    stats.modifyStat('technical', 50);
    // stats.modifyStat('criminal', 25); // Poistettu väliaikaisesti
    stats.modifyStat('medical', 25);
    stats.modifyStat('cunning', 50);
    this.world.componentManager.addComponent(stats);
    
    // Alusta tarpeet
    const needs = new Needs(player.id);
    needs.modifyNeed('hunger', 80);
    needs.modifyNeed('thirst', 70);
    needs.modifyNeed('sleep', 90);
    needs.modifyNeed('warmth', 75);
    needs.modifyNeed('social', 60);
    needs.modifyNeed('pain', 10);
    needs.modifyNeed('hygiene', 50);
    this.world.componentManager.addComponent(needs);
    
    // Talous
    const wallet = new Wallet(player.id);
    wallet.cash = 100;
    wallet.bank = 500;
    this.world.componentManager.addComponent(wallet);
    
    // Lainvalvonta
    this.world.componentManager.addComponent(new LawEnforcement(player.id));
    
    // Inventaario
    this.world.componentManager.addComponent(new Inventory(player.id));
    
    // Taidot
    this.world.componentManager.addComponent(new Skills(player.id));
    
    // Riippuvuudet
    this.world.componentManager.addComponent(new Addiction(player.id));
    
    this.addMessage('Tervetuloa UHO: Fate of the Grid -peliin!', 'system');
    this.addMessage('Käytä WASD liikkumiseen, E vuorovaikutukseen, I inventaarioon', 'system');
    this.addMessage('T = lepää, F = varasta, Välilyönti = kontekstitoiminto', 'system');
    this.addMessage('Numerot 1-3 = testaa päihteitä (alkoholi, kannabis, amfetamiini)', 'system');
  }
  
  // Pelaajan liikkuminen
  private movePlayer(direction: Direction): void {
    if (!this.playerId) return;
    
    const transform = this.world.componentManager.getComponent(this.playerId, Transform);
    if (!transform) return;
    
    // Tallenna vanha sijainti törmäyksen varalta
    const oldX = transform.x;
    const oldY = transform.y;
    
    // Yritä liikkua käyttäen collision systemiä
    const moveSuccessful = this.systems.collision.attemptMove(this.playerId, direction);
    
    if (moveSuccessful) {
      console.log(`🚶 Player moved ${direction} to (${transform.x}, ${transform.y})`);
      this.processTurn();
    } else {
      // Liike estyy - anna pelaajalle viesti
      const reason = this.getCollisionReason(direction, oldX, oldY);
      this.addMessage(reason, 'normal');
      
      // Päivitä facing vaikka liike estyykin
      transform.facing = direction;
    }
  }
  
  // Selvitä miksi liike esty
  private getCollisionReason(direction: Direction, x: number, y: number): string {
    let newX = x;
    let newY = y;
    
    switch (direction) {
      case 'north': newY -= 1; break;
      case 'south': newY += 1; break;
      case 'west': newX -= 1; break;
      case 'east': newX += 1; break;
    }
    
    // Tarkista syy
    if (newX < 0 || newY < 0 || newX >= 256 || newY >= 256) {
      return 'Et voi mennä maailman rajojen ulkopuolelle.';
    }
    
    if (this.systems.collision.isObstacle(newX, newY)) {
      return 'Tiellä on rakennus tai este.';
    }
    
    // Tarkista onko toinen NPC paikalla
    const allNPCs = this.npcManager.getAllNPCs();
    for (const npc of allNPCs) {
      if (Math.floor(npc.transform.x) === Math.floor(newX) && 
          Math.floor(npc.transform.y) === Math.floor(newY)) {
        return `${npc.def.name} on tiellä.`;
      }
    }
    
    return 'Et voi liikkua tuohon suuntaan.';
  }
  
  // Vuoron käsittely
  private processTurn(): void {
    this.turn++;
    
    // Päivitä järjestelmät
    this.world.update(16); // ~16ms delta time
    
    // Päivitä UI
    this.updateUI();
  }
  
  // Vuorovaikutus
  private interact(): void {
    if (!this.playerId) return;
    
    const transform = this.world.componentManager.getComponent(this.playerId, Transform);
    if (!transform) return;
    
    // Etsi lähistöltä NPCjä
    const nearbyNPCs = this.npcManager.getNearbyNPCs(transform.x, transform.y, 1);
    
    if (nearbyNPCs.length > 0) {
      const npc = nearbyNPCs[0];
      this.startDialogue(npc.id, npc.def.name, this.generateNPCDialogue(npc.def.type));
    } else {
      this.addMessage('Ei mitään vuorovaikutettavaa lähettyvillä.', 'normal');
    }
    
    this.processTurn();
  }
  
  private generateNPCDialogue(npcType: string): { text: string[]; options: { text: string; action: () => void }[] } {
    switch (npcType) {
      case 'dealer':
        return {
          text: ['Hei... tartteks jotain erikoista?', 'Minulla on hyvää tavaraa.'],
          options: [
            { text: 'Myy kannabista (50€)', action: () => this.buyDrug('kannabis', 50) },
            { text: 'Myy amfetamiinia (100€)', action: () => this.buyDrug('amfetamiini', 100) },
            { text: 'Ei kiitos', action: () => {} }
          ]
        };
      case 'police':
        return {
          text: ['Kaikki kunnossa täällä?', 'Älä aiheuta häiriötä.'],
          options: [
            { text: 'Joo, kaikki hyvin', action: () => {} },
            { text: 'Mitä se sinulle kuuluu?', action: () => this.increaseHeat(5) }
          ]
        };
      // case 'merchant':
      //   return {
      //     text: ['Mitä kauppiaalle kuuluu?', 'Onko ostettavaa vai myytävää?'],
      //     options: [
      //       { text: 'Näytä tavarat', action: () => this.openShop() },
      //       { text: 'Ei mitään', action: () => {} }
      //     ]
      //   };
      default:
        return {
          text: ['Moi.', 'Kiire meikäläisellä.'],
          options: [
            { text: 'Okei, nähdään', action: () => {} }
          ]
        };
    }
  }
  
  private startDialogue(npcId: number, npcName: string, dialogue: { text: string[]; options: { text: string; action: () => void }[] }): void {
    this.currentDialogue = {
      npcId,
      text: [`${npcName}:`, ...dialogue.text],
      options: dialogue.options,
      currentIndex: 0
    };
    
    this.gameState = GameState.DIALOGUE;
  }
  
  // Kaupan avaaminen
  private openShop(): void {
    this.addMessage('Kauppa-toiminnallisuus tulossa!', 'system');
  }
  
  // Päihteen ostaminen
  private buyDrug(drugId: string, price: number): void {
    if (!this.playerId) return;
    
    const wallet = this.world.componentManager.getComponent(this.playerId, Wallet);
    if (!wallet) return;
    
    if (wallet.cash >= price) {
      wallet.cash -= price;
      
      // Lisää inventaarioon (yksinkertaistettu)
      const inventory = this.world.componentManager.getComponent(this.playerId, Inventory);
      if (inventory) {
        // Yksinkertaistettu inventaarion käyttö - oikeassa toteutuksessa lisättäisiin ItemRef
        console.log(`Ostettiin ${getDrug(drugId)?.name} ${price}€:lla (inventaario-toiminnallisuus tulossa)`);
        this.addMessage(`Ostit ${getDrug(drugId)?.name} ${price}€:lla.`, 'normal');
      }
    } else {
      this.addMessage('Ei ole tarpeeksi rahaa!', 'normal');
    }
  }
  
  // Kuumuuden kasvattaminen
  private increaseHeat(amount: number): void {
    if (!this.playerId) return;
    
    const law = this.world.componentManager.getComponent(this.playerId, LawEnforcement);
    if (law) {
      law.heat = Math.min(100, law.heat + amount);
      this.addMessage(`Poliisi on kiinnostunut sinusta. Kuumuus: ${law.heat}`, 'police');
    }
  }
  
  // Päihteen käyttö
  private useDrug(drugId: string): void {
    if (!this.playerId) return;
    
    const drug = getDrug(drugId);
    if (!drug) {
      this.addMessage(`Päihde '${drugId}' ei löydy!`, 'system');
      return;
    }
    
    // Käytä AddictionSystemin metodia
    const success = this.systems.addiction.consumeDrug(this.playerId, drugId);
    
    if (success) {
      this.addMessage(`Käytit ${drug.name}. ${drug.desc}`, 'drug');
      this.addMessage('Tunnet vaikutuksen alkavan...', 'drug');
    } else {
      this.addMessage(`${drug.name} aiheutti yliannostuksen! Olet huonovointinen.`, 'drug');
    }
    
    this.processTurn();
  }
  
  // Lepää
  private rest(): void {
    if (!this.playerId) return;
    
    const needs = this.world.componentManager.getComponent(this.playerId, Needs);
    if (needs) {
      needs.modifyNeed('sleep', 30);
      needs.modifyNeed('hunger', -5);
      needs.modifyNeed('thirst', -5);
      this.addMessage('Levähdit hetken. Tunnet olosi virkistyneemmäksi.', 'normal');
    }
    
    this.processTurn();
  }
  
  // Varkaus
  private steal(): void {
    this.addMessage('Yritit varastaa, mutta et löytänyt mitään.', 'normal');
    
    // Lisää hieman kuumuutta
    this.increaseHeat(2);
    
    this.processTurn();
  }
  
  // Kontekstitoiminto
  private contextAction(): void {
    this.addMessage('Kontekstitoiminto - tähän tulee kontekstisidonnaista toiminnallisuutta.', 'system');
    this.processTurn();
  }
  
  // Inventaarion toggle
  private toggleInventory(): void {
    this.inventoryVisible = !this.inventoryVisible;
    this.selectedInventoryIndex = 0;
    
    if (this.inventoryVisible) {
      this.gameState = GameState.INVENTORY;
    } else {
      this.gameState = GameState.PLAYING;
    }
  }
  
  // Inventaariossa olevan esineen käyttö
  private useInventoryItem(index: number): void {
    if (!this.playerId) return;
    
    const inventory = this.world.componentManager.getComponent(this.playerId, Inventory);
    if (!inventory || index >= inventory.items.length) return;
    
    const item = inventory.items[index];
    
    // Yksinkertaistettu käyttö - inventaario-toiminnallisuus tulossa
    this.addMessage('Inventaarion esineiden käyttö tulossa tulevassa versiossa!', 'system');
    console.log('Inventory item use:', index);
  }
  
  // UI:n päivitys
  private updateUI(): void {
    if (!this.playerId) return;
    
    const stats = this.world.componentManager.getComponent(this.playerId, Stats);
    const needs = this.world.componentManager.getComponent(this.playerId, Needs);
    const wallet = this.world.componentManager.getComponent(this.playerId, Wallet);
    const law = this.world.componentManager.getComponent(this.playerId, LawEnforcement);
    
    // Päivitä tilastot
    if (stats && this.statsPanel) {
      let statsHTML = '';
      const statNames: StatKey[] = ['strength', 'endurance', 'agility', 'intelligence', 'perception', 'charisma', 'willpower', 'luck'];
      
      statNames.forEach(stat => {
        const value = stats.getStat(stat);
        statsHTML += `<div class="stat-row"><span>${this.translateStat(stat)}:</span><span>${value}</span></div>`;
      });
      
      this.statsPanel.innerHTML = statsHTML;
    }
    
    // Päivitä tarpeet
    if (needs && this.needsPanel) {
      let needsHTML = '';
      const needNames: NeedKey[] = ['hunger', 'thirst', 'sleep', 'warmth', 'social', 'pain', 'hygiene'];
      
      needNames.forEach(need => {
        const value = needs.getNeed(need);
        const fillClass = value > 60 ? '' : value > 30 ? 'low' : 'critical';
        needsHTML += `
          <div>${this.translateNeed(need)}:</div>
          <div class="need-bar">
            <div class="need-fill ${fillClass}" style="width: ${value}%"></div>
          </div>
        `;
      });
      
      this.needsPanel.innerHTML = needsHTML;
    }
    
    // Päivitä talous ja lainvalvonta
    if (wallet) {
      if (this.cashElement) this.cashElement.textContent = `${wallet.cash}€`;
      if (this.bankElement) this.bankElement.textContent = `${wallet.bank}€`;
    }
    
    if (law && this.heatElement) {
      this.heatElement.textContent = law.heat.toString();
      this.heatElement.style.color = law.heat > 50 ? '#ff0000' : law.heat > 25 ? '#ffff00' : '#00ff00';
    }
  }
  
  // Apumetodit käännöksille
  private translateStat(stat: StatKey): string {
    const translations: Partial<Record<StatKey, string>> = {
      strength: 'Voima',
      endurance: 'Kestävyys',
      agility: 'Ketteryys',
      intelligence: 'Älykkyys',
      perception: 'Havainto',
      charisma: 'Karisma',
      willpower: 'Tahdonvoima',
      luck: 'Onni',
      reflex: 'Refleksit',
      tolerance: 'Sietokyky',
      stress: 'Stressinsietokyky',
      technical: 'Tekninen taito',
      medical: 'Lääketieto',
      cunning: 'Ovela'
    };
    return translations[stat] || stat;
  }
  
  private translateNeed(need: NeedKey): string {
    const translations: Record<NeedKey, string> = {
      hunger: 'Nälkä',
      thirst: 'Jano',
      sleep: 'Uni',
      warmth: 'Lämpö',
      social: 'Sosiaalisuus',
      pain: 'Kipu',
      hygiene: 'Hygienia'
    };
    return translations[need] || need;
  }
  
  // Viestien lisäys
  private addMessage(text: string, type: 'normal' | 'system' | 'combat' | 'drug' | 'police'): void {
    this.messages.push({ text, type, timestamp: Date.now() });
    
    if (this.messages.length > this.maxMessages) {
      this.messages.shift();
    }
    
    // Päivitä viestiloki
    if (this.messageLog) {
      const messageElement = document.createElement('div');
      messageElement.className = `message ${type}`;
      messageElement.textContent = text;
      this.messageLog.appendChild(messageElement);
      this.messageLog.scrollTop = this.messageLog.scrollHeight;
      
      // Rajoita viestilokin kokoa
      while (this.messageLog.children.length > this.maxMessages) {
        this.messageLog.removeChild(this.messageLog.firstChild!);
      }
    }
  }
  
  // Pelin käynnistys
  public async start(): Promise<void> {
    console.log('🚀 Käynnistetään UHO peli...');
    
    // Spawn NPCs
    this.npcManager.spawnRandomNPCs();
    
    this.isRunning = true;
    this.gameState = GameState.PLAYING;
    this.lastTime = performance.now();
    
    // Käynnistä peli-loop
    requestAnimationFrame(this.gameLoop.bind(this));
    
    this.updateUI();
    
    this.addMessage('🎮 UHO: Fate of the Grid käynnistetty!', 'system');
    this.addMessage('🌆 Olet kadulla Suomessa. Selviydy ja menesty.', 'system');
    this.addMessage('💊 Huomaa: päihteet ovat vaarallisia ja aiheuttavat riippuvuutta.', 'system');
  }
  
  public startGame(): void {
    this.gameState = GameState.PLAYING;
  }
  
  // Peli-loop
  private gameLoop(currentTime: number): void {
    if (!this.isRunning) return;
    
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    
    // Päivitä animaatiot
    tweenManager.update(currentTime);
    
    // Renderöi
    this.render();
    
    // Jatka looppia
    requestAnimationFrame(this.gameLoop.bind(this));
  }
  
  // Renderöinti
  private render(): void {
    // Tyhjennä canvas
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Renderöi kartta
    this.renderMap();
    
    // Renderöi pelaaja
    this.renderPlayer();
    
    // Renderöi NPCt
    this.renderNPCs();
    
    // Renderöi UI overlay
    this.renderUIOverlay();
  }
  
  private renderMap(): void {
    const tileSize = 8;
    const map = this.mapManager.getCurrentMap();
    
    if (!this.playerId) return;
    
    const playerTransform = this.world.componentManager.getComponent(this.playerId, Transform);
    if (!playerTransform) return;
    
    // Kamera seuraa pelaajaa
    const cameraX = playerTransform.x * tileSize - this.canvas.width / 2;
    const cameraY = playerTransform.y * tileSize - this.canvas.height / 2;
    
    // Renderöi näkyvä alue
    const startX = Math.max(0, Math.floor(cameraX / tileSize));
    const endX = Math.min(map.width - 1, Math.ceil((cameraX + this.canvas.width) / tileSize));
    const startY = Math.max(0, Math.floor(cameraY / tileSize));
    const endY = Math.min(map.height - 1, Math.ceil((cameraY + this.canvas.height) / tileSize));
    
    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        const tileId = map.tiles[y][x];
        const tileType = Object.values(TILE_TYPES)[tileId] || TILE_TYPES.empty;
        
        const screenX = x * tileSize - cameraX;
        const screenY = y * tileSize - cameraY;
        
        this.ctx.fillStyle = this.getTileColor(tileId);
        this.ctx.fillRect(screenX, screenY, tileSize, tileSize);
        
        // Lisää reunat rakennuksille
        if (!tileType.walkable) {
          this.ctx.strokeStyle = '#666';
          this.ctx.lineWidth = 1;
          this.ctx.strokeRect(screenX, screenY, tileSize, tileSize);
        }
      }
    }
  }
  
  private getTileColor(tileId: number): string {
    const colors = [
      '#001122', // empty
      '#444444', // street
      '#666666', // sidewalk
      '#8B4513', // building
      '#32CD32', // shop
      '#FF6347', // hospital
      '#FFD700', // bank
      '#8B008B', // dealer
      '#4169E1', // safe house
      '#DC143C'  // police
    ];
    return colors[tileId] || colors[0];
  }
  
  private renderPlayer(): void {
    if (!this.playerId) return;
    
    const transform = this.world.componentManager.getComponent(this.playerId, Transform);
    if (!transform) return;
    
    const tileSize = 8;
    const playerX = this.canvas.width / 2;
    const playerY = this.canvas.height / 2;
    
    // Pelaajan väri
    this.ctx.fillStyle = '#ffff00';
    this.ctx.fillRect(playerX - tileSize/2, playerY - tileSize/2, tileSize, tileSize);
    
    // Suunta-indikaattori
    this.ctx.fillStyle = '#ffffff';
    const centerX = playerX;
    const centerY = playerY;
    
    switch (transform.facing) {
      case 'north':
        this.ctx.fillRect(centerX - 1, centerY - 3, 2, 1);
        break;
      case 'south':
        this.ctx.fillRect(centerX - 1, centerY + 2, 2, 1);
        break;
      case 'west':
        this.ctx.fillRect(centerX - 3, centerY - 1, 1, 2);
        break;
      case 'east':
        this.ctx.fillRect(centerX + 2, centerY - 1, 1, 2);
        break;
    }
  }
  
  private renderNPCs(): void {
    if (!this.playerId) return;
    
    const playerTransform = this.world.componentManager.getComponent(this.playerId, Transform);
    if (!playerTransform) return;
    
    const tileSize = 8;
    const allNPCs = this.npcManager.getAllNPCs();
    
    for (const npc of allNPCs) {
      const relativeX = (npc.transform.x - playerTransform.x) * tileSize + this.canvas.width / 2;
      const relativeY = (npc.transform.y - playerTransform.y) * tileSize + this.canvas.height / 2;
      
      // Renderöi vain näkyvät NPCt
      if (relativeX >= -tileSize && relativeX <= this.canvas.width && 
          relativeY >= -tileSize && relativeY <= this.canvas.height) {
        
        // NPC väri tyypin mukaan
        let color = '#0088ff'; // Default sininen
        switch (npc.def.type) {
          case 'police':
            color = '#ff0000';
            break;
          case 'dealer':
            color = '#8B008B';
            break;
          // case 'merchant':
          //   color = '#32CD32';
          //   break;
        }
        
        this.ctx.fillStyle = color;
        this.ctx.fillRect(relativeX - tileSize/2, relativeY - tileSize/2, tileSize, tileSize);
      }
    }
  }
  
  private renderUIOverlay(): void {
    // Renderöi dialogi
    if (this.currentDialogue) {
      this.renderDialogue();
    }
    
    // Renderöi inventaario
    if (this.inventoryVisible) {
      this.renderInventory();
    }
    
    // Renderöi pelin tila
    if (this.gameState === GameState.PAUSED) {
      this.renderPauseMenu();
    }
  }
  
  private renderDialogue(): void {
    if (!this.currentDialogue) return;
    
    const padding = 20;
    const dialogueHeight = 200;
    const dialogueY = this.canvas.height - dialogueHeight - padding;
    
    // Tausta
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(padding, dialogueY, this.canvas.width - padding * 2, dialogueHeight);
    
    // Reunus
    this.ctx.strokeStyle = '#ffff00';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(padding, dialogueY, this.canvas.width - padding * 2, dialogueHeight);
    
    // Teksti
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '12px Courier New';
    
    let y = dialogueY + 20;
    
    // Dialogi teksti
    for (const line of this.currentDialogue.text) {
      this.ctx.fillText(line, padding + 10, y);
      y += 16;
    }
    
    y += 10;
    
    // Vaihtoehdot
    for (let i = 0; i < this.currentDialogue.options.length; i++) {
      const option = this.currentDialogue.options[i];
      const isSelected = i === this.currentDialogue.currentIndex;
      
      this.ctx.fillStyle = isSelected ? '#ffff00' : '#cccccc';
      this.ctx.fillText(`${isSelected ? '> ' : '  '}${option.text}`, padding + 20, y);
      y += 16;
    }
  }
  
  private renderInventory(): void {
    if (!this.playerId) return;
    
    const inventory = this.world.componentManager.getComponent(this.playerId, Inventory);
    if (!inventory) return;
    
    const padding = 50;
    const inventoryWidth = this.canvas.width - padding * 2;
    const inventoryHeight = this.canvas.height - padding * 2;
    
    // Tausta
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    this.ctx.fillRect(padding, padding, inventoryWidth, inventoryHeight);
    
    // Reunus
    this.ctx.strokeStyle = '#ffff00';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(padding, padding, inventoryWidth, inventoryHeight);
    
    // Otsikko
    this.ctx.fillStyle = '#ffff00';
    this.ctx.font = '16px Courier New';
    this.ctx.fillText('INVENTAARIO', padding + 10, padding + 25);
    
    // Esineet
    this.ctx.font = '12px Courier New';
    let y = padding + 50;
    
    // Yksinkertaistettu inventaario - tulossa tulevassa versiossa
    this.ctx.fillStyle = '#cccccc';
    this.ctx.fillText('  Inventaario-toiminnallisuus tulossa!', padding + 20, y);
    this.ctx.fillText('  Peruspelit toimivat jo nyt.', padding + 20, y + 16);
    
    // Ohjeet
    this.ctx.fillStyle = '#888888';
    this.ctx.font = '10px Courier New';
    this.ctx.fillText('Nuolet: Liiku, Enter: Käytä, I/Esc: Sulje', padding + 10, padding + inventoryHeight - 20);
  }
  
  private renderPauseMenu(): void {
    // Tausta
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Pause teksti
    this.ctx.fillStyle = '#ffff00';
    this.ctx.font = '24px Courier New';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('PELI PYSÄYTETTY', this.canvas.width / 2, this.canvas.height / 2);
    
    this.ctx.font = '12px Courier New';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText('Paina ESC jatkaaksesi', this.canvas.width / 2, this.canvas.height / 2 + 30);
    
    this.ctx.textAlign = 'left'; // Palauta alkuperäinen
  }
  
  public stop(): void {
    this.isRunning = false;
  }
}