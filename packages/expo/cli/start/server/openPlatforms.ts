import { AbortCommandError } from '../../utils/errors';
import { Options } from '../resolveOptions';
import { DevServerManager } from './DevServerManager';

/** Launch the app on various platforms in parallel. */
export async function openPlatformsAsync(
  devServerManager: DevServerManager,
  options: Pick<Options, 'ios' | 'android' | 'web'>
) {
  const results = await Promise.allSettled([
    options.android ? devServerManager.getDefaultDevServer().openPlatformAsync('emulator') : null,
    options.ios ? devServerManager.getDefaultDevServer().openPlatformAsync('simulator') : null,
    options.web
      ? devServerManager
          .ensureWebDevServerRunningAsync()
          .then(() => devServerManager.getWebDevServer().openPlatformAsync('desktop'))
      : null,
  ]);

  const errors = results
    .reduce<Error[]>((prev, curr) => {
      if (curr instanceof Error) {
        prev.push(curr);
      }
      return prev;
    }, [])
    .filter(Boolean);

  if (errors.length) {
    // ctrl+c
    const isEscapedError = errors.some((error: any) => error.code === 'ABORTED');
    if (isEscapedError) {
      throw new AbortCommandError();
    }
    throw errors[0];
  }

  return !!options.android || !!options.ios;
}
