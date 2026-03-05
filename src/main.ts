import { Renderer, type RenderCell } from './core/renderer';
import { InputHandler, type Command } from './core/input';
import { RNG } from './core/rng';
import { GameLog } from './core/log';
import { World, type ZoneDefinition, type ZoneExit } from './game/world';
import { Player } from './game/player';
import { PillCatalog, type PillBlueprint } from './game/items';
import { NPCManager, type NPC } from './game/npcs';
import { CombatEncounter, type CombatAction, type CombatResolution } from './game/combat';
import { EventDirector } from './game/events';

interface UIElements {
  statsPanel: HTMLElement;
  inventoryList: HTMLElement;
  inventoryPanel: HTMLElement;
  zoneTitle: HTMLElement;
  zoneDescription: HTMLElement;
  statusPanel: HTMLElement;
}

type GameMode = 'explore' | 'combat' | 'dead';

async function loadJSON<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.statusText}`);
  }
  return (await response.json()) as T;
}

class PillKospiGame {
  private renderer: Renderer;
  private input = new InputHandler();
  private rng = new RNG();
  private log: GameLog;
  private world: World;
  private player: Player;
  private npcManager = new NPCManager();
  private combat: CombatEncounter | undefined;
  private eventDirector: EventDirector;
  private mode: GameMode = 'explore';
  private ui: UIElements;
  private inventoryCollapsed = false;

  constructor(pills: PillBlueprint[], zones: ZoneDefinition[]) {
    const canvas = document.getElementById('gameCanvas');
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error('Canvas element not found');
    }

    const statsPanel = document.getElementById('statsPanel');
    const inventoryList = document.getElementById('inventoryList');
    const inventoryPanel = document.getElementById('inventoryPanel');
    const zoneTitle = document.getElementById('zoneTitle');
    const zoneDescription = document.getElementById('zoneDescription');
    const statusPanel = document.getElementById('statusPanel');
    const messageLog = document.getElementById('messageLog');

    if (!statsPanel || !inventoryList || !inventoryPanel || !zoneTitle || !zoneDescription || !statusPanel || !messageLog) {
      throw new Error('UI elements missing');
    }

    this.ui = {
      statsPanel,
      inventoryList,
      inventoryPanel,
      zoneTitle,
      zoneDescription,
      statusPanel
    };

    this.world = new World(zones);

    const startZone = this.world.getZone('torkyturpa-bar');
    this.renderer = new Renderer(canvas, startZone.width, startZone.height);
    this.log = new GameLog(messageLog);

    const catalog = new PillCatalog(pills, this.rng);
    this.player = new Player(catalog);
    this.player.inventory.addRandomPill(this.rng);
    this.player.inventory.addRandomPill(this.rng);

    this.eventDirector = new EventDirector(this.rng);

    this.player.setPosition(4, 9, 'torkyturpa-bar');
    this.log.push('Pill Kospi staggers into Mikä Ikä Land, pockets rattling with questionable pills.', 'system');
    const ambient = this.world.randomAmbient(this.player.zoneId, this.rng);
    if (ambient) {
      this.log.push(ambient, 'event');
    }
  }

  start(): void {
    this.input.onCommand(this.handleCommand);
    this.refresh();
  }

  private handleCommand = (command: Command): void => {
    if (this.mode === 'dead') {
      return;
    }

    if (this.mode === 'combat') {
      this.handleCombatCommand(command);
    } else {
      this.handleExploreCommand(command);
    }

    this.refresh();
  };

  private handleExploreCommand(command: Command): void {
    switch (command) {
      case 'move-up':
        this.attemptMove(0, -1);
        break;
      case 'move-down':
        this.attemptMove(0, 1);
        break;
      case 'move-left':
        this.attemptMove(-1, 0);
        break;
      case 'move-right':
        this.attemptMove(1, 0);
        break;
      case 'wait':
        this.log.push('You lean against a sticky wall and listen to the gossiping mould.', 'system');
        this.eventDirector.tick(this.player.zoneId, this.player, this.player.inventory, this.log);
        if (!this.player.alive) {
          this.handleDeath();
        }
        break;
      case 'interact':
        this.interact();
        break;
      case 'use-pill':
        this.usePill();
        break;
      case 'toggle-inventory':
        this.toggleInventory();
        break;
      default:
        break;
    }
  }

  private handleCombatCommand(command: Command): void {
    if (!this.combat) {
      this.mode = 'explore';
      return;
    }

    const actionMap: Record<Command, CombatAction | undefined> = {
      'action-1': 'slap',
      'action-2': 'kick',
      'action-3': 'spray',
      'action-4': 'rice-grenade',
      'move-up': undefined,
      'move-down': undefined,
      'move-left': undefined,
      'move-right': undefined,
      wait: 'wait',
      interact: undefined,
      'use-pill': undefined,
      'toggle-inventory': undefined
    };

    if (command === 'toggle-inventory') {
      this.toggleInventory();
      return;
    }

    if (command === 'use-pill') {
      const used = this.usePill();
      if (used && this.combat) {
        this.resolveCombatTurn(this.combat.playerAction('wait'));
      }
      return;
    }

    const action = actionMap[command];
    if (!action) {
      this.log.push('Combat jazz hands accomplish nothing. Use 1-4 or Q.', 'system');
      return;
    }

    this.resolveCombatTurn(this.combat.playerAction(action));
  }

  private resolveCombatTurn(resolution: CombatResolution): void {
    if (!this.combat) {
      return;
    }

    if (resolution.type === 'victory') {
      this.finishCombat(resolution.enemy);
      return;
    }

    if (resolution.type === 'defeat') {
      this.handleDeath();
      return;
    }
  }

  private attemptMove(dx: number, dy: number): void {
    const zoneId = this.player.zoneId;
    const newX = this.player.x + dx;
    const newY = this.player.y + dy;

    if (!this.world.isWalkable(zoneId, newX, newY)) {
      this.log.push('You collide with a sweaty wall. It moans approvingly.', 'system');
      return;
    }

    const npc = this.npcManager.findNPC(zoneId, newX, newY);
    if (npc) {
      this.log.push(`${npc.name} blocks the way, dripping ${npc.description.toLowerCase()}.`, npc.type === 'flirt' ? 'flirt' : 'combat');
      return;
    }

    this.player.setPosition(newX, newY);

    const exit = this.world.getExit(zoneId, newX, newY);
    if (exit) {
      this.travel(exit);
      return;
    }

    this.eventDirector.tick(zoneId, this.player, this.player.inventory, this.log);
    if (!this.player.alive) {
      this.handleDeath();
    }
  }

  private interact(): void {
    const target = this.findAdjacentNPC();
    if (target) {
      if (target.type === 'flirt') {
        this.handleFlirt(target);
      } else {
        this.beginCombat(target);
      }
      return;
    }

    const exit = this.world.getExit(this.player.zoneId, this.player.x, this.player.y);
    if (exit) {
      this.travel(exit);
      return;
    }

    this.log.push('You whisper to the fog. It whistles back “mitä sä haluut?”.', 'system');
  }

  private findAdjacentNPC(): NPC | undefined {
    const zoneId = this.player.zoneId;
    const npcs = this.npcManager.getNPCsForZone(zoneId);
    return npcs.find((npc) =>
      npc.alive &&
      Math.abs(npc.x - this.player.x) + Math.abs(npc.y - this.player.y) === 1
    );
  }

  private handleFlirt(npc: NPC): void {
    this.log.push(`You attempt to flirt with ${npc.name}.`, 'flirt');
    const roll = this.player.stats.charm + this.rng.range(1, 6) - this.player.stats.shame;
    const difficulty = (npc.flirtDifficulty ?? 4) + this.rng.range(0, 4);

    if (roll > difficulty) {
      this.log.push(`${npc.name} swoons, mumbling “sä oot niin syntisen siisti”.`, 'flirt');
      this.player.reduceShame(2);
      this.player.adjustStat('groove', 1);
      this.npcManager.markDefeated(npc);
      this.npcManager.grantLoot(npc, (loot) => {
        if (loot.riceGrenades) {
          this.player.inventory.addRiceGrenades(loot.riceGrenades);
          this.log.push(`You acquire ${loot.riceGrenades} rice grenade(s) as a flirty door prize.`, 'loot');
        }
        if (loot.pill) {
          const pill = this.player.inventory.addRandomPill(this.rng);
          this.log.push(`${npc.name} slips you ${pill.blueprint.name} with a wink.`, 'loot');
        }
      });
    } else {
      this.log.push(`${npc.name} laughs, “ei tänään, sädekehä-poju.” Shame intensifies.`, 'flirt');
      this.player.increaseShame(2);
    }
  }

  private beginCombat(npc: NPC): void {
    this.mode = 'combat';
    this.combat = new CombatEncounter(
      this.player,
      npc,
      this.player.inventory,
      this.rng,
      this.log,
      {
        zoneId: this.player.zoneId,
        onSummonBoss: (bossId) => (bossId === 'ankkel-penssi' ? this.npcManager.reviveOrSpawnAnkkel() : undefined)
      }
    );

    this.log.push(`Combat begins! ${npc.name} ${npc.description}.`, npc.type === 'boss' ? 'boss' : 'combat');
  }

  private finishCombat(enemy: NPC): void {
    this.npcManager.markDefeated(enemy);
    this.mode = 'explore';
    this.combat = undefined;
    this.log.push(`${enemy.name} collapses into absurd confetti.`, enemy.type === 'boss' ? 'boss' : 'combat');

    this.npcManager.grantLoot(enemy, (loot) => {
      if (loot.riceGrenades) {
        this.player.inventory.addRiceGrenades(loot.riceGrenades);
        this.log.push(`Loot: ${loot.riceGrenades} rice grenade(s) salvaged from the remains.`, 'loot');
      }
      if (loot.pill) {
        const pill = this.player.inventory.addRandomPill(this.rng);
        this.log.push(`Loot: ${pill.blueprint.name} sticks to your palm.`, 'loot');
      }
    });
  }

  private handleDeath(): void {
    this.mode = 'dead';
    this.combat = undefined;
    this.log.push('Pill Kospi has ascended to Zäksön’s Neverland.', 'death');
  }

  private usePill(): boolean {
    if (!this.player.inventory.hasPills()) {
      this.log.push('Your pockets crinkle with receipts, not pills.', 'system');
      return false;
    }

    this.player.inventory.usePill(0, {
      player: this.player,
      log: this.log,
      rng: this.rng,
      inventory: this.player.inventory
    });
    if (!this.player.alive) {
      this.handleDeath();
    }
    return true;
  }

  private toggleInventory(): void {
    this.inventoryCollapsed = !this.inventoryCollapsed;
    this.ui.inventoryPanel.classList.toggle('collapsed', this.inventoryCollapsed);
  }

  private travel(exit: ZoneExit): void {
    this.log.push(exit.label, 'system');
    this.player.setPosition(exit.spawn.x, exit.spawn.y, exit.to);
    this.mode = 'explore';
    this.combat = undefined;
    const ambient = this.world.randomAmbient(exit.to, this.rng);
    if (ambient) {
      this.log.push(ambient, 'event');
    }
  }

  private refresh(): void {
    this.render();
    this.updateUI();
  }

  private render(): void {
    const grid = this.world.getBaseRenderGrid(this.player.zoneId);
    const npcs = this.npcManager.getNPCsForZone(this.player.zoneId).filter((npc) => npc.alive);

    npcs.forEach((npc) => {
      const cell: RenderCell = {
        char: npc.icon,
        fg: npc.color,
        bg: npc.type === 'boss' ? 'rgba(255, 120, 0, 0.25)' : 'rgba(120, 120, 255, 0.15)'
      };
      if (grid[npc.y] && grid[npc.y][npc.x]) {
        grid[npc.y][npc.x] = cell;
      }
    });

    if (grid[this.player.y] && grid[this.player.y][this.player.x]) {
      grid[this.player.y][this.player.x] = {
        char: '@',
        fg: '#00eaff',
        bg: 'rgba(0, 174, 255, 0.2)'
      };
    }

    this.renderer.render(grid);
  }

  private updateUI(): void {
    this.updateStats();
    this.updateInventory();
    this.updateZoneInfo();
    this.updateStatus();
  }

  private updateStats(): void {
    const stats = this.player.stats;
    this.ui.statsPanel.innerHTML = `
      <div class="stat-row"><span>Charm</span><span>${stats.charm}</span></div>
      <div class="stat-row"><span>Shame</span><span>${stats.shame}/${this.player.shameThreshold}</span></div>
      <div class="stat-row"><span>Groove</span><span>${stats.groove}</span></div>
      <div class="stat-row"><span>Tolerance</span><span>${stats.tolerance}</span></div>
      <div class="stat-row"><span>RicePower</span><span>${stats.ricePower}</span></div>
      <div class="stat-row"><span>HP</span><span>${this.player.hp}/${this.player.maxHp}</span></div>
    `;
  }

  private updateInventory(): void {
    const pills = this.player.inventory.getPills();
    this.ui.inventoryList.innerHTML = '';
    pills.forEach((pill, index) => {
      const discovered = this.player.inventory.getDiscoveredEffect(pill.blueprint.id);
      const li = document.createElement('li');
      li.className = index === 0 ? 'inventory-item primary' : 'inventory-item';
      li.innerHTML = `
        <span class="pill-icon" style="color: ${pill.blueprint.color}">${pill.blueprint.icon}</span>
        <span class="pill-name">${pill.blueprint.name}</span>
        <span class="pill-effect">${discovered ? discovered.title : '???'}</span>
      `;
      this.ui.inventoryList.appendChild(li);
    });

    const grenadeItem = document.createElement('li');
    grenadeItem.className = 'inventory-item grenades';
    grenadeItem.textContent = `Rice grenades: ${this.player.inventory.getRiceGrenades()}`;
    this.ui.inventoryList.appendChild(grenadeItem);
  }

  private updateZoneInfo(): void {
    const zone = this.world.getZone(this.player.zoneId);
    this.ui.zoneTitle.textContent = `${zone.name}`;
    this.ui.zoneDescription.textContent = zone.description;
  }

  private updateStatus(): void {
    const lines: string[] = [];
    lines.push(`Mode: ${this.mode.toUpperCase()}`);

    if (this.mode === 'combat' && this.combat) {
      const enemy = this.combat.getEnemy();
      lines.push(`Enemy: ${enemy.name} (${enemy.hp}/${enemy.maxHp} HP)`);
      if (enemy.bossAbility) {
        lines.push(`Boss ability: ${enemy.bossAbility.toUpperCase()}`);
      }
      lines.push('Actions: [1] Slap [2] Kick [3] Spray [4] Rice Grenade [Q] Pill');
    } else if (this.mode === 'dead') {
      lines.push('All further input is an avant-garde séance. Refresh to restart.');
    } else {
      lines.push('Move with WASD/Arrows. Space to interact. Q to swallow the top pill.');
      lines.push('I toggles inventory. Exits glow as X. Flirt wisely; shame stalks you.');
    }

    this.ui.statusPanel.innerHTML = lines.map((line) => `<div class="status-line">${line}</div>`).join('');
  }
}

async function bootstrap(): Promise<void> {
  const [pills, zones] = await Promise.all([
    loadJSON<PillBlueprint[]>(new URL('./data/pills.json', import.meta.url).toString()),
    loadJSON<ZoneDefinition[]>(new URL('./data/zones.json', import.meta.url).toString())
  ]);

  const game = new PillKospiGame(pills, zones);
  game.start();
  (window as any).game = game;
}

document.addEventListener('DOMContentLoaded', () => {
  bootstrap().catch((error) => {
    console.error('Failed to bootstrap Pill Kospi adventure', error);
  });
});
