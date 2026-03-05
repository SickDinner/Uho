type NeedName = 'energy' | 'social' | 'curiosity' | 'health';
type Profession = 'Keksijä' | 'Taiteilija' | 'Opettaja' | 'Rakentaja';

export interface NeedsState {
  energy: number;
  social: number;
  curiosity: number;
  health: number;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function squaredDistance(ax: number, ay: number, bx: number, by: number): number {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

export function computeMood(needs: NeedsState, profession: Profession): number {
  const base = (needs.energy + needs.social + needs.curiosity + needs.health) / 4;
  const professionBonus = profession === 'Taiteilija' ? 2 : profession === 'Opettaja' ? 1.5 : 1;
  return clamp(base + professionBonus, 0, 100);
}

export function createSeededRandom(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (1664525 * s + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

interface Citizen {
  id: number;
  name: string;
  profession: Profession;
  age: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  mood: number;
  needs: NeedsState;
  creativity: number;
  connections: number[];
  alive: boolean;
}

interface GlobalState {
  season: 'kevät' | 'kesä' | 'syksy' | 'talvi';
  innovationPoints: number;
  speed: 1 | 2 | 4;
  paused: boolean;
  harmonyBoost: number;
  debugOverlay: boolean;
  visualFx: boolean;
  showLabels: boolean;
  simIntensity: number;
  mode: 'Calm' | 'Balanced' | 'Chaos';
}

type SimMode = GlobalState['mode'];

const MODE_PRESETS: Record<SimMode, number> = {
  Calm: 0.7,
  Balanced: 1,
  Chaos: 1.8
};

export function inferModeForIntensity(intensity: number): SimMode {
  if (intensity <= 0.8) return 'Calm';
  if (intensity >= 1.6) return 'Chaos';
  return 'Balanced';
}

export function seasonPaceModifier(season: GlobalState['season']): number {
  if (season === 'talvi') return 1.15;
  if (season === 'kesä') return 0.88;
  return 1;
}


export interface FixedStepAdvanceResult {
  accumulator: number;
  stepsToSimulate: number;
}

export function computeFixedStepAdvance(
  accumulator: number,
  frameDeltaSeconds: number,
  speed: number,
  tickSeconds: number,
  maxStepsPerFrame: number,
  maxAccumulatedSeconds: number,
  epsilon: number
): FixedStepAdvanceResult {
  const safeEpsilon = Math.max(epsilon, Number.EPSILON);
  const safeTickSeconds = Math.max(tickSeconds, safeEpsilon);
  const safeMaxStepsPerFrame = Math.max(0, Math.floor(maxStepsPerFrame));
  const safeMaxAccumulatedSeconds = Math.max(0, maxAccumulatedSeconds);
  const safeAccumulator = Number.isFinite(accumulator) ? clamp(accumulator, 0, safeMaxAccumulatedSeconds) : 0;
  const safeFrameDeltaSeconds = Number.isFinite(frameDeltaSeconds) ? Math.max(0, frameDeltaSeconds) : 0;
  const safeSpeed = Number.isFinite(speed) ? Math.max(0, speed) : 0;

  const clampedAccumulator = Math.min(
    safeAccumulator + safeFrameDeltaSeconds * safeSpeed,
    safeMaxAccumulatedSeconds
  );
  const availableSteps = Math.floor(clampedAccumulator / safeTickSeconds);
  const stepsToSimulate = Math.min(availableSteps, safeMaxStepsPerFrame);

  let nextAccumulator = clampedAccumulator - stepsToSimulate * safeTickSeconds;
  if (nextAccumulator < safeEpsilon) {
    nextAccumulator = 0;
  }

  return {
    accumulator: nextAccumulator,
    stepsToSimulate
  };
}

const NAMES = ['Aino', 'Eero', 'Veera', 'Sisu', 'Lumi', 'Milo', 'Nora', 'Onni', 'Helmi', 'Otso'];
const PROFESSIONS: Profession[] = ['Keksijä', 'Taiteilija', 'Opettaja', 'Rakentaja'];
const SEASONS: GlobalState['season'][] = ['kevät', 'kesä', 'syksy', 'talvi'];
const SIM_TICK_SECONDS = 1 / 60;
const MAX_SIM_STEPS_PER_FRAME = 8;
const MAX_ACCUMULATED_SIM_SECONDS = SIM_TICK_SECONDS * 100;
const SIM_TIME_EPSILON = 1e-9;

export class GeniusLifeApp {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private citizens: Citizen[] = [];
  private nextId = 1;
  private year = 2040;
  private tick = 0;
  private raf = 0;
  private lastTime = 0;
  private simulationAccumulator = 0;

  private messageLog: HTMLElement;
  private statsPanel: HTMLElement;
  private needsPanel: HTMLElement;
  private statusPanel: HTMLElement;
  private controlsPanel: HTMLElement;
  private pauseBtn: HTMLButtonElement | null = null;
  private speedBtn: HTMLButtonElement | null = null;
  private overlayBtn: HTMLButtonElement | null = null;
  private fxBtn: HTMLButtonElement | null = null;
  private seedBtn: HTMLButtonElement | null = null;
  private labelsBtn: HTMLButtonElement | null = null;
  private intensityInput: HTMLInputElement | null = null;
  private keydownHandler: ((event: KeyboardEvent) => void) | null = null;
  private resizeHandler: (() => void) | null = null;
  private visibilityHandler: (() => void) | null = null;
  private fps = 0;
  private frameCounter = 0;
  private frameTimer = 0;
  private previousPopulation = 0;
  private running = false;
  private backgroundDrift = 0;
  private readonly uiUpdateStride = 4;
  private gridCanvas: HTMLCanvasElement | null = null;
  private gridCell = 40;
  private random = Math.random;
  private activeSeed: number | null = null;

  private state: GlobalState = {
    season: 'kevät',
    innovationPoints: 0,
    speed: 1,
    paused: false,
    harmonyBoost: 0,
    debugOverlay: true,
    visualFx: true,
    showLabels: true,
    simIntensity: 1,
    mode: 'Balanced'
  };

  constructor() {
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement | null;
    const messageLog = document.getElementById('messageLog');
    const statsPanel = document.getElementById('statsPanel');
    const needsPanel = document.getElementById('needsPanel');
    const statusPanel = document.getElementById('statusPanel');
    const controlsPanel = document.getElementById('controlsPanel');

    if (!canvas || !messageLog || !statsPanel || !needsPanel || !statusPanel || !controlsPanel) {
      throw new Error('GeniusLifeApp: required DOM elements are missing.');
    }

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('GeniusLifeApp: 2D canvas context could not be created.');
    }

    this.canvas = canvas;
    this.ctx = context;
    this.messageLog = messageLog;
    this.statsPanel = statsPanel;
    this.needsPanel = needsPanel;
    this.statusPanel = statusPanel;
    this.controlsPanel = controlsPanel;

    this.bootstrapRandomSource();

    this.seedWorld();
    this.setupControls();
    this.setupResizeHandler();
    this.log('🌱 NeoKylä syntyi: elämä alkaa ikkuna-universumissa.', 'system');
    this.log('🧪 Vinkki: käytä ohjaimia ja laita turbo päälle.', 'system');
    this.updatePanels();
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.simulationAccumulator = 0;
    this.loop(this.lastTime);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);

    if (this.keydownHandler) {
      window.removeEventListener('keydown', this.keydownHandler);
    }

    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }

    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
    }
  }

