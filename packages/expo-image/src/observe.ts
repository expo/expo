'use client';

import { requireOptionalNativeModule } from 'expo';
import type { ExpoAppMetricsModuleType } from 'expo-app-metrics';
import type { ObserveIntegrationsConfig, ObserveModule } from 'expo-observe';
import { Dimensions, PixelRatio } from 'react-native';

import type { ImageNativeModule } from './Image.types';

/**
 * Configuration for the `expo-observe` integration, set through
 * `Observe.configure({ integrations: { 'expo-image': ... } })`. Passing `true` enables it with
 * defaults; the object form tunes the behavior.
 *
 * The `declare module 'expo-observe'` augmentation that registers the `'expo-image'` key lives in
 * `Image.types.ts` (always in the package's public type graph via `export *`, so it is picked up
 * whenever expo-image is imported). `Image.types.ts` `import type`s this from here. It is exported
 * from this module but not from the package entry, so it is not part of the public API.
 */
export type ExpoImageIntegrationConfig = {
  /**
   * An image is reported as oversized when its decoded pixel area exceeds the screen's physical
   * pixel count (its point area times the square of the device pixel ratio) by more than this
   * factor. For example, `1.5` flags an image decoded at more than 1.5× the pixels the screen
   * physically has — a full-screen image plus 50% headroom.
   *
   * @default 1.5
   */
  oversizeThreshold?: number;
};

const DEFAULT_OVERSIZE_THRESHOLD = 1.5;

// Guards `initObserveIntegrationIfNeeded` so repeated calls wire up the integration only once.
let initialized = false;

// Exported for testing purposes only.
export type IntegrationState = {
  enabled: boolean;
  threshold: number;
  // URLs already reported under the current configuration. Only oversized images are added.
  reported: Set<string>;
  // Subscription to the native `imageLoaded` event, held only while the integration is enabled.
  subscription: { remove: () => void } | null;
  // Native modules resolved when the integration initializes; either may be absent.
  appMetrics: ExpoAppMetricsModuleType | null;
  imageModule: ImageNativeModule | null;
};

type Integrations = ObserveIntegrationsConfig & {
  'expo-image'?: ExpoImageIntegrationConfig;
};

// Exported for testing purposes only.
export type LoadedImage = {
  url: string;
  width: number;
  height: number;
  screenWidth: number;
  screenHeight: number;
  pixelRatio: number;
};

// Exported for testing purposes only.
export function reportIfOversized(state: IntegrationState, image: LoadedImage): void {
  if (!state.enabled || !state.appMetrics) {
    return;
  }
  const { url, width, height, screenWidth, screenHeight, pixelRatio } = image;
  if (!url || !(width > 0) || !(height > 0)) {
    return;
  }
  if (state.reported.has(url)) {
    return;
  }
  // Screen area is in points; the decoded image is in pixels, so convert with pixelRatio² to get
  // the screen's physical pixel count.
  const budget = screenWidth * screenHeight * pixelRatio * pixelRatio;
  if (!(budget > 0) || width * height <= budget * state.threshold) {
    return;
  }
  state.reported.add(url);
  try {
    state.appMetrics.logEvent('expo-image.oversized', {
      displayName: 'Oversized image loaded',
      severity: 'warn',
      body: `Image loaded at ${width}×${height}px is far larger than this device's screen (${screenWidth}×${screenHeight}pt @${pixelRatio}x). Constrain it with the maxWidth/maxHeight load options.`,
      attributes: {
        url,
        imageWidth: width,
        imageHeight: height,
        screenWidth,
        screenHeight,
        pixelRatio,
      },
    });
  } catch {
    console.warn('[expo-image] Failed to logEvent for oversized image.');
    // Reporting is best-effort; a logging failure must not disrupt image loading.
  }
}

// Exported for testing purposes only.
export function handleImageLoaded(
  state: IntegrationState,
  image: { url: string; width: number; height: number },
  report = reportIfOversized
): void {
  const screen = Dimensions.get('screen');
  report(state, {
    ...image,
    screenWidth: screen.width,
    screenHeight: screen.height,
    pixelRatio: PixelRatio.get(),
  });
}

// Exported for testing purposes only.
export function activate(
  state: IntegrationState,
  integrations: Integrations,
  handle = handleImageLoaded
): void {
  const config = integrations['expo-image'];
  state.enabled = !!config;
  state.threshold =
    typeof config === 'object' && config !== null
      ? (config.oversizeThreshold ?? DEFAULT_OVERSIZE_THRESHOLD)
      : DEFAULT_OVERSIZE_THRESHOLD;
  // A new configure may change the threshold (or enable the integration), so start a fresh dedup
  // set: images already reported under the previous settings become eligible to report again.
  state.reported = new Set<string>();
  if (state.enabled && !state.subscription && state.imageModule) {
    state.subscription = state.imageModule.addListener('imageLoaded', (image) =>
      handle(state, image)
    );
  } else if (!state.enabled && state.subscription) {
    state.subscription.remove();
    state.subscription = null;
  }
}

// Exported for testing purposes only.
export function initObserveIntegrationIfNeededImpl(
  activate: (state: IntegrationState, integrations: Integrations) => void
): void {
  const observe = requireOptionalNativeModule<ObserveModule>('ExpoObserve');
  if (!observe) {
    return;
  }
  const state: IntegrationState = {
    enabled: false,
    threshold: DEFAULT_OVERSIZE_THRESHOLD,
    reported: new Set<string>(),
    subscription: null,
    appMetrics: requireOptionalNativeModule<ExpoAppMetricsModuleType>('ExpoAppMetrics'),
    imageModule: requireOptionalNativeModule<ImageNativeModule>('ExpoImage'),
  };
  activate(state, observe.getIntegrations());
  observe.addListener('configure', ({ integrations }) => activate(state, integrations));
}

/**
 * Wires the expo-observe oversized-image integration. Idempotent.
 */
export function initObserveIntegrationIfNeeded(): void {
  if (initialized) {
    return;
  }
  initialized = true;
  initObserveIntegrationIfNeededImpl(activate);
}
