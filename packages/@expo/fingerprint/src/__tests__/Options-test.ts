import { vol } from 'memfs';
import requireString from 'require-from-string';

import { satisfyExpoVersion } from '../ExpoVersions';
import { normalizeOptionsAsync } from '../Options';

jest.mock('fs/promises');
// Mock cpus to return a single core for consistent snapshot testing
jest.mock('os', () => ({ cpus: jest.fn().mockReturnValue([0]) }));
jest.mock('../ExpoVersions');

describe(normalizeOptionsAsync, () => {
  afterEach(() => {
    vol.reset();
  });

  it('should return the default options if no options are provided', async () => {
    const options = await normalizeOptionsAsync('/app');
    // @ts-expect-error: mutate the objects to only show patterns in the snapshot
    options.ignorePathMatchObjects = options.ignorePathMatchObjects.map(({ pattern }) => pattern);
    // @ts-expect-error: mutate the objects to only show patterns in the snapshot
    options.ignoreDirMatchObjects = options.ignoreDirMatchObjects.map(({ pattern }) => pattern);
    expect(options).toMatchSnapshot();
  });

  it('should respect ignorePaths from both config and options', async () => {
    await jest.isolateModulesAsync(async () => {
      const configContents = `\
const config = {
  ignorePaths: ['aaa', 'bbb'],
};
module.exports = config;
`;
      vol.fromJSON({ '/app/fingerprint.config.js': configContents });
      jest.doMock('/app/fingerprint.config.js', () => requireString(configContents), {
        virtual: true,
      });

      const { ignorePathMatchObjects } = await normalizeOptionsAsync('/app', {
        ignorePaths: ['ccc'],
      });
      const ignorePaths = ignorePathMatchObjects.map(({ pattern }) => pattern);
      expect(ignorePaths).toContain('aaa');
      expect(ignorePaths).toContain('bbb');
      expect(ignorePaths).toContain('ccc');
    });
  });

  it('should respect fingerprint config', async () => {
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

      const { hashAlgorithm } = await normalizeOptionsAsync('/app');
      expect(hashAlgorithm).toBe('sha256');
    });
  });

  it('should respect explicit option from arguments than fingerprint config', async () => {
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

      const { hashAlgorithm } = await normalizeOptionsAsync('/app', { hashAlgorithm: 'md5' });
      expect(hashAlgorithm).toBe('md5');
    });
  });
});

describe(`normalizeOptionsAsync - enableReactImportsPatcher`, () => {
  it('should disable ReactImportsPatcher by default', async () => {
    const options = await normalizeOptionsAsync('/app');
    expect(options.enableReactImportsPatcher).toBe(false);
  });

  it('should enable ReactImportsPatcher if the project is having Expo version < 52.0.0', async () => {
    const mockSatisfyExpoVersion = satisfyExpoVersion as jest.MockedFunction<
      typeof satisfyExpoVersion
    >;
    mockSatisfyExpoVersion.mockReturnValueOnce(true);
    const options = await normalizeOptionsAsync('/app');
    expect(mockSatisfyExpoVersion.mock.calls[0][1]).toBe('<52.0.0');
    expect(options.enableReactImportsPatcher).toBe(true);
  });

  it('should override ReactImportsPatcher if the option is provided', async () => {
    const options = await normalizeOptionsAsync('/app', { enableReactImportsPatcher: true });
    expect(options.enableReactImportsPatcher).toBe(true);
  });

  it('should override ReactImportPatcher if config is provided', async () => {
    await jest.isolateModulesAsync(async () => {
      const configContents = `\
/** @type {import('@expo/fingerprint').Config} */
const config = {
  enableReactImportsPatcher: true,
};
module.exports = config;
`;
      vol.fromJSON({ '/app/fingerprint.config.js': configContents });
      jest.doMock('/app/fingerprint.config.js', () => requireString(configContents), {
        virtual: true,
      });

      const options = await normalizeOptionsAsync('/app');
      expect(options.enableReactImportsPatcher).toBe(true);
    });
  });
});
