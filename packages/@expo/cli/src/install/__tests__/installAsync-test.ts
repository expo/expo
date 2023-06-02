import { asMock } from '../../__tests__/asMock';
import { Log } from '../../log';
import { assertNotInstallingExcludedPackages } from '../installAsync';

jest.mock('../../log');

describe(assertNotInstallingExcludedPackages, () => {
  it(`calls Log.exit if a package is in package.json expo.install.exclude`, () => {
    asMock(Log.exit).mockReset();
    assertNotInstallingExcludedPackages('./', ['expo-splash-screen', 'expo-updates'], {
      expo: { install: { exclude: ['expo-splash-screen'] } },
    });

    expect(Log.exit).toBeCalledWith(expect.stringContaining('expo-splash-screen'));
  });

  it(`does not call Log.exit if package.json expo.install.exclude doesn't exist`, () => {
    asMock(Log.exit).mockReset();
    assertNotInstallingExcludedPackages('./', ['expo-splash-screen', 'expo-updates'], {});

    expect(Log.exit).not.toBeCalled();
  });

  it(`does not call Log.exit if packages are not in package.json expo.install.exclude`, () => {
    asMock(Log.exit).mockReset();
    assertNotInstallingExcludedPackages('./', ['expo-splash-screen', 'expo-updates'], {
      expo: { install: { exclude: ['expo-image'] } },
    });

    expect(Log.exit).not.toBeCalled();
  });
});
