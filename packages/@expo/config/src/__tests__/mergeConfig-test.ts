import { mergeConfig } from '../mergeConfig';

describe(mergeConfig, () => {
  it('ignores an own __proto__ property when copying the target', () => {
    const target = JSON.parse('{"__proto__":{"injected":true},"safe":true}');

    const result = mergeConfig<Record<string, any>>(target, {});

    expect(result).toEqual({ safe: true });
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
    expect('injected' in result).toBe(false);
  });

  it('ignores an own __proto__ property when replacing a primitive with an object', () => {
    const source = JSON.parse('{"extra":{"setting":{"__proto__":{"injected":true},"safe":true}}}');

    const result = mergeConfig<Record<string, any>>({ extra: { setting: 'abc' } }, source);

    expect(result.extra.setting).toEqual({ safe: true });
    expect(Object.getPrototypeOf(result.extra.setting)).toBe(Object.prototype);
    expect('injected' in result.extra.setting).toBe(false);
  });

  it.each([
    ['abc', { length: 5 }],
    [1, { constructor: 'custom' }],
  ])('replaces primitive %p with object %p without dropping properties', (value, modification) => {
    expect(
      mergeConfig<Record<string, any>>(
        { extra: { setting: value } },
        { extra: { setting: modification } }
      )
    ).toEqual({ extra: { setting: modification } });
  });

  it('treats a property as absent when the target proxy throws from has', () => {
    const target = new Proxy(
      {},
      {
        has() {
          throw new Error('Cannot check property');
        },
      }
    );

    expect(mergeConfig({ extra: target }, { extra: { enabled: true } })).toEqual({
      extra: { enabled: true },
    });
  });

  it('reads the object tag once when checking whether a value can be merged', () => {
    let reads = 0;
    const value = {
      get [Symbol.toStringTag]() {
        reads++;
        return 'Object';
      },
    };

    mergeConfig({}, { extra: value });

    expect(reads).toBe(2);
  });

  it('captures enumerable keys before reading property values', () => {
    const source = Object.defineProperties(
      {},
      {
        first: {
          enumerable: true,
          get() {
            Object.defineProperty(source, 'second', { enumerable: false });
            return 1;
          },
        },
        second: { enumerable: true, configurable: true, value: 2 },
      }
    );

    expect(mergeConfig({}, source)).toEqual({ first: 1, second: 2 });
  });

  it.each([null, undefined])('throws when the source is %p', (source) => {
    expect(() => mergeConfig({}, source as any)).toThrow(TypeError);
  });
});
