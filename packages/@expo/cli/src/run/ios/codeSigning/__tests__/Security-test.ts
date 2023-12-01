import spawnAsync from '@expo/spawn-async';

import { CommandError } from '../../../../utils/errors';
import {
  extractCodeSigningInfo,
  extractSigningId,
  findIdentitiesAsync,
  getSecurityPemAsync,
} from '../Security';

jest.mock('../../../../start/doctor/SecurityBinPrerequisite', () => ({
  SecurityBinPrerequisite: {
    instance: {
      assertAsync: jest.fn(),
    },
  },
}));

describe(getSecurityPemAsync, () => {
  it(`asserts that the pem could not be found`, async () => {
    jest.mocked(spawnAsync).mockResolvedValueOnce({
      stdout: '',
    } as any);

    await expect(getSecurityPemAsync('1234')).rejects.toThrow(CommandError);
  });
});

describe(findIdentitiesAsync, () => {
  it(`return identities`, async () => {
    jest.mocked(spawnAsync).mockResolvedValueOnce({
      stdout: [
        'Returns a string like:',
        '1) 12222234253761286351826735HGKDHAJGF45283 "Apple Development: Evan Bacon (AA00AABB0A)" (CSSMERR_TP_CERT_REVOKED)',
        '2) 12312234253761286351826735HGKDHAJGF45283 "Apple Development: bacon@expo.io (BB00AABB0A)"',
        // Duplicate
        '3) 12312234253761286351826735HGKDHAJGF45283 "Apple Development: bacon@expo.io (BB00AABB0A)"',
        '4) 12312234253761286351826735HGKDHAJGF452XX "Apple Developer: bacon@expo.dev (CD00AABB0A)"',
        '5) 12442234253761286351826735HGKDHAJGF45283 "iPhone Distribution: Evan Bacon (CC00AABB0B)" (CSSMERR_TP_CERT_REVOKED)',
        '6) 12442234253761286351826735HGKDHAJGF45283 "iPhone Distribution: Evan Bacon (CC00AABB0B)" (CSSMERR_TP_CERT_REVOKED)',
        '7) 15672234253761286351826735HGKDHAJGF45283 "Apple Development: Evan Bacon (AA00AABB0A)"',
        ' 6 valid identities found',
      ].join('\n'),
    } as any);

    await expect(findIdentitiesAsync()).resolves.toEqual([
      'Apple Development: bacon@expo.io (BB00AABB0A)',
      'Apple Developer: bacon@expo.dev (CD00AABB0A)',
      'Apple Development: Evan Bacon (AA00AABB0A)',
    ]);
  });
});

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
