export type BabelPresetExpoPlatformOptions = {
  // Defaults to undefined, set to `true` to disable `@babel/plugin-transform-flow-strip-types`
  disableFlowStripTypesTransform?: boolean;

  disableImportExportTransform?: boolean;
  // Defaults to undefined, set to `false` to disable `@babel/plugin-transform-runtime`
  enableBabelRuntime?: boolean;
  // Defaults to `'default'`, can also use `'hermes-canary'`
  unstable_transformProfile?: 'default' | 'hermes-stable' | 'hermes-canary';
  /** @deprecated Set `jsxRuntime: 'classic'` to disable automatic JSX handling.  */
  useTransformReactJSXExperimental?: boolean;
};

export type BabelPresetExpoOptions = {
  lazyImports?: boolean;
  reanimated?: boolean;
  jsxRuntime?: 'classic' | 'automatic';
  jsxImportSource?: string;
  web?: BabelPresetExpoPlatformOptions;
  native?: BabelPresetExpoPlatformOptions;
};

export function hasModule(name: string): boolean {
  try {
    return !!require.resolve(name);
  } catch (error: any) {
    if (error.code === 'MODULE_NOT_FOUND' && error.message.includes(name)) {
      return false;
    }
    throw error;
  }
}

/** Determine which bundler is being used. */
export function getBundler(caller: any) {
  if (!caller) return null;
  if (caller.bundler) return caller.bundler;
  if (
    // Known tools that use `webpack`-mode via `babel-loader`: `@expo/webpack-config`, Next.js <10
    caller.name === 'babel-loader' ||
    // NextJS 11 uses this custom caller name.
    caller.name === 'next-babel-turbo-loader'
  ) {
    return 'webpack';
  }

  // Assume anything else is Metro.
  return 'metro';
}

export function getPlatform(caller: any) {
  if (!caller) return null;
  if (caller.platform) return caller.platform;
  const bundler = getBundler(caller);
  if (bundler === 'webpack') {
    return 'web';
  }

  // unknown
  return caller.platform;
}

export function getPossibleProjectRoot(caller: any) {
  if (!caller) return null;
  if (caller.projectRoot) return caller.projectRoot;
  // unknown
  return process.env.EXPO_PROJECT_ROOT;
}

export function getIsDev(caller: any) {
  if (caller?.isDev != null) return caller.isDev;

  // https://babeljs.io/docs/options#envname
  return process.env.BABEL_ENV === 'development' || process.env.NODE_ENV === 'development';
}
