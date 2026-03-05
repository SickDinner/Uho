import type { AudioAsset } from '@core/audio-assets.ts';

export type AudioCategory = AudioAsset['category'];

export interface AudioCategorySummary {
  category: AudioCategory;
  total: number;
  loaded: number;
}

export function summarizeAudioCategories(
  assets: readonly AudioAsset[],
  loadedIds: ReadonlySet<string> | readonly string[]
): AudioCategorySummary[] {
  const loadedSet = loadedIds instanceof Set ? loadedIds : new Set(loadedIds);
  const categoryMap = new Map<AudioCategory, { total: number; loaded: number }>();

  for (const asset of assets) {
    const entry = categoryMap.get(asset.category) ?? { total: 0, loaded: 0 };
    entry.total += 1;
    if (loadedSet.has(asset.id)) {
      entry.loaded += 1;
    }
    categoryMap.set(asset.category, entry);
  }

  return Array.from(categoryMap.entries()).map(([category, counts]) => ({
    category,
    total: counts.total,
    loaded: counts.loaded,
  }));
}

export const AUDIO_CATEGORIES: AudioCategory[] = [
  'music',
  'ambient',
  'sfx',
  'weather',
  'ui',
  'voice',
];
