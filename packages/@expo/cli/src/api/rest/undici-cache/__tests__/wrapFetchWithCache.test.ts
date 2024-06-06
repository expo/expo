import { vol } from 'memfs';
import nock from 'nock';
import { FormData } from 'undici';

import type { FetchLike } from '../../client.types';
import { FileSystemResponseCache } from '../FileSystemResponseCache';
import { wrapFetchWithCache } from '../wrapFetchWithCache';

const fetchWithCache = wrapFetchWithCache(
  fetch as FetchLike,
  new FileSystemResponseCache({ cacheDirectory: '/test' })
);

beforeEach(() => vol.fromJSON({ '/test/.gitkeep': '' }));

it('returns cached response for get request', async () => {
  const server = jest.fn(() => ({ get: true }));
  const scope = nock('http://doesnot.exist').get('/test/get').reply(200, server);

  function fetchAction() {
    return fetchWithCache('http://doesnot.exist/test/get').then((res) => res.json());
  }

  const response = await fetchAction();
  const cachedResponse = await fetchAction();

  expect(server).toHaveBeenCalledTimes(1);
  expect(response).toEqual(server());
  expect(response).toEqual(cachedResponse);

  expect(scope.isDone()).toBe(true);
});

it('returns cached response for post request with json body', async () => {
  const server = jest.fn(() => ({ post: 'json-body' }));
  const scope = nock('http://doesnot.exist')
    .post('/test/post', { test: 'json-body' })
    .reply(201, server);

  function fetchAction() {
    return fetchWithCache('http://doesnot.exist/test/post', {
      method: 'POST',
      body: JSON.stringify({ test: 'json-body' }),
    }).then((response) => response.json());
  }

  const response = await fetchAction();
  const cachedResponse = await fetchAction();

  expect(server).toHaveBeenCalledTimes(1);
  expect(response).toEqual(server());
  expect(response).toEqual(cachedResponse);

  expect(scope.isDone()).toBe(true);
});

it('returns cached response for post request formdata body', async () => {
  const server = jest.fn(() => ({ post: 'formdata-body' }));
  const scope = nock('http://doesnot.exist')
    .post('/test/post', (body) => body.includes('formdata-body'))
    .reply(201, server);

  function fetchAction() {
    const body = new FormData();
    body.append('test', 'formdata-body');

    const request = fetchWithCache('http://doesnot.exist/test/post', { body, method: 'POST' });
    return request.then((response) => response.json());
  }

  const response = await fetchAction();
  const cachedResponse = await fetchAction();

  expect(server).toHaveBeenCalledTimes(1);
  expect(response).toEqual(server());
  expect(response).toEqual(cachedResponse);

  expect(scope.isDone()).toBe(true);
});
