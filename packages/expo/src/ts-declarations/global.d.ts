declare const global: any;

declare global {
  // Augment global type for FormData prototype to include missing methods: keys, values, entries, and Symbol.iterator
  // These methods are used in React for server actions.
  interface FormData {
    keys(): IterableIterator<string>;
    values(): IterableIterator<string | Blob>;
    entries(): IterableIterator<[string, string | Blob]>;
    [Symbol.iterator](): IterableIterator<[string, string | Blob]>;
  }
}

// Installed by React Native in development when network inspection is enabled
// eslint-disable-next-line no-var
declare var __NETWORK_REPORTER__: { createDevToolsRequestId(): string } | undefined;
