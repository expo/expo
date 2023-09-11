import { readFile } from 'fs/promises';
import path from 'path';
import resolveFrom from 'resolve-from';

import { ExpoMiddleware } from './ExpoMiddleware';
import { ServerRequest, ServerResponse } from './server.types';

export const ReactDevToolsEndpoint = '/_expo/react-devtools';

export class ReactDevToolsPageMiddleware extends ExpoMiddleware {
  constructor(projectRoot: string) {
    super(projectRoot, [ReactDevToolsEndpoint]);
  }

  async handleRequestAsync(req: ServerRequest, res: ServerResponse): Promise<void> {
    const templatePath =
      // Production: This will resolve when installed in the project.
      resolveFrom.silent(this.projectRoot, 'expo/static/react-devtools-page/index.html') ??
      // Development: This will resolve when testing locally.
      path.resolve(__dirname, '../../../../../static/react-devtools-page/index.html');
    const content = (await readFile(templatePath)).toString('utf-8');

    res.setHeader('Content-Type', 'text/html');
    res.end(content);
  }
}
