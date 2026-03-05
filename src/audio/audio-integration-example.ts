import type { Vector2 } from '@core/types.ts';
import { advancedAudioEngine } from '@core/advanced-audio.ts';
import {
  audioAssetRegistry,
  getRegistryCategorySummaries,
  type AudioCategorySummary,
} from './audio-asset-registry.ts';

let initializationPromise: Promise<void> | null = null;

/**
 * Loads the audio asset registry and applies some sensible defaults for the
 * advanced audio engine.  The promise is cached so gameplay code can await the
 * helper from multiple places without reloading audio assets.
 */
export async function ensureAudioInitialized(initialListenerPosition?: Vector2): Promise<void> {
  if (!initializationPromise) {
    initializationPromise = (async () => {
      await audioAssetRegistry.initialize();

      // Apply baseline mixing values so different categories are balanced.
      advancedAudioEngine.setVolume('master', 0.85);
      advancedAudioEngine.setVolume('music', 0.7);
      advancedAudioEngine.setVolume('ambient', 0.6);
      advancedAudioEngine.setVolume('sfx', 0.85);

      // Start with a gentle breeze so the city does not feel lifeless.
      advancedAudioEngine.setWeatherIntensity('wind', 0.1);
    })();
  }

  await initializationPromise;

  if (initialListenerPosition) {
    advancedAudioEngine.setListenerPosition(initialListenerPosition);
  }
}

/**
 * Utility used by gameplay code to react to player movement.  Keeping this in a
 * dedicated helper avoids importing the full audio engine from UI components.
 */
export function updateListenerPosition(position: Vector2): void {
  advancedAudioEngine.setListenerPosition(position);
}

/**
 * Simple showcase helper that plays the menu ambience.  It is useful when
 * wiring up menus or for QA to quickly validate that the audio pipeline works.
 */
export async function playMenuAmbience(): Promise<void> {
  await ensureAudioInitialized();
  advancedAudioEngine.playMusic('menu_theme', { mood: 'calm', fadeTime: 1500 });
  advancedAudioEngine.setWeatherIntensity('rain', 0);
}

/**
 * Kicks off a lightweight ambience preview by moving the listener into the
 * specified zone and enabling a bit of rain for atmosphere.
 */
export async function previewZoneAt(position: Vector2): Promise<void> {
  await ensureAudioInitialized(position);
  advancedAudioEngine.setWeatherIntensity('rain', 0.3);
}

/**
 * Exposes loading statistics that can be displayed inside developer HUDs or
 * logs.  The summary is calculated via the registry helper so it remains cheap
 * to call from rendering code.
 */
export function describeLoadedAudio(): AudioCategorySummary[] {
  return getRegistryCategorySummaries();
}
