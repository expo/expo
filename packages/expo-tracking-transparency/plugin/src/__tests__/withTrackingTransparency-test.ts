import { withUserTrackingPermission } from '../withTrackingTransparency';

const blankConfig = {
  slug: 'testSlug',
  name: 'testName',
};

const configWithDefaultNSUserTrackingUsageDescription = {
  slug: 'testSlug',
  name: 'testName',
  ios: {
    infoPlist: {
      NSUserTrackingUsageDescription:
        'This will allow the app to gather app-related data that can be used for tracking you or your device.',
    },
  },
};

const configWithCustomNSUserTrackingUsageDescription = {
  slug: 'testSlug',
  name: 'testName',
  ios: {
    infoPlist: {
      NSUserTrackingUsageDescription: 'my custom string',
    },
  },
};

describe('Expo Tracking Transparency', () => {
  it('sets `NSUserTrackingUsageDescription` permission message in the config', () => {
    expect(
      withUserTrackingPermission({
        slug: 'testSlug',
        name: 'testName',
      })
    ).toMatchObject(configWithDefaultNSUserTrackingUsageDescription);
  });

  it('does not add duplicate `NSUserTrackingUsageDescription` permission message in the config', () => {
    expect(
      withUserTrackingPermission({
        slug: 'testSlug',
        name: 'testName',
        ios: {
          infoPlist: {
            NSUserTrackingUsageDescription:
              'This will allow the app to gather app-related data that can be used for tracking you or your device.',
          },
        },
      })
    ).toMatchObject(configWithDefaultNSUserTrackingUsageDescription);
  });

  it('overwrites existing `NSUserTrackingUsageDescription` permission message in the config', () => {
    expect(
      withUserTrackingPermission(
        {
          slug: 'testSlug',
          name: 'testName',
          ios: {
            infoPlist: {
              NSUserTrackingUsageDescription:
                'This will allow the app to gather app-related data that can be used for tracking you or your device.',
            },
          },
        },
        {
          userTrackingPermission: 'my custom string',
        }
      )
    ).toMatchObject(configWithCustomNSUserTrackingUsageDescription);
  });

  it('setting prop to false does not add NSUserTrackingUsageDescription to config', () => {
    expect(
      withUserTrackingPermission(
        {
          slug: 'testSlug',
          name: 'testName',
        },
        {
          userTrackingPermission: false,
        }
      )
    ).toMatchObject(blankConfig);
  });

  it('setting prop to false removes existing NSUserTrackingUsageDescription', () => {
    expect(
      Object.keys(
        withUserTrackingPermission(
          {
            slug: 'testSlug',
            name: 'testName',
            ios: {
              infoPlist: {
                NSUserTrackingUsageDescription:
                  'This will allow the app to gather app-related data that can be used for tracking you or your device.',
              },
            },
          },
          {
            userTrackingPermission: false,
          }
        ).ios.infoPlist
      )
    ).not.toContain('NSUserTrackingUsageDescription');
  });
});
