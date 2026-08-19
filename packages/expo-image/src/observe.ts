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
  /**
   * Whether reported events include the image URL's query string and fragment. By default the URL
   * is truncated at them before it leaves the device, because query parameters often carry
   * sensitive values such as signing tokens or API keys. Enable this only when your image URLs
   * are safe to send off-device in full. Regardless of this setting, basic-auth credentials are
   * always removed from the URL, and only `http(s)`, `file`, and `android.resource` URLs are
   * reported (other schemes, such as `data:` or `ph://`, never leave the device). An event whose
   * URL was modified before sending carries a `urlSanitized: true` attribute.
   *
   * @default false
   */
  includeUrlParams?: boolean;
};

const DEFAULT_OVERSIZE_THRESHOLD = 1.5;

// Guards `initObserveIntegrationIfNeeded` so repeated calls wire up the integration only once.
let initialized = false;

// Exported for testing purposes only.
export type IntegrationState = {
  enabled: boolean;
  threshold: number;
  includeUrlParams: boolean;
  // URLs already reported under the current configuration, as they were reported (so without
  // query and fragment unless `includeUrlParams` is set). Only oversized images are added.
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

// Truncates a URL at its query string and fragment (unless `includeUrlParams` opts in) and always
// removes userinfo credentials from the authority, so values like signing tokens, API keys, or
// basic-auth passwords never leave the device.
function sanitizeUrl(url: string, includeUrlParams: boolean): string {
  let sanitized = url;
  if (!includeUrlParams) {
    const paramsStart = sanitized.search(/[?#]/);
    if (paramsStart !== -1) {
      sanitized = sanitized.slice(0, paramsStart);
    }
  }
  // Userinfo ends at the last `@` before the authority ends (matching WHATWG parsing, so an
  // unencoded `@` inside a password is consumed too), while `/`, `?`, and `#` bound the match, so
  // an `@` later in the path or query never matches.
  return sanitized.replace(/^([^:/?#]+:\/\/)[^/?#]*@/, '$1');
}

// Exported for testing purposes only.
export function reportIfOversized(state: IntegrationState, image: LoadedImage): void {
  if (!state.enabled || !state.appMetrics) {
    return;
  }
  const { width, height, screenWidth, screenHeight, pixelRatio } = image;
  if (!image.url || !(width > 0) || !(height > 0)) {
    return;
  }
  // Only remote images, local files, and bundled Android resources are reported: those URLs
  // identify developer-owned content that the developer can act on. Every other scheme fails safe
  // regardless of `includeUrlParams`, because it carries device-local or user-library content (the
  // whole payload for `data:`, a stable personal-photo identifier for `ph://` and `content://`).
  if (!/^(https?|file|android\.resource):/i.test(image.url)) {
    return;
  }
  // Deduping on the reported form also collapses variants of one image that differ only in their
  // query parameters (such as rotating signed URLs) into a single event.
  const url = sanitizeUrl(image.url, state.includeUrlParams);
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
        // Present only when sanitization changed the URL, mirroring the navigation integration's
        // `urlHidden` attribute.
        ...(url !== image.url ? { urlSanitized: true } : {}),
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
  const configObject = typeof config === 'object' && config !== null ? config : {};
  state.enabled = !!config;
  state.threshold = configObject.oversizeThreshold ?? DEFAULT_OVERSIZE_THRESHOLD;
  state.includeUrlParams = configObject.includeUrlParams ?? false;
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
    includeUrlParams: false,
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
