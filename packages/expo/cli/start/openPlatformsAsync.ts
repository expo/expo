import { AbortCommandError } from '../utils/errors';
import * as Android from './android/Android';
import * as Apple from './ios/Apple';
import { Options } from './resolveOptions';
import * as Webpack from './webpack/Webpack';

export async function openPlatformsAsync(
  projectRoot: string,
  options: Pick<Options, 'devClient' | 'ios' | 'android' | 'web'>,
  settings: { webOnly?: boolean }
) {
  const results = await Promise.allSettled([
    (async () => {
      if (options.android) {
        if (settings.webOnly) {
          return Android.openWebProjectAsync(projectRoot);
        } else if (options.devClient) {
          return Android.openProjectInDevClientAsync(projectRoot);
        }
        return Android.openProjectInExpoGoAsync(projectRoot);
      }
      return null;
    })(),
    (async () => {
      if (options.ios) {
        if (settings.webOnly) {
          return Apple.openWebProjectAsync(projectRoot);
        } else if (options.devClient) {
          return Apple.openProjectInDevClientAsync(projectRoot);
        }
        return Apple.openProjectInExpoGoAsync(projectRoot);
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
