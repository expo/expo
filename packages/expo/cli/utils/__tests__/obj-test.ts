import { set, get } from '../obj';

describe(set, () => {
  it(`sets deeply`, () => {
    expect(set({}, 'a.b.c', 'd')).toEqual({ a: { b: { c: 'd' } } });
  });
  it(`overwrites`, () => {
    expect(set({ a: { b: { c: 'e' } } }, 'a.b.c', 'd')).toEqual({ a: { b: { c: 'd' } } });
  });
  it(`shallow writes`, () => {
    expect(set({}, 'a', 'd')).toEqual({ a: 'd' });
  });
});
describe(get, () => {
  it(`gets deeply`, () => {
    expect(get({ a: { b: { c: 'd' } } }, 'a.b.c')).toEqual('d');
  });
  it(`returns null`, () => {
    expect(get({ a: { b: { c: 'd' } } }, 'a.b.d')).toEqual(null);
  });
});
