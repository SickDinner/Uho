import { describe, expect, it } from 'vitest';

import type { AudioAsset } from '@/audio/audio-asset-registry.ts';
import { AUDIO_CATEGORIES, summarizeAudioCategories } from '@/audio/audio-metadata.ts';

describe('summarizeAudioCategories', () => {
  const sampleAssets: AudioAsset[] = [
    { id: 'city_theme', src: 'music', category: 'music', description: 'Music' },
    { id: 'menu_theme', src: 'music', category: 'music', description: 'Music' },
    { id: 'rain_light', src: 'weather', category: 'weather', description: 'Rain' },
    { id: 'ui_click', src: 'ui', category: 'ui', description: 'Click' },
  ];

  it('counts assets per category', () => {
    const summary = summarizeAudioCategories(sampleAssets, new Set(['city_theme', 'ui_click']));
    expect(summary).toEqual([
      { category: 'music', total: 2, loaded: 1 },
      { category: 'weather', total: 1, loaded: 0 },
      { category: 'ui', total: 1, loaded: 1 },
    ]);
  });

  it('accepts array input for loaded ids', () => {
    const summary = summarizeAudioCategories(sampleAssets, ['menu_theme']);
    expect(summary.find(entry => entry.category === 'music')?.loaded).toBe(1);
  });
});

describe('AUDIO_CATEGORIES constant', () => {
  it('lists known categories in a stable order', () => {
    expect(AUDIO_CATEGORIES).toMatchSnapshot();
  });
});
