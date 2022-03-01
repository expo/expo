import { vol } from 'memfs';

import { delayAsync } from '../../../utils/delay';
import { NgrokInstance } from '../../doctor/ngrok/NgrokResolver';
import { startAdbReverseAsync } from '../../platforms/android/adbReverse';
import { AsyncNgrok } from '../AsyncNgrok';

const asMock = <T extends (...args: any[]) => any>(fn: T): jest.MockedFunction<T> =>
  fn as jest.MockedFunction<T>;

jest.mock('../../../utils/delay', () => ({
  delayAsync: jest.fn(async () => {}),
}));
jest.mock('../../../api/settings');
jest.mock('../../doctor/ngrok/NgrokResolver', () => {
  const instance: NgrokInstance = {
    getActiveProcess: jest.fn(),
    connect: jest.fn(async () => 'http://localhost:3000'),
    kill: jest.fn(),
  };

  return {
    NgrokResolver: jest.fn(() => ({
      resolveAsync: jest.fn(async () => instance),
      get: jest.fn(async () => instance),
    })),
  };
});

jest.mock('../../platforms/android/adbReverse', () => ({
  startAdbReverseAsync: jest.fn(async () => true),
}));

jest.mock('../../../utils/exit');

function createNgrokInstance() {
  const projectRoot = '/';
  const port = 3000;
  const ngrok = new AsyncNgrok(projectRoot, port);
  ngrok.getActiveUrl = jest.fn(ngrok.getActiveUrl.bind(ngrok));
  ngrok.stopAsync = jest.fn(ngrok.stopAsync.bind(ngrok));
  return {
    projectRoot,
    port,
    ngrok,
  };
}

beforeEach(() => {
  asMock(delayAsync).mockClear();
  asMock(startAdbReverseAsync).mockClear();
  vol.reset();
});

describe('getActiveUrl', () => {
  it(`is loaded on start`, async () => {
    const { ngrok } = createNgrokInstance();
    expect(ngrok.getActiveUrl()).toBeNull();
    await ngrok.startAsync();
    expect(ngrok.getActiveUrl()).toEqual('http://localhost:3000');
  });
});
describe('startAsync', () => {
  it(`fails if adb reverse doesn't work`, async () => {
    const { ngrok } = createNgrokInstance();
    asMock(startAdbReverseAsync).mockResolvedValueOnce(false);

    await expect(ngrok.startAsync()).rejects.toThrow(/adb/);
  });
  it(`starts`, async () => {
    const { ngrok } = createNgrokInstance();
    expect(await ngrok._connectToNgrokAsync()).toEqual('http://localhost:3000');
  });
  it(`times out`, async () => {
    const { ngrok } = createNgrokInstance();

    // Add a connect which takes too long
    let timer: NodeJS.Timeout | null = null;
    const connect = jest.fn(
      () =>
        new Promise((resolve) => {
          timer = setTimeout(resolve, 1000);
        })
    );
    ngrok.resolver.resolveAsync = jest.fn(async () => ({ connect } as any));

    try {
      await expect(
        ngrok._connectToNgrokAsync({
          // Lower the time out to speed up the test.
          timeout: 10,
        })
      ).rejects.toThrow(/Ngrok tunnel took too long to connect/);
      // Time out is on a per-run basis.
      expect(connect).toHaveBeenCalledTimes(1);
    } finally {
      // clean up
      clearTimeout(timer);
    }
  });
  it(`retries three times`, async () => {
    const { ngrok } = createNgrokInstance();

    // Add a connect which always fails.
    const connect = jest.fn(() => {
      throw new Error('woops');
    });
    ngrok.resolver.resolveAsync = jest.fn(async () => ({ connect } as any));

    await expect(
      ngrok._connectToNgrokAsync({
        // Lower the time out to speed up the test.
        timeout: 10,
      })
    ).rejects.toThrow(/woops/);
    // Runs the function three times.
    expect(connect).toHaveBeenCalledTimes(3);
  });
  it(`fixes invalid URL error by changing the randomness`, async () => {
    const { ngrok, projectRoot } = createNgrokInstance();
    vol.fromJSON({}, projectRoot);

    ngrok._resetProjectRandomnessAsync = jest.fn(ngrok._resetProjectRandomnessAsync.bind(ngrok));
    // Add a connect which throws an invalid URL error, then works the second time.
    const connect = jest
      .fn()
      .mockImplementationOnce(() => {
        const err = new Error();
        // @ts-expect-error
        err.error_code = 103;

        throw err;
      })
      .mockImplementationOnce(() => 'http://localhost:3000');
    ngrok.resolver.resolveAsync = jest.fn(async () => ({ connect } as any));

    await ngrok._connectToNgrokAsync();

    // Once for the initial generation and once for the retry.
    expect(ngrok._resetProjectRandomnessAsync).toHaveBeenCalledTimes(2);
    expect(connect).toHaveBeenCalledTimes(2);
  });
});
describe('_getProjectHostnameAsync', () => {
  it(`generates a valid hostname`, async () => {
    const { projectRoot, ngrok } = createNgrokInstance();
    vol.fromJSON({}, projectRoot);

    const hostname = await ngrok._getProjectHostnameAsync();
    expect(hostname).toEqual(expect.stringMatching(/.*\.anonymous\.3000\.exp\.direct/));

    // URL-safe
    expect(encodeURIComponent(hostname)).toEqual(hostname);

    // Works twice in a row...
    expect(await ngrok._getProjectHostnameAsync()).toEqual(
      expect.stringMatching(/.*\.anonymous\.3000\.exp\.direct/)
    );

    // randomness is persisted
    expect(JSON.parse(vol.toJSON()['/.expo/settings.json']).urlRandomness).toBeDefined();
  });
});
