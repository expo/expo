import { NativeModule, requireOptionalNativeModule } from 'expo';
import { registerObserveIntegration } from 'expo-observe-interface';

// An example library that integrates itself with EAS Observe through expo-observe-interface, with a
// JavaScript integration and a native integration under the same name.

export const OBSERVE_INTEGRATION_EXAMPLE = 'observe-integration-example';

export type ObserveIntegrationExampleConfig = {
  /**
   * Whether the integration also reports warnings.
   */
  reportWarnings?: boolean;
};

declare module 'expo-observe-interface' {
  interface ObserveIntegrationsConfig {
    'observe-integration-example'?: boolean | ObserveIntegrationExampleConfig;
  }
}

export type ExampleLogLevel = 'warn' | 'error';

type ExampleLogListener = (level: ExampleLogLevel, message: string) => boolean;

declare class ObserveIntegrationExampleModule extends NativeModule {
  readonly isNativeIntegrationSetUp: boolean;
  log(level: ExampleLogLevel, message: string): boolean;
}

const nativeModule = requireOptionalNativeModule<ObserveIntegrationExampleModule>(
  'ObserveIntegrationExample'
);

let listener: ExampleLogListener | null = null;

/**
 * Logs a message in the JavaScript part of the example library. Returns whether the integration
 * recorded it.
 */
export function logInJavaScript(level: ExampleLogLevel, message: string): boolean {
  return listener?.(level, message) ?? false;
}

/**
 * Logs a message in the native part of the example library. Returns whether the integration
 * recorded it.
 */
export function logInNative(level: ExampleLogLevel, message: string): boolean {
  return nativeModule?.log(level, message) ?? false;
}

export function isJavaScriptIntegrationSetUp(): boolean {
  return listener !== null;
}

export function isNativeIntegrationSetUp(): boolean {
  return nativeModule?.isNativeIntegrationSetUp ?? false;
}

registerObserveIntegration<ObserveIntegrationExampleConfig>({
  name: OBSERVE_INTEGRATION_EXAMPLE,
  setup({ config, observe }) {
    console.log(`[observe-integration-example] Set up with ${JSON.stringify(config)}`);
    listener = (level, message) => {
      if (level === 'error') {
        return observe.reportError({
          type: 'observe-integration-example.error',
          message,
          code: 'ExampleError',
        });
      }
      if (!config.reportWarnings) {
        return false;
      }
      return observe.reportWarning({
        name: 'observe-integration-example.warning',
        displayName: 'Example warning',
        message,
        code: 'ExampleWarning',
      });
    };
    return () => {
      console.log('[observe-integration-example] Torn down');
      listener = null;
    };
  },
});
