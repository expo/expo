import { ExpoCrypto, encodeBase64NoWrap } from 'expo-new-app-auth/build/ExpoCrypto';

export const name = 'AppAuth.ExpoCrypto';

export async function test({ describe, it, expect, jasmine }) {
  describe('encodeBase64NoWrap', () => {
    // From https://github.com/dankogai/js-base64/blob/master/test/atob.js
    it('d', () => expect(encodeBase64NoWrap('d')).toBe('ZA=='));
    it('da', () => expect(encodeBase64NoWrap('da')).toBe('ZGE='));
    it('dan', () => expect(encodeBase64NoWrap('dan')).toBe('ZGFu'));
  });

  // Based on the AppAuth-JS tests to ensure the same results are created using unimodules.
  describe('ExpoCrypto', () => {
    const CODE = new Array(6).join('challenge');
    const EXPECTED_BASE64 = 'MYdqq2Vt_ZLMAWpXXsjGIrlxrCF2e4ZP4SxDf7cm_tg';
    const crypto = new ExpoCrypto();

    it(`creates the expected challenge for a valid code`, async () => {
      const code = await crypto.generateRandom(43);
      const challenge = await crypto.deriveChallenge(code);
      expect(challenge).toBeTruthy();
      // No `==` in the base64 encoded result.
      expect(challenge.indexOf('=') < 0);
    });

    it(`generateRandom produces different values`, async () => {
      const code1 = crypto.generateRandom(10);
      const code2 = crypto.generateRandom(10);
      const result = await Promise.all([code1, code2]);
      expect(result[0]).not.toEqual(result[1]);
    });

    it(`produces the right base64 encoded challenge`, async () => {
      const challenge = await crypto.deriveChallenge(CODE);
      expect(challenge).toEqual(EXPECTED_BASE64);
    });
  });
}
