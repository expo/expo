import {
  getFacebookAdvertiserIDCollection,
  getFacebookAppId,
  getFacebookAutoInitEnabled,
  getFacebookAutoLogAppEvents,
  getFacebookDisplayName,
  getFacebookScheme,
  setFacebookAdvertiserIDCollectionEnabled,
  setFacebookAppId,
  setFacebookAutoInitEnabled,
  setFacebookConfig,
} from '../withIosFacebook';

describe('ios facebook config', () => {
  it(`returns null from all getters if no value provided`, () => {
    expect(getFacebookScheme({})).toBe(null);
    expect(getFacebookAppId({})).toBe(null);
    expect(getFacebookDisplayName({})).toBe(null);
    expect(getFacebookAutoLogAppEvents({})).toBe(null);
    expect(getFacebookAutoInitEnabled({})).toBe(null);
    expect(getFacebookAdvertiserIDCollection({})).toBe(null);
  });

  it(`returns correct value from all getters if value provided`, () => {
    expect(getFacebookScheme({ facebookScheme: 'myscheme' })).toMatch('myscheme');
    expect(getFacebookAppId({ facebookAppId: 'my-app-id' })).toMatch('my-app-id');
    expect(getFacebookDisplayName({ facebookDisplayName: 'my-display-name' })).toMatch(
      'my-display-name'
    );
    expect(getFacebookAutoLogAppEvents({ facebookAutoLogAppEventsEnabled: false })).toBe(false);
    expect(getFacebookAutoInitEnabled({ facebookAutoInitEnabled: true })).toBe(true);
    expect(
      getFacebookAdvertiserIDCollection({ facebookAdvertiserIDCollectionEnabled: false })
    ).toBe(false);
  });

  it('sets the facebook app id config', () => {
    expect(setFacebookAppId({ facebookAppId: 'abc' }, {})).toStrictEqual({
      FacebookAppID: 'abc',
    });
  });

  it('sets the facebook auto init config', () => {
    expect(setFacebookAutoInitEnabled({ facebookAutoInitEnabled: true }, {})).toStrictEqual({
      FacebookAutoInitEnabled: true,
    });
  });

  it('sets the facebook advertising id enabled config', () => {
    expect(
      setFacebookAdvertiserIDCollectionEnabled({ facebookAdvertiserIDCollectionEnabled: true }, {})
    ).toStrictEqual({
      FacebookAdvertiserIDCollectionEnabled: true,
    });
  });

  it('removes the facebook config', () => {
    expect(
      setFacebookConfig(
        {},
        {
          FacebookAdvertiserIDCollectionEnabled: true,
          FacebookAppID: 'my-app-id',
          FacebookAutoInitEnabled: true,
          FacebookAutoLogAppEventsEnabled: true,
          FacebookDisplayName: 'my-display-name',
          LSApplicationQueriesSchemes: ['fbapi', 'fb-messenger-api', 'fbauth2', 'fbshareextension'],
        }
      )
    ).toStrictEqual({});
  });
  it('preserves the existing LSApplicationQueriesSchemes after removing the facebook schemes', () => {
    const plist = setFacebookConfig(
      {},
      {
        LSApplicationQueriesSchemes: [
          'expo',
          'fbapi',
          'fb-messenger-api',
          'fbauth2',
          'fbshareextension',
        ],
      }
    );
    // Test that running the command twice doesn't cause duplicates
    expect(setFacebookConfig({}, plist)).toStrictEqual({
      LSApplicationQueriesSchemes: ['expo'],
    });
  });
});
