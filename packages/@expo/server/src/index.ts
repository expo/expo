import '@expo/server/install';

import { Response } from '@remix-run/node';
import fs from 'fs';
import path from 'path';
import { URL } from 'url';

import type { ExpoRoutesManifestV1 } from 'expo-router/build/routes-manifest';

import { ExpoRequest, ExpoResponse } from './environment';

const debug = require('debug')('expo:server') as typeof console.log;

function getProcessedManifest(path: string): ExpoRoutesManifestV1<RegExp> {
  // TODO: JSON Schema for validation
  let routesManifest = JSON.parse(fs.readFileSync(path, 'utf-8')) as ExpoRoutesManifestV1;

  const parsed: ExpoRoutesManifestV1<RegExp> = {
    ...routesManifest,
    functions: routesManifest.functions.map((value: any) => {
      return {
        ...value,
        regex: new RegExp(value.regex),
      };
    }),
    staticHtml: routesManifest.staticHtml.map((value: any) => {
      return {
        ...value,
        regex: new RegExp(value.regex),
      };
    }),
  };

  return parsed;
}

// TODO: Reuse this for dev as well
export function createRequestHandler(distFolder: string) {
  const routesManifest = getProcessedManifest(path.join(distFolder, '_expo/routes.json'));

  const dynamicManifest = [...routesManifest.functions, ...routesManifest.staticHtml].filter(
    (route: any) => route.type === 'dynamic' || route.dynamic
  );

  return async function handler(request: ExpoRequest): Promise<Response> {
    const url = new URL(request.url, 'http://expo.dev');

    const sanitizedPathname = url.pathname.replace(/^\/+/, '').replace(/\/+$/, '') + '/';

    for (const route of dynamicManifest) {
      if (!route.regex.test(sanitizedPathname)) {
        continue;
      }

      const params = getSearchParams(route.src, sanitizedPathname);

      for (const [key, value] of Object.entries(params)) {
        if (value) {
          request.expoUrl.searchParams.set(key, value);
        }
      }

      // Handle dynamic pages like `[foobar].tsx`
      if (route.type === 'static') {
        // serve a static file
        const filePath = path.join(distFolder, route.file.replace(/\.[tj]sx?$/, '.html'));
        return new ExpoResponse(fs.readFileSync(filePath, 'utf-8'), {
          status: 200,
          headers: {
            'Content-Type': 'text/html',
          },
        });
      }

      const funcPath = path.join(distFolder, route.src);
      debug(`Handling dynamic route: ${route.file}: ${funcPath}`);

      const func = require(funcPath);
      const routeHandler = func[request.method];
      if (!routeHandler) {
        return new ExpoResponse('Method not allowed', {
          status: 405,
          headers: {
            'Content-Type': 'text/plain',
          },
        });
      }

      try {
        // TODO: Handle undefined
        return (await routeHandler(request)) as ExpoResponse;
      } catch (error) {
        // TODO: Symbolicate error stack
        console.error(error);
        // const res = ExpoResponse.error();
        // res.status = 500;
        // return res;

        return new ExpoResponse('Internal server error', {
          status: 500,
          headers: {
            'Content-Type': 'text/plain',
          },
        });
      }
    }

    // 404
    const response = new ExpoResponse('Not found', {
      status: 404,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
    return response;
  };
}

// Given a formatted URL like `/[foo]/bar/[baz].js` and a URL like `/hello/bar/world?other=1`
// return the processed search params like `{ baz: 'world', foo: 'hello', other: '1' }`
function getSearchParams(url: string, filePath: string) {
  const params = new URLSearchParams(url.split('?')[1]);
  const formattedParams = filePath.split('/').filter(Boolean);
  const searchParams: Record<string, string | null> = {};

  for (let i = 0; i < formattedParams.length; i++) {
    const param = formattedParams[i];
    if (param.startsWith('[')) {
      const key = param.replace(/[\[\]]/g, '');
      searchParams[key] = params.get(key);
    }
  }

  return searchParams;
}

export { ExpoResponse, ExpoRequest };
