import { set, get, pickBy } from '../obj';

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

describe(pickBy, () => {
  it(`picks`, () => {
    expect(pickBy({ a: { b: { c: 'd' } } }, (_, key) => key.startsWith('a'))).toEqual({
      a: { b: { c: 'd' } },
    });
  });
  it(`ignores`, () => {
    expect(pickBy({ a: { b: { c: 'd' } } }, (_, key) => !key.startsWith('a'))).toEqual({});
  });
});
