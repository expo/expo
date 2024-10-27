import assert from 'assert';
import path from 'path';
import resolveFrom from 'resolve-from';
import send from 'send';

import { ExpoMiddleware } from './ExpoMiddleware';
import { ServerRequest, ServerResponse } from './server.types';

export const ReactDevToolsEndpoint = '/_expo/react-devtools';

export class ReactDevToolsPageMiddleware extends ExpoMiddleware {
  constructor(projectRoot: string) {
    super(projectRoot, [ReactDevToolsEndpoint]);
  }

  override shouldHandleRequest(req: ServerRequest): boolean {
    if (!req.url?.startsWith(ReactDevToolsEndpoint)) {
      return false;
    }
    return true;
  }

  async handleRequestAsync(req: ServerRequest, res: ServerResponse): Promise<void> {
    assert(req.headers.host, 'Request headers must include host');
    const { pathname } = new URL(req.url ?? '/', `http://${req.headers.host}`);
    const requestPath = pathname.substring(ReactDevToolsEndpoint.length) || '/';

    const entryPath =
      // Production: This will resolve when installed in the project.
      resolveFrom.silent(this.projectRoot, 'expo/static/react-devtools-page/index.html') ??
      // Development: This will resolve when testing locally.
      path.resolve(__dirname, '../../../../../static/react-devtools-page/index.html');

    const staticRoot = path.dirname(entryPath);
    send(req, requestPath, { root: staticRoot }).pipe(res);
  }
}
