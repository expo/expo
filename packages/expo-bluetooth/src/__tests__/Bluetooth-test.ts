

it(`throws a controlled error when imported`, () => {
  expect(require('../')).toThrow();  
})