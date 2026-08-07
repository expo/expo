import type { RouterConfigOptions } from '../../react-navigation/native';
import { StackRouter } from '../stack-router';

jest.mock('nanoid/non-secure', () => ({ nanoid: jest.fn(() => 'test') }));

test('projects navigator params from stale state without declared fields', () => {
  const router = StackRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['home', 'details'],
    routeParamList: {},
    routeGetIdList: {},
  };

  expect(
    router.getStateForNavigatorParams!(
      { key: 'stack', routes: [{ key: 'home', name: 'home' }] },
      { screen: 'details', routeKey: 'details-preallocated' },
      options
    )
  ).toMatchObject({
    index: 1,
    routes: [
      { key: 'home', name: 'home' },
      { key: 'details-preallocated', name: 'details' },
    ],
  });
});
