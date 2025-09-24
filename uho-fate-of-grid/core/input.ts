export interface GamepadMapping {
  // Face buttons (Xbox controller)
  A: number;        // 0
  B: number;        // 1  
  X: number;        // 2
  Y: number;        // 3
  
  // Shoulder buttons
  LB: number;       // 4
  RB: number;       // 5
  LT: number;       // 6 (trigger)
  RT: number;       // 7 (trigger)
  
  // System buttons
  Back: number;     // 8
  Start: number;    // 9
  
  // Stick buttons
  LS: number;       // 10 (left stick click)
  RS: number;       // 11 (right stick click)
  
  // D-pad
  Up: number;       // 12
  Down: number;     // 13
  Left: number;     // 14
  Right: number;    // 15
}

export interface GamepadState {
  connected: boolean;
  buttons: boolean[];
  axes: number[];
  lastButtonStates: boolean[];
  vibrationSupported: boolean;
}

export interface InputAction {
  keyboard?: string[];
  gamepad?: number[];
  type: 'press' | 'hold' | 'release';
}

export interface InputBinding {
  [actionName: string]: InputAction;
}

export class InputManager {
  private keys: Set<string> = new Set();
  private mouseButtons: Set<number> = new Set();
  private mousePosition = { x: 0, y: 0 };
  private gamepadStates: Map<number, GamepadState> = new Map();
  
  // Xbox controller standard mapping
  private xboxMapping: GamepadMapping = {
    A: 0, B: 1, X: 2, Y: 3,
    LB: 4, RB: 5, LT: 6, RT: 7,
    Back: 8, Start: 9,
    LS: 10, RS: 11,
    Up: 12, Down: 13, Left: 14, Right: 15
  };
  
  // Default input bindings
  private bindings: InputBinding = {
    // Movement
    moveUp: { keyboard: ['w', 'arrowup'], gamepad: [this.xboxMapping.Up], type: 'press' },
    moveDown: { keyboard: ['s', 'arrowdown'], gamepad: [this.xboxMapping.Down], type: 'press' },
    moveLeft: { keyboard: ['a', 'arrowleft'], gamepad: [this.xboxMapping.Left], type: 'press' },
    moveRight: { keyboard: ['d', 'arrowright'], gamepad: [this.xboxMapping.Right], type: 'press' },
    
    // Actions
    interact: { keyboard: ['e'], gamepad: [this.xboxMapping.A], type: 'press' },
    inventory: { keyboard: ['i'], gamepad: [this.xboxMapping.Y], type: 'press' },
    map: { keyboard: ['m'], gamepad: [this.xboxMapping.Back], type: 'press' },
    menu: { keyboard: ['escape'], gamepad: [this.xboxMapping.Start], type: 'press' },
    
    // Additional actions
    talk: { keyboard: ['f'], gamepad: [this.xboxMapping.X], type: 'press' },
    rest: { keyboard: ['t'], gamepad: [this.xboxMapping.B], type: 'press' },
    sprint: { keyboard: ['shift'], gamepad: [this.xboxMapping.RB], type: 'hold' },
    
    // Camera controls
    zoomIn: { keyboard: ['='], gamepad: [this.xboxMapping.RT], type: 'press' },
    zoomOut: { keyboard: ['-'], gamepad: [this.xboxMapping.LT], type: 'press' },
    
    // Quick actions
    quickAction1: { keyboard: ['1'], gamepad: [this.xboxMapping.LB], type: 'press' },
    quickAction2: { keyboard: ['2'], type: 'press' },
    quickAction3: { keyboard: ['3'], type: 'press' },
    quickAction4: { keyboard: ['4'], type: 'press' }
  };
  
  private actionStates: Map<string, boolean> = new Map();
  private lastActionStates: Map<string, boolean> = new Map();
  private inputCooldowns: Map<string, number> = new Map();
  private defaultCooldown = 150; // ms
  
  constructor() {
    this.setupEventListeners();
    this.initializeGamepads();
  }
  
