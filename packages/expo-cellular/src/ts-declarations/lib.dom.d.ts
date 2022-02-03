// Expose this file as a module (see https://stackoverflow.com/a/59499895/4337317)
export {};

/**
 * Handle deprecations and missing typings that not available in the main lib.dom.d.ts file.
 */
declare global {
  type EffectiveConnectionType = '2g' | '3g' | '4g' | 'slow-2g';

  interface NetworkInformation {
    readonly effectiveType: EffectiveConnectionType;
  }

  interface Navigator {
    readonly mozConnection?: NetworkInformation;
    readonly webkitConnection?: NetworkInformation;
  }
}
