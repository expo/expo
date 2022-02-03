import * as RemoteConsole from '../RemoteConsole';
import { __waitForEmptyLogQueueAsync } from '../RemoteLogging';

jest.mock('react-native/Libraries/Core/Devtools/symbolicateStackTrace', () =>
  jest.fn(async (stack) => stack)
);

jest.mock('expo-constants', () => require('../../__mocks__/Constants-development'));
jest.mock('expo-application', () => ({
  androidId: 'i-am-unique',
  applicationId: 'me-too',
  getIosIdForVendorAsync: async () => 'me-too!',
}));

let originalFetch;

const mockOriginalConsole = {
  error: jest.fn(),
} as any as Console;

beforeAll(() => {
  originalFetch = global.fetch;
  // @ts-ignore
  global.fetch = jest.fn(async () => ({ status: 200 }));
});

afterAll(() => {
  global.fetch = originalFetch;
});

describe(`remote console logging`, () => {
  it(`removes internal console stack frames from the reported stack trace`, async () => {
    const fetchBarrier = new Promise((resolve) => {
      (global.fetch as jest.Mock).mockImplementationOnce(async () => {
        resolve(null);
        return { status: 200 };
      });
    });
    const mockConsole = RemoteConsole.createRemoteConsole(mockOriginalConsole);

    mockConsole.error('oh no');
    await fetchBarrier;
    await __waitForEmptyLogQueueAsync();

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const requestBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(Array.isArray(requestBody)).toBe(true);
    expect(requestBody.length).toBe(1);

    const logEntry = requestBody[0];
    expect(logEntry.includesStack).toBe(true);
    expect(logEntry.body[0].message).toBe('oh no');
    // TODO: Change the stack trace capturing to happen synchronously with the console.error call
    // expect(logEntry.body[0].stack).toMatch(path.basename(__filename));
  });
});
