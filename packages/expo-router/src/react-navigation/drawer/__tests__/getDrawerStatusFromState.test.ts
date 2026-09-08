import { expect, it } from '@jest/globals';

import type { DrawerNavigationState, ParamListBase } from '../../native';
import { getDrawerStatusFromState } from '../utils/getDrawerStatusFromState';

const state = {
  stale: false,
  type: 'drawer',
  key: 'drawer',
  routeKeySeq: 0,
  routeNames: ['one'],
  routes: [{ name: 'one', key: 'one-key' }],
  index: 0,
} satisfies DrawerNavigationState<ParamListBase>;

it('returns the explicit drawer status', () => {
  expect(getDrawerStatusFromState({ ...state, drawerStatus: 'open' }, 'closed')).toBe('open');
  expect(getDrawerStatusFromState({ ...state, drawerStatus: 'closed' }, 'open')).toBe('closed');
});

it('returns the configured default when drawerStatus is absent', () => {
  expect(getDrawerStatusFromState(state, 'closed')).toBe('closed');
  expect(getDrawerStatusFromState(state, 'open')).toBe('open');
});

it('does not derive status from full route history', () => {
  expect(
    getDrawerStatusFromState({ ...state, history: [{ type: 'route', key: 'one-key' }] }, 'closed')
  ).toBe('closed');
});
