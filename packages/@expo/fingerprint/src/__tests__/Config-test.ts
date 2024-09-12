import { vol } from 'memfs';
import requireString from 'require-from-string';

import { loadConfigAsync, normalizeSourceSkips } from '../Config';
import { SourceSkips } from '../sourcer/SourceSkips';

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

  it('should support sourceSkips as an array of strings', async () => {
    await jest.isolateModulesAsync(async () => {
      const configContents = `\
const config = {
  sourceSkips: [
    'ExpoConfigRuntimeVersionIfString',
    'ExpoConfigNames',
  ],
};
module.exports = config;
`;
      vol.fromJSON({ '/app/fingerprint.config.js': configContents });
      jest.doMock('/app/fingerprint.config.js', () => requireString(configContents), {
        virtual: true,
      });
      const config = await loadConfigAsync('/app', true);
      expect(config).toEqual({
        sourceSkips: SourceSkips.ExpoConfigRuntimeVersionIfString | SourceSkips.ExpoConfigNames,
      });
    });
  });
});

describe(normalizeSourceSkips, () => {
  it('should return SourceSkips.None if sourceSkips is undefined', () => {
    expect(normalizeSourceSkips(undefined)).toEqual(SourceSkips.None);
  });

  it('should return original number if sourceSkips is a number', () => {
    const skips: SourceSkips =
      SourceSkips.ExpoConfigRuntimeVersionIfString | SourceSkips.ExpoConfigNames;
    const result = normalizeSourceSkips(skips);
    expect(result).toEqual(skips);
  });

  it('should return an empty array if sourceSkips is an empty array', () => {
    expect(normalizeSourceSkips([])).toEqual(SourceSkips.None);
  });

  it('should return an array with normalized source skips', () => {
    const result = normalizeSourceSkips(['ExpoConfigRuntimeVersionIfString', 'ExpoConfigNames']);
    expect(result).toEqual(
      SourceSkips.ExpoConfigRuntimeVersionIfString | SourceSkips.ExpoConfigNames
    );
  });

  it('should throw for invalid sourceSkips type', () => {
    // @ts-expect-error
    expect(() => normalizeSourceSkips({})).toThrow();
    // @ts-expect-error
    expect(() => normalizeSourceSkips('test')).toThrow();
  });
});
