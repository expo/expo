import os from 'os';

/** Determines whether the current process is running inside Windows Subsystem for Linux (WSL). */
export function isWsl(): boolean {
  if (process.platform !== 'linux') return false;
  if (process.env.WSL_DISTRO_NAME) return true;
  const release = os.release().toLowerCase();
  return release.includes('microsoft') || release.includes('wsl');
}
