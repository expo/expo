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
};
export type IntegrationState = {
    enabled: boolean;
    threshold: number;
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