  private setupEventListeners(): void {
    // Keyboard events
    document.addEventListener('keydown', (e) => {
      this.keys.add(e.key.toLowerCase());
    });
    
    document.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase());
    });
    
    // Mouse events
    document.addEventListener('mousedown', (e) => {
      this.mouseButtons.add(e.button);
    });
    
    document.addEventListener('mouseup', (e) => {
      this.mouseButtons.delete(e.button);
    });
    
    document.addEventListener('mousemove', (e) => {
      this.mousePosition.x = e.clientX;
      this.mousePosition.y = e.clientY;
    });
    
    // Gamepad connection events
    window.addEventListener('gamepadconnected', (e) => {
      console.log(`Gamepad connected: ${e.gamepad.id}`);
      this.initializeGamepad(e.gamepad.index);
    });
    
    window.addEventListener('gamepaddisconnected', (e) => {
      console.log(`Gamepad disconnected: ${e.gamepad.id}`);
      this.gamepadStates.delete(e.gamepad.index);
    });
  }
  
  private initializeGamepads(): void {
    const gamepads = navigator.getGamepads();
    for (let i = 0; i < gamepads.length; i++) {
      if (gamepads[i]) {
        this.initializeGamepad(i);
      }
    }
  }
  
  private initializeGamepad(index: number): void {
    const gamepad = navigator.getGamepads()[index];
    if (!gamepad) return;
    
    this.gamepadStates.set(index, {
      connected: true,
      buttons: new Array(gamepad.buttons.length).fill(false),
      axes: new Array(gamepad.axes.length).fill(0),
      lastButtonStates: new Array(gamepad.buttons.length).fill(false),
      vibrationSupported: 'vibrationActuator' in gamepad
    });
  }
  
  public update(deltaTime: number): void {
    // Update action states
    this.lastActionStates.clear();
    for (const [action, state] of this.actionStates) {
      this.lastActionStates.set(action, state);
    }
    
    // Update gamepad states
    this.updateGamepads();
    
    // Update action states based on current input
    this.updateActionStates();
    
    // Update cooldowns
    for (const [action, cooldown] of this.inputCooldowns) {
      if (cooldown > 0) {
        this.inputCooldowns.set(action, Math.max(0, cooldown - deltaTime));
      }
    }
  }
  
  private updateGamepads(): void {
    const gamepads = navigator.getGamepads();
    
    for (const [index, state] of this.gamepadStates) {
      const gamepad = gamepads[index];
      if (!gamepad) {
        state.connected = false;
        continue;
      }
      
      // Store previous button states
      state.lastButtonStates = [...state.buttons];
      
      // Update button states
      for (let i = 0; i < gamepad.buttons.length; i++) {
        state.buttons[i] = gamepad.buttons[i].pressed;
      }
      
      // Update axes (analog sticks and triggers)
      for (let i = 0; i < gamepad.axes.length; i++) {
        state.axes[i] = gamepad.axes[i];
      }
    }
  }
  
  private updateActionStates(): void {
    for (const [actionName, binding] of Object.entries(this.bindings)) {
      let isActive = false;
      
      // Check keyboard input
      if (binding.keyboard) {
        for (const key of binding.keyboard) {
          if (this.keys.has(key)) {
            isActive = true;
            break;
          }
        }
      }
      
      // Check gamepad input
      if (!isActive && binding.gamepad) {
        for (const [index, state] of this.gamepadStates) {
          if (!state.connected) continue;
          
          for (const buttonIndex of binding.gamepad) {
            if (state.buttons[buttonIndex]) {
              isActive = true;
              break;
            }
          }
          
          if (isActive) break;
        }
      }
      
      this.actionStates.set(actionName, isActive);
    }
  }
  
  // Public API methods
  public isActionPressed(action: string): boolean {
    const cooldown = this.inputCooldowns.get(action);
    if (cooldown && cooldown > 0) return false;
    
    const current = this.actionStates.get(action) || false;
    const previous = this.lastActionStates.get(action) || false;
    
    if (current && !previous) {
      this.inputCooldowns.set(action, this.defaultCooldown);
      return true;
    }
    
    return false;
  }
  
  public isActionHeld(action: string): boolean {
    return this.actionStates.get(action) || false;
  }
  
  public isActionReleased(action: string): boolean {
    const current = this.actionStates.get(action) || false;
    const previous = this.lastActionStates.get(action) || false;
    
    return !current && previous;
  }
  
  public getAnalogInput(action: 'leftStick' | 'rightStick'): { x: number, y: number } {
    for (const [index, state] of this.gamepadStates) {
      if (!state.connected) continue;
      
      if (action === 'leftStick') {
        return {
          x: Math.abs(state.axes[0]) > 0.1 ? state.axes[0] : 0,
          y: Math.abs(state.axes[1]) > 0.1 ? state.axes[1] : 0
        };
      } else if (action === 'rightStick') {
        return {
          x: Math.abs(state.axes[2]) > 0.1 ? state.axes[2] : 0,
          y: Math.abs(state.axes[3]) > 0.1 ? state.axes[3] : 0
        };
      }
    }
    
    return { x: 0, y: 0 };
  }
  
  public getTriggerInput(trigger: 'left' | 'right'): number {
    for (const [index, state] of this.gamepadStates) {
      if (!state.connected) continue;
      
      // On most gamepads, triggers are axes 2 and 5, or buttons 6 and 7
      if (trigger === 'left') {
        // Try axis first (more precise), then button
        return state.axes.length > 2 ? (state.axes[2] + 1) / 2 : (state.buttons[6] ? 1 : 0);
      } else {
        return state.axes.length > 5 ? (state.axes[5] + 1) / 2 : (state.buttons[7] ? 1 : 0);
      }
    }
    
    return 0;
  }
  
  public vibrate(intensity: number = 0.5, duration: number = 200): void {
    for (const [index, state] of this.gamepadStates) {
      if (!state.connected || !state.vibrationSupported) continue;
      
      const gamepad = navigator.getGamepads()[index];
      if (gamepad && 'vibrationActuator' in gamepad) {
        (gamepad as any).vibrationActuator.playEffect('dual-rumble', {
          startDelay: 0,
          duration: duration,
          weakMagnitude: intensity * 0.5,
          strongMagnitude: intensity
        });
      }
    }
  }
  
  public getMousePosition(): { x: number, y: number } {
    return { ...this.mousePosition };
  }
  
  public isMouseButtonPressed(button: number = 0): boolean {
    return this.mouseButtons.has(button);
  }
  
  public getConnectedGamepads(): number[] {
    return Array.from(this.gamepadStates.keys()).filter(
      index => this.gamepadStates.get(index)?.connected
    );
  }
  
  public updateBinding(action: string, binding: InputAction): void {
    this.bindings[action] = binding;
  }
  
  public getBinding(action: string): InputAction | undefined {
    return this.bindings[action];
  }
  
  public getAllBindings(): InputBinding {
    return { ...this.bindings };
  }
  
  // For debugging
  public getDebugInfo(): any {
    return {
      connectedGamepads: this.getConnectedGamepads().length,
      activeKeys: Array.from(this.keys),
      activeActions: Object.fromEntries(
        Array.from(this.actionStates.entries()).filter(([, active]) => active)
      ),
      gamepadStates: Object.fromEntries(this.gamepadStates)
    };
  }
}

// Create a global input manager instance
export const inputManager = new InputManager();