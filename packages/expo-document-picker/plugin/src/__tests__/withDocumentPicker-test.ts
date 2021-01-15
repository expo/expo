import withDocumentPicker from '../withDocumentPicker';

describe(withDocumentPicker, () => {
  beforeEach(() => {
    delete process.env.EXPO_APPLE_TEAM_ID;
  });
  it(`asserts bundle id`, () => {
    expect(() => withDocumentPicker({ name: 'hey', slug: 'hey' })).toThrow('ios.bundleIdentifier');
  });
  it(`asserts apple team id`, () => {
    expect(() =>
      withDocumentPicker({ name: 'hey', slug: 'hey', ios: { bundleIdentifier: 'foo' } })
    ).toThrow('EXPO_APPLE_TEAM_ID');
  });
  it(`works when the props are all defined`, () => {
    process.env.EXPO_APPLE_TEAM_ID = 'FOOBAR';
    withDocumentPicker({ name: 'hey', slug: 'hey', ios: { bundleIdentifier: 'foo' } });
  });
});
