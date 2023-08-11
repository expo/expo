import { DevServerManager } from './DevServerManager';
import { AbortCommandError } from '../../utils/errors';
import { Options } from '../resolveOptions';

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
          .then(() => devServerManager.getWebDevServer()?.openPlatformAsync('desktop'))
      : null,
  ]);

  const errors = results
    .map((result) => (result.status === 'rejected' ? result.reason : null))
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
