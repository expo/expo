import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

import { fileExistsAsync } from '../../../utils/dir';
import { getDomComponentHtml, getDomComponentVirtualProxy } from '../metro/dom-components';
import { createBundleUrlPath, ExpoMetroOptions } from './metroOptions';

import type { ServerRequest, ServerResponse } from './server.types';

export type PickPartial<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

const fileURLToFilePath = (fileURL: string) => {
  if (!fileURL.startsWith('file://')) {
    throw new Error('Not a file URL');
  }
  return decodeURI(fileURL.slice('file://'.length));
};

export function createDomComponentsMiddleware(
  {
    projectRoot,
    metroRoot,
    getDevServerUrl,
  }: { projectRoot: string; metroRoot: string; getDevServerUrl: () => string },
  instanceMetroOptions: PickPartial<ExpoMetroOptions, 'mainModuleName' | 'platform' | 'bytecode'>
) {
  async function getDomComponentVirtualEntryModuleAsync(file: string) {
    const filePath = file.startsWith('file://') ? fileURLToFilePath(file) : file;

    const hash = crypto.createHash('sha1').update(filePath).digest('hex');

    const generatedEntry = path.join(projectRoot, '.expo/@dom', hash + '.js');

    const entryFile = getDomComponentVirtualProxy(generatedEntry, filePath);

    fs.mkdirSync(path.dirname(entryFile.filePath), { recursive: true });

    const exists = await fileExistsAsync(entryFile.filePath);
    // TODO: Assert no default export at runtime.
    await fs.promises.writeFile(entryFile.filePath, entryFile.contents);

    if (!exists) {
      // Give time for watchman to compute the file...
      // TODO: Virtual modules which can have dependencies.
      await new Promise((res) => setTimeout(res, 1000));
    }

    return generatedEntry;
  }

  return async (req: ServerRequest, res: ServerResponse, next: (err?: Error) => void) => {
    if (!req.url) return next();

    const url = coreceUrl(req.url);

    // Match `/_expo/@dom`.
    // This URL can contain additional paths like `/_expo/@dom/foo.js?file=...` to help the Safari dev tools.
    if (!url.pathname.startsWith('/_expo/@dom')) {
      return next();
    }

    const file = url.searchParams.get('file');

    if (!file || !file.startsWith('file://')) {
      res.statusCode = 400;
      res.statusMessage = 'Invalid file path';
      return res.end();
    }

    // Generate a unique entry file for the webview.
    const generatedEntry = await getDomComponentVirtualEntryModuleAsync(file);

    // Create the script URL
    const metroUrl = new URL(
      createBundleUrlPath({
        ...instanceMetroOptions,
        isDOM: true,
        mainModuleName: path.relative(metroRoot, generatedEntry),
        bytecode: false,
        platform: 'web',
        isExporting: false,
        engine: 'hermes',
        // Required for ensuring bundler errors are caught in the root entry / async boundary and can be recovered from automatically.
        lazy: true,
      }),
      // TODO: This doesn't work on all public wifi configurations.
      getDevServerUrl()
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

function coreceUrl(url: string) {
  try {
    return new URL(url);
  } catch {
    return new URL(url, 'https://localhost:0');
  }
}
