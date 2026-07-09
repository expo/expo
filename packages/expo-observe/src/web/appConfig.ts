export type WebAppConfig = {
  extra?: { eas?: { projectId?: string; observe?: { endpointUrl?: string } } };
};

/**
 * Reads the app config on web. `process.env.APP_MANIFEST` is inlined as the
 * serialized app config by babel-preset-expo when bundling for web — the same
 * mechanism `expo-constants` uses to read the config in browsers.
 */
export function getAppConfig(): WebAppConfig | null {
  try {
    const manifest = process.env.APP_MANIFEST as unknown;
    if (typeof manifest === 'string') {
      return JSON.parse(manifest);
    }
    return (manifest as WebAppConfig) ?? null;
  } catch {
    return null;
  }
}
