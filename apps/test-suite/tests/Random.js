import { Random } from 'expo';

export const name = 'Random';

export async function test({ describe, it, expect }) {
  describe('Random', async () => {
    it('getRandomIntegerAsync()', async () => {
      const length = 3;
      const bytes = await Random.getRandomBytesAsync(length);
      console.log({ bytes });
      expect(bytes instanceof Uint8Array).toBe(true);
      expect(bytes.length).toBe(length);
      const moreBytes = await Random.getRandomBytesAsync(length);
      expect(moreBytes[0]).not.toBe(bytes[0]);
    });
  });
}
