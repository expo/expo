import { Page } from './types';

type DevicePageInternal = Pick<Page, 'title' | 'capabilities'>;
type DevicePageResponse = {
  title: string;
  reactNative?: {
    logicalDeviceId: string;
    capabilities: Page['capabilities'];
  };
};

/**
 * Determine if a page debug target is supported by our debugging extensions.
 * If it's not, the extended CDP handlers will not be enabled.
 */
export function pageIsSupported(page: DevicePageInternal | DevicePageResponse): boolean {
  // @ts-expect-error No good way to filter this properly in TypeScript
  const capabilities = page.capabilities ?? page.reactNative?.capabilities ?? {};

  return (
    page.title === 'React Native Experimental (Improved Chrome Reloads)' ||
    capabilities.nativePageReloads === true
  );
}
