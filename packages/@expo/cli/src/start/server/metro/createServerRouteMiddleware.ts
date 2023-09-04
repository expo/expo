/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import requireString from 'require-from-string';
import resolve from 'resolve';
import resolveFrom from 'resolve-from';
import { promisify } from 'util';

import { Log } from '../../../log';
import { getStaticRenderFunctions } from '../getStaticRenderFunctions';
import { ServerNext, ServerRequest, ServerResponse } from '../middleware/server.types';
import {
  ExpoRouterServerManifestV1Route,
  fetchManifest,
  refetchManifest,
} from './fetchRouterManifest';
import { bundleApiRoute, eagerBundleApiRoutes } from './fetchServerRoutes';
import { getErrorOverlayHtmlAsync, logMetroError, logMetroErrorAsync } from './metroErrorInterface';

const debug = require('debug')('expo:start:server:metro') as typeof console.log;

const resolveAsync = promisify(resolve) as any as (
  id: string,
  opts: resolve.AsyncOpts
) => Promise<string | null>;

import { createRequestHandler } from '@expo/server/build/vendor/http';
import { ExpoResponse } from '@expo/server/build';

export function createRouteHandlerMiddleware(
  projectRoot: string,
  options: { mode?: string; appDir: string; port?: number; getWebBundleUrl: () => string }
) {
  // Install Node.js browser polyfills and source map support
  require(resolveFrom(projectRoot, '@expo/server/install'));
  const devServerUrl = `http://localhost:${options.port}`;

  // don't await
  eagerBundleApiRoutes(projectRoot, options);
  refetchManifest(projectRoot, options);

  console.log('setup');

  return createRequestHandler(
    { build: '' },
    {
      async getRoutesManifest() {
        const { manifest } = await fetchManifest<RegExp>(projectRoot, options);
        if (!manifest) {
          // NOTE: no app dir
          // TODO: Redirect to 404 page
          return null;
        }
        console.log('manifest', manifest);
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

  // const { convertRequest, respond } = require(resolveFrom(
  //   projectRoot,
  //   '@expo/server/build/vendor/http'
  // ));

  // // don't await
  // eagerBundleApiRoutes(projectRoot, options);
  // refetchManifest(projectRoot, options);

  // const devServerUrl = `http://localhost:${options.port}`;

  // return async function ExpoAPIRouteDevMiddleware(
  //   req: ServerRequest,
  //   res: ServerResponse,
  //   next: ServerNext
  // ) {
  //   if (!req?.url || !req.method) {
  //     return next();
  //   }
  //   const { manifest } = await fetchManifest<RegExp>(projectRoot, options);
  //   if (!manifest) {
  //     // NOTE: no app dir
  //     // TODO: Redirect to 404 page
  //     return next();
  //   }

  //   const location = new URL(req.url, 'https://expo.dev');

  //   // 1. Get pathname, e.g. `/thing`
  //   const pathname = location.pathname?.replace(/\/$/, '');
  //   const sanitizedPathname = pathname.replace(/^\/+/, '').replace(/\/+$/, '') + '/';

  //   let functionRoute: ExpoRouterServerManifestV1Route<RegExp> | null = null;

  //   const notFoundManifest = manifest?.notFoundRoutes;
  //   const staticManifest = manifest?.staticRoutes;
  //   const dynamicManifest = manifest?.dynamicRoutes;

  //   for (const route of dynamicManifest) {
  //     if (route.namedRegex.test(location.pathname)) {
  //       functionRoute = route;
  //       break;
  //     }
  //   }

  //   if (req.method === 'GET' || req.method === 'HEAD') {
  //     for (const route of staticManifest) {
  //       if (route.namedRegex.test(sanitizedPathname)) {
  //         // if (
  //         //   // Skip the 404 page if there's a function
  //         //   route.generated &&
  //         //   // TODO: Add a proper 404 convention.
  //         //   route.page.match(/^\.\/\[\.\.\.404]$/)
  //         // ) {
  //         //   if (functionRoute) {
  //         //     continue;
  //         //   }
  //         // }

  //         try {
  //           const { getStaticContent } = await getStaticRenderFunctions(projectRoot, devServerUrl, {
  //             minify: options.mode === 'production',
  //             dev: options.mode !== 'production',
  //             // Ensure the API Routes are included
  //             environment: 'node',
  //           });

  //           let content = await getStaticContent(location);

  //           //TODO: Not this -- disable injection some other way
  //           if (options.mode !== 'production') {
  //             // Add scripts for rehydration
  //             // TODO: bundle split
  //             content = content.replace(
  //               '</body>',
  //               [`<script src="${options.getWebBundleUrl()}" defer></script>`].join('\n') +
  //                 '</body>'
  //             );
  //           }

  //           res.setHeader('Content-Type', 'text/html');
  //           res.end(content);
  //           return;
  //         } catch (error: any) {
  //           res.setHeader('Content-Type', 'text/html');
  //           try {
  //             res.end(
  //               await getErrorOverlayHtmlAsync({
  //                 error,
  //                 projectRoot,
  //               })
  //             );
  //           } catch (staticError: any) {
  //             // Fallback error for when Expo Router is misconfigured in the project.
  //             res.end(
  //               '<span><h3>Internal Error:</h3><b>Project is not setup correctly for static rendering (check terminal for more info):</b><br/>' +
  //                 error.message +
  //                 '<br/><br/>' +
  //                 staticError.message +
  //                 '</span>'
  //             );
  //           }
  //         }
  //         return;
  //       }
  //     }
  //   }

  //   if (!functionRoute) {
  //     if (req.method === 'GET' || req.method === 'HEAD') {
  //       for (const route of notFoundManifest) {
  //         if (route.namedRegex.test(sanitizedPathname)) {
  //           try {
  //             const { getStaticContent } = await getStaticRenderFunctions(
  //               projectRoot,
  //               devServerUrl,
  //               {
  //                 minify: options.mode === 'production',
  //                 dev: options.mode !== 'production',
  //                 // Ensure the API Routes are included
  //                 environment: 'node',
  //               }
  //             );

  //             let content = await getStaticContent(location);

  //             //TODO: Not this -- disable injection some other way
  //             if (options.mode !== 'production') {
  //               // Add scripts for rehydration
  //               // TODO: bundle split
  //               content = content.replace(
  //                 '</body>',
  //                 [`<script src="${options.getWebBundleUrl()}" defer></script>`].join('\n') +
  //                   '</body>'
  //               );
  //             }

  //             res.setHeader('Content-Type', 'text/html');
  //             res.end(content);
  //             return;
  //           } catch (error: any) {
  //             res.setHeader('Content-Type', 'text/html');
  //             try {
  //               res.end(
  //                 await getErrorOverlayHtmlAsync({
  //                   error,
  //                   projectRoot,
  //                 })
  //               );
  //             } catch (staticError: any) {
  //               // Fallback error for when Expo Router is misconfigured in the project.
  //               res.end(
  //                 '<span><h3>Internal Error:</h3><b>Project is not setup correctly for static rendering (check terminal for more info):</b><br/>' +
  //                   error.message +
  //                   '<br/><br/>' +
  //                   staticError.message +
  //                   '</span>'
  //               );
  //             }
  //           }
  //           return;
  //         }
  //       }
  //     }

  //     return next();
  //   }

  //   const resolvedFunctionPath = await resolveAsync(functionRoute.page, {
  //     extensions: ['.js', '.jsx', '.ts', '.tsx'],
  //     basedir: options.appDir,
  //   });

  //   const middlewareContents = await bundleApiRoute(projectRoot, resolvedFunctionPath!, options);
  //   if (!middlewareContents) {
  //     // TODO: Error handling
  //     return next();
  //   }

  //   let middleware: any;
  //   try {
  //     debug(`Bundling middleware at: ${resolvedFunctionPath}`);
  //     middleware = requireString(middlewareContents);
  //   } catch (error: any) {
  //     if (error instanceof Error) {
  //       await logMetroErrorAsync({ projectRoot, error });
  //     } else {
  //       Log.error('Failed to load middleware: ' + error);
  //     }
  //     res.statusCode = 500;
  //     return res.end('Failed to load middleware: ' + resolvedFunctionPath + '\n\n' + error.message);
  //   }

  //   debug(`Supported methods (API route exports):`, Object.keys(middleware), ' -> ', req.method);

  //   // Interop default
  //   const func = middleware[req.method];

  //   if (!func) {
  //     res.statusCode = 405;
  //     return res.end('Method not allowed');
  //   }

  //   const expoRequest = convertRequest(req, res, functionRoute);

  //   try {
  //     // 4. Execute.
  //     const response = await func?.(expoRequest);

  //     // 5. Respond
  //     if (response) {
  //       await respond(res, response);
  //     } else {
  //       // TODO: Not sure what to do here yet
  //       res.statusCode = 500;
  //       res.end();
  //     }
  //   } catch (error: any) {
  //     if (error instanceof Error) {
  //       logMetroError(projectRoot, { error });
  //     }

  //     res.statusCode = 500;
  //     res.end();
  //   }
  // };
}
