'use strict';

export const name = 'Basic2';

export function test(t) {
  t.describe('Basic2', () => {
    t.it('2 + 2 is 4?', () => {
      t.expect(2 + 2).toBe(4);
    });

    t.it('2 + 3 is 4?', () => {
      t.expect(2 + 3).toBe(4);
    });
  });
}
