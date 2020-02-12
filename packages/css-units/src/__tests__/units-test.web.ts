import * as units from '../units';

for (const key of Object.keys(units)) {
  const unitMethod = units[key];
  if (key !== 'px')
    it(`returns a string value matching the method name ${key}`, () => {
      expect(unitMethod(1)).toBe(`${1}${key}`);
    });
}
