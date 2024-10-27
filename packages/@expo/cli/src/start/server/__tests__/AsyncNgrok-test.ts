import { vol } from 'memfs';

import { NgrokInstance, NgrokResolver } from '../../doctor/ngrok/NgrokResolver';
import { hasAdbReverseAsync, startAdbReverseAsync } from '../../platforms/android/adbReverse';
import { AsyncNgrok } from '../AsyncNgrok';

jest.mock('../../../log');
jest.mock('../../../utils/delay', () => ({
  delayAsync: jest.fn(async () => {}),
  resolveWithTimeout: jest.fn(async (fn) => fn()),
}));
jest.mock('../../../api/settings');
jest.mock('../../doctor/ngrok/NgrokResolver', () => {
  const instance: NgrokInstance = {
    getActiveProcess: jest.fn(),
    connect: jest.fn(async () => 'http://localhost:3000'),
    kill: jest.fn(),
  };

  return {
    isNgrokClientError: jest.requireActual('../../doctor/ngrok/NgrokResolver').isNgrokClientError,
    NgrokResolver: jest.fn(() => ({
      resolveAsync: jest.fn(async () => instance),
      get: jest.fn(async () => instance),
    })),
  };
});
jest.mock('../../platforms/android/adbReverse', () => ({
  hasAdbReverseAsync: jest.fn(async () => true),
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

const originalEnv = process.env;

afterAll(() => {
  process.env = originalEnv;
});

beforeEach(() => {
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
  it(`skips adb reverse if Android cannot be found`, async () => {
    const { ngrok } = createNgrokInstance();
    jest.mocked(hasAdbReverseAsync).mockReturnValueOnce(false);

    await ngrok.startAsync();
    expect(startAdbReverseAsync).not.toBeCalled();
  });
  beforeEach(() => {
    delete process.env.EXPO_TUNNEL_SUBDOMAIN;
  });
  it(`fails if adb reverse doesn't work`, async () => {
    const { ngrok } = createNgrokInstance();
    jest.mocked(startAdbReverseAsync).mockResolvedValueOnce(false);

    await expect(ngrok.startAsync()).rejects.toThrow(/adb/);
  });
  it(`starts`, async () => {
    const { ngrok } = createNgrokInstance();
    expect(await ngrok._connectToNgrokAsync()).toEqual('http://localhost:3000');
  });
  it(`starts with custom subdomain`, async () => {
    process.env.EXPO_TUNNEL_SUBDOMAIN = 'test';
    const { ngrok } = createNgrokInstance();
    expect(await ngrok._connectToNgrokAsync()).toEqual('http://localhost:3000');
    const instance = await new NgrokResolver('/').resolveAsync();
    expect(instance.connect).toBeCalledWith(expect.objectContaining({ subdomain: 'test' }));
  });
  it(`starts with any subdomain`, async () => {
    process.env.EXPO_TUNNEL_SUBDOMAIN = '1';
    const { ngrok } = createNgrokInstance();
    expect(await ngrok._connectToNgrokAsync()).toEqual('http://localhost:3000');
    const instance = await new NgrokResolver('/').resolveAsync();
    expect(instance.connect).toBeCalledWith(
      expect.objectContaining({ subdomain: expect.stringMatching(/.*-anonymous-3000$/) })
    );
  });

  it(`retries three times`, async () => {
    const { ngrok } = createNgrokInstance();

    // Add a connect which always fails.
    const connect = jest.fn(() => {
      throw new Error('woops');
    });
    ngrok.resolver.resolveAsync = jest.fn(async () => ({ connect }) as any);

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
        err.body = { msg: '...', error_code: 103 };

        throw err;
      })
      .mockImplementationOnce(() => 'http://localhost:3000');
    ngrok.resolver.resolveAsync = jest.fn(async () => ({ connect }) as any);

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
    expect(hostname).toEqual(expect.stringMatching(/.*-anonymous-3000\.exp\.direct/));

    // URL-safe
    expect(encodeURIComponent(hostname)).toEqual(hostname);

    // Works twice in a row...
    expect(await ngrok._getProjectHostnameAsync()).toEqual(
      expect.stringMatching(/.*-anonymous-3000\.exp\.direct/)
    );

    // randomness is persisted
    expect(JSON.parse(vol.toJSON()['/.expo/settings.json']).urlRandomness).toBeDefined();
  });
});
