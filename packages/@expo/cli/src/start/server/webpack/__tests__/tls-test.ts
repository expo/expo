import { certificateFor } from '@expo/devcert';
import { vol } from 'memfs';

import * as Log from '../../../../log';
import { ensureEnvironmentSupportsTLSAsync, getTLSCertAsync } from '../tls';

jest.mock('../../../../log');

const originalEnv = process.env;

beforeEach(() => {
  vol.reset();
  delete process.env.SSL_CRT_FILE;
  delete process.env.SSL_KEY_FILE;
});

describe(ensureEnvironmentSupportsTLSAsync, () => {
  beforeEach(() => {
    delete process.env.SSL_CRT_FILE;
    delete process.env.SSL_KEY_FILE;
  });
  afterAll(() => {
    process.env = originalEnv;
  });
  it(`skips TLS if the environment variables are already configured`, async () => {
    process.env.SSL_CRT_FILE = 'foo';
    process.env.SSL_KEY_FILE = 'bar';
    await ensureEnvironmentSupportsTLSAsync('/');
    expect(certificateFor).toBeCalledTimes(0);
  });

  it(`generates TLS if the environment variables are not set`, async () => {
    await ensureEnvironmentSupportsTLSAsync('/');

    expect(certificateFor).toBeCalledTimes(1);
    expect(process.env.SSL_CRT_FILE).toBe('/.expo/tls/cert-localhost.pem');
    expect(process.env.SSL_KEY_FILE).toBe('/.expo/tls/key-localhost.pem');
  });
});

describe(getTLSCertAsync, () => {
  it(`creates an TLS cert for the computer`, async () => {
    jest.mocked(Log.log).mockReset();
    await expect(getTLSCertAsync('/')).resolves.toEqual({
      certPath: '/.expo/tls/cert-localhost.pem',
      keyPath: '/.expo/tls/key-localhost.pem',
    });

    expect(vol.toJSON()).toEqual({
      '/.expo/tls/cert-localhost.pem': 'cert',
      '/.expo/tls/key-localhost.pem': 'key',
      '/.expo/README.md': expect.any(String),
    });
    expect(Log.log).toHaveBeenLastCalledWith(
      expect.stringContaining('Creating TLS certificate for localhost')
    );
  });
});
