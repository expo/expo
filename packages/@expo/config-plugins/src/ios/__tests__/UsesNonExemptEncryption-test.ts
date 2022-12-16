import { getUsesNonExemptEncryption, setUsesNonExemptEncryption } from '../UsesNonExemptEncryption';

describe('uses non exempt encryption', () => {
  it(`returns null if key not specified`, () => {
    expect(getUsesNonExemptEncryption({})).toBe(null);
  });

  it(`returns the value if given`, () => {
    expect(
      getUsesNonExemptEncryption({ ios: { config: { usesNonExemptEncryption: false } } })
    ).toBe(false);

    expect(getUsesNonExemptEncryption({ ios: { config: { usesNonExemptEncryption: true } } })).toBe(
      true
    );
  });

  it(`sets ITSAppUsesNonExemptEncryption the key is given`, () => {
    expect(
      setUsesNonExemptEncryption({ ios: { config: { usesNonExemptEncryption: false } } }, {})
    ).toMatchObject({
      ITSAppUsesNonExemptEncryption: false,
    });
  });

  it(`makes no changes to the infoPlist no config is provided`, () => {
    expect(setUsesNonExemptEncryption({}, {})).toMatchObject({});
  });
});
