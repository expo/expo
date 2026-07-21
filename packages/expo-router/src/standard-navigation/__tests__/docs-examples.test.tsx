/* eslint-disable @typescript-eslint/no-unused-vars */
import { Pressable, Text, View } from 'react-native';
import { createStandardNavigator } from 'standard-navigation';

import { TabRouter } from '../../react-navigation/routers';
import { unstable_createStandardRouterNavigator } from '../index';
import type { NavigatorContentProps } from '../types';

function typecheck(_value: unknown) {}

// These examples mirror docs/pages/router/advanced/custom-navigators.mdx and must stay in sync so
// the snippets users copy keep compiling.

// "Create a navigator in your app" — `EventMap` is inferred without explicit type arguments.
{
  type TabsContentProps = NavigatorContentProps<{ title?: string }>;

  const TabsContent = ({ state, descriptors, actions }: TabsContentProps) => {
    const focusedRoute = state.routes[state.index]!;

    return (
      <View style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>{descriptors[focusedRoute.key]!.render()}</View>
        <View style={{ flexDirection: 'row' }}>
          {state.routes.map((route) => (
            <Pressable
              key={route.key}
              style={{ flex: 1, padding: 16 }}
              onPress={() => actions.navigate(route.name)}>
              <Text>{descriptors[route.key]!.options.title ?? route.name}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    );
  };

  // eslint-disable-next-line no-unused-expressions
  unstable_createStandardRouterNavigator(TabsContent, TabRouter);
}

// "Typed events" — the event map is inferred from the component and `emitter.emit` is typed
// against it (unknown event names and mismatched payloads are rejected).
{
  type TabsContentProps = NavigatorContentProps<
    { title?: string },
    { tabPress: { data: undefined; canPreventDefault: true } }
  >;

  const TabsContent = ({ emitter }: TabsContentProps) => {
    emitter.emit({ type: 'tabPress', canPreventDefault: true });
    // @ts-expect-error `nope` is not a declared event.
    emitter.emit({ type: 'nope' });
    return null;
  };

  // eslint-disable-next-line no-unused-expressions
  unstable_createStandardRouterNavigator(TabsContent, TabRouter);
}

// "Options" — the optional third argument type-checks, and `createProps` may dispatch a `PRELOAD`
// action against the raw router `dispatch` (the guide's `createProps` example). `POP_TO_TOP` would
// be a no-op on a TabRouter, so the guide uses `PRELOAD`.
{
  type TabsCreateProps = { activeRouteKey: string; preload: (name: string) => void };
  type TabsContentProps = NavigatorContentProps<
    { title?: string },
    Record<string, never>,
    object,
    TabsCreateProps
  >;

  const TabsContent = ({ state, descriptors, activeRouteKey, preload }: TabsContentProps) => {
    const focusedRoute = state.routes[state.index]!;
    return (
      <Pressable onPress={() => preload(activeRouteKey)} style={{ flex: 1 }}>
        {descriptors[focusedRoute.key]!.render()}
      </Pressable>
    );
  };

  const Tabs = unstable_createStandardRouterNavigator(TabsContent, TabRouter, {
    useOnlyUserDefinedScreens: true,
    createProps: ({ state, dispatch }) => ({
      activeRouteKey: state.routes[state.index]!.key,
      preload: (name: string) => dispatch({ type: 'PRELOAD', payload: { name } }),
    }),
  });

  typecheck(<Tabs />);
  // @ts-expect-error `activeRouteKey` is injected by `createProps`.
  typecheck(<Tabs activeRouteKey="route" />);
  // @ts-expect-error `preload` is injected by `createProps`.
  typecheck(<Tabs preload={() => {}} />);
}

// "Library entry points" — a framework-agnostic navigator created directly with
// `createStandardNavigator`, declaring a real event map (the guide's library-author example).
{
  type TabsContentProps = NavigatorContentProps<
    { title?: string },
    { tabPress: { data: undefined; canPreventDefault: true } }
  >;

  const TabsContent = ({ emitter }: TabsContentProps) => {
    emitter.emit({ type: 'tabPress', canPreventDefault: true });
    return null;
  };

  // eslint-disable-next-line no-unused-expressions
  createStandardNavigator<
    { title?: string },
    { tabPress: { data: undefined; canPreventDefault: true } }
  >(TabsContent);
}

describe('custom navigator documentation examples', () => {
  it('is type-checked by tsc via pnpm typecheck or et check-packages', () => {
    expect(typeof unstable_createStandardRouterNavigator).toBe('function');
  });
});
