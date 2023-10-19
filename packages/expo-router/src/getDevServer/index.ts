import { Platform } from 'expo-modules-core';

export const getDevServer = () => {
  // Disable for SSR
  if (!Platform.isDOMAvailable) {
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
      if (document?.currentScript && 'src' in document.currentScript) {
        return document.currentScript.src;
      }

      const query = new URLSearchParams(location.search);

      query.append('platform', Platform.OS);

      return location.origin + location.pathname + '?' + query;
    },

    url: location.origin + '/',
  };
};
