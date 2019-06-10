import * as Random from 'expo-random';

export const name = 'Random';

export async function test({ describe, it, expect }) {
  describe('Random', async () => {
    it('getRandomBytesAsync()', async () => {
      const length = 3;
      const bytes = await Random.getRandomBytesAsync(length);
      expect(bytes instanceof Uint8Array).toBe(true);
      expect(bytes.length).toBe(length);
      const moreBytes = await Random.getRandomBytesAsync(length);
      expect(moreBytes[0]).not.toBe(bytes[0]);
    });
  });
}
