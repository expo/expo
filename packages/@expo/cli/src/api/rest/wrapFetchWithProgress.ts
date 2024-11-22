import { Response } from 'undici';

import { FetchLike } from './client.types';
import * as Log from '../../log';

const debug = require('debug')('expo:api:fetch:progress') as typeof console.log;

export function wrapFetchWithProgress(fetch: FetchLike): FetchLike {
  return function fetchWithProgress(url, init) {
    return fetch(url, init).then((response) => {
      const onProgress = init?.onProgress;

      // Abort if no `onProgress` is provided, the request failed, or there is no response body
      if (!onProgress || !response.ok || !response.body) {
        return response;
      }

      // Calculate total progress size
      const contentLength = response.headers.get('Content-Length');
      const progressTotal = Number(contentLength);

      debug(`Download size: %d`, progressTotal);

      // Abort if the `Content-Length` header is missing or invalid
      if (!progressTotal || isNaN(progressTotal) || progressTotal < 0) {
        Log.warn(
          'Progress callback not supported for network request because "Content-Length" header missing or invalid in response from URL:',
          url.toString()
        );
        return response;
      }

      debug(`Starting progress animation for: %s`, url);

      // Initialize the progression variables
      let progressCurrent = 0;
      const progressUpdate = () => {
        const progress = progressCurrent / progressTotal || 0;
        onProgress({
          progress,
          total: progressTotal,
          loaded: progressCurrent,
        });
      };

      // Create a new body-wrapping stream that handles the progression methods
      const bodyReader = response.body.getReader();
      const bodyWithProgress = new ReadableStream({
        start(controller) {
          function next() {
            bodyReader.read().then(({ done, value }) => {
              // Close the controller once stream is done
              if (done) return controller.close();

              // Update the progression
              progressCurrent += Buffer.byteLength(value);
              progressUpdate();

              // Continue the stream, and read the next chunk
              controller.enqueue(value);
              next();
            });
          }

          progressUpdate();
          next();
        },
      });

      // Return the new response with the wrapped body stream
      return new Response(bodyWithProgress as any, response);
    });
  };
}
