import { certificateFor } from '@expo/devcert';
import { vol } from 'memfs';

import * as Log from '../../../../log';
import { ensureEnvironmentSupportsSSLAsync, getSSLCertAsync } from '../ssl';

jest.mock('../../../../log');

const asMock = <T extends (...args: any[]) => any>(fn: T): jest.MockedFunction<T> =>
  fn as jest.MockedFunction<T>;

const originalEnv = process.env;

beforeEach(() => {
  vol.reset();
  delete process.env.SSL_CRT_FILE;
  delete process.env.SSL_KEY_FILE;
});

describe(ensureEnvironmentSupportsSSLAsync, () => {
  beforeEach(() => {
    delete process.env.SSL_CRT_FILE;
    delete process.env.SSL_KEY_FILE;
  });
  afterAll(() => {
    process.env = originalEnv;
  });
  it(`skips SSL if the environment variables are already configured`, async () => {
    process.env.SSL_CRT_FILE = 'foo';
    process.env.SSL_KEY_FILE = 'bar';
    await ensureEnvironmentSupportsSSLAsync('/');
    expect(certificateFor).toBeCalledTimes(0);
  });

  it(`generates SSL if the environment variables are not set`, async () => {
    await ensureEnvironmentSupportsSSLAsync('/');

    expect(certificateFor).toBeCalledTimes(1);
    expect(process.env.SSL_CRT_FILE).toBe('/.expo/ssl/cert-localhost.pem');
    expect(process.env.SSL_KEY_FILE).toBe('/.expo/ssl/key-localhost.pem');
  });
});

describe(getSSLCertAsync, () => {
  it(`creates an SSL cert for the computer`, async () => {
    asMock(Log.log).mockReset();
    await expect(getSSLCertAsync('/')).resolves.toEqual({
      certPath: '/.expo/ssl/cert-localhost.pem',
      keyPath: '/.expo/ssl/key-localhost.pem',
    });

    expect(vol.toJSON()).toEqual({
      '/.expo/ssl/cert-localhost.pem': 'cert',
      '/.expo/ssl/key-localhost.pem': 'key',
      '/.expo/README.md': expect.any(String),
    });
    expect(Log.log).toHaveBeenLastCalledWith(
      expect.stringContaining('Creating SSL certificate for localhost')
    );
  });
});