  private setupResizeHandler(): void {
    this.resizeHandler = () => {
      const rect = this.canvas.getBoundingClientRect();
      const nextWidth = Math.max(640, Math.floor(rect.width));
      const nextHeight = Math.max(420, Math.floor(rect.height));

      if (nextWidth !== this.canvas.width || nextHeight !== this.canvas.height) {
        this.canvas.width = nextWidth;
        this.canvas.height = nextHeight;
        this.rebuildGridCache();
      }
    };

    this.resizeHandler();
    window.addEventListener('resize', this.resizeHandler);
  }

  private setupControls(): void {
    this.controlsPanel.innerHTML = `
      <button id="pauseBtn">⏸️ Pause</button>
      <button id="speedBtn">⚡ Nopeus x1</button>
      <button id="boostBtn">✨ Harmonia-buusti</button>
      <button id="ideaBtn">🧠 Ideapurkaus</button>
      <button id="overlayBtn">📊 Overlay: ON</button>
      <button id="fxBtn">✨ Efektit: ON</button>
      <button id="labelsBtn">🏷️ Nimet: ON</button>
      <button id="seedBtn">🎲 Satunnainen seed</button>
      <div class="mode-row">
        <button id="modeCalmBtn">🟢 Calm</button>
        <button id="modeBalancedBtn">🟡 Balanced</button>
        <button id="modeChaosBtn">🔴 Chaos</button>
      </div>
      <label class="control-label">Simulaation intensiteetti
        <input id="intensityInput" type="range" min="0.5" max="2" step="0.1" value="1" />
      </label>
      <button id="resetBtn">🔄 Uusi maailma</button>
      <div class="controls-hint">Pikanäppäimet: [Space] pause, [F] speed, [D] overlay, [S] seed, [L] nimet, [1/2/3] moodi, [R] reset</div>
    `;

    this.pauseBtn = document.getElementById('pauseBtn') as HTMLButtonElement | null;
    this.speedBtn = document.getElementById('speedBtn') as HTMLButtonElement | null;
    this.overlayBtn = document.getElementById('overlayBtn') as HTMLButtonElement | null;
    const boostBtn = document.getElementById('boostBtn') as HTMLButtonElement;
    const ideaBtn = document.getElementById('ideaBtn') as HTMLButtonElement;
    this.fxBtn = document.getElementById('fxBtn') as HTMLButtonElement;
    this.labelsBtn = document.getElementById('labelsBtn') as HTMLButtonElement | null;
    this.seedBtn = document.getElementById('seedBtn') as HTMLButtonElement;
    const modeCalmBtn = document.getElementById('modeCalmBtn') as HTMLButtonElement;
    const modeBalancedBtn = document.getElementById('modeBalancedBtn') as HTMLButtonElement;
    const modeChaosBtn = document.getElementById('modeChaosBtn') as HTMLButtonElement;
    this.intensityInput = document.getElementById('intensityInput') as HTMLInputElement;
    const resetBtn = document.getElementById('resetBtn') as HTMLButtonElement;

    const togglePause = () => {
      this.state.paused = !this.state.paused;
      if (this.pauseBtn) this.pauseBtn.textContent = this.state.paused ? '▶️ Jatka' : '⏸️ Pause';
      this.log(this.state.paused ? '⏸️ Simulaatio pysäytetty hetkeksi.' : '▶️ Simulaatio jatkuu.', 'system');
    };

    const switchSpeed = () => {
      this.state.speed = this.state.speed === 1 ? 2 : this.state.speed === 2 ? 4 : 1;
      if (this.speedBtn) this.speedBtn.textContent = `⚡ Nopeus x${this.state.speed}`;
      this.log(`⚙️ Simulaation nopeus vaihdettu tasolle x${this.state.speed}.`, 'system');
    };

    this.pauseBtn?.addEventListener('click', togglePause);
    this.speedBtn?.addEventListener('click', switchSpeed);
    boostBtn.addEventListener('click', () => this.activateHarmonyBoost());
    ideaBtn.addEventListener('click', () => this.triggerIdeaBurst());
    this.overlayBtn?.addEventListener('click', () => {
      this.state.debugOverlay = !this.state.debugOverlay;
      if (this.overlayBtn) this.overlayBtn.textContent = `📊 Overlay: ${this.state.debugOverlay ? 'ON' : 'OFF'}`;
    });
    this.fxBtn.addEventListener('click', () => {
      this.state.visualFx = !this.state.visualFx;
      if (this.fxBtn) this.fxBtn.textContent = `✨ Efektit: ${this.state.visualFx ? 'ON' : 'OFF'}`;
    });
    this.labelsBtn?.addEventListener('click', () => {
      this.state.showLabels = !this.state.showLabels;
      if (this.labelsBtn) this.labelsBtn.textContent = `🏷️ Nimet: ${this.state.showLabels ? 'ON' : 'OFF'}`;
    });
    this.seedBtn.addEventListener('click', () => {
      this.randomizeSeedAndReset();
    });
    this.intensityInput.addEventListener('input', () => {
      if (!this.intensityInput) return;
      this.state.simIntensity = Number(this.intensityInput.value);
      this.updateModeButtons(modeCalmBtn, modeBalancedBtn, modeChaosBtn);
    });

    modeCalmBtn.addEventListener('click', () => {
      if (!this.intensityInput) return;
      this.applyMode('Calm', this.intensityInput);
      this.updateModeButtons(modeCalmBtn, modeBalancedBtn, modeChaosBtn);
    });
    modeBalancedBtn.addEventListener('click', () => {
      if (!this.intensityInput) return;
      this.applyMode('Balanced', this.intensityInput);
      this.updateModeButtons(modeCalmBtn, modeBalancedBtn, modeChaosBtn);
    });
    modeChaosBtn.addEventListener('click', () => {
      if (!this.intensityInput) return;
      this.applyMode('Chaos', this.intensityInput);
      this.updateModeButtons(modeCalmBtn, modeBalancedBtn, modeChaosBtn);
    });

    this.updateModeButtons(modeCalmBtn, modeBalancedBtn, modeChaosBtn);
    resetBtn.addEventListener('click', () => this.resetWorld());

    this.keydownHandler = (event) => {
      if (event.repeat) return;

      if (event.code === 'Space') {
        event.preventDefault();
        togglePause();
      } else if (event.key.toLowerCase() === 'f') {
        switchSpeed();
      } else if (event.key.toLowerCase() === 'd') {
        this.state.debugOverlay = !this.state.debugOverlay;
        if (this.overlayBtn) this.overlayBtn.textContent = `📊 Overlay: ${this.state.debugOverlay ? 'ON' : 'OFF'}`;
      } else if (event.key.toLowerCase() === 'r') {
        this.resetWorld();
      } else if (event.key.toLowerCase() === 's') {
        this.randomizeSeedAndReset();
      } else if (event.key.toLowerCase() === 'l') {
        this.state.showLabels = !this.state.showLabels;
        if (this.labelsBtn) this.labelsBtn.textContent = `🏷️ Nimet: ${this.state.showLabels ? 'ON' : 'OFF'}`;
      } else if (event.key === '1') {
        if (!this.intensityInput) return;
        this.applyMode('Calm', this.intensityInput);
        this.updateModeButtons(modeCalmBtn, modeBalancedBtn, modeChaosBtn);
      } else if (event.key === '2') {
        if (!this.intensityInput) return;
        this.applyMode('Balanced', this.intensityInput);
        this.updateModeButtons(modeCalmBtn, modeBalancedBtn, modeChaosBtn);
      } else if (event.key === '3') {
        if (!this.intensityInput) return;
        this.applyMode('Chaos', this.intensityInput);
        this.updateModeButtons(modeCalmBtn, modeBalancedBtn, modeChaosBtn);
      }
    };

    this.visibilityHandler = () => {
      if (document.visibilityState === 'hidden' && !this.state.paused) {
        this.state.paused = true;
        if (this.pauseBtn) this.pauseBtn.textContent = '▶️ Jatka';
      }
    };

    window.addEventListener('keydown', this.keydownHandler);
    document.addEventListener('visibilitychange', this.visibilityHandler);
  }

