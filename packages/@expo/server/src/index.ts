import { Response } from '@remix-run/node';
import fs from 'fs';
import path from 'path';
import { URL } from 'url';

import { ExpoRequest, ExpoResponse, installGlobals } from './environment';

import 'source-map-support/register';

installGlobals();

// TODO: Reuse this for dev as well
export function createRequestHandler(distFolder: string) {
  const routesManifest = JSON.parse(
    fs.readFileSync(path.join(distFolder, '_expo/routes.json'), 'utf-8')
  ).map((value: any) => {
    return {
      ...value,
      regex: new RegExp(value.regex),
    };
  });

  const dynamicManifest = routesManifest.filter(
    (route: any) => route.type === 'dynamic' || route.dynamic
  );

  return async function handler(request: ExpoRequest): Promise<Response> {
    const url = new URL(request.url, 'http://acme.dev');

    const sanitizedPathname = url.pathname.replace(/^\/+/, '').replace(/\/+$/, '') + '/';

    for (const route of dynamicManifest) {
      if (!route.regex.test(sanitizedPathname)) {
        continue;
      }

      // Handle dynamic pages like `[foobar].tsx`
      if (route.type === 'static') {
        // serve a static file
        const filePath = path.join(distFolder, route.file.replace(/\.[tj]sx?$/, '.html'));
        const response = new ExpoResponse(fs.readFileSync(filePath, 'utf-8'), {
          status: 200,
          headers: {
            'Content-Type': 'text/html',
          },
        });

        return response;
      }

      const func = require(path.join(distFolder, route.src));
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
