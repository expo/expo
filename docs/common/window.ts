export const getViewportSize = () => {
  const width = Math.max(
    document.documentElement ? document.documentElement.clientWidth : 0,
    window.innerWidth || 0
  );
  const height = Math.max(
    document.documentElement ? document.documentElement.clientHeight : 0,
    window.innerHeight || 0
  );

  return {
    width,
    height,
  };
};
