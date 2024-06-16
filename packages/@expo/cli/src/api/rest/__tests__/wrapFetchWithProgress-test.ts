import nock from 'nock';
import fetch from 'node-fetch';
import path from 'path';
import { Stream } from 'stream';
import { promisify } from 'util';

import * as Log from '../../../log';
import { wrapFetchWithProgress } from '../wrapFetchWithProgress';

const fs = jest.requireActual('fs') as typeof import('fs');
const pipeline = promisify(Stream.pipeline);

jest.mock(`../../../log`);

describe(wrapFetchWithProgress, () => {
  beforeEach(() => {
    jest.mocked(Log.warn).mockClear();
  });
  it('should call the progress callback', async () => {
    const url = 'https://example.com';

    const scope = nock(url)
      .get('/asset')
      .reply(() => {
        const fixturePath = path.join(__dirname, './fixtures/panda.png');
        return [
          // Status
          200,
          // Data
          fs.createReadStream(fixturePath),
          {
            // Headers for progress
            'Content-Length': fs.statSync(fixturePath).size,
          },
        ];
      });

    const onProgress = jest.fn();

    await pipeline(
      (
        await wrapFetchWithProgress(fetch)(url + '/asset', {
          onProgress,
        })
      ).body,
      require('fs').createWriteStream('/foobar')
    );
    // Ensure this example is called more than once.
    expect(onProgress).toHaveBeenCalledTimes(4);
    expect(onProgress).toHaveBeenNthCalledWith(1, {
      loaded: 65536,
      progress: 0.43515444476906323,
      total: 150604,
    });

    // Ensure progress ends on 1.0
    expect(onProgress).toHaveBeenLastCalledWith({
      loaded: 150604,
      progress: 1,
      total: 150604,
    });
    expect(scope.isDone()).toBe(true);
  });

  it('should warn that a request is missing the content length header', async () => {
    const url = 'https://example.com';

    // Return no Content-Length header.
    const scope = nock(url).get('/asset').reply(200, '');

    const onProgress = jest.fn();

    await wrapFetchWithProgress(fetch)(url + '/asset', {
      onProgress,
    });
    expect(Log.warn).toHaveBeenCalledWith(
      'Progress callback not supported for network request because "Content-Length" header missing or invalid in response from URL:',
      'https://example.com/asset'
    );

    expect(scope.isDone()).toBe(true);
  });
});
