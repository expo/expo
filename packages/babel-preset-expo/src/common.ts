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
