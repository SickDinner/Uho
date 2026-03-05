export type Command =
  | 'move-up'
  | 'move-down'
  | 'move-left'
  | 'move-right'
  | 'wait'
  | 'interact'
  | 'use-pill'
  | 'toggle-inventory'
  | 'action-1'
  | 'action-2'
  | 'action-3'
  | 'action-4';

const keyBindings: Record<string, Command> = {
  ArrowUp: 'move-up',
  ArrowDown: 'move-down',
  ArrowLeft: 'move-left',
  ArrowRight: 'move-right',
  w: 'move-up',
  a: 'move-left',
  s: 'move-down',
  d: 'move-right',
  '.': 'wait',
  ' ': 'interact',
  Enter: 'interact',
  q: 'use-pill',
  i: 'toggle-inventory',
  '1': 'action-1',
  '2': 'action-2',
  '3': 'action-3',
  '4': 'action-4'
};

export type CommandListener = (command: Command, event: KeyboardEvent) => void;

export class InputHandler {
  private listeners: Set<CommandListener> = new Set();
  private readonly keydownHandler = (event: KeyboardEvent): void => {
    const command = keyBindings[event.key];
    if (!command) {
      return;
    }

    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) {
      event.preventDefault();
    }

    this.listeners.forEach((listener) => listener(command, event));
  };

  constructor() {
    window.addEventListener('keydown', this.keydownHandler);
  }

  onCommand(listener: CommandListener): void {
    this.listeners.add(listener);
  }

  offCommand(listener: CommandListener): void {
    this.listeners.delete(listener);
  }

  destroy(): void {
    this.listeners.clear();
    window.removeEventListener('keydown', this.keydownHandler);
  }
}
