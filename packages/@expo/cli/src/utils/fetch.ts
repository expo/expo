import type { FetchLike } from '../api/rest/client.types';

/**
 * The Node's built-in fetch API, but polyfilled from `undici` if necessary.
 * @todo(cedric): remove this once we min-support a Node version where fetch can't be disabled
 */
export const fetch: FetchLike =
  typeof globalThis.fetch !== 'undefined' ? globalThis.fetch : require('undici').fetch;

/**
 * Node's built-in fetch Headers class, or the polyfilled Headers from `undici` when unavailable.
 * @todo(cedric): remove this once we min-support a Node version where fetch can't be disabled
 */
export const Headers: typeof import('undici').Headers =
  typeof globalThis.Headers !== 'undefined' ? globalThis.Headers : require('undici').Headers;
