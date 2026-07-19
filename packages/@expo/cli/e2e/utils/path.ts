import os from 'node:os';
import path from 'node:path';

/**
 * The temporary directory to use when testing projects.
 * This resolves the `EXPO_E2E_TEMP_DIR` environment variable, or uses `os.tempDir()`.
 */
export const TEMP_DIR = process.env.EXPO_E2E_TEMP_DIR
  ? path.resolve(process.env.EXPO_E2E_TEMP_DIR)
  : os.tmpdir();

/** Generate a random temporary directory path */
export function getTemporaryPath() {
  return path.join(TEMP_DIR, Math.random().toString(36).substring(2));
}
