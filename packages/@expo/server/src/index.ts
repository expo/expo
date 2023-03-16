import fs from 'fs';
import path from 'path';
import { URL } from 'url';

import { ExpoRequest, ExpoResponse, installGlobals } from './environment';
import { getStaticMiddleware } from './statics';

import 'source-map-support/register';
// Given build dir
// parse path
// import middleware function

installGlobals();

// TODO: Reuse this for dev as well
export function createRequestHandler(distFolder: string) {
  //   const statics = path.join(distFolder, 'static');

  const routesManifest = JSON.parse(
    fs.readFileSync(path.join(distFolder, 'routes-manifest.json'), 'utf-8')
  ).map((value: any) => {
    return {
      ...value,
      regex: new RegExp(value.regex),
    };
  });

  const dynamicManifest = routesManifest.filter((route: any) => route.type === 'dynamic');

  //   const serveStatic = getStaticMiddleware(statics);

  return async function handler(request: ExpoRequest): Promise<ExpoResponse> {
    const url = new URL(request.url, 'http://acme.dev');

    // Statics first
    // const staticResponse = await serveStatic(url, request);
    // if (staticResponse) {
    //   return staticResponse;
    // }

    const sanitizedPathname = url.pathname.replace(/^\/+/, '').replace(/\/+$/, '') + '/';

    for (const route of dynamicManifest) {
      if (!route.regex.test(sanitizedPathname)) {
        continue;
      }

      const func = require(path.join(distFolder, route.src));
      const routeHandler = func[request.method];
      if (!routeHandler) {
        const response = ExpoResponse.error();
        response.status = 405;
        response.statusText = 'Method not allowed';
        return response;
      }

      try {
        // TODO: Handle undefined
        return (await routeHandler(request)) as ExpoResponse;
      } catch (error) {
        // TODO: Symbolicate error stack
        console.error(error);
        const res = ExpoResponse.error();
        res.status = 500;
        return res;
      }
    }

    // 404
    const response = ExpoResponse.error();
    response.status = 404;
    response.statusText = 'Not found';
    return response;
  };
}
