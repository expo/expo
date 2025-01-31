import * as PackageManager from '@expo/package-manager';

import { delayAsync } from '../../../../utils/delay';
import { confirmAsync } from '../../../../utils/prompts';
import { ExternalModule, ExternalModuleVersionError } from '../ExternalModule';

jest.mock('../../../../utils/prompts');
jest.mock('../../../../log');
jest.mock('../../../../utils/delay', () => ({
  delayAsync: jest.fn(async () => {}),
}));

function createExternalModuleResolver() {
  const projectRoot = '/';
  const onMessage = jest.fn((pkgName) => pkgName + ' is required');
  const externalModule = new ExternalModule<any>(
    projectRoot,
    { name: '@expo/ngrok', versionRange: '^4.1.0' },
    onMessage
  );
  // Mock the require statements.
  externalModule._require = jest.fn();
  externalModule._resolveLocal = jest.fn((moduleId) => '/path/to/' + moduleId);
  externalModule._resolveGlobal = jest.fn((moduleId) => '/path/to/' + moduleId);
  externalModule.getVersioned = jest.fn(externalModule.getVersioned.bind(externalModule));
  externalModule.installAsync = jest.fn(externalModule.installAsync.bind(externalModule));

  return {
    projectRoot,
    externalModule,
    onMessage,
  };
}

describe('get', () => {
  it(`returns null when the version is incorrect.`, () => {
    const { externalModule } = createExternalModuleResolver();
    jest.mocked(externalModule._require).mockReturnValue({
      version: '1.0.0',
    });

    const instance = externalModule.get();

    expect(instance).toBe(null);
  });
});
describe('_resolveModule', () => {
  it(`asserts when the required package exports a nullish value.`, () => {
    const { externalModule } = createExternalModuleResolver();
    jest
      .mocked(externalModule._require)
      .mockReturnValueOnce({ version: '4.1.0' })
      .mockReturnValueOnce(null);
    jest.mocked(externalModule._resolveLocal).mockReturnValue('/');

    expect(() => externalModule._resolveModule(true)).toThrowError(/exports a nullish value/);
  });
});

describe('getVersioned', () => {
  it('resolves the local instance of a package', () => {
    const { externalModule } = createExternalModuleResolver();
    jest
      .mocked(externalModule._require)
      .mockReturnValueOnce({
        version: '4.1.0',
      })
      .mockReturnValueOnce('foobar');

    const instance = externalModule.getVersioned();

    expect(externalModule._resolveLocal).toHaveBeenNthCalledWith(1, '@expo/ngrok/package.json');
    expect(externalModule._resolveLocal).toHaveBeenNthCalledWith(2, '@expo/ngrok');
    expect(externalModule._resolveGlobal).toHaveBeenCalledTimes(0);
    expect(instance).toBe('foobar');
  });

  it('resolves the global instance of a package', () => {
    const { externalModule } = createExternalModuleResolver();
    jest
      .mocked(externalModule._require)
      .mockReturnValueOnce(null)
      .mockReturnValueOnce({
        version: '4.1.0',
      })
      .mockReturnValueOnce('foobar');

    const instance = externalModule.getVersioned();

    expect(externalModule._resolveLocal).toHaveBeenNthCalledWith(1, '@expo/ngrok/package.json');
    expect(externalModule._resolveLocal).toHaveBeenCalledTimes(1);
    expect(externalModule._resolveGlobal).toHaveBeenNthCalledWith(1, '@expo/ngrok/package.json');
    expect(instance).toBe('foobar');
  });
});

describe('resolveAsync', () => {
  it('overwrites preferred global install when local packages needs upgrade', async () => {
    const { externalModule } = createExternalModuleResolver();

    externalModule.getVersioned = jest.fn(() => {
      // mock throwing an error when the local version is lower than required.
      throw new ExternalModuleVersionError('foobar', false);
    });

    externalModule.installAsync = jest.fn();

    await externalModule.resolveAsync({
      // overwrites the preferred value since we'll have a more informed guess.
      prefersGlobalInstall: true,
    });

    expect(externalModule.installAsync).toHaveBeenCalledWith({ shouldGloballyInstall: false });
  });
  it('upgrades non-compliant local package', async () => {
    const { externalModule } = createExternalModuleResolver();
    jest.mocked(externalModule._require).mockReturnValueOnce({
      version: '3.0.0',
    });

    externalModule.installAsync = jest.fn();

    await externalModule.resolveAsync();

    expect(externalModule.installAsync).toHaveBeenCalledWith({ shouldGloballyInstall: false });
    expect(externalModule._resolveLocal).toHaveBeenNthCalledWith(1, '@expo/ngrok/package.json');
    expect(externalModule._resolveGlobal).toHaveBeenCalledTimes(0);
  });

  it('upgrades non-compliant global package', async () => {
    const { externalModule } = createExternalModuleResolver();

    jest
      .mocked(externalModule._require)
      .mockReturnValueOnce(
        // Return the local package as null to imply that it doesn't exist.
        null
      )
      .mockReturnValueOnce({
        version: '3.0.0',
      });

    externalModule.installAsync = jest.fn();

    await externalModule.resolveAsync();

    expect(externalModule.installAsync).toHaveBeenCalledWith({ shouldGloballyInstall: true });
    expect(externalModule._resolveLocal).toHaveBeenNthCalledWith(1, '@expo/ngrok/package.json');
    expect(externalModule._resolveGlobal).toHaveBeenNthCalledWith(1, '@expo/ngrok/package.json');
  });
});

