import { requireOptionalNative } from 'expo';

/**
 * The `integrations` option of `Observe.configure`. A library adds the key of its integration with
 * declaration merging. Use the npm package name of the library as the key.
 *
 * @example
 * ```ts
 * declare module 'expo-observe-interface' {
 *   interface ObserveIntegrationsConfig {
 *     'my-library'?: boolean | { reportWarnings?: boolean };
 *   }
 * }
 * ```
 */
// oxlint-disable-next-line typescript/no-empty-object-type -- Libraries add their keys with declaration merging.
export interface ObserveIntegrationsConfig {}

/**
 * A value of an attribute that an integration attaches to a report.
 */
export type ObserveAttributeValue = string | number | boolean;

/**
 * The severity of a log event.
 */
export type ObserveSeverity = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export type ObserveErrorReport = {
  /**
   * The error type, for example `'my-library.error'`. Observe groups errors by type and message.
   */
  type: string;
  message: string;
  stacktrace?: string;
  /**
   * A stable code of the error, recorded as the `expo.error.code` attribute. The `ignoredCodes`
   * option of the integration config skips reports with this code.
   */
  code?: string;
  /**
   * Whether the error is written to disk before `reportError` returns, and recorded on the next
   * launch. Use it for an error that is reported just before the app can end.
   *
   * @default false
   */
  persistImmediately?: boolean;
};

export type ObserveWarningReport = {
  /**
   * The event name, for example `'my-library.warning'`.
   */
  name: string;
  /**
   * The name that the dashboard shows for the event.
   */
  displayName?: string;
  /**
   * Recorded as the body of the event and as the `message` attribute.
   */
  message: string;
  /**
   * A stable code of the warning, recorded as the `code` attribute. The `ignoredCodes` option of
   * the integration config skips reports with this code.
   */
  code?: string;
  attributes?: Record<string, ObserveAttributeValue>;
};

export type ObserveEvent = {
  /**
   * The event name. Names that start with `expo.` are reserved.
   */
  name: string;
  /**
   * The name that the dashboard shows for the event.
   */
  displayName?: string;
  body?: string;
  attributes?: Record<string, ObserveAttributeValue>;
  /**
   * @default 'info'
   */
  severity?: ObserveSeverity;
};

/**
 * Reports for one integration. The functions do nothing after the integration is torn down. Each
 * report function returns whether the report was recorded.
 *
 * Nothing is recorded while the user has not granted consent to Observe. The client does not
 * limit how often an integration reports.
 */
export type ObserveClient = {
  /**
   * Records an error.
   */
  reportError(report: ObserveErrorReport): boolean;
  /**
   * Records a warning as a log event at the `warn` severity.
   */
  reportWarning(report: ObserveWarningReport): boolean;
  /**
   * Records a log event.
   */
  logEvent(event: ObserveEvent): boolean;
};

/**
 * What `setup` of an integration receives.
 */
export type ObserveIntegrationContext<Config extends object> = {
  /**
   * The object under the integration key in `Observe.configure({ integrations })`, or an empty
   * object for `true`. Values that JSON cannot represent, such as functions, are left out.
   */
  config: Config;
  /**
   * Reports for this integration. It stops working after the teardown runs.
   */
  observe: ObserveClient;
};

/**
 * An integration that reports what a library logs to EAS Observe.
 */
export type ObserveIntegration<Config extends object = object> = {
  /**
   * The key of the integration in `Observe.configure({ integrations })`. Use the npm package name
   * of the library.
   */
  name: string;
  /**
   * Starts the integration. Returns a function that stops it. `setup` runs when `Observe.configure`
   * enables the integration. When a later `configure` call changes the config of the integration,
   * the teardown runs, and then `setup` runs again with the new config. When a later `configure`
   * call turns the integration off, only the teardown runs.
   */
  setup(context: ObserveIntegrationContext<Config>): (() => void) | void;
};

/**
 * The version of the contract between this package and the `ObserveIntegrations` native module of
 * `expo-observe`.
 */
const API_VERSION = 1;

