import type { NativeModule } from 'expo';

import type {
  LogAttributeValue,
  LogEventOptions,
  MetricAttributes,
  NetworkRequestFilter,
  RecordSpanOptions,
  Span,
  StartSpanOptions,
} from './app-metrics';

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

// Keep in sync with `metricNameMap` in `ios/OpenTelemetry.swift` and `android/.../OpenTelemetry.kt` (except legacy entries).
/**
 * Name of a metric that Expo Observe sends
 */
export type ObserveMetricName =
  | 'expo.app_startup.tti'
  | 'expo.app_startup.ttr'
  | 'expo.app_startup.cold_launch_time'
  | 'expo.app_startup.warm_launch_time'
  | 'expo.app_startup.bundle_load_time'
  | 'expo.updates.download_time'
  | 'expo.navigation.cold_ttr'
  | 'expo.navigation.warm_ttr'
  | 'expo.navigation.tti'
  | 'expo.navigation.tbt';

/**
 * Name of an event that Expo Observe sends. You can also pass a custom name to `logEvent`.
 */
export type ObserveEventName =
  | 'js.exception'
  | 'native.exception'
  | 'expo.feedback'
  | 'reanimated.warning'
  | 'updates.warning'
  | 'expo-image.oversized'
  | (string & {});

/**
 * User feedback sent by `reportFeedback`. Set `message`, `rating`, or both.
 */
export type ObserveFeedback = {
  /**
   * Where the feedback is collected, for example, `'checkout'`. Many reports can use the same id.
   * Sent as the `expo.feedback.id` attribute.
   */
  id: string;
  /**
   * Text that the user wrote. Sent as the event body. Text longer than 4096 characters is cut.
   */
  message?: string;
  /**
   * A whole number from `scale.min` to `scale.max`. Sent as the `expo.feedback.rating` attribute.
   */
  rating?: number;
  /**
   * The lowest and the highest `rating` your UI allows, as whole numbers from 0 to 10. `min` must
   * be less than `max`. Set it only with a `rating`. Sent as the `expo.feedback.scale.min` and
   * `expo.feedback.scale.max` attributes. The dashboard uses the scale to compare ratings.
   *
   * @default { min: 0, max: 10 }
   */
  scale?: { min: number; max: number };
  /**
   * Attributes attached to the event. They follow the same rules as `logEvent` attributes. If the
   * event has more than 128 attributes in total, the `expo.*` attributes are kept first.
   */
  attributes?: ObserveAttributes;
};

/**
 * Whether the user consents to Observe collecting data. The `consent` option of the `expo-observe`
 * config plugin sets the value for the first launch, and `setConsent` changes it at runtime.
 */
