import * as units from '../units';

describe(`px`, () => {
  it(`returns the same value`, () => {
    expect(units.px(56)).toBe(56);
  });
});

const unexpectedTypes: any[] = ['56', false, null, undefined, [], {}, function() {}];

describe(`type-safe`, () => {
  for (const key of Object.keys(units)) {
    describe(key, () => {
      const unitMethod = units[key];
      for (const element of unexpectedTypes) {
        it(`throws on unexpected type ${typeof element}`, () => {
          expect(() => unitMethod(element)).toThrow(`${key} expected`);
        });
      }
    });
  }
});
