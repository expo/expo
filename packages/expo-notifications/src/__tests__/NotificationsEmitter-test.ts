import { removeNotificationSubscription } from '../NotificationsEmitter';

it('removeNotificationSubscription', () => {
  // @ts-expect-error: passing `undefined` instead of a `EventSubscription`
  expect(() => removeNotificationSubscription()).toThrow(
    'removeNotificationSubscription: Provided value is not a subscription: undefined'
  );
  const subscription = {
    remove: jest.fn(),
  };
  removeNotificationSubscription(subscription);
  expect(subscription.remove).toHaveBeenCalled();
});
