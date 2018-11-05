'use strict';

export const name = 'Basic1';

export function test(t) {
  t.describe('Basic1', () => {
    t.it('waits 0.5 seconds and passes', async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      t.expect(true).toBe(true);
    });

    t.it('waits 1 second and fails', async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      t.expect(true).toBe(false);
    });
  });
}
