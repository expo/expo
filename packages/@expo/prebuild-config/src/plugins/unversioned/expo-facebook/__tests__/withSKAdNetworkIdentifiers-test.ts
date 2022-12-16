import { withSKAdNetworkIdentifiers } from '../withSKAdNetworkIdentifiers';

describe(withSKAdNetworkIdentifiers, () => {
  it(`skips adding ids to the Info.plist if facebookAppId isn't defined`, () => {
    // @ts-ignore: ExpoConfig name and slug
    expect(withSKAdNetworkIdentifiers({}, ['FOOBAR', 'other'])).toStrictEqual({});
  });
  it(`adds ids to the Info.plist`, () => {
    // @ts-ignore: ExpoConfig name and slug
    expect(withSKAdNetworkIdentifiers({ facebookAppId: 'xxx' }, ['FOOBAR', 'other'])).toStrictEqual(
      {
        facebookAppId: 'xxx',
        ios: {
          infoPlist: {
            SKAdNetworkItems: [
              {
                SKAdNetworkIdentifier: 'foobar',
              },
              {
                SKAdNetworkIdentifier: 'other',
              },
            ],
          },
        },
      }
    );
  });
  it(`prevents adding duplicate ids to the Info.plist`, () => {
    expect(
      withSKAdNetworkIdentifiers(
        // @ts-ignore: ExpoConfig name and slug
        {
          facebookAppId: 'xxx',
          ios: {
            infoPlist: {
              SKAdNetworkItems: [
                {
                  SKAdNetworkIdentifier: 'foobar',
                },
              ],
            },
          },
        },
        ['foobar', 'other']
      )
    ).toStrictEqual({
      facebookAppId: 'xxx',
      ios: {
        infoPlist: {
          SKAdNetworkItems: [
            {
              SKAdNetworkIdentifier: 'foobar',
            },
            {
              SKAdNetworkIdentifier: 'other',
            },
          ],
        },
      },
    });
  });
});