  private resetWorld(): void {
    this.citizens = [];
    this.nextId = 1;
    this.tick = 0;
    this.year = 2040;
    this.state.innovationPoints = 0;
    this.state.harmonyBoost = 0;
    this.state.debugOverlay = true;
    this.state.visualFx = true;
    this.state.showLabels = true;
    this.state.season = 'kevät';
    this.state.paused = false;
    this.state.speed = 1;
    this.seedWorld();

    if (this.pauseBtn) this.pauseBtn.textContent = '⏸️ Pause';
    if (this.speedBtn) this.speedBtn.textContent = '⚡ Nopeus x1';
    if (this.overlayBtn) this.overlayBtn.textContent = '📊 Overlay: ON';
    if (this.fxBtn) this.fxBtn.textContent = '✨ Efektit: ON';
    if (this.labelsBtn) this.labelsBtn.textContent = '🏷️ Nimet: ON';
    if (this.intensityInput) this.intensityInput.value = String(this.state.simIntensity);

    this.updatePanels();
    this.log('🌍 Uusi maailma luotu. NeoKylä alkaa alusta.', 'system');
  }

  private activateHarmonyBoost(): void {
    if (this.state.innovationPoints < 40) {
      this.log('❗ Harmonia-buusti vaatii 40 innovaatiopistettä.', 'system');
      return;
    }
    this.state.innovationPoints = Math.max(0, this.state.innovationPoints - 40);
    this.state.harmonyBoost = 900;
    this.updatePanels();
    this.log('✨ Harmonia-buusti aktivoitu! Kaikki saavat hyvinvointia.', 'system');
  }

