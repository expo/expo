import LogSerialization from '../LogSerialization';
import RemoteLogging, { __waitForEmptyLogQueueAsync } from '../RemoteLogging';

jest.mock('uuid-js', () => ({
  create() {
    return {
      toString() {
        return 'c0d50576-7ddc-4196-8b1d-01c2d1786631';
      },
    };
  },
}));

jest.mock('../LogSerialization', () => ({
  serializeLogDataAsync: jest.fn(async data => {
    return {
      body: data.map(datum => JSON.stringify(datum)),
      includesStack: false,
    };
  }),
}));

jest.mock('expo-constants', () => ({
  Constants: require('../../__mocks__/Constants-development'),
}));

let originalFetch;

beforeAll(async () => {
  originalFetch = global.fetch;
  global.fetch = jest.fn(async () => _createMockResponse());
});

afterAll(() => {
  global.fetch = originalFetch;
});

it(`sends logs to the server`, async () => {
  await RemoteLogging.enqueueRemoteLogAsync('info', {}, ['hello!']);
  await __waitForEmptyLogQueueAsync();

  expect(LogSerialization.serializeLogDataAsync).toHaveBeenCalledTimes(1);
  expect(fetch).toHaveBeenCalledTimes(1);
  expect((fetch as jest.Mock).mock.calls[0][0]).toBe('https://localhost:19001/logs');
  expect((fetch as jest.Mock).mock.calls[0][1].method).toMatch(/^POST$/i);
  expect((fetch as jest.Mock).mock.calls[0][1].headers).toMatchSnapshot();
  expect((fetch as jest.Mock).mock.calls[0][1].body).toMatchSnapshot();
});

it(`limits network requests but eventually sends all logs`, async () => {
  let resolveFetch;
  (fetch as jest.Mock).mockImplementationOnce(
    () =>
      new Promise(resolve => {
        resolveFetch = resolve;
      })
  );

  await RemoteLogging.enqueueRemoteLogAsync('info', {}, ['hello']);
  await RemoteLogging.enqueueRemoteLogAsync('info', {}, ['world']);
  await RemoteLogging.enqueueRemoteLogAsync('info', {}, ['test']);

  expect(fetch).toHaveBeenCalledTimes(1);
  resolveFetch(_createMockResponse());

  await __waitForEmptyLogQueueAsync();
  expect(LogSerialization.serializeLogDataAsync).toHaveBeenCalledTimes(3);
  expect(fetch).toHaveBeenCalledTimes(2);
});

it(`continues sending logs after a network failure`, async () => {
  let rejectFetch;
  (fetch as jest.Mock).mockImplementationOnce(
    () =>
      new Promise((resolve, reject) => {
        rejectFetch = reject;
      })
  );

  await RemoteLogging.enqueueRemoteLogAsync('info', {}, ['hello']);
  await RemoteLogging.enqueueRemoteLogAsync('info', {}, ['world']);

  expect(fetch).toHaveBeenCalledTimes(1);
  rejectFetch(new Error('Intentional network failure'));

  await __waitForEmptyLogQueueAsync();
  expect(fetch).toHaveBeenCalledTimes(2);
  expect((fetch as jest.Mock).mock.calls[1][1].body).toMatch('world');
});

it(`continues sending logs after a serialization failure`, async () => {
  (LogSerialization.serializeLogDataAsync as jest.Mock).mockImplementationOnce(async () => {
    throw new Error('Intentional serialization failure');
  });

  await expect(RemoteLogging.enqueueRemoteLogAsync('info', {}, ['hello'])).rejects.toBeDefined();
  await __waitForEmptyLogQueueAsync();
  expect(fetch).not.toHaveBeenCalled();

  await RemoteLogging.enqueueRemoteLogAsync('info', {}, ['world']);
  await __waitForEmptyLogQueueAsync();
  expect(fetch).toHaveBeenCalledTimes(1);
  expect((fetch as jest.Mock).mock.calls[0][1].body).toMatch('world');
});

describe('addTransportErrorListener', () => {
  let subscription;
  let mockListener = jest.fn();

  beforeAll(() => {
    subscription = RemoteLogging.addTransportErrorListener(mockListener);
  });

  afterAll(() => {
    subscription.remove();
  });

  it(`emits an error event if the network fails`, async () => {
    (fetch as jest.Mock).mockImplementationOnce(async () => {
      throw new Error('Intentional network failure');
    });

    await RemoteLogging.enqueueRemoteLogAsync('info', {}, ['hello!']);
    await __waitForEmptyLogQueueAsync();

    expect(mockListener).toHaveBeenCalledTimes(1);
    expect((mockListener as jest.Mock).mock.calls[0][0].error).toBeDefined();
    expect((mockListener as jest.Mock).mock.calls[0][0].error.message).toMatch('Intentional network failure');
    expect((mockListener as jest.Mock).mock.calls[0][0].response).not.toBeDefined();
  });

  it(`emits an error event if the server responds with 500`, async () => {
    (fetch as jest.Mock).mockImplementationOnce(async () => _createMockResponse({ status: 500 }));

    await RemoteLogging.enqueueRemoteLogAsync('info', {}, ['hello!']);
    await __waitForEmptyLogQueueAsync();

    expect(mockListener).toHaveBeenCalledTimes(1);
    expect((mockListener as jest.Mock).mock.calls[0][0].error).toBeDefined();
    expect((mockListener as jest.Mock).mock.calls[0][0].response).toBeDefined();
  });

  it(`doesn't emit an error event if the server responds with 200`, async () => {
    await RemoteLogging.enqueueRemoteLogAsync('info', {}, ['hello!']);
    await __waitForEmptyLogQueueAsync();

    expect(mockListener).not.toHaveBeenCalled();
  });
});

function _createMockResponse(fields = {}) {
  return {
    status: 200,
    ...fields,
  };
}
