export function useEnvironmentVariablesPolyfill({ devServerUrl }: { devServerUrl?: string }) {
  globalThis.process = globalThis.process || {};
  globalThis.process.env.EXPO_DEV_SERVER_ORIGIN ??= devServerUrl;
}
