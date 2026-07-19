import { AuthError } from '../Errors';

// Test case: Uber throws this error without a message
// ensure that we append the proper message.
it(`adds a message to invalid_scope`, () => {
  const error = new AuthError({ error: 'invalid_scope' });
  expect(error.message).toMatch(/The requested scope is invalid/);
  expect(error.description).toMatch(/The requested scope is invalid/);
});
