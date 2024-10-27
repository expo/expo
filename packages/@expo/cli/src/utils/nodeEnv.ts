// Set the environment to production or development
// lots of tools use this to determine if they should run in a dev mode.
export function setNodeEnv(mode: 'development' | 'production') {
  process.env.NODE_ENV = process.env.NODE_ENV || mode;
  process.env.BABEL_ENV = process.env.BABEL_ENV || process.env.NODE_ENV;

  // @ts-expect-error: Add support for external React libraries being loaded in the same process.
  globalThis.__DEV__ = process.env.NODE_ENV !== 'production';
}
