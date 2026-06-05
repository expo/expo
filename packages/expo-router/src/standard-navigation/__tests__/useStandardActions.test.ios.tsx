import { act, renderHook } from '@testing-library/react-native';
import { Fragment } from 'react';
import { View } from 'react-native';
import { type NavigatorArgs } from 'standard-navigation';

import type { ParamListBase } from '../../react-navigation/core';
import {
  TabRouter,
  type TabNavigationState,
  type TabRouterOptions,
} from '../../react-navigation/routers';
import { renderRouter } from '../../testing-library';
import { unstable_createStandardRouterNavigator } from '../index';
import { useStandardActions } from '../useStandardActions';

type Navigation = Parameters<typeof useStandardActions>[0];

// --- Unit: useStandardActions in isolation against a mock dispatch ---
describe('useStandardActions (unit)', () => {
  it('back() dispatches GO_BACK targeting the current navigator', () => {
    const dispatch = jest.fn();
    const { result } = renderHook(() => useStandardActions({ dispatch }, 'tab-key'));

    result.current.back();

    expect(dispatch).toHaveBeenCalledWith({ type: 'GO_BACK', target: 'tab-key' });
  });

  it('navigate(name) dispatches NAVIGATE with undefined params targeting the current navigator', () => {
    const dispatch = jest.fn();
    const { result } = renderHook(() => useStandardActions({ dispatch }, 'tab-key'));

    result.current.navigate('home');

    expect(dispatch).toHaveBeenCalledWith({
      type: 'NAVIGATE',
      payload: { name: 'home', params: undefined },
      target: 'tab-key',
    });
  });

  it('navigate(name, params) dispatches NAVIGATE with params targeting the current navigator', () => {
    const dispatch = jest.fn();
    const { result } = renderHook(() => useStandardActions({ dispatch }, 'tab-key'));

    result.current.navigate('home', { id: '1' });

    expect(dispatch).toHaveBeenCalledWith({
      type: 'NAVIGATE',
      payload: { name: 'home', params: { id: '1' } },
      target: 'tab-key',
    });
  });

  it('returns a stable reference while navigation and target are unchanged', () => {
    const navigation: Navigation = { dispatch: jest.fn() };
    const { result, rerender } = renderHook(() => useStandardActions(navigation, 'tab-key'));
    const first = result.current;

    rerender({});

    expect(result.current).toBe(first);
  });

  it('returns a new reference when navigation changes', () => {
    const { result, rerender } = renderHook(
      ({ navigation }: { navigation: Navigation }) => useStandardActions(navigation, 'tab-key'),
      { initialProps: { navigation: { dispatch: jest.fn() } } }
    );
    const first = result.current;

    rerender({ navigation: { dispatch: jest.fn() } });

    expect(result.current).not.toBe(first);
  });

  it('returns a new reference when the target changes', () => {
    const navigation: Navigation = { dispatch: jest.fn() };
    const { result, rerender } = renderHook(
      ({ target }: { target: string }) => useStandardActions(navigation, target),
      { initialProps: { target: 'tab-key' } }
    );
    const first = result.current;

    rerender({ target: 'other-key' });

    expect(result.current).not.toBe(first);
  });
});

// --- Integration: actions drive a real navigator through renderRouter ---
describe('useStandardActions (integration)', () => {
  const contentSpy = jest.fn();
  function NavigatorContent(args: NavigatorArgs<Record<string, never>, Record<string, never>>) {
    contentSpy(args);
    return (
      <>
        {args.state.routes.map((route) => (
          <Fragment key={route.key}>{args.descriptors[route.key]!.render()}</Fragment>
        ))}
      </>
    );
  }
  const StandardTabs = unstable_createStandardRouterNavigator<
    Record<string, never>,
    TabNavigationState<ParamListBase>,
    Record<string, never>,
    object,
    TabRouterOptions
  >(NavigatorContent, TabRouter, { useOnlyUserDefinedScreens: true });

  it('navigate() switches the focused route in a real navigator', () => {
    renderRouter({
      _layout: () => (
        <StandardTabs>
          <StandardTabs.Screen name="index" />
          <StandardTabs.Screen name="second" />
        </StandardTabs>
      ),
      index: () => <View testID="index" />,
      second: () => <View testID="second" />,
    });
    const lastArgs = () =>
      contentSpy.mock.calls.at(-1)![0] as NavigatorArgs<
        Record<string, never>,
        Record<string, never>
      >;

    act(() => lastArgs().actions.navigate('second'));

    expect(lastArgs().state.routes[lastArgs().state.index]!.name).toBe('second');
  });
});
