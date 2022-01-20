import UserSettings from '../UserSettings';

describe(UserSettings.getDirectory, () => {
  beforeEach(() => {
    delete process.env.__UNSAFE_EXPO_HOME_DIRECTORY;
    delete process.env.EXPO_STAGING;
    delete process.env.EXPO_LOCAL;
  });

  it(`gets the default state directory`, () => {
    expect(UserSettings.getDirectory()).toBe('/home/.expo');
  });
  it(`gets the staging state directory`, () => {
    process.env.EXPO_STAGING = 'true';
    expect(UserSettings.getDirectory()).toBe('/home/.expo-staging');
  });
  it(`gets the local state directory`, () => {
    process.env.EXPO_LOCAL = 'true';
    expect(UserSettings.getDirectory()).toBe('/home/.expo-local');
  });
  it(`gets the custom state directory`, () => {
    process.env.__UNSAFE_EXPO_HOME_DIRECTORY = '/foobar/yolo';
    expect(UserSettings.getDirectory()).toBe('/foobar/yolo');
  });
});
