import { AbortCommandError } from '../../utils/errors';
import { Options } from '../resolveOptions';
import {
  ensureWebDevServerRunningAsync,
  getDefaultDevServer,
  getWebDevServer,
} from './startDevServers';

export async function openPlatformsAsync(
  projectRoot: string,
  options: Pick<Options, 'ios' | 'android' | 'web'>
) {
  const results = await Promise.allSettled([
    options.android ? getDefaultDevServer().openPlatformAsync('emulator') : null,
    options.ios ? getDefaultDevServer().openPlatformAsync('simulator') : null,
    options.web
      ? ensureWebDevServerRunningAsync(projectRoot).then(() =>
          getWebDevServer().openPlatformAsync('desktop')
        )
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
