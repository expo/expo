export const name = 'JSC';

export function canRunAsync({ isAutomated, OS }) {
  return OS === 'android';
}

export function test({ describe, afterEach, it, expect, jasmine, ...t }) {
  it('defines the Symbol global variable and symbol primitive', () => {
    expect(Symbol).toBeDefined();
    const test = Symbol('test');
    expect(typeof test).toEqual('symbol');
  });
  it('does not use intl variant', () => {
    const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const date = new Date();
    const he = date.toLocaleDateString('he', opts);
    const us = date.toLocaleDateString('en-US', opts);
    expect(he).toEqual(us);
  });
}
