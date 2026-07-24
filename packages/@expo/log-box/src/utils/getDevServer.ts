export const getDevServer = () => {
  // Disable for SSR
  if (typeof window === 'undefined') {
    return {
      bundleLoadedFromServer: true,
      url: '',
    };
  }

  return {
    // The bundle is always loaded from a server in the browser.
    bundleLoadedFromServer: true,
    url: location.origin + '/',
  };
};
