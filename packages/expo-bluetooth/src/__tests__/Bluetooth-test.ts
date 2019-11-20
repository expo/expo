it(`throws a controlled error when imported`, () => {
  expect(() => require('../')).toThrow('expo-bluetooth is currently a stub');
});
