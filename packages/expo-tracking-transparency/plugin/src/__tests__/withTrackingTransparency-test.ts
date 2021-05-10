import {
  withUserTrackingPermission,
  DEFAULT_NSUserTrackingUsageDescription,
} from '../withTrackingTransparency';

const blankConfig = {
  slug: 'testSlug',
  name: 'testName',
};

const configWithDefaultNSUserTrackingUsageDescription = {
  slug: 'testSlug',
  name: 'testName',
  ios: {
    infoPlist: {
      NSUserTrackingUsageDescription: DEFAULT_NSUserTrackingUsageDescription,
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
            NSUserTrackingUsageDescription: DEFAULT_NSUserTrackingUsageDescription,
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
              NSUserTrackingUsageDescription: DEFAULT_NSUserTrackingUsageDescription,
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
                NSUserTrackingUsageDescription: DEFAULT_NSUserTrackingUsageDescription,
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