  private triggerIdeaBurst(): void {
    const best = this.pickMostCreativeCitizens(3);
    if (best.length === 0) return;

    best.forEach((citizen) => {
      citizen.needs.curiosity = Math.min(100, citizen.needs.curiosity + 35);
      citizen.needs.energy = Math.max(10, citizen.needs.energy - 15);
      citizen.creativity = Math.min(100, citizen.creativity + 8);
    });

    this.state.innovationPoints += 12;
    this.updatePanels();
    this.log('🧠 Ideapurkaus! Luovimmat asukkaat tekivät läpimurron.', 'system');
  }

  private applyMode(mode: SimMode, intensityInput: HTMLInputElement): void {
    this.state.mode = mode;
    const intensity = MODE_PRESETS[mode];
    this.state.simIntensity = intensity;
    intensityInput.value = String(intensity);
    this.log(`🧭 Simulaatiotila: ${mode}`, 'system');
  }

  private randomizeSeedAndReset(): void {
    this.activeSeed = Math.floor(Math.random() * 0xffffffff);
    this.random = createSeededRandom(this.activeSeed);
    this.resetWorld();
    this.log(`🎲 Uusi seed käytössä: ${this.activeSeed}`, 'system');
  }

  private pickMostCreativeCitizens(limit: number): Citizen[] {
    if (limit <= 0) return [];

    const top: Citizen[] = [];
    for (const citizen of this.citizens) {
      if (!citizen.alive) continue;

      let index = top.findIndex((entry) => citizen.creativity > entry.creativity);
      if (index === -1 && top.length < limit) {
        top.push(citizen);
      } else if (index >= 0) {
        top.splice(index, 0, citizen);
        if (top.length > limit) top.pop();
      }
    }

    return top;
  }

