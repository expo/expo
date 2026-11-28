// On web, `fetch` is the platform's own, which only accepts the platform's `Request`. The split is
// here rather than in `index.web.ts` because the `expo/fetch` export resolves to `index.js` by its
// exact path, so bundlers never pick a platform-specific index.
export const Request = globalThis.Request;
