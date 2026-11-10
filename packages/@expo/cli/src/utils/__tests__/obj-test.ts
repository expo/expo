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
  it(`does not pollute the object prototype`, () => {
    set({}, '__proto__.polluted', 'yes');
    set({}, 'constructor.prototype.polluted', 'yes');
    expect(({} as any).polluted).toBeUndefined();
  });
});
describe(get, () => {
  it(`gets deeply`, () => {
    expect(get({ a: { b: { c: 'd' } } }, 'a.b.c')).toEqual('d');
  });
  it(`returns null`, () => {
    expect(get({ a: { b: { c: 'd' } } }, 'a.b.d')).toEqual(null);
  });
  it(`returns null when a section on the path is null or undefined`, () => {
    expect(get({ splash: null }, 'splash.image')).toEqual(null);
    expect(get({ splash: undefined }, 'splash.image')).toEqual(null);
    expect(
      get({ android: { adaptiveIcon: null } }, 'android.adaptiveIcon.foregroundImage')
    ).toEqual(null);
  });
  it(`returns null when a section on the path is a primitive`, () => {
    expect(get({ ios: 'oops' }, 'ios.bundleIdentifier')).toEqual(null);
    expect(get({ a: 1 }, 'a.b')).toEqual(null);
  });
  it(`still returns a falsy value that is set`, () => {
    expect(get({ a: { b: 0 } }, 'a.b')).toEqual(0);
    expect(get({ a: { b: '' } }, 'a.b')).toEqual('');
    expect(get({ a: { b: null } }, 'a.b')).toEqual(null);
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