  private updateModeButtons(calm: HTMLButtonElement, balanced: HTMLButtonElement, chaos: HTMLButtonElement): void {
    const guessedMode = inferModeForIntensity(this.state.simIntensity);
    this.state.mode = guessedMode;

    calm.style.outline = guessedMode === 'Calm' ? '2px solid #6fe3a2' : 'none';
    balanced.style.outline = guessedMode === 'Balanced' ? '2px solid #f6e05e' : 'none';
    chaos.style.outline = guessedMode === 'Chaos' ? '2px solid #ff7b7b' : 'none';
  }

  private seedWorld(): void {
    for (let i = 0; i < 14; i++) {
      this.citizens.push(this.createCitizen(this.random() * this.canvas.width, this.random() * this.canvas.height));
    }
  }

  private createCitizen(x: number, y: number): Citizen {
    const profession = PROFESSIONS[Math.floor(this.random() * PROFESSIONS.length)];
    return {
      id: this.nextId++,
      name: `${NAMES[Math.floor(this.random() * NAMES.length)]}-${Math.floor(this.random() * 90 + 10)}`,
      profession,
      age: Math.floor(this.random() * 30) + 18,
      x,
      y,
      vx: (this.random() - 0.5) * 0.8,
      vy: (this.random() - 0.5) * 0.8,
      mood: 70,
      needs: {
        energy: 65 + this.random() * 30,
        social: 45 + this.random() * 45,
        curiosity: 45 + this.random() * 45,
        health: 60 + this.random() * 35
      },
      creativity: 40 + this.random() * 60,
      connections: [],
      alive: true
    };
  }

  private loop = (now: number): void => {
    if (!this.running) return;
    const dt = Math.min((now - this.lastTime) / 1000, 0.25);
    this.lastTime = now;
    this.updateFps(dt);

    if (!this.state.paused) {
      const simulationStep = computeFixedStepAdvance(
        this.simulationAccumulator,
        dt,
        this.state.speed,
        SIM_TICK_SECONDS,
        MAX_SIM_STEPS_PER_FRAME,
        MAX_ACCUMULATED_SIM_SECONDS,
        SIM_TIME_EPSILON
      );

      this.simulationAccumulator = simulationStep.accumulator;
      for (let i = 0; i < simulationStep.stepsToSimulate; i++) {
        this.update(SIM_TICK_SECONDS);
      }
    }
    this.render();
    this.raf = requestAnimationFrame(this.loop);
  };