export type ObserveConsent = 'not-granted' | 'granted';

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
   * If `dispatchingEnabled` is `false`, nothing is dispatched regardless of `dispatchInDebug`.
   * `sampleRate` and `errorSampleRate` also apply in debug builds.
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
   * Errors follow `errorSampleRate` when it is set and higher. Every installation sends feedback
   * from `reportFeedback`.
   *
   * > Note: Devices that end up out-of-sample drop pending metrics rather than accumulating them.
   *
   * @default undefined - metrics from all devices are sent
   */
  sampleRate?: number;
  /**
   * Fraction of installations that should dispatch errors, in `[0, 1]`. Values outside that range
   * are clamped. Use it to keep more errors than other events, for example, `sampleRate: 0.03` with
   * `errorSampleRate: 1`.
   *
   * Errors include unhandled JavaScript errors, errors from `reportError` and
   * `ObserveErrorBoundary`, and native crash reports. Every installation sends feedback from
   * `reportFeedback`. All other events follow `sampleRate`.
   *
   * `errorSampleRate` is a minimum. Installations in-sample for `sampleRate` always send errors. A
   * lower value has no effect, and `configure()` prints a warning. An unset `sampleRate` counts as
   * `1`.
   *
   * `dispatchingEnabled` and `dispatchInDebug` apply to errors the same way as to other events.
   *
   * @default undefined - errors follow `sampleRate`
   */
  errorSampleRate?: number;
  /**
   * Metric names that are not sent. Each `configure` call replaces the list.
   *
   * @default []
   */
  ignoredMetrics?: ObserveMetricName[];
  /**
   * Event names that are not sent, including custom names passed to `logEvent`. Each `configure`
   * call replaces the list.
   *
   * @default []
   */
  ignoredEvents?: ObserveEventName[];
  /**
   * Whether to record unhandled JavaScript errors as `exception` log events.
   *
   * When `false`, unhandled errors are no longer recorded. React Native's own handling is
   * unaffected either way: the red box in development and fatal termination in production still
   * happen. Errors you report yourself with `reportError`, and render-phase errors captured by
   * `ObserveErrorBoundary`, are also unaffected.
   *
   * > Note: The handler is installed when the package is first imported, which is earlier than any
   * > `configure` call. An error thrown before `configure` runs is therefore still recorded.
   *
   * @default true
   */
  errorHandlingEnabled?: boolean;
  /**
   * Opt in to per-integration behavior. See the [Expo Router](/eas/observe/integrations/expo-router/)
   * and [React Navigation](/eas/observe/integrations/react-navigation/) integrations, or
   * [integrate your own package](/eas/observe/integrations/third-party/).
   */
  integrations?: ObserveIntegrationsConfig;
  /**
   * Whether network requests are recorded as trace spans. Pass `true` to record every request,
   * or an object to record only the ones matching a filter.
   *
   * Off by default, because each recorded span counts toward your event quota. This controls
   * recording, not just export: a request that's turned off or filtered out never reaches the
   * local database. It applies to future requests only, so anything recorded earlier in the
   * launch still gets sent. The setting persists across launches.
   *
   * @default false
   */
  networkTraces?: boolean | ObserveNetworkTracesConfig;
};

export type ObserveNetworkTracesConfig = {
  /**
   * Whether network requests are recorded at all. Set it to `false` to keep a filter configured
   * while recording nothing.
   *
   * @default true
   */
  enabled?: boolean;
  /**
   * Only requests matching the filter are recorded. An omitted field matches every request; an
   * empty array matches none.
   */
  filter?: NetworkRequestFilter | null;
};

export type ObserveNavigationIntegrationConfig = {
  /**
   * Route or query parameter keys to remove from exported navigation metric
   * `routeParams`. When any configured parameter is removed from a metric,
   * the exported resolved URL/path is replaced with `urlHidden: true`.
   * Does not affect `routeName`.
   */
  filteredParams?: string[];
};

export interface ObserveIntegrationsConfig {
  /**
   * Enables the `expo-router` integration, which records navigation metrics
   * (`cold_ttr`, `warm_ttr`, `tti`, `tbt`) from router state changes.
   *
   * Requires `expo-router` to be installed.
   *
   * Pass an object to filter exported route/query params.
   *
   * @default false
   */
  'expo-router'?: boolean | ObserveNavigationIntegrationConfig;
  /**
   * Enables the `@react-navigation/native` integration, which records
   * navigation metrics (`cold_ttr`, `warm_ttr`, `tti`, `tbt`).
   *
   * Requires `@react-navigation/native` to be installed and the app tree
   * to be wrapped in `<ObserveNavigationContainer>` instead of the stock
   * `<NavigationContainer>`.
   *
   * Pass an object to filter exported route/query params.
   *
   * @default false
   */
  'react-navigation'?: boolean | ObserveNavigationIntegrationConfig;
  /**
   * Enables the `react-native-reanimated` integration, which reports Reanimated errors to Observe
   * as errors named `reanimated.error`. To also report Reanimated warnings as events named
   * `reanimated.warning`, set `reportWarnings`. Reanimated still prints errors and warnings to the
   * console. The integration reports each distinct message at most once every 15 minutes. It
   * reports at most 20 distinct errors and 20 distinct warnings in any 15-minute period.
   *
   * Requires `react-native-reanimated` 4.7.0 or later to be installed.
   *
   * The integration configures Reanimated's logger with `configureReanimatedLogger`. To set the
   * logger's `level` and `strict` options, pass an object here. Don't call
   * `configureReanimatedLogger` in your app. A later call removes the integration's callback, and
   * the integration replaces the `level` and `strict` options of an earlier call.
   *
   * @default false
   */
  'react-native-reanimated'?: boolean | ObserveReanimatedIntegrationConfig;
  /**
   * Enables the `expo-updates` integration, which reports the errors that `expo-updates` logs to Observe as errors
   * named `updates.error`. The message starts with the code of the log entry, for example
   * `UpdateFailedToLoad: Failed to launch update: ...`. To also report warnings as events named `updates.warning`,
   * set `reportWarnings`.
   *
   * A JS error that `expo-updates` error recovery handles is reported as `updates.error_recovery` on the next launch,
   * because error recovery can end the app right after the error.
   *
   * When the app launches, the integration starts with the config of the last `configure` call, before your code
   * runs. So it also reports what `expo-updates` logs before `configure` runs, except at the first launch after you
   * enable it.
   *
   * @default false
   * @platform ios
   */
  'expo-updates'?: boolean | ObserveExpoUpdatesIntegrationConfig;
}

