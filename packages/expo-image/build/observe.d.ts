import type { ExpoAppMetricsModuleType } from 'expo-app-metrics';
import type { ObserveIntegrationsConfig } from 'expo-observe';
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
     * reported (other schemes, such as `data:` or `ph://`, never leave the device). URLs are
     * reported in normalized (WHATWG) form, and the event's `urlSanitized` attribute tells whether
     * the URL was modified beyond that.
     *
     * @default false
     */
    includeUrlParams?: boolean;
};
export type IntegrationState = {
    enabled: boolean;
    threshold: number;
    includeUrlParams: boolean;
    reported: Set<string>;
    subscription: {
        remove: () => void;
    } | null;
    appMetrics: ExpoAppMetricsModuleType | null;
    imageModule: ImageNativeModule | null;
};
type Integrations = ObserveIntegrationsConfig & {
    'expo-image'?: ExpoImageIntegrationConfig;
};
export type LoadedImage = {
    url: string;
    width: number;
    height: number;
    screenWidth: number;
    screenHeight: number;
    pixelRatio: number;
};
export declare function reportIfOversized(state: IntegrationState, image: LoadedImage): void;
export declare function handleImageLoaded(state: IntegrationState, image: {
    url: string;
    width: number;
    height: number;
}, report?: typeof reportIfOversized): void;
export declare function activate(state: IntegrationState, integrations: Integrations, handle?: typeof handleImageLoaded): void;
export declare function initObserveIntegrationIfNeededImpl(activate: (state: IntegrationState, integrations: Integrations) => void): void;
/**
 * Wires the expo-observe oversized-image integration. Idempotent.
 */
export declare function initObserveIntegrationIfNeeded(): void;
export {};
//# sourceMappingURL=observe.d.ts.map