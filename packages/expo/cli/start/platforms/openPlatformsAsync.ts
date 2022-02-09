import { AbortCommandError } from '../../utils/errors';
import { Options } from '../resolveOptions';
import * as Webpack from '../webpack/Webpack';
import { AndroidPlatformManager } from './android/AndroidPlatformManager';
import { ApplePlatformManager } from './ios/ApplePlatformManager';

export async function openPlatformsAsync(
  projectRoot: string,
  options: Pick<Options, 'devClient' | 'ios' | 'android' | 'web'>,
  settings: { webOnly?: boolean }
) {
  const results = await Promise.allSettled([
    (async () => {
      if (options.android) {
        const platform = new AndroidPlatformManager(projectRoot);
        if (settings.webOnly) {
          return platform.openAsync({ runtime: 'web' });
        } else if (options.devClient) {
          return platform.openAsync({ runtime: 'custom' });
        }
        return platform.openAsync({ runtime: 'expo' });
      }
      return null;
    })(),
    (async () => {
      if (options.ios) {
        const platform = new ApplePlatformManager(projectRoot);
        if (settings.webOnly) {
          return platform.openAsync({ runtime: 'web' });
        } else if (options.devClient) {
          return platform.openAsync({ runtime: 'custom' });
        }
        return platform.openAsync({ runtime: 'expo' });
      }
      return null;
    })(),
    (async () => {
      if (options.web) {
        return Webpack.openAsync(projectRoot);
      }
      return null;
    })(),
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
