import { getFullBundlerUrl } from './getFullBundlerUrl';

const getDevServer = () => {
  // Disable for SSR
  if (typeof window === 'undefined') {
    return {
      bundleLoadedFromServer: true,
      fullBundleUrl: '',
      url: '',
    };
  }

  return {
    // The bundle is always loaded from a server in the browser.
    bundleLoadedFromServer: true,

    /** URL but ensures that platform query param is added. */
    get fullBundleUrl() {
      return getFullBundlerUrl();
    },
    url: location.origin + location.pathname,
  };
};

export default getDevServer;
