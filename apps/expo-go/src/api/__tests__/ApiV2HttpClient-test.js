import Store from '../../redux/Store';
import ApiV2Error from '../ApiV2Error';
import ApiV2HttpClient from '../ApiV2HttpClient';

jest.mock('react-native', () => {
  const ReactNative = jest.requireActual('react-native');
  ReactNative.NativeModules.ExponentKernel.sdkVersions = '12.0.0,11.0.0';
  return ReactNative;
});
jest.mock('@react-native-async-storage/async-storage', () => ({}));
jest.mock('../../redux/Store');

let originalFetch;

beforeEach(() => {
  originalFetch = global.fetch;
  global.fetch = jest.fn();
  global.fetch.mockReturnValue(
    Promise.resolve({
      async text() {
        return '{}';
      },
    })
  );
});

afterEach(() => {
  global.fetch = originalFetch;
  originalFetch = null;
});

it(`supports GET requests`, async () => {
  _setFakeHttpResponse('{"data": {"test":"yes"}}');

  const client = new ApiV2HttpClient();
  const response = await client.getAsync('example', { a: 1, b: true, c: 'hi' });
  expect(response).toEqual({ test: 'yes' });
  expect(global.fetch.mock.calls.length).toBe(1);
  expect(global.fetch.mock.calls[0][0]).toMatchSnapshot();
  expect(global.fetch.mock.calls[0][1].method).toBe('get');
  expect(global.fetch.mock.calls[0][1].body).not.toBeDefined();
});

it(`supports POST requests`, async () => {
  _setFakeHttpResponse('{"data": {"test":"yes"}}');

  const client = new ApiV2HttpClient();
  const response = await client.postAsync('example', {
    a: 1,
    b: true,
    c: 'hi',
    d: ['list'],
    e: { nested: true },
  });
  expect(response).toEqual({ test: 'yes' });
  expect(global.fetch.mock.calls.length).toBe(1);
  expect(global.fetch.mock.calls[0][0]).toMatchSnapshot();
  expect(global.fetch.mock.calls[0][1].method).toBe('post');
  expect(global.fetch.mock.calls[0][1].headers['Content-Type']).toBe('application/json');
  expect(global.fetch.mock.calls[0][1].body).toMatchSnapshot();
});

it(`supports slashes in method names`, async () => {
  const client = new ApiV2HttpClient();
  await client.getAsync('prefix/method');
  expect(global.fetch.mock.calls.length).toBe(1);
  expect(global.fetch.mock.calls[0][0]).toMatch(/\/api\/v2\/prefix\/method$/);
});

it(`sets custom Expo headers`, async () => {
  const client = new ApiV2HttpClient();
  await client.getAsync('example');

  const headers = global.fetch.mock.calls[0][1].headers;
  expect(headers['Expo-SDK-Version']).toBe('12.0.0,11.0.0');
  expect(headers['Expo-Platform']).toBe('ios');
  expect(headers['expo-session']).toBeUndefined();
});

it(`includes the session token`, async () => {
  Store.getState.mockReturnValueOnce({
    session: { sessionSecret: 'test-secret' },
  });

  const client = new ApiV2HttpClient();
  await client.getAsync('example');

  const headers = global.fetch.mock.calls[0][1].headers;
  expect(headers['expo-session']).toBe('test-secret');
});

it(`handles API errors`, async () => {
  _setFakeHttpResponse('{"errors": [{"message":"Intentional","code":"TEST_CODE"}]}');

  const client = new ApiV2HttpClient();
  try {
    await client.getAsync('example');
    throw new Error('Expected API client to throw an error');
  } catch (e) {
    expect(e.message).toBe('Intentional');
    expect(e.code).toBe('TEST_CODE');
    expect(e instanceof ApiV2Error).toBe(true);
  }
});

it(`handles malformed responses`, async () => {
  _setFakeHttpResponse('Bad gateway');

  const client = new ApiV2HttpClient();
  try {
    await client.getAsync('example');
    throw new Error('Expected API client to throw an error');
  } catch (e) {
    expect(e.message).toMatchSnapshot();
    expect(e.responseBody).toBe('Bad gateway');
    expect(e instanceof ApiV2Error).toBe(false);
  }
});

function _setFakeHttpResponse(responseText) {
  global.fetch.mockReturnValueOnce(
    Promise.resolve({
      async text() {
        return responseText;
      },
    })
  );
}
