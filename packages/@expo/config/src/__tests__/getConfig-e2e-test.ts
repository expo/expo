// Tests that require physical fixtures due to their complex nature.
import { join, resolve } from 'path';

import { getConfig, setCustomConfigPath } from '../Config';
import { getDynamicConfig } from '../getConfig';

const mockConfigContext = {} as any;

jest.unmock('resolve-from');

describe(getDynamicConfig, () => {
  describe('process.cwd in a child process', () => {
    const originalCwd = process.cwd();
    const projectRoot = join(__dirname, 'fixtures/dynamic-cwd');

    beforeEach(() => {
      process.chdir(__dirname);
    });

    afterEach(() => {
      process.chdir(originalCwd);
    });

    // Test that hot evaluation is spawned in the expected location
    // https://github.com/expo/expo-cli/pull/2220
    it('process.cwd in read-config script is not equal to the project root', () => {
      const configPath = join(projectRoot, 'app.config.ts');

      const { config } = getDynamicConfig(configPath, mockConfigContext);

      expect(config.extra.processCwd).toBe(__dirname);
      expect(
        getDynamicConfig(configPath, {
          projectRoot,
        } as any).config.extra.processCwd
      ).toBe(__dirname);
    });
  });
});

describe(getConfig, () => {
  it('parses a js config with import', () => {
    const projectRoot = resolve(__dirname, './fixtures/require-file');
    const configPath = resolve(projectRoot, 'with-import_app.config.js');

    setCustomConfigPath(projectRoot, configPath);
    const { exp } = getConfig(projectRoot, {
      skipSDKVersionRequirement: true,
    });
    // @ts-ignore: foo property is not defined
    expect(exp.foo).toBe('bar');
  });

  it('throws a useful error for a project with an external syntax error', () => {
    const projectRoot = resolve(__dirname, './fixtures/external-error');
    const configPath = resolve(projectRoot, 'app.config.js');

    setCustomConfigPath(projectRoot, configPath);
    expect(() =>
      getConfig(projectRoot, {
        skipSDKVersionRequirement: true,
      })
    ).toThrowErrorMatchingSnapshot();
  });

  it('resolves plugins', () => {
    const projectRoot = resolve(__dirname, './fixtures/plugins');
    const { exp } = getConfig(projectRoot, {
      skipSDKVersionRequirement: true,
    });

    expect(exp.name).toBe('custom-name');
    expect(exp.slug).toBe('from-custom-plugin');
    expect(exp.plugins[0]).toStrictEqual('./my-plugin');
    // Ensure the plugin method is serialized into its original name
    expect(exp.plugins[1][0]).toBe('withCustom');
  });
});
