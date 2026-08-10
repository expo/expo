import { expect, test } from '@jest/globals';

import type { DrawerNavigationState, DrawerStatus, ParamListBase } from '../../native';
import { getDrawerStatusFromState } from '../utils/getDrawerStatusFromState';

const createState = (
  history: DrawerNavigationState<ParamListBase>['history'],
  defaultStatus: DrawerStatus = 'closed'
): DrawerNavigationState<ParamListBase> => ({
  stale: false,
  type: 'drawer',
  key: 'drawer-test',
  index: 0,
  routeNames: ['bar'],
  routes: [{ key: 'bar', name: 'bar' }],
  default: defaultStatus,
  history,
});

test.each<{ defaultStatus: DrawerStatus }>([
  { defaultStatus: 'closed' },
  { defaultStatus: 'open' },
])('falls back to defaultStatus: $defaultStatus without history', ({ defaultStatus }) => {
  expect(getDrawerStatusFromState(createState(undefined, defaultStatus))).toBe(defaultStatus);
});

test('reads the status from the last drawer entry', () => {
  expect(
    getDrawerStatusFromState(
      createState([
        { type: 'route', key: 'bar' },
        { type: 'drawer', status: 'open' },
      ])
    )
  ).toBe('open');
});

test('falls back to defaultStatus when history has no drawer entry', () => {
  expect(getDrawerStatusFromState(createState([{ type: 'route', key: 'bar' }], 'open'))).toBe(
    'open'
  );
});
