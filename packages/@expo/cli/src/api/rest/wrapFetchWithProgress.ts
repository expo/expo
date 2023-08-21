import { FetchLike } from './client.types';
import * as Log from '../../log';
const debug = require('debug')('expo:api:fetch:progress') as typeof console.log;

export function wrapFetchWithProgress(fetch: FetchLike): FetchLike {
  return (url, init) => {
    return fetch(url, init).then((res) => {
      if (res.ok && init?.onProgress) {
        const totalDownloadSize = res.headers.get('Content-Length');
        const total = Number(totalDownloadSize);

        debug(`Download size: ${totalDownloadSize}`);
        if (!totalDownloadSize || isNaN(total) || total < 0) {
          Log.warn(
            'Progress callback not supported for network request because "Content-Length" header missing or invalid in response from URL:',
            url.toString()
          );
          return res;
        }

        let length = 0;

        debug(`Starting progress animation for ${url}`);
        res.body.on('data', (chunk) => {
          length += Buffer.byteLength(chunk);
          onProgress();
        });

        res.body.on('end', () => {
          debug(`Finished progress animation for ${url}`);
          onProgress();
        });

        const onProgress = () => {
          const progress = length / total || 0;
          init.onProgress?.({
            progress,
            total,
            loaded: length,
          });
        };
      }
      return res;
    });
  };
}
