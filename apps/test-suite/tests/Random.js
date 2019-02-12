import { Random } from 'expo';

export const name = 'Random';

export async function test(t) {
  t.describe('Random', async () => {
    t.it('getRandomIntegerAsync()', async () => {
      const length = 3;
      const bytes = await Random.getRandomIntegerAsync(length);
      console.log({ bytes });
      t.expect(bytes instanceof Uint8Array).toBeTruthy();
      t.expect(bytes.length).toBe(length);
      const moreBytes = await Random.getRandomIntegerAsync(length);
      t.expect(moreBytes[0]).not.toBe(bytes[0]);
    });
  });
}
