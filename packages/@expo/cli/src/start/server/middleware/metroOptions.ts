import type { BundleOptions as MetroBundleOptions } from 'metro/src/shared/types';
import resolveFrom from 'resolve-from';

import { env } from '../../../utils/env';

export function shouldEnableAsyncImports(projectRoot: string): boolean {
  if (env.EXPO_NO_METRO_LAZY) {
    return false;
  }

  // `@expo/metro-runtime` includes support for the fetch + eval runtime code required
  // to support async imports. If it's not installed, we can't support async imports.
  // If it is installed, the user MUST import it somewhere in their project.
  // Expo Router automatically pulls this in, so we can check for it.
  return resolveFrom.silent(projectRoot, '@expo/metro-runtime') != null;
}

export type ExpoMetroOptions = {
  platform: string;
  mainModuleName: string;
  mode: string;
  minify?: boolean;
  environment?: string;
  serializerOutput?: 'static';
  serializerIncludeMaps?: boolean;
  lazy?: boolean;
  engine?: 'hermes';
  preserveEnvVars?: boolean;
};

function withDefaults({
  mode = 'development',
  minify = mode === 'production',
  preserveEnvVars = env.EXPO_NO_CLIENT_ENV_VARS,
  ...props
}: ExpoMetroOptions): ExpoMetroOptions {
  return {
    mode,
    minify,
    preserveEnvVars,
    ...props,
  };
}

export function getMetroDirectBundleOptions(
  options: ExpoMetroOptions
): Partial<MetroBundleOptions> {
  const {
    mainModuleName,
    platform,
    mode,
    minify,
    environment,
    serializerOutput,
    serializerIncludeMaps,
    lazy,
    engine,
    preserveEnvVars,
  } = withDefaults(options);

  const dev = mode !== 'production';
  const isHermes = engine === 'hermes';

  let fakeSourceUrl: string | undefined;

  // TODO: Upstream support to Metro for passing custom serializer options.
  if (serializerIncludeMaps != null || serializerOutput != null) {
    fakeSourceUrl = new URL(
      createBundleUrlPath(options).replace(/^\//, ''),
      'http://localhost:8081'
    ).toString();
  }

  const bundleOptions: Partial<MetroBundleOptions> = {
    platform,
    entryFile: mainModuleName,
    dev,
    minify: !isHermes && (minify ?? !dev),
    inlineSourceMap: false,
    lazy,
    unstable_transformProfile: isHermes ? 'hermes-stable' : 'default',
    customTransformOptions: {
      __proto__: null,
      engine,
      preserveEnvVars,
      environment,
    },
    customResolverOptions: {
      __proto__: null,
      environment,
    },
    sourceUrl: fakeSourceUrl,
  };

  return bundleOptions;
}

export function createBundleUrlPath(options: ExpoMetroOptions): string {
  const {
    platform,
    mainModuleName,
    mode,
    minify,
    environment,
    serializerOutput,
    serializerIncludeMaps,
    lazy,
    engine,
    preserveEnvVars,
  } = withDefaults(options);

  const queryParams = new URLSearchParams({
    platform: encodeURIComponent(platform),
    dev: String(mode !== 'production'),
    // TODO: Is this still needed?
    hot: String(false),
  });

  if (lazy) {
    queryParams.append('lazy', String(lazy));
  }

  if (minify) {
    queryParams.append('minify', String(minify));
  }

  if (engine) {
    queryParams.append('transform.engine', engine);
  }

  if (preserveEnvVars) {
    queryParams.append('transform.preserveEnvVars', String(preserveEnvVars));
  }

  if (environment) {
    queryParams.append('resolver.environment', environment);
    queryParams.append('transform.environment', environment);
  }

  if (serializerOutput) {
    queryParams.append('serializer.output', serializerOutput);
  }
  if (serializerIncludeMaps) {
    queryParams.append('serializer.map', String(serializerIncludeMaps));
  }

  return `/${encodeURI(mainModuleName)}.bundle?${queryParams.toString()}`;
}
