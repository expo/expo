import * as Random from 'expo-random';

export const name = 'Random';

export async function test({ describe, it, expect }) {
  describe('Random', async () => {
    it('getRandomBytesAsync()', async () => {
      const length = 4;
      const bytes = await Random.getRandomBytesAsync(length);
      expect(bytes instanceof Uint8Array).toBe(true);
      expect(bytes.length).toBe(length);

      // Verify with high likelihood that we get different values each time
      const moreBytes = await Random.getRandomBytesAsync(length);
      expect([...moreBytes]).not.toEqual([...bytes]);
    });
  });
}