  private update(dt: number): void {
    this.tick += 1;

    if (this.tick % 240 === 0) {
      this.year += 1;
      this.state.season = SEASONS[this.year % SEASONS.length];
      this.log(`📅 Vuosi ${this.year}: ${this.state.season} muokkaa tunnelmaa.`);
    }

    this.previousPopulation = this.citizens.length;

    if (this.state.harmonyBoost > 0) {
      this.state.harmonyBoost -= 1;
    }

    for (const citizen of this.citizens) {
      if (!citizen.alive) continue;

      const seasonModifier = seasonPaceModifier(this.state.season);
      citizen.age += dt * 0.08;
      const pace = this.state.simIntensity;
      citizen.needs.energy -= dt * 3.1 * seasonModifier * pace;
      citizen.needs.social -= dt * 1.1 * pace;
      citizen.needs.curiosity -= dt * 1.3 * pace;
      citizen.needs.health -= dt * 0.85 * seasonModifier * pace;

      if (this.state.harmonyBoost > 0) {
        citizen.needs.social += dt * 2.8;
        citizen.needs.health += dt * 2.2;
      }

      citizen.mood = computeMood(citizen.needs, citizen.profession);

      if (citizen.needs.energy < 25) {
        citizen.vx *= 0.985;
        citizen.vy *= 0.985;
        citizen.needs.energy += dt * 2.9;
      }

      if (citizen.needs.curiosity < 45) {
        citizen.creativity += dt * 1.8;
        citizen.needs.curiosity += dt * 1.9;
      }

      if (citizen.needs.social < 35) {
        const friend = this.findNearestCitizen(citizen);
        if (friend) {
          const dx = friend.x - citizen.x;
          const dy = friend.y - citizen.y;
          const len = Math.hypot(dx, dy) || 1;
          citizen.vx += (dx / len) * dt * 0.38;
          citizen.vy += (dy / len) * dt * 0.38;
        }
      }

      citizen.x += citizen.vx * 60 * dt * pace;
      citizen.y += citizen.vy * 60 * dt * pace;

      if (citizen.x < 12 || citizen.x > this.canvas.width - 12) citizen.vx *= -1;
      if (citizen.y < 12 || citizen.y > this.canvas.height - 12) citizen.vy *= -1;

      citizen.x = Math.max(12, Math.min(this.canvas.width - 12, citizen.x));
      citizen.y = Math.max(12, Math.min(this.canvas.height - 12, citizen.y));

      for (const need of Object.keys(citizen.needs) as NeedName[]) {
        citizen.needs[need] = clamp(citizen.needs[need], 0, 100);
      }

      citizen.creativity = clamp(citizen.creativity, 0, 100);

      if (citizen.age > 95 || citizen.needs.health <= 0) {
        citizen.alive = false;
        this.log(`🕊️ ${citizen.name} poistui legendaksi iässä ${Math.floor(citizen.age)}.`);
      }
    }

    this.handleInteractions(dt);
    this.handlePopulationGrowth();
    this.citizens = this.citizens.filter((citizen) => citizen.alive);

    if (this.citizens.length < 6) {
      const newcomer = this.createCitizen(this.random() * this.canvas.width, this.random() * this.canvas.height);
      this.citizens.push(newcomer);
      this.log(`✨ ${newcomer.name} muutti NeoKylään vahvistamaan tulevaisuutta!`, 'system');
    }

    this.state.innovationPoints = clamp(this.state.innovationPoints, 0, 9999);

    if (this.tick % this.uiUpdateStride === 0) {
      this.updatePanels();
    }
  }

  private handleInteractions(dt: number): void {
    for (let i = 0; i < this.citizens.length; i++) {
      for (let j = i + 1; j < this.citizens.length; j++) {
        const a = this.citizens[i];
        const b = this.citizens[j];
        const d2 = squaredDistance(a.x, a.y, b.x, b.y);

        if (d2 < 24 * 24) {
          a.needs.social += dt * 11.5;
          b.needs.social += dt * 11.5;
          a.needs.health += dt * 2;
          b.needs.health += dt * 2;

          if (!a.connections.includes(b.id) && this.random() < 0.007) {
            a.connections.push(b.id);
            b.connections.push(a.id);
            this.state.innovationPoints += 4;
            this.log(`🤝 ${a.name} ja ${b.name} loivat uuden idealiiton.`);
          }

          if (this.random() < 0.0035) {
            a.creativity += 1.5;
            b.creativity += 1.5;
            this.state.innovationPoints += 1;
          }
        }
      }
    }
  }

