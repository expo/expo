export function getViewportSize() {
  const width = Math.max(
    document.documentElement ? document.documentElement.clientWidth : 0,
    window.innerWidth ?? 0
  );
  const height = Math.max(
    document.documentElement ? document.documentElement.clientHeight : 0,
    window.innerHeight ?? 0
  );

  return {
    width,
    height,
  };
}

export function prefersDarkTheme() {
  return window?.matchMedia('(prefers-color-scheme: dark)').matches ?? false;
}

export function prefersReducedMotion() {
  return window?.matchMedia('(prefers-reduced-motion)').matches ?? false;
}
