import { withSKAdNetworkIdentifiers } from '../withSKAdNetworkIdentifiers';

describe(withSKAdNetworkIdentifiers, () => {
  it(`adds ids to the Info.plist`, () => {
    // @ts-ignore: ExpoConfig name and slug
    expect(withSKAdNetworkIdentifiers({}, ['FOOBAR', 'other'])).toStrictEqual({
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
  it(`prevents adding duplicate ids to the Info.plist`, () => {
    expect(
      withSKAdNetworkIdentifiers(
        // @ts-ignore: ExpoConfig name and slug
        {
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
