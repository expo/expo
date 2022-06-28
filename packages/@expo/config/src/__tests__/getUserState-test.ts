import { getExpoHomeDirectory } from '../getUserState';

jest.mock('os');
jest.mock('fs');

describe(getExpoHomeDirectory, () => {
  beforeEach(() => {
    delete process.env.__UNSAFE_EXPO_HOME_DIRECTORY;
    delete process.env.EXPO_STAGING;
    delete process.env.EXPO_LOCAL;
  });

  it(`gets the default state directory`, () => {
    expect(getExpoHomeDirectory()).toBe('/home/.expo');
  });
  it(`gets the staging state directory`, () => {
    process.env.EXPO_STAGING = 'true';
    expect(getExpoHomeDirectory()).toBe('/home/.expo-staging');
  });
  it(`gets the local state directory`, () => {
    process.env.EXPO_LOCAL = 'true';
    expect(getExpoHomeDirectory()).toBe('/home/.expo-local');
  });
  it(`gets the custom state directory`, () => {
    process.env.__UNSAFE_EXPO_HOME_DIRECTORY = '/foobar/yolo';
    expect(getExpoHomeDirectory()).toBe('/foobar/yolo');
  });
});
