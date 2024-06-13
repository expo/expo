import path from 'path';

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

/** If bundling for a react-server target. */
export function getIsReactServer(caller: any): boolean {
  return caller?.isReactServer ?? false;
}

export function getIsDev(caller: any) {
  if (caller?.isDev != null) return caller.isDev;

  // https://babeljs.io/docs/options#envname
  return process.env.BABEL_ENV === 'development' || process.env.NODE_ENV === 'development';
}

export function getIsFastRefreshEnabled(caller: any) {
  if (!caller) return false;
  return caller.isHMREnabled && !caller.isServer && !caller.isNodeModule && getIsDev(caller);
}

export function getIsProd(caller: any) {
  if (caller?.isDev != null) return caller.isDev === false;

  // https://babeljs.io/docs/options#envname
  return process.env.BABEL_ENV === 'production' || process.env.NODE_ENV === 'production';
}

export function getIsNodeModule(caller: any): boolean {
  return caller?.isNodeModule ?? false;
}

export function getBaseUrl(caller: any): string {
  return caller?.baseUrl ?? '';
}

export function getIsServer(caller: any) {
  return caller?.isServer ?? false;
}

export function getExpoRouterAbsoluteAppRoot(caller: any): string {
  const rootModuleId = caller?.routerRoot ?? './app';
  if (path.isAbsolute(rootModuleId)) {
    return rootModuleId;
  }
  const projectRoot = getPossibleProjectRoot(caller) || '/';

  return path.join(projectRoot, rootModuleId);
}

export function getInlineEnvVarsEnabled(caller: any): boolean {
  const isWebpack = getBundler(caller) === 'webpack';
  const isDev = getIsDev(caller);
  const isServer = getIsServer(caller);
  const isNodeModule = getIsNodeModule(caller);
  const preserveEnvVars = caller?.preserveEnvVars;
  // Development env vars are added in the serializer to avoid caching issues in development.
  // Servers have env vars left as-is to read from the environment.
  return !isNodeModule && !isWebpack && !isDev && !isServer && !preserveEnvVars;
}

export function getAsyncRoutes(caller: any): boolean {
  const isServer = getIsServer(caller);
  if (isServer) {
    return false;
  }
  const isProd = getIsProd(caller);
  const platform = getPlatform(caller);
  if (platform !== 'web' && isProd) {
    return false;
  }
  return caller?.asyncRoutes ?? false;
}
