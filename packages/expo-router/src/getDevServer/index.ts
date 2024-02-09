export const getDevServer = () => {
  return {
    url: typeof location === 'undefined' ? '' : location.origin + '/',
  };
};
