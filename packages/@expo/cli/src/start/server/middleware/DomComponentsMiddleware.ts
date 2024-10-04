import path from 'path';
import resolveFrom from 'resolve-from';

import { createBundleUrlPath, ExpoMetroOptions } from './metroOptions';
import type { ServerRequest, ServerResponse } from './server.types';
import { Log } from '../../../log';
import { memoize } from '../../../utils/fn';
import { fileURLToFilePath } from '../metro/createServerComponentsMiddleware';

export type PickPartial<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export const DOM_COMPONENTS_BUNDLE_DIR = 'www.bundle';

const warnUnstable = memoize(() =>
  Log.warn('Using experimental DOM Components API. Production exports may not work as expected.')
);

type CreateDomComponentsMiddlewareOptions = {
  /** The absolute metro or server root, used to calculate the relative dom entry path */
  metroRoot: string;
  /** The absolute project root, used to resolve the `expo/dom/entry.js` path */
  projectRoot: string;
};

export function createDomComponentsMiddleware(
  { metroRoot, projectRoot }: CreateDomComponentsMiddlewareOptions,
  instanceMetroOptions: PickPartial<ExpoMetroOptions, 'mainModuleName' | 'platform' | 'bytecode'>
) {
  return async (req: ServerRequest, res: ServerResponse, next: (err?: Error) => void) => {
    if (!req.url) return next();

    const url = coerceUrl(req.url);

    // Match `/_expo/@dom`.
    // This URL can contain additional paths like `/_expo/@dom/foo.js?file=...` to help the Safari dev tools.
    if (!url.pathname.startsWith('/_expo/@dom')) {
      return next();
    }

    const file = url.searchParams.get('file');

    if (!file || !file.startsWith('file://')) {
      res.statusCode = 400;
      res.statusMessage = 'Invalid file path: ' + file;
      return res.end();
    }

    warnUnstable();

    // Generate a unique entry file for the webview.
    const generatedEntry = file.startsWith('file://') ? fileURLToFilePath(file) : file;
    const virtualEntry = resolveFrom(projectRoot, 'expo/dom/entry.js');
    const relativeImport = './' + path.relative(path.dirname(virtualEntry), generatedEntry);
    // Create the script URL
    const requestUrlBase = `http://${req.headers.host}`;
    const metroUrl = new URL(
      createBundleUrlPath({
        ...instanceMetroOptions,
        domRoot: encodeURI(relativeImport),
        mainModuleName: path.relative(metroRoot, virtualEntry),
        bytecode: false,
        platform: 'web',
        isExporting: false,
        engine: 'hermes',
        // Required for ensuring bundler errors are caught in the root entry / async boundary and can be recovered from automatically.
        lazy: true,
      }),
      requestUrlBase
    ).toString();

    res.statusCode = 200;
    // Return HTML file
    res.setHeader('Content-Type', 'text/html');

    res.end(
      // Create the entry HTML file.
      getDomComponentHtml(metroUrl, { title: path.basename(file) })
    );
  };
}

function coerceUrl(url: string) {
  try {
    return new URL(url);
  } catch {
    return new URL(url, 'https://localhost:0');
  }
}

export function getDomComponentHtml(src?: string, { title }: { title?: string } = {}) {
  // This HTML is not optimized for `react-native-web` since DOM Components are meant for general React DOM web development.
  return `
<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
        ${title ? `<title>${title}</title>` : ''}
        <style id="expo-dom-component-style">
        /* These styles make the body full-height */
        html,
        body {
          -webkit-overflow-scrolling: touch; /* Enables smooth momentum scrolling */
        }
        /* These styles make the root element full-height */
        #root {
          display: flex;
          flex: 1;
        }
        </style>
    </head>
    <body>
    <noscript>DOM Components require <code>javaScriptEnabled</code></noscript>
        <!-- Root element for the DOM component. -->
        <div id="root"></div>
        ${src ? `<script crossorigin src="${src}"></script>` : ''}
    </body>
</html>`;
}
