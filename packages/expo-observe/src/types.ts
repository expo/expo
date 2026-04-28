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
   * When unset, defaults to `false` for debug builds and `true` for release builds
   * so dev metrics aren't shipped without explicit opt-in.
   */
  dispatchingEnabled?: boolean;
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
};

export interface ExpoObserveModuleType {
  dispatchEvents(): Promise<void>;
  /**
   * Configures observability settings.
   */
  configure(config: Config): void;
}
