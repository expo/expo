import { ExpoConfig } from '@expo/config-types';
import { vol } from 'memfs';

import { addWarningIOS } from '../../utils/warnings';
import { createInfoPlistPluginWithPropertyGuard } from '../ios-plugins';
import { evalModsAsync } from '../mod-compiler';
import { getIosModFileProviders, withIosBaseMods } from '../withIosBaseMods';
import rnFixture from './fixtures/react-native-project';

jest.mock('../../utils/warnings', () => ({
  addWarningIOS: jest.fn(),
}));

jest.mock('fs');

export const asMock = <T extends (...args: any[]) => any>(fn: T): jest.MockedFunction<T> =>
  fn as jest.MockedFunction<T>;
describe(createInfoPlistPluginWithPropertyGuard, () => {
  const projectRoot = '/app';

  beforeEach(async () => {
    asMock(addWarningIOS).mockClear();
    vol.fromJSON(
      {
        ...rnFixture,
      },
      projectRoot
    );
  });

  afterEach(() => {
    vol.reset();
  });

  it(`respects info plist manual values`, async () => {
    const setter = jest.fn();
    const withPlugin = createInfoPlistPluginWithPropertyGuard(setter, {
      infoPlistProperty: 'CFFakeValue',
      // Supports nesting
      expoConfigProperty: 'ios.appStoreUrl',
    });

    let config: ExpoConfig = {
      name: 'hey',
      slug: '',
      ios: {
        appStoreUrl: 'underlying',
        infoPlist: {
          CFFakeValue: false,
        },
      },
    };

    config = withPlugin(config);

    config = withIosBaseMods(config, {
      providers: {
        infoPlist: getIosModFileProviders().infoPlist,
      },
    });

    const results = await evalModsAsync(config, {
      projectRoot,
      platforms: ['ios'],
      introspect: true,
      assertMissingModProviders: true,
    });

    expect(results.ios.infoPlist.CFFakeValue).toEqual(false);

    expect(setter).not.toBeCalled();
    expect(addWarningIOS).toBeCalledWith(
      'ios.appStoreUrl',
      '"ios.infoPlist.CFFakeValue" is set in the config. Ignoring abstract property "ios.appStoreUrl": underlying'
    );
  });

  it(`does not warn about info plist overrides if the abstract value is not defined`, async () => {
    const setter = jest.fn();
    const withPlugin = createInfoPlistPluginWithPropertyGuard(setter, {
      infoPlistProperty: 'CFFakeValue',
      expoConfigProperty: 'foobar',
    });

    let config: ExpoConfig = {
      name: 'hey',
      slug: '',
      ios: {
        infoPlist: {
          CFFakeValue: false,
        },
      },
    };

    config = withPlugin(config);

    config = withIosBaseMods(config, {
      providers: {
        infoPlist: getIosModFileProviders().infoPlist,
      },
    });

    const results = await evalModsAsync(config, {
      projectRoot,
      platforms: ['ios'],
      introspect: true,
      assertMissingModProviders: true,
    });

    expect(results.ios.infoPlist.CFFakeValue).toEqual(false);

    expect(setter).not.toBeCalled();
    expect(addWarningIOS).not.toBeCalled();
  });

  it(`uses default behavior when not overwritten`, async () => {
    const setter = jest.fn();
    const withPlugin = createInfoPlistPluginWithPropertyGuard(setter, {
      infoPlistProperty: 'CFFakeValue',
      expoConfigProperty: 'name',
    });

    let config: ExpoConfig = {
      name: 'hey',
      slug: '',
      ios: {
        infoPlist: {},
      },
    };

    config = withPlugin(config);

    config = withIosBaseMods(config, {
      providers: {
        infoPlist: getIosModFileProviders().infoPlist,
      },
    });

    await evalModsAsync(config, {
      projectRoot,
      platforms: ['ios'],
      introspect: true,
      assertMissingModProviders: true,
    });

    expect(setter).toBeCalled();
    expect(addWarningIOS).not.toBeCalled();
  });
});
