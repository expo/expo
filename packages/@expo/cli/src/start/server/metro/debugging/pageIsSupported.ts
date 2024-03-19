import { Page } from './types';

/**
 * Determine if a page debug target is supported by our debugging extensions.
 * If it's not, the extended CDP handlers will not be enabled.
 */
export function pageIsSupported(page: Page) {
  return (
    page.title === 'React Native Experimental (Improved Chrome Reloads)' ||
    page.capabilities.nativePageReloads === true
  );
}
