/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { ProjectConfig } from '@expo/config';
import resolve from 'resolve';
import resolveFrom from 'resolve-from';
import { promisify } from 'util';

import { fetchManifest } from './fetchRouterManifest';
import { getErrorOverlayHtmlAsync, logMetroError } from './metroErrorInterface';
import { warnInvalidWebOutput, warnInvalidMiddlewareOutput } from './router';
import { CommandError } from '../../../utils/errors';

const debug = require('debug')('expo:start:server:metro') as typeof console.log;

const resolveAsync = promisify(resolve) as any as (
  id: string,
  opts: resolve.AsyncOpts
) => Promise<string | null>;

export function createRouteHandlerMiddleware(
  projectRoot: string,
  options: {
    appDir: string;
    routerRoot: string;
    getStaticPageAsync: (pathname: string) => Promise<{ content: string }>;
    bundleApiRoute: (
      functionFilePath: string
    ) => Promise<null | Record<string, Function> | Response>;
    config: ProjectConfig;
  } & import('expo-router/build/routes-manifest').Options
) {
  if (!resolveFrom.silent(projectRoot, 'expo-router')) {
    throw new CommandError(
      `static and server rendering requires the expo-router package to be installed in your project. Either install the expo-router package or change 'web.output' to 'static' in your app.json.`
    );
  }

  const { createRequestHandler } =
    require('@expo/server/adapter/http') as typeof import('@expo/server/adapter/http');

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
            redirects: [],
            rewrites: [],
          }
        );
      },
      async getHtml(request) {
        try {
          const { content } = await options.getStaticPageAsync(request.url);
          return content;
        } catch (error: any) {
          // Forward the Metro server response as-is. It won't be pretty, but at least it will be accurate.

          try {
            return new Response(
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
            debug('Failed to render static error overlay:', staticError);
            // Fallback error for when Expo Router is misconfigured in the project.
            return new Response(
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
      async handleRouteError(error) {
        const { ExpoError } = require('@expo/server') as typeof import('@expo/server');

        if (ExpoError.isExpoError(error)) {
          // TODO(@krystofwoldrich): Can we show code snippet of the handler?
          // NOTE(@krystofwoldrich): Removing stack since to avoid confusion. The error is not in the server code.
          delete error.stack;
        }

        const htmlServerError = await getErrorOverlayHtmlAsync({
          error,
          projectRoot,
          routerRoot: options.routerRoot!,
        });

        return new Response(htmlServerError, {
          status: 500,
          headers: {
            'Content-Type': 'text/html',
          },
        });
      },
      async getApiRoute(route) {
        const { exp } = options.config;
        if (exp.web?.output !== 'server') {
          warnInvalidWebOutput();
        }

        const resolvedFunctionPath = await resolveAsync(route.file, {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
          basedir: options.appDir,
        })!;

        try {
          debug(`Bundling API route at: ${resolvedFunctionPath}`);
          return await options.bundleApiRoute(resolvedFunctionPath!);
        } catch (error: any) {
          return new Response(
            'Failed to load API Route: ' + resolvedFunctionPath + '\n\n' + error.message,
            {
              status: 500,
              headers: {
                'Content-Type': 'text/html',
              },
            }
          );
        }
      },
      async getMiddleware(route) {
        const { exp } = options.config;

        if (!options.unstable_useServerMiddleware) {
          return {
            default: () => {
              throw new CommandError(
                'Server middleware is not enabled. Add unstable_useServerMiddleware: true to your `expo-router` plugin config.'
              );
            },
          };
        }

        if (exp.web?.output !== 'server') {
          warnInvalidMiddlewareOutput();
          return {
            default: () => {
              console.warn(
                'Server middleware is only supported when web.output is set to "server" in your app config'
              );
            },
          };
        }

        const resolvedFunctionPath = await resolveAsync(route.file, {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
          basedir: options.appDir,
        })!;

        try {
          debug(`Bundling middleware at: ${resolvedFunctionPath}`);
          return await options.bundleApiRoute(resolvedFunctionPath!);
        } catch (error: any) {
          return new Response(
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
