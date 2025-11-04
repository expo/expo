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

  nock('http://expo.test').get('/get').reply(200, server);

  function fetchAction() {
    return fetchWithCache('http://expo.test/get').then((res) => res.json());
  }

  const response = await fetchAction();
  const cachedResponse = await fetchAction();

  expect(server).toHaveBeenCalledTimes(1);
  expect(response).toEqual(server());
  expect(response).toEqual(cachedResponse);
});

it('returns cached response for post request with json body', async () => {
  const server = jest.fn(() => ({ post: 'json-body' }));

  nock('http://expo.test')
    .post('/post', (body) => body.test === 'json-body')
    .reply(201, server);

  function fetchAction() {
    return fetchWithCache('http://expo.test/post', {
      method: 'POST',
      body: JSON.stringify({ test: 'json-body' }),
    }).then((response) => response.json());
  }

  const response = await fetchAction();
  const cachedResponse = await fetchAction();

  expect(server).toHaveBeenCalledTimes(1);
  expect(response).toEqual(server());
  expect(response).toEqual(cachedResponse);
});

it('returns cached response for post request formdata body', async () => {
  const server = jest.fn(() => ({ post: 'formdata-body' }));

  nock('http://expo.test')
    .post('/post', (body) => {
      return body.includes('formdata-body');
    })
    .reply(201, server);

  function fetchAction() {
    const body = new FormData();
    body.append('test', 'formdata-body');
    // nock doesn't support FormData, so it will call toString on it.
    // On Node 24, FormData.toString() returns '[object FormData]', but on Node 22, it returns multipart form data.
    // If it returns '[object FormData]', we have no way to distinguish this FormData from our request body,
    // so we need to override the toString method to return 'formdata-body'.
    body.toString = () => 'formdata-body';
    const request = fetchWithCache('http://expo.test/post', { body, method: 'POST' });
    return request.then((response) => response.json());
  }

  const response = await fetchAction();
  const cachedResponse = await fetchAction();

  expect(server).toHaveBeenCalledTimes(1);
  expect(response).toEqual(server());
  expect(response).toEqual(cachedResponse);
});

it('does not cache failed response for get request', async () => {
  const server = jest.fn(() => ({ error: 'not found' }));

  nock('http://expo.test').get('/error/get').times(2).reply(404, server);

  function fetchAction() {
    return fetchWithCache('http://expo.test/error/get').then((res) => res.json());
  }

  const response = await fetchAction();
  const cachedResponse = await fetchAction();

  expect(server).toHaveBeenCalledTimes(2);
  expect(response).toEqual(server());
  expect(response).toEqual(cachedResponse);
});
