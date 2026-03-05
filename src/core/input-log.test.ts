import { describe, expect, it, vi } from 'vitest';
import { InputHandler } from './input';
import { GameLog } from './log';

describe('InputHandler', () => {
  it('stops emitting commands after destroy', () => {
    const handler = new InputHandler();
    const listener = vi.fn();
    handler.onCommand(listener);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));
    expect(listener).toHaveBeenCalledTimes(1);

    handler.destroy();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe('GameLog', () => {
  it('keeps DOM entries capped to 200 entries', () => {
    const container = document.createElement('div');
    const log = new GameLog(container);

    for (let i = 0; i < 250; i += 1) {
      log.push(`entry-${i}`, 'system');
    }

    expect(container.children.length).toBe(200);
    expect(container.firstElementChild?.textContent).toBe('entry-50');
    expect(container.lastElementChild?.textContent).toBe('entry-249');
  });
});
