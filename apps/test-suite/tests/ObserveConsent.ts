import { File, Paths } from 'expo-file-system';
import { Observe } from 'expo-observe';

import type { JasmineInterface } from '../types';

export const name = 'ObserveConsent';

export function test({ describe, expect, it }: JasmineInterface) {
  describe('Observe.setConsent', () => {
    it('persists the last choice when grant and revoke are called back-to-back', async () => {
      const choice = new File(Paths.document, 'ExpoAppMetrics', 'observe-consent');
      const original = choice.exists ? choice.bytesSync() : null;
      try {
        await Observe.setConsent('granted');
        expect(choice.textSync()).toBe('granted');

        for (let pair = 1; pair <= 1000; pair++) {
          const grant = Observe.setConsent('granted');
          const revoke = Observe.setConsent('not-granted');
          const results = await Promise.allSettled([grant, revoke]);
          expect(results.filter((result) => result.status === 'rejected'))
            .withContext(`pair ${pair}`)
            .toEqual([]);
          expect(choice.textSync()).withContext(`pair ${pair}`).toBe('not-granted');
        }
      } finally {
        if (original !== null) {
          choice.write(original);
        } else if (choice.exists) {
          choice.delete();
        }
      }
    }, 60_000);
  });
}
