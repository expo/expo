export const name = 'JSC';

export function test(t) {
  t.describe('JSC', () => {
    t.it('defines the Symbol global variable and symbol primitive', () => {
      t.expect(Symbol).toBeDefined();
      const test = Symbol('test');
      t.expect(typeof test).toEqual('symbol');
    });
    t.it('does not use intl variant', () => {
      const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      const date = new Date();
      const he = date.toLocaleDateString('he', opts);
      const us = date.toLocaleDateString('en-US', opts);
      t.expect(he).toEqual(us);
    });
  });
}
