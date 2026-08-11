import { DrawerRouter } from '../../routers';
import { getDrawerStatusFromState } from '../utils/getDrawerStatusFromState';

const state = DrawerRouter({}).getInitialState({
  routeNames: ['index'],
  routeParamList: {},
  routeGetIdList: {},
});

const openState = DrawerRouter({ defaultStatus: 'open' }).getInitialState({
  routeNames: ['index'],
  routeParamList: {},
  routeGetIdList: {},
});

it.each(['closed', 'open'] as const)(
  'uses the provided default status %s when history has no drawer entry',
  (defaultStatus) => {
    expect(getDrawerStatusFromState(state, defaultStatus)).toBe(defaultStatus);
  }
);

it('reports open for a router with defaultStatus open and no drawer entry', () => {
  expect(getDrawerStatusFromState(openState, 'open')).toBe('open');
});

it('reports closed for a router with defaultStatus open after the drawer is closed', () => {
  expect(
    getDrawerStatusFromState(
      {
        ...openState,
        history: [...(openState.history ?? []), { type: 'drawer', status: 'closed' }],
      },
      'open'
    )
  ).toBe('closed');
});

it('uses the last drawer status from history instead of the provided default', () => {
  expect(
    getDrawerStatusFromState(
      {
        ...state,
        history: [
          ...(state.history ?? []),
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
