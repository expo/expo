import type { DrawerNavigationState, ParamListBase } from '../../routers';
import { getDrawerStatusFromState } from '../utils/getDrawerStatusFromState';

const state: DrawerNavigationState<ParamListBase> = {
  stale: false,
  routeKeySeq: 0,
  key: 'drawer',
  index: 0,
  routeNames: ['index'],
  routes: [{ key: 'index', name: 'index' }],
};

it.each(['closed', 'open'] as const)(
  'uses the provided default status %s when history has no drawer entry',
  (defaultStatus) => {
    expect(getDrawerStatusFromState(state, defaultStatus)).toBe(defaultStatus);
  }
);

it('ignores non-drawer history entries', () => {
  expect(
    getDrawerStatusFromState(
      {
        ...state,
        history: [
          { type: 'drawer', status: 'open' },
          { type: 'route', key: 'index' },
        ],
      },
      'closed'
    )
  ).toBe('open');
});

it('uses the last drawer status from history instead of the provided default', () => {
  expect(
    getDrawerStatusFromState(
      {
        ...state,
        history: [
          { type: 'drawer', status: 'open' },
          { type: 'drawer', status: 'closed' },
        ],
      },
      'open'
    )
  ).toBe('closed');
});

it('uses the provided default status when history is absent', () => {
  expect(getDrawerStatusFromState({ ...state, history: undefined }, 'open')).toBe('open');
});