type NativeObserveIntegrationClient = {
  reportError(report: ObserveErrorReport): boolean;
  reportWarning(report: ObserveWarningReport): boolean;
  logEvent(event: ObserveEvent): boolean;
};

type NativeObserveIntegrations = {
  readonly apiVersion: number;
  register(
    name: string,
    apply: (configJson: string | null, client: NativeObserveIntegrationClient | null) => void
  ): void;
};

type NativeObservePackage = {
  ObserveIntegrations?: NativeObserveIntegrations;
};

/**
 * Registers an integration with `expo-observe`. `setup` runs each time `Observe.configure` enables
 * the integration with a new config, and the teardown runs before the next `setup` and when a
 * `configure` call turns the integration off. Errors that `setup` or the teardown throw are caught
 * and printed as warnings.
 *
 * Call it once, when the library is imported. A later registration with the same name replaces the
 * earlier one.
 *
 * When `expo-observe` is not installed, the function does nothing, so a library can call it
 * without a dependency on `expo-observe`.
 *
 * @example
 * ```ts
 * import { registerObserveIntegration } from 'expo-observe-interface';
 *
 * registerObserveIntegration<{ reportWarnings?: boolean }>({
 *   name: 'my-library',
 *   setup({ config, observe }) {
 *     const subscription = addLogListener((log) => {
 *       if (log.level === 'error') {
 *         observe.reportError({ type: 'my-library.error', message: log.message, code: log.code });
 *       } else if (config.reportWarnings) {
 *         observe.reportWarning({ name: 'my-library.warning', message: log.message });
 *       }
 *     });
 *     return () => subscription.remove();
 *   },
 * });
 * ```
 *
 * @platform ios
 */
export function registerObserveIntegration<Config extends object = object>(
  integration: ObserveIntegration<Config>
): void {
  // `requireOptionalNative` is missing from older versions of `expo`.
  const host =
    typeof requireOptionalNative === 'function'
      ? requireOptionalNative<NativeObservePackage>('expo-observe')?.ObserveIntegrations
      : undefined;
  if (!host) {
    return;
  }
  const { name } = integration;
  if (host.apiVersion !== API_VERSION) {
    if (__DEV__) {
      console.warn(
        `[expo-observe-interface] The '${name}' integration does not start, because the installed ` +
          `expo-observe uses integration API version ${host.apiVersion}, and this expo-observe-interface ` +
          `uses version ${API_VERSION}. Install the versions of expo-observe and expo-observe-interface ` +
          'from the same Expo SDK.'
      );
    }
    return;
  }
  let teardown: (() => void) | null = null;
  host.register(name, (configJson, nativeClient) => {
    if (teardown) {
      callSafely(name, 'teardown', teardown);
      teardown = null;
    }
    if (configJson == null || nativeClient == null) {
      return;
    }
    const result = callSafely(name, 'setup', () =>
      integration.setup({
        config: JSON.parse(configJson) as Config,
        observe: createClient(name, nativeClient),
      })
    );
    teardown = typeof result === 'function' ? result : null;
  });
}

function callSafely<T>(name: string, hook: string, call: () => T): T | undefined {
  try {
    return call();
  } catch (error) {
    console.warn(
      `[expo-observe-interface] The \`${hook}\` of the '${name}' integration threw:`,
      error
    );
    return undefined;
  }
}

/**
 * Wraps the native client, so a report that the native client rejects, for example because of an
 * attribute of the wrong type, returns `false` instead of throwing in the library.
 */
function createClient(name: string, native: NativeObserveIntegrationClient): ObserveClient {
  function call(method: string, body: () => boolean): boolean {
    try {
      return body();
    } catch (error) {
      if (__DEV__) {
        console.warn(
          `[expo-observe-interface] The '${name}' integration could not call \`${method}\`:`,
          error
        );
      }
      return false;
    }
  }
  return {
    reportError: (report) => call('reportError', () => native.reportError(report)),
    reportWarning: (report) => call('reportWarning', () => native.reportWarning(report)),
    logEvent: (event) => call('logEvent', () => native.logEvent(event)),
  };
}
