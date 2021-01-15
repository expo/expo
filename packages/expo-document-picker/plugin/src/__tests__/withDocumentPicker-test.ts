import withDocumentPicker from '../withDocumentPicker';

describe(withDocumentPicker, () => {
  it(`asserts bundle id`, () => {
    expect(() =>
      withDocumentPicker(
        { name: 'hey', slug: 'hey' },
        // @ts-ignore
        {}
      )
    ).toThrow('ios.bundleIdentifier');
  });
  it(`asserts apple team id`, () => {
    expect(() =>
      withDocumentPicker(
        { name: 'hey', slug: 'hey', ios: { bundleIdentifier: 'foo' } },
        // @ts-ignore
        {}
      )
    ).toThrow('appleTeamId');
  });
});
