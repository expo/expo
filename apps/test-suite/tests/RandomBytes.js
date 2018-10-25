import { NativeModules } from 'react-native';

const { RNRandomBytes } = NativeModules;

export const name = 'RNRandomBytes';

function randomBytes(length) {
  return new Promise((res, rej) => {
    RNRandomBytes.randomBytes(length, function(err, base64String) {
      if (err) {
        rej(err);
      } else {
        res(base64String);
      }
    });
  });
}
export function test({ describe, it, expect }) {
  describe(`${name}`, () => {
    it('expect seed to be valid', async () => {
      expect(RNRandomBytes.seed).toBeDefined();
    });

    it('expect reandom bytes to be valid', async () => {
      const bytes = await randomBytes(5);
      expect(bytes).toBeDefined();

      const otherBytes = await randomBytes(10);
      expect(otherBytes).toBeDefined();
      expect(otherBytes.length).toBeGreaterThan(bytes.length);
    });
  });
}
