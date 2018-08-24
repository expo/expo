import { normalizeTrackingOptions } from '../AnalyticsUtils';

it(`changes usernameOrEmail to email if it's an email`, () => {
  let options = { usernameOrEmail: 'brentvatne@gmail.com' };
  let expectedResult = { email: 'brentvatne@gmail.com' };
  expect(normalizeTrackingOptions(options)).toEqual(expectedResult);
});

it(`changes usernameOrEmail to username if it's not an email`, () => {
  let options = { usernameOrEmail: 'notbrent' };
  let expectedResult = { username: 'notbrent' };
  expect(normalizeTrackingOptions(options)).toEqual(expectedResult);
});

it(`returns null if options is null`, () => {
  expect(normalizeTrackingOptions(null)).toBeNull();
});
