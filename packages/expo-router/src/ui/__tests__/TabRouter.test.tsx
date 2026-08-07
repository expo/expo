import type { RouterConfigOptions } from '../../react-navigation/native';
import { ExpoTabRouter } from '../TabRouter';

jest.mock('nanoid/non-secure', () => ({ nanoid: jest.fn(() => 'test') }));

test('retains pure navigator params support from the tab router', () => {
  const router = ExpoTabRouter({ triggerMap: {} });
  const options: RouterConfigOptions = {
    routeNames: ['index', 'second'],
    routeParamList: {},
    routeGetIdList: {},
  };

  const result = router.getStateForNavigatorParams!(
    { key: 'tab', routes: [{ key: 'index', name: 'index' }] },
    { screen: 'second', routeKey: 'second-key' },
    options
  );

  expect(result).toMatchObject({
    index: 1,
    routes: [
      { key: 'index', name: 'index' },
      { key: 'second-key', name: 'second' },
    ],
  });
});
