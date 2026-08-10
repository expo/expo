import {
  appendInternalExpoRouterParams,
  getInternalExpoRouterParams,
  hasParam,
  removeInternalExpoRouterParams,
  removeParams,
  type InternalExpoRouterParamName,
} from '../navigationParams';

const NO_ANIMATION = '__internal_expo_router_no_animation' as InternalExpoRouterParamName;
const IS_PREVIEW = '__internal__expo_router_is_preview_navigation' as InternalExpoRouterParamName;

it('appends internal params only at the current level', () => {
  expect(
    appendInternalExpoRouterParams(
      { screen: 'ordinary', params: { value: 'ordinary' } },
      { [IS_PREVIEW]: true }
    )
  ).toEqual({
    screen: 'ordinary',
    params: { value: 'ordinary' },
    [IS_PREVIEW]: true,
  });
});

it('returns undefined when there are no params', () => {
  expect(appendInternalExpoRouterParams(undefined, {})).toBeUndefined();
});

it('reads internal params only from the current level', () => {
  expect(
    getInternalExpoRouterParams({
      [NO_ANIMATION]: true,
      params: { [IS_PREVIEW]: true },
    })
  ).toEqual({ [NO_ANIMATION]: true });
});

it('removes internal params while preserving the ordinary params key', () => {
  expect(
    removeInternalExpoRouterParams({
      screen: 'ordinary',
      params: { [IS_PREVIEW]: true, value: 'ordinary' },
      initial: 'ordinary',
      [NO_ANIMATION]: true,
    })
  ).toEqual({
    screen: 'ordinary',
    params: { [IS_PREVIEW]: true, value: 'ordinary' },
    initial: 'ordinary',
  });
});

it('removes named params only from the current level', () => {
  expect(removeParams({ value: 1, params: { value: 2 } }, ['value'])).toEqual({
    params: { value: 2 },
  });
});

it('checks params only at the current level', () => {
  expect(hasParam({ params: { value: true } }, 'value')).toBe(false);
  expect(hasParam({ value: false }, 'value')).toBe(true);
  expect(hasParam({ value: undefined }, 'value')).toBe(false);
});
