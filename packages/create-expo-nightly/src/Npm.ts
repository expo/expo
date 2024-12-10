import { runAsync } from './Processes.js';

/**
 * Get the version of a package's dist-tag from npm.
 */
export async function getNpmVersionAsync(packageName: string, distTag: string): Promise<string> {
  const { stdout } = await runAsync('npm', ['view', `${packageName}@${distTag}`, 'version']);
  return stdout.trim();
}
