'use strict';

export const name = 'Basic';

export function test({ describe, it, expect }) {
  describe(name, () => {
    it('waits 0.5 seconds and passes', async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      expect(true).toBe(true);
    });
    it('2 + 2 is 4?', () => {
      expect(2 + 2).toBe(4);
    });
  });
}
