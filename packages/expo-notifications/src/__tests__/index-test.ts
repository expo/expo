import * as Notifications from '..';

it(`includes IosAuthorizationStatus export`, () => {
  expect(Notifications.IosAuthorizationStatus).toBeDefined();
});

it('Notifications exports', () => {
  // this is not a comprehensive test of the exports, it's more about tracking changes
  expect(Notifications).toMatchSnapshot();
});
