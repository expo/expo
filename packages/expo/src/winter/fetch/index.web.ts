export * from './fetch';
export * from './fetch.types';
// On web, `fetch` is the platform's own, which only recognizes the platform's `Request`.
export const Request = globalThis.Request;
