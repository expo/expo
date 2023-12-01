import { IOSConfig } from '@expo/config-plugins';

import { selectAsync } from '../../../../utils/prompts';
import { promptOrQueryNativeSchemeAsync, getDefaultNativeScheme } from '../resolveNativeScheme';

jest.mock('../../../../utils/prompts');
jest.mock('@expo/config-plugins', () => {
  return {
    IOSConfig: {
      ...jest.requireActual('@expo/config-plugins').IOSConfig,
      BuildScheme: {
        getRunnableSchemesFromXcodeproj: jest.fn(),
      },
    },
  };
});

describe(getDefaultNativeScheme, () => {
  it(`defaults to application scheme regardless of position in array`, () => {
    jest.mocked(IOSConfig.BuildScheme.getRunnableSchemesFromXcodeproj).mockReturnValueOnce([
      // Ensure the wrong one is first...
      { name: 'foobar2', osType: 'watchOS', type: 'com.apple.product-type.application.watchapp' },
      { name: 'foobar', osType: 'iOS', type: 'com.apple.product-type.application' },
    ]);
    expect(
      getDefaultNativeScheme(
        '/',
        {
          configuration: 'Debug',
        },
        {
          name: 'foo',
        }
      )
    ).toEqual({
      name: 'foobar',
      osType: 'iOS',
      type: 'com.apple.product-type.application',
    });
  });
  it(`uses only scheme if available even if no application scheme is available`, () => {
    jest
      .mocked(IOSConfig.BuildScheme.getRunnableSchemesFromXcodeproj)
      .mockReturnValueOnce([
        { name: 'foobar2', osType: 'watchOS', type: 'com.apple.product-type.application.watchapp' },
      ]);
    expect(
      getDefaultNativeScheme(
        '/',
        {
          configuration: 'Debug',
        },
        {
          name: 'foo',
        }
      )
    ).toEqual({
      name: 'foobar2',
      osType: 'watchOS',
      type: 'com.apple.product-type.application.watchapp',
    });
  });
});

describe(promptOrQueryNativeSchemeAsync, () => {
  it(`resolves xcworkspace with higher priority than xcodeproj`, async () => {
    jest
      .mocked(IOSConfig.BuildScheme.getRunnableSchemesFromXcodeproj)
      .mockReturnValueOnce([
        { name: 'foobar', osType: 'iOS', type: 'com.apple.product-type.application' },
      ]);

    expect(await promptOrQueryNativeSchemeAsync('/', { scheme: 'foobar' })).toEqual({
      name: 'foobar',
      osType: 'iOS',
      type: 'com.apple.product-type.application',
    });
  });
  it(`asserts no schemes`, async () => {
    jest.mocked(IOSConfig.BuildScheme.getRunnableSchemesFromXcodeproj).mockReturnValueOnce([]);

    await expect(promptOrQueryNativeSchemeAsync('/', { scheme: 'foobar' })).rejects.toThrowError(
      /No native iOS build schemes found/
    );
  });
  it(`prompts to select a scheme`, async () => {
    jest.mocked(IOSConfig.BuildScheme.getRunnableSchemesFromXcodeproj).mockReturnValueOnce([
      { name: 'foobar', osType: 'iOS', type: 'com.apple.product-type.application' },
      { name: 'foobar2', osType: 'watchOS', type: 'com.apple.product-type.application.watchapp' },
    ]);

    jest.mocked(selectAsync).mockResolvedValueOnce('foobar2');

    expect(await promptOrQueryNativeSchemeAsync('/', { scheme: true })).toEqual({
      name: 'foobar2',
      osType: 'watchOS',
      type: 'com.apple.product-type.application.watchapp',
    });
  });
  it(`returns null if no matching scheme can be found`, async () => {
    jest.mocked(IOSConfig.BuildScheme.getRunnableSchemesFromXcodeproj).mockReturnValueOnce([
      { name: 'foobar', osType: 'iOS', type: 'com.apple.product-type.application' },
      { name: 'foobar2', osType: 'watchOS', type: 'com.apple.product-type.application.watchapp' },
    ]);

    jest.mocked(selectAsync).mockResolvedValueOnce('bacon');
    expect(await promptOrQueryNativeSchemeAsync('/', { scheme: true })).toEqual(null);
  });
});
