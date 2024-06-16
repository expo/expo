import betterOpenBrowserAsync from 'better-opn';

/**
 * Due to a bug in `open`, which is used as fallback on Windows, we need to ensure `process.env.SYSTEMROOT` is set.
 * This environment variable is set by Windows on `SystemRoot`, causing `open` to execute a command with an "unknown" drive letter.
 *
 * @see https://github.com/sindresorhus/open/issues/205
 */
export async function openBrowserAsync(
  target: string,
  options?: any
): Promise<import('child_process').ChildProcess | false> {
  if (process.platform !== 'win32') {
    return await betterOpenBrowserAsync(target, options);
  }

  const oldSystemRoot = process.env.SYSTEMROOT;
  try {
    process.env.SYSTEMROOT = process.env.SYSTEMROOT ?? process.env.SystemRoot;
    return await betterOpenBrowserAsync(target, options);
  } finally {
    process.env.SYSTEMROOT = oldSystemRoot;
  }
}
