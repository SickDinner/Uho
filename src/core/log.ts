export type LogCategory = 'system' | 'combat' | 'flirt' | 'loot' | 'event' | 'boss' | 'death';

interface LogEntry {
  text: string;
  category: LogCategory;
}

const categoryColors: Record<LogCategory, string> = {
  system: '#93c8ff',
  combat: '#ff7b7b',
  flirt: '#ff9ffd',
  loot: '#ffeb7b',
  event: '#a1ffb7',
  boss: '#ffa54a',
  death: '#f2f2f2'
};

export class GameLog {
  private entries: LogEntry[] = [];

  constructor(private container: HTMLElement) {}

  push(text: string, category: LogCategory = 'system'): void {
    const entry: LogEntry = { text, category };
    this.entries.push(entry);
    this.trim();
    this.renderEntry(entry);
  }

  clear(): void {
    this.entries = [];
    this.container.innerHTML = '';
  }

  private trim(): void {
    if (this.entries.length > 200) {
      this.entries.splice(0, this.entries.length - 200);
    }
  }

  private renderEntry(entry: LogEntry): void {
    const div = document.createElement('div');
    div.className = 'message';
    div.style.color = categoryColors[entry.category];
    div.textContent = entry.text;
    this.container.appendChild(div);
    this.container.scrollTop = this.container.scrollHeight;
  }
}
