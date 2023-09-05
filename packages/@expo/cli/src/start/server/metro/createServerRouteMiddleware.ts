/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { ExpoResponse } from '@expo/server/build';
import { createRequestHandler } from '@expo/server/build/vendor/http';
import requireString from 'require-from-string';
import resolve from 'resolve';
// import resolveFrom from 'resolve-from';
import { promisify } from 'util';

import { Log } from '../../../log';
import { getStaticRenderFunctions } from '../getStaticRenderFunctions';
import { fetchManifest } from './fetchRouterManifest';
import { bundleApiRoute } from './fetchServerRoutes';
import { getErrorOverlayHtmlAsync, logMetroError, logMetroErrorAsync } from './metroErrorInterface';

const debug = require('debug')('expo:start:server:metro') as typeof console.log;

const resolveAsync = promisify(resolve) as any as (
  id: string,
  opts: resolve.AsyncOpts
) => Promise<string | null>;

export function createRouteHandlerMiddleware(
  projectRoot: string,
  options: { mode?: string; appDir: string; port?: number; getWebBundleUrl: () => string }
) {
  // Install Node.js browser polyfills and source map support
  // require(resolveFrom(projectRoot, '@expo/server/install'));
  const devServerUrl = `http://localhost:${options.port}`;

  return createRequestHandler(
    { build: '' },
    {
      async getRoutesManifest() {
        const manifest = await fetchManifest<RegExp>(projectRoot, options);
        if (!manifest) {
          // NOTE: no app dir
          // TODO: Redirect to 404 page
          return null;
        }
        debug('manifest', manifest);
        return manifest;
      },
      async getHtml(request, route) {
        try {
          const { getStaticContent } = await getStaticRenderFunctions(projectRoot, devServerUrl, {
            minify: options.mode === 'production',
            dev: options.mode !== 'production',
            // Ensure the API Routes are included
            environment: 'node',
          });

          let content = await getStaticContent(request.expoUrl);

          //TODO: Not this -- disable injection some other way
          if (options.mode !== 'production') {
            // Add scripts for rehydration
            // TODO: bundle split
            content = content.replace(
              '</body>',
              [`<script src="${options.getWebBundleUrl()}" defer></script>`].join('\n') + '</body>'
            );
          }

          return content;
        } catch (error: any) {
          try {
            return new ExpoResponse(
              await getErrorOverlayHtmlAsync({
                error,
                projectRoot,
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
