import Log from '@expo/bunyan';
import { INTERNAL_CALLSITES_REGEX } from '@expo/metro-config';
import type { IncomingMessage, ServerResponse } from 'http';
import path from 'path';

import { ReactNativeStackFrame, StackFrame, Symbolicator } from './Symbolicator';
import {
  AnyCompiler,
  createGetFileNameFromUrl,
  getFileFromCompilerAsync,
  getPlatformFromRequest,
} from './getFileAsync';

// Customize the stack frames like we do in Metro projects.
function customizeFrame(frame: StackFrame) {
  let collapse = Boolean(frame.file && INTERNAL_CALLSITES_REGEX.test(frame.file));

  if (!collapse) {
    // This represents the first frame of the stacktrace.
    // Often this looks like: `__r(0);`.
    // The URL will also be unactionable in the app and therefore not very useful to the developer.
    if (
      frame.column === 3 &&
      frame.methodName === 'global code' &&
      frame.file?.match(/^https?:\/\//g)
    ) {
      collapse = true;
    }
  }

  return { ...(frame || {}), collapse };
}

export function createSymbolicateMiddleware({
  projectRoot,
  logger,
  compiler,
}: {
  projectRoot: string;
  logger: Log;
  compiler: AnyCompiler;
}) {
  const getFilenameFromUrl = createGetFileNameFromUrl(compiler);

  const symbolicate = new Symbolicator({
    projectRoot,
    logger,
    customizeFrame,
    async getFileAsync(props) {
      const fileName = getFilenameFromUrl(props);
      return getFileFromCompilerAsync(compiler, { fileName, platform: props.platform });
    },
    async getSourceMapAsync(props) {
      const fileName = getFilenameFromUrl(props);
      const fallbackSourceMapFilename = `${fileName}.map`;
      const bundle = await getFileFromCompilerAsync(compiler, {
        fileName,
        platform: props.platform,
      });
      const sourceMappingUrl = /sourceMappingURL=(.+)$/.exec(bundle)?.[1];
      const sourceMapBasename = sourceMappingUrl?.split('?')?.[0];

      let sourceMapFilename = fallbackSourceMapFilename;
      if (sourceMapBasename) {
        sourceMapFilename = path.join(path.dirname(fileName), sourceMapBasename);
      }

      let parseError: Error | null = null;
      for (const file of [sourceMapFilename, fallbackSourceMapFilename]) {
        try {
          return await getFileFromCompilerAsync(compiler, {
            fileName: file,
            platform: props.platform,
          });
        } catch (error: any) {
          parseError = error;
          console.warn('Failed to read source map from sourceMappingURL:', file);
          // logger.warn({ tag: 'dev-server' }, 'Failed to read source map from sourceMappingURL');
        }
      }
      throw parseError;
    },
  });

  return async function (
    req: IncomingMessage & { body?: any; rawBody?: any },
    res: ServerResponse
  ) {
    try {
      if (!req.rawBody) {
        return res.writeHead(400).end('Missing request rawBody.');
      }

      const { stack } = JSON.parse(req.rawBody as string) as {
        stack: ReactNativeStackFrame[];
      };

      const platform =
        getPlatformFromRequest(req) ?? Symbolicator.inferPlatformFromStack(stack) ?? 'web';

      if (!platform) {
        return res
          .writeHead(400)
          .end(
            'Missing expo-platform header, platform query parameter, or platform parameter in source map comment url'
          );
      }

      const parsed = await symbolicate.process(stack, { platform });
      return res.end(JSON.stringify(parsed));
    } catch (error: any) {
      console.error(`Failed to symbolicate: ${error} ${error.stack}`);
      // logger.error({ tag: 'dev-server' }, `Failed to symbolicate: ${error} ${error.stack}`);
      res.statusCode = 500;
      return res.end(JSON.stringify({ error: error.message }));
    }
  };
}
