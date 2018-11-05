// import { EXPO_CONSOLE_METHOD_NAME } from '../LogSerialization';
import RemoteConsole from '../RemoteConsole';
import RemoteLogging from '../RemoteLogging';

jest.mock('../RemoteLogging', () => {
  return {
    enqueueRemoteLogAsync: jest.fn(async () => {}),
  };
});

let console;
const mockOriginalConsole = {
  assert: jest.fn(),
  debug: jest.fn(),
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  group: jest.fn(),
  groupCollapsed: jest.fn(),
  groupEnd: jest.fn(),
  takeHeapSnapshot: jest.fn(),
  memory: {
    jsHeapSizeLimit: 4 * 1024 ** 3,
    totalJSHeapSize: 20 * 1024 ** 2,
    usedJSHeapSize: 10 * 1024 ** 2,
  },
} as any;

beforeEach(() => {
  console = RemoteConsole.createRemoteConsole(mockOriginalConsole);
});

it(`exposes un-overridden methods of the original console`, () => {
  expect(() => console.takeHeapSnapshot()).not.toThrow();
  expect(mockOriginalConsole.takeHeapSnapshot).toHaveBeenCalledTimes(1);
});

it(`exposes un-overridden non-function properties of the original console`, () => {
  expect(console.memory).toBeDefined();
  expect(console.memory).toMatchSnapshot();
});

// it(`uses a sentinel value to name custom console methods`, () => {
//   (RemoteLogging.enqueueRemoteLogAsync as jest.Mock).mockImplementationOnce(() => {
//     throw new Error('Intentional test error');
//   });
//   expect.assertions(1);

//   try {
//     console.log();
//   } catch (error) {
//     expect(error.stack).toMatch(EXPO_CONSOLE_METHOD_NAME);
//   }
// });

describe(`asserting`, () => {
  it(`does nothing when the test condition passes`, () => {
    console.assert(true);
    expect(RemoteLogging.enqueueRemoteLogAsync).not.toHaveBeenCalled();

    console.assert(1);
    expect(RemoteLogging.enqueueRemoteLogAsync).not.toHaveBeenCalled();

    console.assert({});
    expect(RemoteLogging.enqueueRemoteLogAsync).not.toHaveBeenCalled();
  });

  it(`reports failed assertions as errors`, () => {
    console.assert(false);
    expect(RemoteLogging.enqueueRemoteLogAsync).toHaveBeenCalledTimes(1);
    expect((RemoteLogging.enqueueRemoteLogAsync as jest.Mock).mock.calls[0][0]).toBe('error');
  });

  it(`formats string messages`, () => {
    console.assert(false, 'oh no');
    expect(RemoteLogging.enqueueRemoteLogAsync).toHaveBeenCalledTimes(1);
    expect((RemoteLogging.enqueueRemoteLogAsync as jest.Mock).mock.calls[0][2]).toMatchSnapshot();
  });

  it(`adds a failed assertion notice to non-string messages`, () => {
    console.assert(false, {});
    expect(RemoteLogging.enqueueRemoteLogAsync).toHaveBeenCalledTimes(1);
    expect((RemoteLogging.enqueueRemoteLogAsync as jest.Mock).mock.calls[0][2]).toMatchSnapshot();
  });
});

describe('logging', () => {
  let data = ['hi', { a: 'b' }, [1, 2], null, false];

  it(`logs debug data at the "info" level`, () => {
    console.debug(...data);
    expect(mockOriginalConsole.debug).toHaveBeenCalledTimes(1);
    expect(mockOriginalConsole.debug).toHaveBeenCalledWith(...data);
    _expectDataLoggingLevel('info');
  });

  it(`logs log data at the "info" level`, () => {
    console.log(...data);
    expect(mockOriginalConsole.log).toHaveBeenCalledTimes(1);
    expect(mockOriginalConsole.log).toHaveBeenCalledWith(...data);
    _expectDataLoggingLevel('info');
  });

  it(`logs info data at the "info" level`, () => {
    console.info(...data);
    expect(mockOriginalConsole.info).toHaveBeenCalledTimes(1);
    expect(mockOriginalConsole.info).toHaveBeenCalledWith(...data);
    _expectDataLoggingLevel('info');
  });

  it(`logs warning data at the "warn" level`, () => {
    console.warn(...data);
    expect(mockOriginalConsole.warn).toHaveBeenCalledTimes(1);
    expect(mockOriginalConsole.warn).toHaveBeenCalledWith(...data);
    _expectDataLoggingLevel('warn');
  });

  it(`logs error data at the "error" level`, () => {
    console.error(...data);
    expect(mockOriginalConsole.error).toHaveBeenCalledTimes(1);
    expect(mockOriginalConsole.error).toHaveBeenCalledWith(...data);
    _expectDataLoggingLevel('error');
  });

  function _expectDataLoggingLevel(level) {
    expect(RemoteLogging.enqueueRemoteLogAsync).toHaveBeenCalledTimes(1);
    expect((RemoteLogging.enqueueRemoteLogAsync as jest.Mock).mock.calls[0][0]).toBe(level);
    expect((RemoteLogging.enqueueRemoteLogAsync as jest.Mock).mock.calls[0][2]).toEqual(data);
  }
});

