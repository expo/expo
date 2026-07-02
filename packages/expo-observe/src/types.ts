import type { NativeModule } from 'expo';
import type { LogAttributeValue, LogEventOptions, MetricAttributes } from 'expo-app-metrics';

/**
 * Value types accepted as attribute values in `setGlobalAttributes` and the
 * other Observe APIs. Strings, numbers, and booleans are stored as typed
 * primitives; arrays and nested maps preserve their structure.
 */
export type ObserveAttribute = LogAttributeValue;

/**
 * A map of attribute key to value, as accepted by `setGlobalAttributes` and
 * other Observe APIs that take a free-form attributes payload.
 */
export type ObserveAttributes = Record<string, ObserveAttribute>;

export type ObserveConfig = {
  /**
   * The environment for observability events
   *
   * @default process.env.NODE_ENV
   */
  environment?: string;
  /**
   * Whether to dispatch observability events to the server.
   *
   * When `false`, any pending metrics are marked as sent without being dispatched
   * and no further metrics are dispatched until this is set back to `true`.
   *
   * @default true
   */
  dispatchingEnabled?: boolean;
  /**
   * Whether to dispatch metrics that were collected in a debug build of the host app.
   *
   * When `false`, metrics produced by debug builds are marked as sent without being dispatched.
   * When `true`, debug-build metrics are dispatched alongside release-build metrics.
   *
   * Has no effect on release builds.
   *
   * If `dispatchingEnabled` is `false` or this device is out-of-sample for `sampleRate`, nothing
   * is dispatched regardless of `dispatchInDebug`.
   *
   * @default false
   */
  dispatchInDebug?: boolean;
  /**
   * Fraction of installations that should dispatch metrics, in `[0, 1]`. Values outside that range
   * are clamped.
   *
   * The decision is **deterministic per installation** — a device is either permanently in-sample
   * or out-of-sample for a given rate, so the choice is stable across app launches.
   *
   * Interaction with `dispatchingEnabled`:
   * - If `dispatchingEnabled` is `false`, metrics are never dispatched
   * - If `dispatchingEnabled` is `true` (or unset), metrics are dispatched only when this device
   *   is in-sample.
   *
   * > Note: Devices that end up out-of-sample drop pending metrics rather than accumulating them.
   *
   * @default undefined - metrics from all devices are sent
   */
  sampleRate?: number;
  /**
   * Opt in to per-integration behavior.
   */
  integrations?: ObserveIntegrationsConfig;
};

export interface ObserveIntegrationsConfig {
  /**
   * Enables the `expo-router` integration, which records navigation metrics
   * (`cold_ttr`, `warm_ttr`, `tti`) from router state changes.
   *
   * Requires `expo-router` to be installed.
   *
   * @default false
   */
  'expo-router'?: boolean;
  /**
   * Enables the `@react-navigation/native` integration, which records
   * navigation metrics (`cold_ttr`, `warm_ttr`, `tti`).
   *
   * Requires `@react-navigation/native` to be installed and the app tree
   * to be wrapped in `<ObserveNavigationContainer>` instead of the stock
   * `<NavigationContainer>`.
   *
   * @default false
   */
  'react-navigation'?: boolean;
}

/**
 * Events emitted by the native `ExpoObserve` module.
 */
export type ObserveModuleEvents = {
  /**
   * Fired on every `configure(...)` call, carrying the resolved `integrations`
   * config
   */
  configure: (payload: { integrations: ObserveIntegrationsConfig }) => void;
};

export declare class ObserveModule extends NativeModule<ObserveModuleEvents> {
  dispatchEvents(): Promise<void>;
  /**
   * Configures observability settings.
   */
  configure(config: ObserveConfig): void;
  /**
   * Returns the `integrations` config from the most recent `configure(...)`
   * call, or an empty object if `configure` has not run yet.
   */
  getIntegrations(): ObserveIntegrationsConfig;
  /**
   * Records a log event against the current main session. The event is
   * persisted locally and dispatched on the next `dispatchEvents()` flush.
   *
   * Severity defaults to `"info"` when not provided.
   *
   * @param name Event name.
   * @param options Optional body, attributes, and severity overrides.
   */
  logEvent(name: string, options?: LogEventOptions): void;
  /**
   * Marks the first render of the app. Used to compute the `cold_ttr` and
   * `warm_ttr` metrics.
   */
  markFirstRender(): void;
  /**
   * Marks the moment the app becomes interactive. Used to compute the `tti`
   * metric. Custom `routeName` and `params` can be attached via `attributes`.
   *
   * > Note: When the `expo-router` or `@react-navigation/native` integration
   * > is active, prefer `useObserve().markInteractive(...)` — the hook fills
   * > in `routeName` from the current route, while this raw call does not.
   */
  markInteractive(attributes?: MetricAttributes): void;
  /**
   * Sets attributes merged into every subsequent metric and log event.
   * Per-record keys win on collision. Pass `null`, `undefined`, or an empty
   * object to clear.
   *
   * @example
   * ```ts
   * Observe.setGlobalAttributes({
   *   subscription_tier: 'pro',
   *   experiment_variant: 'B',
   * });
   * ```
   */
  setGlobalAttributes(attributes?: ObserveAttributes | null): void;
  /**
   * Pushes JS-bundle-derived facts (`process.env.NODE_ENV`, `__DEV__`) into native
   * storage. Called automatically once when the package is first imported; should
   * not be called by host apps directly.
   *
   * @internal
   */
  setBundleDefaults(defaults: { environment: string; isJsDev: boolean }): void;
}