export type ObserveReanimatedIntegrationConfig = {
  /**
   * The minimum log level that Reanimated prints and reports. Pass a `ReanimatedLogLevel` value
   * from `react-native-reanimated`: `ReanimatedLogLevel.warn` (`1`) or `ReanimatedLogLevel.error`
   * (`2`).
   *
   * @default ReanimatedLogLevel.warn
   */
  level?: 1 | 2;
  /**
   * Whether Reanimated also prints and reports its strict-mode warnings.
   *
   * @default true
   */
  strict?: boolean;
  /**
   * Whether the integration also reports Reanimated warnings to Observe, as events named
   * `reanimated.warning`. Reanimated prints warnings to the console either way.
   *
   * @default false
   */
  reportWarnings?: boolean;
};

export type ObserveExpoUpdatesIntegrationConfig = {
  /**
   * Whether the integration also reports `expo-updates` warnings to Observe, as events named `updates.warning`. The
   * event has the code of the log entry in the `code` attribute, and the key of its message in the `key` attribute.
   *
   * @default false
   */
  reportWarnings?: boolean;
  /**
   * Codes of the log entries that the integration does not report. For example, `expo-updates` logs a network error
   * with the `UpdateServerUnreachable` code.
   *
   * @default []
   */
  ignoredCodes?: ObserveExpoUpdatesLogEntryCode[];
  /**
   * Keys of the log messages that the integration does not report, for example `'remote.assetDownloadFailed'`. A key
   * names one message of `expo-updates`, so it is more specific than a code. An `updates.warning` event has the key
   * of its message in the `key` attribute.
   *
   * @default []
   */
  ignoredKeys?: string[];
};

/**
 * The code of an `expo-updates` log entry.
 */
