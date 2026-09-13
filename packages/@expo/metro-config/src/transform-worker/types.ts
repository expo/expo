import type {
  CustomTransformOptions as MetroCustomTransformOptions,
  MetroBabelFileMetadata,
} from '@expo/metro/metro-babel-transformer';
import type { JsTransformerConfig as MetroJsTransformerConfig } from '@expo/metro/metro-transform-worker';

/**
 * Metro custom transform options plus fields owned and consumed by Expo.
 *
 * These mirror the options built by `getMetroDirectBundleOptions()` in
 * `@expo/cli/src/start/server/middleware/metroOptions.ts`, so the value types here are
 * the ones that survive a round-trip through the bundle URL's query params. Most flags
 * are therefore strings, not booleans.
 */
export type ExpoCustomTransformOptions = MetroCustomTransformOptions & {
  asyncRoutes?: 'true';
  baseUrl?: string;
  bytecode?: '1';
  clientBoundaries?: string[];
  /** Absolute path to the entry file of a `"use dom"` component. */
  dom?: string;
  engine?: 'hermes';
  environment?: 'node' | 'react-server' | 'client';
  hosted?: '1';
  isLoaderBundle?: 'true';
  liveBindings?: 'false';
  optimize?: boolean;
  preserveEnvVars?: boolean;
  /** Set by `prewarmTransformPool()`, which throws the transform result away. */
  prewarm?: '1';
  reactCompiler?: 'true';
  routerRoot?: string;
  useMd5Filename?: boolean;
};

/** Metro Babel metadata plus fields produced and consumed by Expo Babel plugins. */
export type ExpoBabelFileMetadata = MetroBabelFileMetadata & {
  expoDomComponentReference?: string;
  hasCjsExports?: boolean;
  loaderReference?: string;
  performConstantFolding?: boolean;
  reactClientReference?: string;
  reactServerReference?: string;
};

/**
 * The fields Expo adds to Metro's transformer configuration.
 *
 * Kept separate from {@link ExpoJsTransformerConfig} so that `@expo/cli` can intersect
 * these onto `ConfigT['transformer']` without discarding its `readonly` modifiers.
 */
export type ExpoJsTransformerConfigExtensions = {
  /** Normal path at which Babel config is found (must be relative to project root). */
  readonly extendsBabelConfigPath?: string;
  /**
   * The user's own `transformerPath`, moved here by `withMetroSupervisingTransformWorker()`
   * in `@expo/cli` so that the supervising transformer can load it. Set this to `false` in
   * a project's Metro config to opt out of the supervising transformer when debugging.
   */
  expo_customTransformerPath?: string | false;
};

/** Metro transformer configuration plus fields owned and consumed by Expo. */
export type ExpoJsTransformerConfig = MetroJsTransformerConfig & ExpoJsTransformerConfigExtensions;
