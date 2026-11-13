import { CookieConsentProvider } from '@expo/styleguide-cookie-consent';
import { useEffect, type PropsWithChildren } from 'react';

const DATAGRAIL_CUSTOMER_ID = '1670e563-5fad-498c-829e-6e1ec0d72dc7';
const PRODUCTION_DATAGRAIL_CONTAINER_ID = '4eb52ba0-0d2c-4c0c-b086-eb6c1a64a189';
const STAGING_DATAGRAIL_CONTAINER_ID = 'a7095413-bb49-40c3-a291-2b78cd6ebb8f';
const GOOGLE_ANALYTICS_ID = 'G-YKNPYCMLWY';
const PRODUCTION_DOCS_HOST = 'docs.expo.dev';
const CONSENT_BANNER_SELECTOR = '.dg-consent-banner';

// Previews are production builds, so the host decides the container, not `NODE_ENV`.
export function getDataGrailContainerId(host: string) {
  return host === PRODUCTION_DOCS_HOST
    ? PRODUCTION_DATAGRAIL_CONTAINER_ID
    : STAGING_DATAGRAIL_CONTAINER_ID;
}

function addNofollowToBannerLinks(bannerRoot: ShadowRoot) {
  bannerRoot.querySelectorAll<HTMLAnchorElement>('a[href]').forEach(link => {
    link.relList.add('nofollow');
  });
}

function useNofollowConsentBannerLinks() {
  useEffect(() => {
    const watchedRoots = new WeakSet<ShadowRoot>();
    const bannerObservers: MutationObserver[] = [];

    const watchBanner = (banner: Element) => {
      const bannerRoot = banner.shadowRoot;
      if (!bannerRoot || watchedRoots.has(bannerRoot)) {
        return;
      }
      watchedRoots.add(bannerRoot);
      addNofollowToBannerLinks(bannerRoot);
      const bannerObserver = new MutationObserver(() => {
        addNofollowToBannerLinks(bannerRoot);
      });
      bannerObserver.observe(bannerRoot, { childList: true, subtree: true });
      bannerObservers.push(bannerObserver);
    };

    const watchBanners = () => {
      document.querySelectorAll(CONSENT_BANNER_SELECTOR).forEach(watchBanner);
    };

    const bodyObserver = new MutationObserver(watchBanners);
    bodyObserver.observe(document.body, { childList: true, subtree: true });
    watchBanners();

    return () => {
      bodyObserver.disconnect();
      bannerObservers.forEach(observer => {
        observer.disconnect();
      });
    };
  }, []);
}

export function ConsentProvider({ children }: PropsWithChildren) {
  const host = typeof window === 'undefined' ? '' : window.location.host;
  useNofollowConsentBannerLinks();
  return (
    <CookieConsentProvider
      customerId={DATAGRAIL_CUSTOMER_ID}
      containerId={getDataGrailContainerId(host)}
      ga4Id={GOOGLE_ANALYTICS_ID}>
      {children}
    </CookieConsentProvider>
  );
}