export type ObserveExpoUpdatesLogEntryCode =
  | 'None'
  | 'NoUpdatesAvailable'
  | 'UpdateAssetsNotAvailable'
  | 'UpdateServerUnreachable'
  | 'UpdateHasInvalidSignature'
  | 'UpdateCodeSigningError'
  | 'UpdateFailedToLoad'
  | 'AssetsFailedToLoad'
  | 'JSRuntimeError'
  | 'InitializationError'
  | 'Unknown';

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
  /**
   * The Expo Services client id: a random, pseudonymous identifier for this app installation, shared by all
   * Expo Services client libraries. Observe records it on every metric and log event as the
   * `expo.eas_client.id` attribute, so use it to correlate Observe data with another service.
   *
   * The id is stored in native preferences and is stable across app launches and app updates. It
   * changes when the app's data is cleared or the app is reinstalled, although a backup restore
   * can carry the previous id over. It identifies an installation, not a user or a device.
   *
   * `null` on web, where there is no Expo Services client id.
   * Reading the id creates it on the device when it does not exist, also while consent is not
   * granted. A revoke keeps the id.
   *
   * @example
   * ```ts
   * import { Observe } from 'expo-observe';
   *
   * // Attach the same id to data you send elsewhere to line it up with Observe.
   * await fetch('https://example.com/events', {
   *   method: 'POST',
   *   body: JSON.stringify({ easClientId: Observe.clientId }),
   * });
   * ```
   *
   * @platform android
   * @platform ios
   */
  readonly clientId: string | null;
  /**
   * Changes whether the user consents to Observe collecting data. The device saves the value, and
   * it overrides the `consent` option of the `expo-observe` config plugin on later launches.
   *
   * A grant starts collection and saves the startup metrics of the current launch. A revoke stops
   * collection and deletes the Observe data stored on the device, but keeps `clientId`. A call
   * with the current value leaves collection unchanged.
   *
   * Observe starts collection at most one time in each app launch. After a revoke, a grant only
   * saves the value, and collection starts at the next launch.
   *
   * @param consent The new consent value.
   * @returns A promise that resolves when the change is applied. Calls are applied one at a time,
   * in call order. On Android, the promise rejects if the device cannot save the value, even for
   * the current value. In that case, a revoke still stops collection and deletes stored data,
   * and a grant leaves collection unchanged.
   *
   * @example
   * ```ts
   * import { Observe } from 'expo-observe';
   *
   * await Observe.setConsent(userAccepted ? 'granted' : 'not-granted');
   * ```
   *
   * @platform android
   * @platform ios
   */
  setConsent(consent: ObserveConsent): Promise<void>;
  /**
   * Dispatches pending events to the server immediately.
   *
   * Events are dispatched automatically when the app moves to the background. On Android,
   * a background worker dispatches events once network connectivity is available. On iOS,
   * dispatching happens when the app resigns active state or is about to terminate. Call
   * this method to flush events manually, for example, during testing or to ensure events
   * are sent before a specific point.
   *
   * @returns A promise that resolves once the events have been dispatched. A call made while
   * another dispatch is running waits for it to finish first.
   *
   * @example
   * ```ts
   * import { Observe } from 'expo-observe';
   *
   * await Observe.dispatchEvents();
   * ```
   */
  dispatchEvents(): Promise<void>;
  /**
   * Starts a trace span for an operation that is underway, and returns the span. The span gets
   * its trace ID and span ID immediately, so you can pass it as `parent` to other spans before it
   * ends.
   *
   * Observe saves the span when you call `end()`, and sends it with the next dispatch as part of
   * the current session. If you never call `end()`, Observe never sends the span.
   *
   * This method never throws. When it cannot record the span, it logs a warning. The span that it
   * returns still accepts every call.
   *
   * @param name A short, stable name for the operation, for example, `'checkout'`. Observe does
   * not record the span when the name is empty, starts with the reserved `expo.` prefix, or is
   * longer than 256 characters.
   * @param options Initial attributes, a parent span, and an optional start time
   * @returns The span. Call `end()` on it when the operation finishes.
   *
   * @example
   * ```ts
   * import { Observe } from 'expo-observe';
   *
   * const span = Observe.startSpan('checkout', { attributes: { 'cart.items': 3 } });
   * span.addEvent('cart-validated');
   * span.end();
   * ```
   */
  startSpan(name: string, options?: StartSpanOptions): Span;
  /**
   * Runs `callback` inside a span. The span starts first and ends when the callback returns or its
   * promise settles.
   *
   * When the callback throws or its promise rejects, the span ends with the `'error'` status and
   * the error message. The returned promise then rejects with the same error, so your own error
   * handling still works. An error inside Observe never changes the result: the returned promise
   * settles the same way as the callback.
   *
   * The callback receives the span. Use the span to add attributes and events, and pass it as
   * `parent` to nested spans. Observe does not nest spans automatically. A span that you start
   * inside the callback without `parent` begins its own trace.
   *
   * @param name A short, stable name for the operation. Observe does not record the span when the
   * name is empty, starts with the reserved `expo.` prefix, or is longer than 256 characters. The
   * callback still runs.
   * @param callback The operation to measure. It can be synchronous or asynchronous.
   * @param options Initial attributes, a parent span, and an optional start time
   * @returns A promise fulfilled with the result of the callback
   *
   * @example
   * ```ts
   * import { Observe } from 'expo-observe';
   *
   * const receipt = await Observe.withSpan('checkout', async (span) => {
   *   await Observe.withSpan('validate-cart', () => validateCart(), { parent: span });
   *   span.addEvent('cart-validated');
   *   return submitOrder();
   * });
   * ```
   */
  withSpan<T>(
    name: string,
    callback: (span: Span) => T | Promise<T>,
    options?: StartSpanOptions
  ): Promise<T>;
  /**
   * Records a span for an operation that you already measured. The result is the same as
   * `startSpan` followed immediately by `end()`, with the times that you supply.
   *
   * Observe does not record the span when `startTime` or `endTime` is missing or is not in Unix
   * epoch milliseconds. The same applies when `endTime` is before `startTime`. In each case,
   * Observe logs a warning. A value from `performance.now()` is not a Unix epoch time, so use
   * `Date.now()`. This method never throws.
   *
   * @param name A short, stable name for the operation. Observe does not record the span when the
   * name is empty, starts with the reserved `expo.` prefix, or is longer than 256 characters.
   * @param options The start and end times in Unix epoch milliseconds (both required), optional
   * attributes, and an optional parent span
   *
   * @example
   * ```ts
   * import { Observe } from 'expo-observe';
   *
   * const startTime = Date.now();
   * decodeImage();
   * Observe.recordSpan('image-decode', { startTime, endTime: Date.now() });
   * ```
   */
  recordSpan(name: string, options: RecordSpanOptions): void;
  /**
   * Configures how observability events are collected and dispatched at runtime, such as
   * the environment label, dispatching behavior, sampling, and integrations.
   *
   * @param config Observability settings to apply.
   *
   * @example
   * ```ts
   * import { Observe } from 'expo-observe';
   *
   * Observe.configure({
   *   environment: 'production',
   *   dispatchingEnabled: true,
   * });
   * ```
   */
  configure(config: ObserveConfig): void;
  /**
   * Returns the `integrations` config from the most recent `configure(...)`
   * call, or an empty object if `configure` has not run yet.
   */
  getIntegrations(): ObserveIntegrationsConfig;
  /**
   * Invokes a callback once when the named integration configuration becomes available.
   *
   * @param name Integration name.
   * @param callback Function called with the integration configuration.
   *
   * @example
   * ```ts
   * Observe.registerIntegration('expo-router', config => {
   *   console.log(config);
   * });
   * ```
   */
  registerIntegration<K extends keyof ObserveIntegrationsConfig>(
    name: K,
    callback: (config: ObserveIntegrationsConfig[K]) => void
  ): void;
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
   * Reports an error your code caught and handled, recorded as a non-fatal `exception` event. Use it
   * to keep visibility into failures you recover from, which never reach the automatic global handler
   * or an error boundary.
   *
   * The thrown value is normalized: an `Error`'s `name`, `message`, and `stack` are captured; any
   * other value (a string, a plain object) is stringified as the message.
   *
   * @param error The caught value. An `Error` is preferred, but any thrown value is accepted.
   *
   * @example
   * ```ts
   * try {
   *   await syncCart();
   * } catch (error) {
   *   Observe.reportError(error);
   * }
   * ```
   */
  // eslint-disable-next-line handle-callback-err -- `error` is the caught value to report, not a Node callback error.
  reportError(error: unknown): void;
  /**
   * Reports feedback from a user as an `expo.feedback` event. Every installation sends feedback:
   * `sampleRate` and `errorSampleRate` do not apply to it. `dispatchingEnabled`,
   * `dispatchInDebug`, and `ignoredEvents` apply to it the same way as to other events.
   *
   * `reportFeedback` drops the report and prints a warning in development when `id` is empty, when
   * the report has neither `message` nor `rating` (an empty `message` counts as none), when
   * `rating` is not a whole number within `scale`, when `scale` is not valid or has no `rating`,
   * or when an argument has the wrong type.
   *
   * @param feedback The feedback to report.
   *
   * @example
   * ```ts
   * Observe.reportFeedback({ id: 'checkout', message: 'The pay button is hard to find.', rating: 6 });
   * ```
   *
   * @platform android
   * @platform ios
   */
  reportFeedback(feedback: ObserveFeedback): void;
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
  /**
   * Returns whether the app privacy manifest declares user content.
   *
   * @private
   * @platform ios
   */
  hasUserContentPrivacyEntry?(): boolean;
}