describe('installAsync', () => {
  it(`installs the missing package to project dev dependencies`, async () => {
    const { externalModule } = createExternalModuleResolver();

    jest.mocked(externalModule.getVersioned).mockReturnValueOnce(
      // Return the global package as null to imply that it doesn't exist.
      'foobar'
    );
    jest
      .mocked(confirmAsync)
      .mockResolvedValueOnce(true)
      .mockImplementation(() => {
        throw new Error("shouldn't happen");
      });

    const addDevAsync = jest.fn();

    jest.mocked(PackageManager.createForProject).mockReturnValueOnce({
      addDevAsync,
    } as any);

    const instance = await externalModule.installAsync({ shouldPrompt: true, autoInstall: false });

    expect(externalModule.installAsync).toHaveBeenCalledWith({
      autoInstall: false,
      shouldPrompt: true,
    });
    expect(delayAsync).toBeCalled();

    expect(instance).toBe('foobar');
    expect(PackageManager.createForProject).toBeCalled();
    // Ensure all packages are added as dev dep locally.
    expect(addDevAsync).toBeCalled();
  });

  it(`installs the missing package globally with npm`, async () => {
    const { externalModule } = createExternalModuleResolver();

    jest.mocked(externalModule.getVersioned).mockReturnValueOnce(
      // Return the global package as null to imply that it doesn't exist.
      'foobar'
    );

    const addGlobalAsync = jest.fn();

    jest.mocked(PackageManager.NpmPackageManager as any).mockReturnValueOnce({
      addGlobalAsync,
    } as any);

    await externalModule.installAsync({
      autoInstall: true,
      shouldGloballyInstall: true,
    });

    expect(PackageManager.createForProject).not.toBeCalled();
    // Ensure all packages are added as dev dep locally.
    expect(addGlobalAsync).toBeCalled();
    expect(confirmAsync).not.toBeCalled();
  });

  it(`throws an error when the package cannot be found after install`, async () => {
    const { externalModule } = createExternalModuleResolver();

    jest.mocked(externalModule.getVersioned).mockReturnValue(
      // Return the local package as null to imply that it doesn't exist.
      null
    );
    jest.mocked(confirmAsync).mockImplementation(() => {
      throw new Error("shouldn't happen");
    });

    jest.mocked(PackageManager.createForProject).mockReturnValueOnce({
      addDevAsync: jest.fn(),
    } as any);

    await expect(externalModule.installAsync({ autoInstall: true })).rejects.toThrowError(
      /Please install .* and try again/
    );

    expect(externalModule.installAsync).toHaveBeenCalledTimes(2);
    expect(PackageManager.createForProject).toBeCalled();
  });

  it(`asserts on missing`, async () => {
    const { externalModule } = createExternalModuleResolver();

    jest.mocked(externalModule.getVersioned).mockReturnValue(
      // Return the local package as null to imply that it doesn't exist.
      null
    );
    jest.mocked(confirmAsync).mockImplementation(() => {
      throw new Error("shouldn't happen");
    });

    jest.mocked(PackageManager.createForProject).mockReturnValueOnce({
      addDevAsync: jest.fn(),
    } as any);

    await expect(
      externalModule.resolveAsync({ autoInstall: false, shouldPrompt: false })
    ).rejects.toThrowError(/Please install .* and try again/);

    // Only invoked once, since we're not prompting.
    expect(externalModule.installAsync).toHaveBeenCalledTimes(1);
    // No install was called
    expect(PackageManager.createForProject).toBeCalledTimes(0);
  });
});
