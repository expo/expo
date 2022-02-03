import * as Random from 'expo-random';

export const name = 'Random';

export async function test({ describe, it, expect }) {
  describe('Random', async () => {
    it('gets random bytes asynchronously', async () => {
      const length = 4;
      const bytes = await Random.getRandomBytesAsync(length);

      expect(bytes instanceof Uint8Array).toBe(true);
      expect(bytes.length).toBe(length);
    });

    it('gets random bytes synchronously', () => {
      const length = 12;
      const bytes = Random.getRandomBytes(length);

      expect(bytes instanceof Uint8Array).toBe(true);
      expect(bytes.length).toBe(length);
    });

    // Verify with high likelihood that we get different values each time
    it('is random', () => {
      const length = 8;
      const firstDraw = Random.getRandomBytes(length);
      const secondDraw = Random.getRandomBytes(length);

      expect([...firstDraw]).not.toEqual([...secondDraw]);
    });
  });
}
