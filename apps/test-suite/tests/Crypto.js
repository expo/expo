import { Crypto } from 'expo';

export const name = 'Crypto';

export async function test({ describe, it, expect }) {
  describe('Crypto', async () => {
    describe('digestStringAsync()', async () => {
      for (const entry of Object.entries(Crypto.Algorithm)) {
        const [key, algorithm] = entry;
        it(`Crypto.Hash.${key}`, async () => {
          const value = await Crypto.digestStringAsync(algorithm, 'Expo');
          console.log({ value });
          // const length = 3;
          // const bytes = await Random.getRandomBytesAsync(length);
          // expect(bytes instanceof Uint8Array).toBe(true);
          // expect(bytes.length).toBe(length);
          // const moreBytes = await Random.getRandomBytesAsync(length);
          // expect(moreBytes[0]).not.toBe(bytes[0]);
        });
      }
    });
  });
}
