'use strict';

export const name = 'Basic';

export function test(t) {
  t.describe('Basic', () => {
    t.it('waits 0.5 seconds and passes', async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      t.expect(true).toBe(true);
    });
    t.it('2 + 2 is 4?', () => {
      t.expect(2 + 2).toBe(4);
    });
  });
}
