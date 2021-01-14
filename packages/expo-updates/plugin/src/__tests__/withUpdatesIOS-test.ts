import * as Updates from '../withUpdatesIOS';

describe('iOS Updates config', () => {
  it(`returns correct default values from all getters if no value provided`, () => {
    expect(Updates.getSDKVersion({})).toBe(null);
    expect(Updates.getUpdateUrl({ slug: 'foo' }, null)).toBe(null);
    expect(Updates.getUpdatesCheckOnLaunch({})).toBe('ALWAYS');
    expect(Updates.getUpdatesEnabled({})).toBe(true);
    expect(Updates.getUpdatesTimeout({})).toBe(0);
  });

  it(`returns correct value from all getters if value provided`, () => {
    expect(Updates.getSDKVersion({ sdkVersion: '37.0.0' })).toBe('37.0.0');
    expect(Updates.getUpdateUrl({ slug: 'my-app' }, 'user')).toBe('https://exp.host/@user/my-app');
    expect(Updates.getUpdateUrl({ slug: 'my-app', owner: 'owner' }, 'user')).toBe(
      'https://exp.host/@owner/my-app'
    );
    expect(
      Updates.getUpdatesCheckOnLaunch({ updates: { checkAutomatically: 'ON_ERROR_RECOVERY' } })
    ).toBe('NEVER');
    expect(Updates.getUpdatesCheckOnLaunch({ updates: { checkAutomatically: 'ON_LOAD' } })).toBe(
      'ALWAYS'
    );
    expect(Updates.getUpdatesEnabled({ updates: { enabled: false } })).toBe(false);
    expect(Updates.getUpdatesTimeout({ updates: { fallbackToCacheTimeout: 2000 } })).toBe(2000);
  });

  it('sets the correct values in Expo.plist', () => {
    expect(
      Updates.setUpdatesConfig(
        {
          sdkVersion: '37.0.0',
          slug: 'my-app',
          owner: 'owner',
          updates: {
            enabled: false,
            fallbackToCacheTimeout: 2000,
            checkAutomatically: 'ON_ERROR_RECOVERY',
          },
        },
        {},
        'user'
      )
    ).toMatchObject({
      EXUpdatesEnabled: false,
      EXUpdatesURL: 'https://exp.host/@owner/my-app',
      EXUpdatesCheckOnLaunch: 'NEVER',
      EXUpdatesLaunchWaitMs: 2000,
      EXUpdatesSDKVersion: '37.0.0',
    });
  });
});
