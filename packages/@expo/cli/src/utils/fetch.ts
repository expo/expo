/**
 * The Node's built-in fetch API, but polyfilled from `undici` if necessary.
 * @todo(cedric): remove this once we min-support a Node version where fetch can't be disabled
 */
export const fetch =
  typeof globalThis.fetch === 'function' ? globalThis.fetch : require('undici').fetch;
