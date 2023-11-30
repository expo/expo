/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { ExpoResponse } from '@expo/server';
import { createRequestHandler } from '@expo/server/build/vendor/http';
import requireString from 'require-from-string';
import resolve from 'resolve';
import { promisify } from 'util';

import { ForwardHtmlError } from './MetroBundlerDevServer';
import { bundleApiRoute } from './bundleApiRoutes';
import { fetchManifest } from './fetchRouterManifest';
import { getErrorOverlayHtmlAsync, logMetroError, logMetroErrorAsync } from './metroErrorInterface';
import { Log } from '../../../log';

const debug = require('debug')('expo:start:server:metro') as typeof console.log;

const resolveAsync = promisify(resolve) as any as (
  id: string,
  opts: resolve.AsyncOpts
) => Promise<string | null>;

export function createRouteHandlerMiddleware(
  projectRoot: string,
  options: {
    mode?: string;
    appDir: string;
    routerRoot: string;
    port?: number;
    baseUrl: string;
    getWebBundleUrl: () => string;
    getStaticPageAsync: (pathname: string) => Promise<{ content: string }>;
  }
) {
  return createRequestHandler(
    { build: '' },
    {
      async getRoutesManifest() {
        const manifest = await fetchManifest<RegExp>(projectRoot, options);
        debug('manifest', manifest);
        // NOTE: no app dir if null
        // TODO: Redirect to 404 page
        return (
          manifest ?? {
            // Support the onboarding screen if there's no manifest
            htmlRoutes: [
              {
                file: 'index.js',
                page: '/index',
                routeKeys: {},
                namedRegex: /^\/(?:index)?\/?$/i,
              },
            ],
            apiRoutes: [],
            notFoundRoutes: [],
          }
        );
      },
      async getHtml(request) {
        try {
          const { content } = await options.getStaticPageAsync(request.url);
          return content;
        } catch (error: any) {
          // Forward the Metro server response as-is. It won't be pretty, but at least it will be accurate.
          if (error instanceof ForwardHtmlError) {
            return new ExpoResponse(error.html, {
              status: error.statusCode,
              headers: {
                'Content-Type': 'text/html',
              },
            });
          }

          try {
            return new ExpoResponse(
              await getErrorOverlayHtmlAsync({
                error,
                projectRoot,
                routerRoot: options.routerRoot,
              }),
              {
                status: 500,
                headers: {
                  'Content-Type': 'text/html',
                },
              }
            );
          } catch (staticError: any) {
            // Fallback error for when Expo Router is misconfigured in the project.
            return new ExpoResponse(
              '<span><h3>Internal Error:</h3><b>Project is not setup correctly for static rendering (check terminal for more info):</b><br/>' +
                error.message +
                '<br/><br/>' +
                staticError.message +
                '</span>',
              {
                status: 500,
                headers: {
                  'Content-Type': 'text/html',
                },
              }
            );
          }
        }
      },
      logApiRouteExecutionError(error) {
        logMetroError(projectRoot, { error });
      },
      async getApiRoute(route) {
        const resolvedFunctionPath = await resolveAsync(route.page, {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
          basedir: options.appDir,
        });

        const middlewareContents = await bundleApiRoute(
          projectRoot,
          resolvedFunctionPath!,
          options
        );
        if (!middlewareContents) {
          // TODO: Error handling
          return null;
        }

        try {
          debug(`Bundling middleware at: ${resolvedFunctionPath}`);
          return requireString(middlewareContents);
        } catch (error: any) {
          if (error instanceof Error) {
            await logMetroErrorAsync({ projectRoot, error });
          } else {
            Log.error('Failed to load middleware: ' + error);
          }
          return new ExpoResponse(
            'Failed to load middleware: ' + resolvedFunctionPath + '\n\n' + error.message,
            {
              status: 500,
              headers: {
                'Content-Type': 'text/html',
              },
            }
          );
        }
      },
    }
  );
}