describe('grouping', () => {
  it(`labels groups`, () => {
    console.group('group 1');
    expect(RemoteLogging.enqueueRemoteLogAsync).toHaveBeenCalled();
    expect((RemoteLogging.enqueueRemoteLogAsync as jest.Mock).mock.calls[0][2]).toEqual(['group 1']);
  });

  it(`labels collapsed groups`, () => {
    console.groupCollapsed('group 2');
    expect(RemoteLogging.enqueueRemoteLogAsync).toHaveBeenCalled();
    expect((RemoteLogging.enqueueRemoteLogAsync as jest.Mock).mock.calls[0][2]).toEqual(['group 2']);
  });

  it(`increases the group depth`, () => {
    console.log();
    _expectGroupDepthToBe(0);

    console.group();
    console.log();
    _expectGroupDepthToBe(1);

    console.group();
    console.log();
    _expectGroupDepthToBe(2);
  });

  it(`decreases the group depth`, () => {
    console.group();
    console.group();
    console.log();
    _expectGroupDepthToBe(2);

    console.groupEnd();
    _expectGroupDepthToBe(1);

    console.groupEnd();
    _expectGroupDepthToBe(0);
  });

  it(`prevents negative group depths`, () => {
    console.log();
    _expectGroupDepthToBe(0);

    // Attempt to make the depth negative
    console.groupEnd();
    _expectGroupDepthToBe(0);

    // Test that the depth counts from zero
    console.group();
    console.log();
    _expectGroupDepthToBe(1);
  });

  it(`supports collapsed groups`, () => {
    console.groupCollapsed();
    expect(RemoteLogging.enqueueRemoteLogAsync).toHaveBeenCalled();
    expect((RemoteLogging.enqueueRemoteLogAsync as jest.Mock).mock.calls[0][1]).toMatchObject({
      groupCollapsed: true,
    });

    console.log();
    _expectGroupDepthToBe(1);
  });

  it(`sends the grouping depth with each call`, () => {
    console.group();
    (RemoteLogging.enqueueRemoteLogAsync as jest.Mock).mockClear();

    console.debug();
    _expectGroupDepthToBe(1);
    (RemoteLogging.enqueueRemoteLogAsync as jest.Mock).mockClear();

    console.log();
    _expectGroupDepthToBe(1);
    (RemoteLogging.enqueueRemoteLogAsync as jest.Mock).mockClear();

    console.info();
    _expectGroupDepthToBe(1);
    (RemoteLogging.enqueueRemoteLogAsync as jest.Mock).mockClear();

    console.warn();
    _expectGroupDepthToBe(1);
    (RemoteLogging.enqueueRemoteLogAsync as jest.Mock).mockClear();

    console.error();
    _expectGroupDepthToBe(1);
    (RemoteLogging.enqueueRemoteLogAsync as jest.Mock).mockClear();

    console.assert(false);
    _expectGroupDepthToBe(1);
    (RemoteLogging.enqueueRemoteLogAsync as jest.Mock).mockClear();

    console.group();
    _expectGroupDepthToBe(1);
    (RemoteLogging.enqueueRemoteLogAsync as jest.Mock).mockClear();

    console.groupEnd();
    _expectGroupDepthToBe(1);
    (RemoteLogging.enqueueRemoteLogAsync as jest.Mock).mockClear();
  });

  function _expectGroupDepthToBe(depth) {
    expect(RemoteLogging.enqueueRemoteLogAsync).toHaveBeenCalled();

    let calls = (RemoteLogging.enqueueRemoteLogAsync as jest.Mock).mock.calls;
    expect(calls[calls.length - 1][1]).toMatchObject({
      groupDepth: depth,
    });
  }
});
