import nock from 'nock';
import path from 'path';

import * as Log from '../../../log';
import type { FetchLike } from '../client.types';
import { wrapFetchWithProgress } from '../wrapFetchWithProgress';

const fs = jest.requireActual('fs') as typeof import('fs');
const fetch = globalThis.fetch as FetchLike;

jest.mock(`../../../log`);

describe(wrapFetchWithProgress, () => {
  beforeEach(() => {
    jest.mocked(Log.warn).mockClear();
  });

  it('should call the progress callback', async () => {
    const url = 'https://example.com';
    const fixturePath = path.join(__dirname, './fixtures/panda.png');
    const fixtureSize = fs.statSync(fixturePath).size;

    const scope = nock(url)
      .get('/asset')
      .reply(() => {
        return [
          200, // Status
          fs.createReadStream(fixturePath), // Data
          { 'Content-Length': fixtureSize }, // Headers for progress
        ];
      });

    const onProgress = jest.fn();
    const response = await wrapFetchWithProgress(fetch)(url + '/asset', { onProgress });
    // Load the response body to trigger the progression events
    await response.blob();

    // Ensure the progress callback was called more than start and end
    expect(onProgress.mock.calls.length).toBeGreaterThan(2);
    // Ensure progress starts at 0%
    expect(onProgress).toHaveBeenNthCalledWith(1, {
      loaded: 0,
      progress: 0,
      total: fixtureSize,
    });
    // Ensure progress ends at 100%
    expect(onProgress).toHaveBeenLastCalledWith({
      loaded: fixtureSize,
      progress: 1,
      total: fixtureSize,
    });

    expect(scope.isDone()).toBe(true);
  });

  it('should not call progress when response is not ok', async () => {
    const url = 'https://example.com';
    const scope = nock(url).get('/asset').reply(404, { error: 'Not Found' });

    const onProgress = jest.fn();
    const response = await wrapFetchWithProgress(fetch)(url + '/asset', { onProgress });
    // Load the response body to trigger the progression events
    await response.json();

    expect(onProgress).not.toHaveBeenCalled();
    expect(scope.isDone()).toBe(true);
  });

  it('should not call progress when response is empty', async () => {
    const url = 'https://example.com';
    const scope = nock(url).get('/asset').reply(204);

    const onProgress = jest.fn();
    const response = await wrapFetchWithProgress(fetch)(url + '/asset', { onProgress });
    // Load the response body to trigger the progression events
    await response.text();

    expect(onProgress).not.toHaveBeenCalled();
    expect(scope.isDone()).toBe(true);
  });

  it('should warn that a request is missing the content length header', async () => {
    const url = 'https://example.com';
    const scope = nock(url).get('/asset').reply(200, ''); // Return no Content-Length header

    await wrapFetchWithProgress(fetch)(url + '/asset', { onProgress: jest.fn() });

    expect(Log.warn).toHaveBeenCalledWith(
      'Progress callback not supported for network request because "Content-Length" header missing or invalid in response from URL:',
      'https://example.com/asset'
    );
    expect(scope.isDone()).toBe(true);
  });
});
