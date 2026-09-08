import {
  INTERNAL_EXPO_ROUTER_PREVIEW_ID_PARAM_NAME,
  INTERNAL_EXPO_ROUTER_NO_ANIMATION_PARAM_NAME,
} from '../../../navigationParams';
import type { NavigationState } from '../../../react-navigation/native';
import { findPreviewActivationPath } from '../utils';

const previewId = 'preview';
const previewParams = {
  item: 'two',
  [INTERNAL_EXPO_ROUTER_PREVIEW_ID_PARAM_NAME]: previewId,
  [INTERNAL_EXPO_ROUTER_NO_ANIMATION_PARAM_NAME]: true,
};

function stackState(): NavigationState {
  return {
    stale: false,
    routeKeySeq: 0,
    key: 'root-stack',
    index: 0,
    routeNames: ['index', 'details'],
    routes: [
      { key: 'index-key', name: 'index' },
      { key: 'details-key', name: 'details', params: previewParams },
    ],
  };
}

function tabsState(): NavigationState {
  return {
    stale: false,
    routeKeySeq: 0,
    key: 'root-stack',
    index: 0,
    routeNames: ['__root'],
    routes: [
      {
        key: 'root-key',
        name: '__root',
        state: {
          stale: false,
          routeKeySeq: 0,
          key: 'root-tabs',
          index: 0,
          routeNames: ['home', 'settings'],
          routes: [
            { key: 'home-key', name: 'home' },
            {
              key: 'settings-key',
              name: 'settings',
              state: {
                stale: false,
                routeKeySeq: 0,
                key: 'settings-stack',
                index: 0,
                routeNames: ['index', 'details'],
                routes: [
                  { key: 'settings-index-key', name: 'index' },
                  { key: 'details-key', name: 'details', params: previewParams },
                ],
              },
            },
          ],
        },
      },
    ],
  };
}

it('returns the ancestor path to a preloaded route in the focused stack', () => {
  expect(findPreviewActivationPath(stackState(), 'details-key', previewId)).toEqual([
    { key: 'details-key', name: 'details' },
  ]);
});

it('returns the ancestor path to a preloaded route in another tab', () => {
  expect(findPreviewActivationPath(tabsState(), 'details-key', previewId)).toEqual([
    { key: 'root-key', name: '__root' },
    { key: 'settings-key', name: 'settings' },
    { key: 'details-key', name: 'details' },
  ]);
});

it('returns undefined when the preview id does not match', () => {
  expect(findPreviewActivationPath(stackState(), 'details-key', 'other')).toBeUndefined();
});

it('returns undefined when a focused sibling has the same public route', () => {
  const state = stackState();
  state.routes[0] = {
    key: 'details-focused-key',
    name: 'details',
    params: { item: 'two' },
  };

  expect(findPreviewActivationPath(state, 'details-key', previewId)).toBeUndefined();
});

it('returns the preloaded route when a focused sibling has different public params', () => {
  const state = stackState();
  state.routes[0] = {
    key: 'details-focused-key',
    name: 'details',
    params: { item: 'one' },
  };

  expect(findPreviewActivationPath(state, 'details-key', previewId)).toEqual([
    { key: 'details-key', name: 'details' },
  ]);
});

it('returns undefined when the route key is absent', () => {
  expect(findPreviewActivationPath(tabsState(), 'missing', previewId)).toBeUndefined();
});