  private handlePopulationGrowth(): void {
    if (this.tick % 500 !== 0 || this.citizens.length > 28) return;

    const thriving = this.citizens.filter((c) => c.mood > 68 && c.needs.health > 58);
    if (thriving.length >= 3) {
      const child = this.createCitizen(
        this.canvas.width * (0.25 + this.random() * 0.5),
        this.canvas.height * (0.25 + this.random() * 0.5)
      );
      child.age = 1;
      child.creativity = 82;
      this.citizens.push(child);
      this.state.innovationPoints += 8;
      this.updatePanels();
      this.log(`👶 Uusi sukupolvi: ${child.name} syntyi täynnä potentiaalia!`, 'system');
    }
  }

  private findNearestCitizen(citizen: Citizen): Citizen | undefined {
    let closest: Citizen | undefined;
    let dist = Number.POSITIVE_INFINITY;

    for (const other of this.citizens) {
      if (other.id === citizen.id || !other.alive) continue;
      const d2 = squaredDistance(citizen.x, citizen.y, other.x, other.y);
      if (d2 < dist) {
        dist = d2;
        closest = other;
      }
    }

    return closest;
  }

  private render(): void {
    this.ctx.fillStyle = this.state.visualFx ? 'rgba(5, 7, 15, 0.35)' : '#05070f';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.backgroundDrift += 0.003;
    this.drawGrid();

    for (const citizen of this.citizens) {
      const moodColor = citizen.mood > 70 ? '#7CFFB2' : citizen.mood > 45 ? '#FFD166' : '#FF6B6B';

      const pulse = 8 + Math.sin(this.tick * 0.06 + citizen.id) * 1.2;
      this.ctx.beginPath();
      this.ctx.fillStyle = moodColor;
      this.ctx.arc(citizen.x, citizen.y, pulse, 0, Math.PI * 2);
      this.ctx.fill();

      if (this.state.visualFx) {
        this.ctx.beginPath();
        this.ctx.strokeStyle = `${moodColor}66`;
        this.ctx.lineWidth = 2;
        this.ctx.arc(citizen.x, citizen.y, pulse + 4, 0, Math.PI * 2);
        this.ctx.stroke();
      }

      if (this.state.showLabels) {
        this.ctx.fillStyle = '#d8e0ff';
        this.ctx.font = '10px monospace';
        this.ctx.fillText(citizen.name, citizen.x - 22, citizen.y - 12);
      }
    }

    if (this.state.paused) {
      this.ctx.fillStyle = 'rgba(4, 8, 20, 0.55)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = 'bold 30px monospace';
      this.ctx.fillText('PAUSE', this.canvas.width / 2 - 60, this.canvas.height / 2);
    }

    if (this.state.debugOverlay) {
      this.drawDebugOverlay();
    }
  }

  private updateFps(dt: number): void {
    this.frameCounter += 1;
    this.frameTimer += dt;

    if (this.frameTimer >= 0.5) {
      this.fps = Math.round(this.frameCounter / this.frameTimer);
      this.frameCounter = 0;
      this.frameTimer = 0;
    }
  }

  private drawDebugOverlay(): void {
    const avgMood = this.average((c) => c.mood);
    const delta = this.citizens.length - this.previousPopulation;
    const trend = delta > 0 ? `+${delta}` : `${delta}`;

    this.ctx.fillStyle = 'rgba(8, 14, 36, 0.7)';
    this.ctx.fillRect(8, 8, 240, 70);
    this.ctx.fillStyle = '#9cf6ff';
    this.ctx.font = '12px monospace';
    this.ctx.fillText(`FPS: ${this.fps}`, 16, 26);
    this.ctx.fillText(`Population: ${this.citizens.length} (${trend})`, 16, 44);
    this.ctx.fillText(`Avg mood: ${avgMood.toFixed(1)}`, 16, 62);
  }

  getSnapshot(): { population: number; year: number; mode: SimMode; intensity: number; seed: number | null } {
    return {
      population: this.citizens.length,
      year: this.year,
      mode: this.state.mode,
      intensity: this.state.simIntensity,
      seed: this.activeSeed
    };
  }

  private drawGrid(): void {
    if (!this.gridCanvas) {
      this.rebuildGridCache();
    }

    if (!this.gridCanvas) return;

    const glow = 0.2 + Math.abs(Math.sin(this.backgroundDrift)) * 0.15;
    this.ctx.globalAlpha = glow;
    this.ctx.drawImage(this.gridCanvas, 0, 0);
    this.ctx.globalAlpha = 1;
  }

