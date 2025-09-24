import type { AudioAsset } from '@core/audio-assets.ts';
import { audioAssetRegistry as coreRegistry } from '@core/audio-assets.ts';
import {
  AUDIO_CATEGORIES,
  summarizeAudioCategories,
  type AudioCategory,
  type AudioCategorySummary,
} from './audio-metadata.ts';

export type { AudioAsset, AudioCategory, AudioCategorySummary };
export { AUDIO_CATEGORIES, summarizeAudioCategories };

/**
 * Re-export the singleton registry so gameplay code can use a stable import
 * path that sits alongside other high-level audio helpers in `src/audio`.
 */
export const audioAssetRegistry = coreRegistry;

/**
 * Convenience method that inspects the core registry to provide summarized
 * loading information per category.  The registry lazily loads assets so this
 * should be called after `audioAssetRegistry.initialize()` has resolved.
 */
export function getRegistryCategorySummaries(): AudioCategorySummary[] {
  const allAssets: AudioAsset[] = [];
  const loadedIds: string[] = [];

  for (const category of AUDIO_CATEGORIES) {
    const assets = audioAssetRegistry.getAssetsByCategory(category);
    allAssets.push(...assets);

    for (const asset of assets) {
      if (audioAssetRegistry.isAssetLoaded(asset.id)) {
        loadedIds.push(asset.id);
      }
    }
  }

  return summarizeAudioCategories(allAssets, loadedIds);
}
