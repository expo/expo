describe('structuredClone', () => {
  it(`uses the Expo built-in APIs`, () => {
    expect((structuredClone as any)[Symbol.for('expo.builtin')]).toBe(true);
  });

  it(`clones primitives`, () => {
    const obj = {
      a: 1,
      b: 'string',
      c: [1, 2, 3],
      d: { nested: true },
      e: new Date(),
      f: /regex/,
      g: new Map([['key', 'value']]),
      h: new Set([1, 2, 3]),
    };

    const cloned = structuredClone(obj);

    expect(cloned).toEqual(obj);
    expect(cloned).not.toBe(obj); // Ensure it's a deep clone
    expect(cloned.e).toBeInstanceOf(Date);
    expect(cloned.f).toBeInstanceOf(RegExp);
    expect(cloned.g).toBeInstanceOf(Map);
    expect(cloned.h).toBeInstanceOf(Set);
  });
});
