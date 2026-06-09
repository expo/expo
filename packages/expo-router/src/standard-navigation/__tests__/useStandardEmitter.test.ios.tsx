import { act, renderHook } from '@testing-library/react-native';
import { Fragment } from 'react';
import { View } from 'react-native';
import { type NavigatorArgs } from 'standard-navigation';

import type { EventEmitter, ParamListBase } from '../../react-navigation/core';
import {
  TabRouter,
  type TabNavigationState,
  type TabRouterOptions,
} from '../../react-navigation/routers';
import { renderRouter } from '../../testing-library';
import { unstable_createStandardRouterNavigator } from '../index';
import { useStandardEmitter } from '../useStandardEmitter';

type TestEventMap = {
  plain: { data: { value: number } | undefined; canPreventDefault: false };
  cancelable: { data: undefined; canPreventDefault: true };
};

// --- Unit: useStandardEmitter in isolation against a mock emit ---
describe('useStandardEmitter (unit)', () => {
  function setup(emitReturn: object = {}) {
    const emit = jest.fn().mockReturnValue(emitReturn);
    const navigation = { emit } as unknown as EventEmitter<TestEventMap>;
    const { result, rerender } = renderHook(() => useStandardEmitter<TestEventMap>(navigation));
    return { emit, navigation, result, rerender };
  }

  it('forwards the options to navigation.emit', () => {
    const { emit, result } = setup();

    result.current.emit({ type: 'plain', target: 'k', data: { value: 1 } });

    expect(emit).toHaveBeenCalledWith({ type: 'plain', target: 'k', data: { value: 1 } });
  });

  it('returns a base event built from the input options', () => {
    const { result } = setup();

    const event = result.current.emit({ type: 'plain', target: 'k', data: { value: 1 } });

    expect(event).toEqual({ type: 'plain', target: 'k', data: { value: 1 } });
  });

  it('includes defaultPrevented/preventDefault when the emit result has them', () => {
    const preventDefault = jest.fn();
    const { result } = setup({ defaultPrevented: true, preventDefault });

    const event = result.current.emit({ type: 'cancelable', target: 'k', canPreventDefault: true });

    expect(event).toMatchObject({ type: 'cancelable', target: 'k', defaultPrevented: true });
    expect((event as { preventDefault: unknown }).preventDefault).toBe(preventDefault);
    expect(Object.keys(event)).toEqual(
      expect.arrayContaining(['defaultPrevented', 'preventDefault'])
    );
  });

  it('omits defaultPrevented/preventDefault when the emit result lacks them', () => {
    const { result } = setup({});

    const event = result.current.emit({ type: 'plain', data: { value: 1 } });

    expect('defaultPrevented' in event).toBe(false);
    expect('preventDefault' in event).toBe(false);
  });

  it('reflects preventDefault called after emit returns', () => {
    // Mirrors the real emitter (useEventEmitter): `defaultPrevented` is a live getter over a
    // closure flag that `preventDefault` mutates.
    let prevented = false;
    const { result } = setup({
      get defaultPrevented() {
        return prevented;
      },
      preventDefault: () => {
        prevented = true;
      },
    });

    const event = result.current.emit({ type: 'cancelable', target: 'k', canPreventDefault: true });

    expect(event.defaultPrevented).toBe(false);
    event.preventDefault();
    // The original event's flag flipped, and the returned event observes it live.
    expect(prevented).toBe(true);
    expect(event.defaultPrevented).toBe(true);
  });

  it('returns a stable reference while navigation is unchanged', () => {
    const navigation = { emit: jest.fn() } as unknown as EventEmitter<TestEventMap>;
    const { result, rerender } = renderHook(() => useStandardEmitter<TestEventMap>(navigation));
    const first = result.current;

    rerender({});

    expect(result.current).toBe(first);
  });

  it('returns a new reference when navigation changes', () => {
    const { result, rerender } = renderHook(
      ({ navigation }: { navigation: EventEmitter<TestEventMap> }) =>
        useStandardEmitter<TestEventMap>(navigation),
      { initialProps: { navigation: { emit: jest.fn() } as unknown as EventEmitter<TestEventMap> } }
    );
    const first = result.current;

    rerender({ navigation: { emit: jest.fn() } as unknown as EventEmitter<TestEventMap> });

    expect(result.current).not.toBe(first);
  });
});

// --- Integration: emit reaches a real screen listener through renderRouter ---
describe('useStandardEmitter (integration)', () => {
  type IntegrationEventMap = {
    ping: { data: { n: number } | undefined; canPreventDefault: false };
  };

  const contentSpy = jest.fn();
  function NavigatorContent(args: NavigatorArgs<Record<string, never>, IntegrationEventMap>) {
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
    IntegrationEventMap,
    object,
    TabRouterOptions
  >(NavigatorContent, TabRouter, { useOnlyUserDefinedScreens: true });

  it('delivers an emitted event to the targeted screen listener', () => {
    const ping = jest.fn();
    renderRouter({
      _layout: () => (
        <StandardTabs screenListeners={{ ping: (e: { data?: unknown }) => ping(e.data) }}>
          <StandardTabs.Screen name="index" />
        </StandardTabs>
      ),
      index: () => <View testID="index" />,
    });
    const lastArgs = () =>
      contentSpy.mock.calls.at(-1)![0] as NavigatorArgs<Record<string, never>, IntegrationEventMap>;

    act(() => {
      lastArgs().emitter.emit({
        type: 'ping',
        target: lastArgs().state.routes[0]!.key,
        data: { n: 1 },
      });
    });

    expect(ping).toHaveBeenCalledWith({ n: 1 });
  });
});