  private rebuildGridCache(): void {
    const gridCanvas = document.createElement('canvas');
    gridCanvas.width = this.canvas.width;
    gridCanvas.height = this.canvas.height;
    const gridCtx = gridCanvas.getContext('2d');
    if (!gridCtx) return;

    gridCtx.strokeStyle = 'rgba(56, 74, 120, 0.9)';
    gridCtx.lineWidth = 1;

    for (let x = 0; x <= this.canvas.width; x += this.gridCell) {
      gridCtx.beginPath();
      gridCtx.moveTo(x, 0);
      gridCtx.lineTo(x, this.canvas.height);
      gridCtx.stroke();
    }

    for (let y = 0; y <= this.canvas.height; y += this.gridCell) {
      gridCtx.beginPath();
      gridCtx.moveTo(0, y);
      gridCtx.lineTo(this.canvas.width, y);
      gridCtx.stroke();
    }

    this.gridCanvas = gridCanvas;
  }

  private updatePanels(): void {
    const population = this.citizens.length;
    const avgMood = this.average((c) => c.mood);
    const avgCreativity = this.average((c) => c.creativity);
    const socialLinks = this.citizens.reduce((sum, c) => sum + c.connections.length, 0) / 2;

    this.statsPanel.innerHTML = `
      <div class="stat-row"><span>Asukkaat:</span><span>${population}</span></div>
      <div class="stat-row"><span>Keskim. mieliala:</span><span>${avgMood.toFixed(1)}</span></div>
      <div class="stat-row"><span>Keskim. luovuus:</span><span>${avgCreativity.toFixed(1)}</span></div>
      <div class="stat-row"><span>Ystävyyssuhteet:</span><span>${Math.floor(socialLinks)}</span></div>
      <div class="stat-row"><span>Innovaatiopisteet:</span><span>${this.state.innovationPoints}</span></div>
    `;

    const needs = ['energy', 'social', 'curiosity', 'health'] as NeedName[];
    this.needsPanel.innerHTML = needs
      .map((need) => {
        const value = this.average((c) => c.needs[need]);
        const klass = value < 30 ? 'critical' : value < 60 ? 'low' : '';
        return `
          <div class="stat-row"><span>${this.translateNeed(need)}:</span><span>${value.toFixed(0)}%</span></div>
          <div class="need-bar"><div class="need-fill ${klass}" style="width:${value}%"></div></div>
        `;
      })
      .join('');

    this.statusPanel.innerHTML = `
      <div class="stat-row"><span>Simuloitu vuosi:</span><span>${this.year}</span></div>
      <div class="stat-row"><span>Syklin numero:</span><span>${this.tick}</span></div>
      <div class="stat-row"><span>Kausi:</span><span>${this.state.season}</span></div>
      <div class="stat-row"><span>Tila-moodi:</span><span>${this.state.mode}</span></div>
      <div class="stat-row"><span>Utopia-indeksi:</span><span>${((avgMood + avgCreativity) / 2).toFixed(1)}</span></div>
      <div class="stat-row"><span>Tila:</span><span>${avgMood > 70 ? 'Kukoistava' : avgMood > 50 ? 'Vakaa' : 'Haastava'}</span></div>
    `;
  }

  private translateNeed(need: NeedName): string {
    return { energy: 'Energia', social: 'Yhteisöllisyys', curiosity: 'Uteliaisuus', health: 'Terveys' }[need];
  }

  private average(selector: (citizen: Citizen) => number): number {
    if (this.citizens.length === 0) return 0;
    return this.citizens.reduce((sum, citizen) => sum + selector(citizen), 0) / this.citizens.length;
  }

  private bootstrapRandomSource(): void {
    const params = new URLSearchParams(window.location.search);
    const seed = params.get('seed');

    if (!seed) return;

    const parsed = Number(seed);
    if (!Number.isFinite(parsed)) return;

    this.activeSeed = parsed >>> 0;
    this.random = createSeededRandom(this.activeSeed);
    this.log(`🧬 Deterministinen seed käytössä: ${this.activeSeed}`, 'system');
  }

  private log(message: string, type: 'system' | 'combat' | 'drug' = 'system'): void {
    const line = document.createElement('div');
    line.className = `message ${type}`;
    line.textContent = `[${this.year}] ${message}`;
    this.messageLog.prepend(line);

    while (this.messageLog.childElementCount > 18) {
      this.messageLog.removeChild(this.messageLog.lastElementChild!);
    }
  }
}
