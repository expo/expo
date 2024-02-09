import type { IncomingMessage, ServerResponse } from 'http';

// Middleware to suppress `EISDIR` error when opening javascript inspector in remote debugging.
// A workaround for https://github.com/facebook/react-native/issues/28844
// The root cause is that metro cannot serve sourcemap requests for /debugger-ui/
export function suppressRemoteDebuggingErrorMiddleware(
  req: IncomingMessage,
  res: ServerResponse,
  next: (err?: Error) => void
) {
  if (req.url?.match(/\/debugger-ui\/.+\.map$/)) {
    res.writeHead(404);
    res.end('Sourcemap for /debugger-ui/ is not supported.');
    return;
  }
  next();
}
