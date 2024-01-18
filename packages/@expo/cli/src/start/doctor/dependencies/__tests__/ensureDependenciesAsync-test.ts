import { installAsync } from '../../../../install/installAsync';
import { isInteractive } from '../../../../utils/interactive';
import { confirmAsync } from '../../../../utils/prompts';
import { createInstallCommand, ensureDependenciesAsync } from '../ensureDependenciesAsync';
import { getMissingPackagesAsync } from '../getMissingPackages';

jest.mock('@expo/config', () => ({
  getConfig: jest.fn(() => ({
    pkg: {},
    exp: {
      sdkVersion: '45.0.0',
      name: 'my-app',
      slug: 'my-app',
    },
  })),
}));

jest.mock('../getMissingPackages', () => ({
  getMissingPackagesAsync: jest.fn(),
}));
jest.mock('../../../../install/installAsync', () => ({
  installAsync: jest.fn(),
}));
jest.mock('../../../../utils/interactive', () => ({
  isInteractive: jest.fn(() => true),
}));
jest.mock('../../../../utils/prompts', () => ({
  confirmAsync: jest.fn(() => true),
}));

describe(ensureDependenciesAsync, () => {
  beforeEach(() => {
    jest.mocked(getMissingPackagesAsync).mockReset();
    jest.mocked(installAsync).mockReset();
    jest.mocked(confirmAsync).mockResolvedValue(true);
    jest.mocked(isInteractive).mockReturnValue(true);
  });
  it(`prompts to install`, async () => {
    jest
      .mocked(getMissingPackagesAsync)
      .mockResolvedValueOnce({
        missing: [{ pkg: 'bacon', file: '', version: '~1.0.0' }],
        resolutions: {},
      })
      .mockResolvedValueOnce({
        missing: [],
        resolutions: {},
      });

    expect(
      await ensureDependenciesAsync('projectRoot', {
        installMessage: 'installMessage',
        warningMessage: 'warningMessage',
        requiredPackages: [{ pkg: 'bacon', file: '', version: '~1.0.0' }],
        exp: {
          sdkVersion: '45.0.0',
          slug: 'my-app',
          name: 'my-app',
        },
      })
    ).toBe(true);

    expect(confirmAsync).toBeCalledTimes(1);
    expect(installAsync).toBeCalledTimes(1);
    expect(installAsync).toBeCalledWith(['bacon@~1.0.0'], { projectRoot: 'projectRoot' });
  });
  it(`installs without prompting`, async () => {
    jest
      .mocked(getMissingPackagesAsync)
      .mockResolvedValueOnce({
        missing: [{ pkg: 'bacon', file: '', version: '~1.0.0' }],
        resolutions: {},
      })
      .mockResolvedValueOnce({
        missing: [],
        resolutions: {},
      });

    expect(
      await ensureDependenciesAsync('projectRoot', {
        skipPrompt: true,
        isProjectMutable: true,
        installMessage: 'installMessage',
        warningMessage: 'warningMessage',
        requiredPackages: [{ pkg: 'bacon', file: '', version: '~1.0.0' }],
        exp: {
          sdkVersion: '45.0.0',
          slug: 'my-app',
          name: 'my-app',
        },
      })
    ).toBe(true);

    expect(confirmAsync).toBeCalledTimes(0);
    expect(installAsync).toBeCalledTimes(1);
    expect(installAsync).toBeCalledWith(['bacon@~1.0.0'], { projectRoot: 'projectRoot' });
  });
  it(`asserts when the prompt is rejected`, async () => {
    jest.mocked(confirmAsync).mockResolvedValueOnce(false);
    jest
      .mocked(getMissingPackagesAsync)
      .mockResolvedValueOnce({
        missing: [{ pkg: 'bacon', file: '', version: '~1.0.0' }],
        resolutions: {},
      })
      .mockResolvedValueOnce({
        missing: [],
        resolutions: {},
      });

    await expect(
      ensureDependenciesAsync('projectRoot', {
        installMessage: 'installMessage',
        warningMessage: 'warningMessage',
        requiredPackages: [{ pkg: 'bacon', file: '', version: '~1.0.0' }],
        exp: {
          sdkVersion: '45.0.0',
          slug: 'my-app',
          name: 'my-app',
        },
      })
    ).rejects.toThrowError(/Please install/);

    expect(confirmAsync).toBeCalledTimes(1);
    expect(installAsync).toBeCalledTimes(0);
  });
  it(`asserts when mutations are required in CI`, async () => {
    // jest.mocked(confirmAsync).mockResolvedValueOnce(false);
    jest.mocked(getMissingPackagesAsync).mockResolvedValueOnce({
      missing: [{ pkg: 'bacon', file: '', version: '~1.0.0' }],
      resolutions: {},
    });

    jest.mocked(isInteractive).mockReturnValue(false);

    await expect(
      ensureDependenciesAsync('projectRoot', {
        installMessage: 'installMessage',
        warningMessage: 'warningMessage',
        requiredPackages: [{ pkg: 'bacon', file: '', version: '~1.0.0' }],
        exp: {
          sdkVersion: '45.0.0',
          slug: 'my-app',
          name: 'my-app',
        },
      })
    ).rejects.toThrowError(/Please install/);

    expect(confirmAsync).toBeCalledTimes(0);
    expect(installAsync).toBeCalledTimes(0);
  });
});

describe(createInstallCommand, () => {
  it(`formats install`, () => {
    expect(
      createInstallCommand({
        packages: [
          { pkg: 'bacon', file: '', version: '~1.0.0' },
          { pkg: 'other', file: '' },
        ],
      })
    ).toBe('npx expo install bacon other');
  });
});
