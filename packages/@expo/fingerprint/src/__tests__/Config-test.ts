import { vol } from 'memfs';
import requireString from 'require-from-string';

import { loadConfigAsync } from '../Config';

jest.mock('fs/promises');

describe(loadConfigAsync, () => {
  afterEach(() => {
    vol.reset();
  });

  it('should return null if no config file is found', async () => {
    const config = await loadConfigAsync('/app', true);
    expect(config).toBeNull();
  });

  it('should return the config file if it exists', async () => {
    await jest.isolateModulesAsync(async () => {
      const configContents = `\
/** @type {import('@expo/fingerprint').Config} */
const config = {
  hashAlgorithm: 'sha256',
};
module.exports = config;
`;
      vol.fromJSON({ '/app/fingerprint.config.js': configContents });
      jest.doMock('/app/fingerprint.config.js', () => requireString(configContents), {
        virtual: true,
      });
      const config = await loadConfigAsync('/app', true);
      expect(config).toEqual({ hashAlgorithm: 'sha256' });
    });
  });

  it('should mute console logs when mute=true', async () => {
    await jest.isolateModulesAsync(async () => {
      const configContents = `\
/** @type {import('@expo/fingerprint').Config} */
const config = {
  hashAlgorithm: 'sha256',
};
module.exports = config;
`;
      vol.fromJSON({ '/app/fingerprint.config.js': configContents });
      jest.doMock(
        '/app/fingerprint.config.js',
        () => {
          // Since requireString() evaluates code in a new context, console.log will not be mocked there,
          // we just call console.log here alternatively.
          // This is actually in the `require(configFile)` call in the `loadConfigAsync()` function.
          console.log('echo from fingerprint.config.js');
          return requireString(configContents);
        },
        {
          virtual: true,
        }
      );
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const config = await loadConfigAsync('/app', true);
      expect(config).toEqual({ hashAlgorithm: 'sha256' });
      expect(logSpy).not.toHaveBeenCalled();
    });
  });

  it('should not mute console logs when mute=false', async () => {
    await jest.isolateModulesAsync(async () => {
      const configContents = `\
/** @type {import('@expo/fingerprint').Config} */
const config = {
  hashAlgorithm: 'sha256',
};
module.exports = config;
`;
      vol.fromJSON({ '/app/fingerprint.config.js': configContents });
      jest.doMock(
        '/app/fingerprint.config.js',
        () => {
          // Since requireString() evaluates code in a new context, console.log will not be mocked there,
          // we just call console.log here alternatively.
          // This is actually in the `require(configFile)` call in the `loadConfigAsync()` function.
          console.log('echo from fingerprint.config.js');
          return requireString(configContents);
        },
        {
          virtual: true,
        }
      );
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const config = await loadConfigAsync('/app');
      expect(config).toEqual({ hashAlgorithm: 'sha256' });
      expect(logSpy).toHaveBeenCalled();
    });
  });

  it('should strip unsupported config', async () => {
    await jest.isolateModulesAsync(async () => {
      const configContents = `\
const config = {
  debug: true,
  otherKey: 'value1',
  otherNestedKey: {
    foo: 'bar',
  },
};
module.exports = config;
`;
      vol.fromJSON({ '/app/fingerprint.config.js': configContents });
      jest.doMock('/app/fingerprint.config.js', () => requireString(configContents), {
        virtual: true,
      });
      const config = await loadConfigAsync('/app', true);
      expect(config).toEqual({ debug: true });
    });
  });
});
