import { Crypto } from 'expo';

export const name = 'Crypto';

export async function test(t) {
  t.it(`digests string`, async () => {
    Crypto.digestStringAsync();
  });
}
