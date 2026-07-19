import crypto from '../index';

test(`defines getRandomValues`, () => {
  expect(crypto.getRandomValues).toBeDefined();
});
