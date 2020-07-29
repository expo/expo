export function isAvailable() {
  return 'wakeLock' in navigator;
}

export default {};
