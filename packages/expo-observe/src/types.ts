export type Config = {
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
   * Disables the automatic `expo-router` integration that records TTR/TTI per screen.
   *
   * When `true` or `expo-router` is not installed, the router integration will not be used.
   *
   * @default false
   */
  disableRouterIntegration?: boolean;
};

export interface ExpoObserveModuleType {
  dispatchEvents(): Promise<void>;
  /**
   * Configures observability settings.
   */
  configure(config: Config): void;
  /**
   * Pushes JS-bundle-derived facts (`process.env.NODE_ENV`, `__DEV__`) into native
   * storage. Called automatically once when the package is first imported; should
   * not be called by host apps directly.
   *
   * @internal
   */
  setBundleDefaults(defaults: { environment: string; isJsDev: boolean }): void;
}
