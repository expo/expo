import { extractCodeSigningInfo, extractSigningId } from '../Security';

describe(extractCodeSigningInfo, () => {
  it(`extracts`, () => {
    expect(
      extractCodeSigningInfo(
        '  2) 12312234253761286351826735HGKDHAJGF45283 "Apple Development: bacon@expo.io (BB00AABB0A)"'
      )
    ).toBe('Apple Development: bacon@expo.io (BB00AABB0A)');
  });
  it(`does not match lines ending in (CSSMERR_TP_CERT_REVOKED)`, () => {
    expect(
      extractCodeSigningInfo(
        '  3) 12442234253761286351826735HGKDHAJGF45283 "iPhone Distribution: Evan Bacon (CC00AABB0B)" (CSSMERR_TP_CERT_REVOKED)'
      )
    ).toBe(null);
  });
});

describe(extractSigningId, () => {
  it(`extracts`, () => {
    expect(extractSigningId('Apple Development: Evan Bacon (AA00AABB0A)')).toBe('AA00AABB0A');
  });
});
