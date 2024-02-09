/**
 * Load a bundle for a URL using fetch + eval on native and script tag injection on web.
 *
 * @param bundlePath Given a statement like `import('./Bacon')` `bundlePath` would be `Bacon.bundle?params=from-metro`.
 */
export declare function loadBundleAsync(bundlePath: string): Promise<void>;
//# sourceMappingURL=loadBundle.d.ts.map