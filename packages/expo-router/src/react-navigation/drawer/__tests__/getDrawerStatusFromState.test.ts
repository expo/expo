import { DrawerRouter } from '../../routers';
import { getDrawerStatusFromState } from '../utils/getDrawerStatusFromState';

const state = DrawerRouter({}).getInitialState({
  routeNames: ['index'],
  routeParamList: {},
  routeGetIdList: {},
});

it('uses closed by default when history has no drawer entry', () => {
  expect(getDrawerStatusFromState(state)).toBe('closed');
});

it('uses the provided default status when history has no drawer entry', () => {
  expect(getDrawerStatusFromState(state, 'open')).toBe('open');
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
