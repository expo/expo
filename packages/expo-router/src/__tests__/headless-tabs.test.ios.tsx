import { act, fireEvent, screen, userEvent } from '@testing-library/react-native';
import type { Ref } from 'react';
import React, { forwardRef, useEffect, useState } from 'react';
import type { ViewProps } from 'react-native';
import { View, Text, Button } from 'react-native';

import { store } from '../global-state/router-store';
import { useLocalSearchParams } from '../hooks';
import { router } from '../imperative-api';
import { useGuardRedirect } from '../layouts/GuardContext';
import { Stack } from '../layouts/Stack';
import { Tabs as JSTabs } from '../layouts/Tabs';
import { Link, Redirect } from '../link/Link';
import { useIsFocused } from '../react-navigation/native';
import { type RenderRouterOptions, renderRouter, waitFor } from '../testing-library';
import { TabList, TabSlot, TabTrigger, Tabs, useTabTrigger } from '../ui';
import { useNavigation } from '../useNavigation';
import { useNavigatorContext } from '../views/Navigator';
import type { PressableProps } from '../views/Pressable';
import { Pressable } from '../views/Pressable';

const renderFruitApp = (options: RenderRouterOptions = {}) =>
  renderRouter(
    {
      '(group)/_layout': {
        unstable_settings: {
          initialRouteName: 'orange',
        },
        default: () => {
          return (
            <Tabs>
              <TabList>
                <TabTrigger name="apple" testID="goto-apple" href="/apple">
                  <Text>Apple</Text>
                </TabTrigger>
                {/* TODO(@ubax): Remove nested trigger href once headless tabs require direct-child hrefs (unify with NativeTabs). */}
                <TabTrigger name="banana" testID="goto-banana" href="/banana/taste">
                  <Text>Banana</Text>
                </TabTrigger>
                <TabTrigger name="orange" testID="goto-orange" href="/orange">
                  <Text>Orange</Text>
                </TabTrigger>
                <TabTrigger
                  name="pear"
                  testID="goto-pear"
                  href={{ pathname: '/[fruit]', params: { fruit: 'pear' } }}>
                  <Text>Pear</Text>
                </TabTrigger>
              </TabList>
              <TabSlot />
            </Tabs>
          );
        },
      },
      '(group)/apple': () => <Text testID="apple">Apple</Text>,

      // Banana
      '(group)/banana/_layout': {
        unstable_settings: {
          initialRouteName: 'index',
        },
        default: () => <Stack />,
      },
      '(group)/banana/index': () => <Text testID="banana">Banana Index</Text>,
      '(group)/banana/color': () => <Text testID="banana-color">Banana Color</Text>,
      '(group)/banana/shape': () => <Text testID="banana-shape">Banana Shape</Text>,
      '(group)/banana/[dynamic]': () => <Text testID="banana-dynamic">Banana dynamic</Text>,

      // Orange
      '(group)/orange/_layout': {
        unstable_settings: {
          initialRouteName: 'index',
        },
        default: () => <Stack />,
      },
      '(group)/orange/index': () => <Text testID="orange">Orange</Text>,
      '(group)/orange/color': () => <Text testID="orange-color">Orange Color</Text>,
      '(group)/orange/shape': () => <Text testID="orange">Orange Shape</Text>,

      // [fruit]
      '(group)/[fruit]/_layout': {
        unstable_settings: {
          initialRouteName: 'index',
        },
        default: () => <Stack />,
      },
      '(group)/[fruit]/index': () => <Text testID="[fruit]">Fruit</Text>,
      '(group)/[fruit]/color': () => <Text testID="[fruit]-color">Fruit Color</Text>,
      '(group)/[fruit]/shape': () => <Text testID="[fruit]">Fruit Shape</Text>,
    },
    options
  );

it('should render the correct screen with nested navigators', () => {
  renderFruitApp({ initialUrl: '/apple' });
  expect(screen).toHaveSegments(['(group)', 'apple']);

  fireEvent.press(screen.getByTestId('goto-banana'));
  expect(screen.getByTestId('banana-dynamic')).toBeVisible();
  expect(screen).toHaveSegments(['(group)', 'banana', '[dynamic]']);
  act(() => router.push('/banana/shape'));
  expect(screen).toHaveSegments(['(group)', 'banana', 'shape']);
  expect(screen.getByTestId('banana-shape')).toBeVisible();

  fireEvent.press(screen.getByTestId('goto-apple'));
  expect(screen).toHaveSegments(['(group)', 'apple']);

  // A deep trigger resolves its destination against the preserved stack.
  fireEvent.press(screen.getByTestId('goto-banana'));
  expect(screen).toHaveSegments(['(group)', 'banana', '[dynamic]']);
});

it('can resolve a deep trigger in the focused tab through useTabTrigger', () => {
  function DeepTrigger() {
    const { switchTab } = useTabTrigger({ name: 'banana' });
    return <Button title="Deep trigger" onPress={() => switchTab('banana', {})} />;
  }

  renderRouter(
    {
      _layout: () => (
        <Tabs>
          <TabList>
            <TabTrigger name="banana" href="/banana/details" />
          </TabList>
          <DeepTrigger />
          <TabSlot />
        </Tabs>
      ),
      'banana/_layout': () => <Stack />,
      'banana/index': () => <Text testID="banana-index">Index</Text>,
      'banana/details': () => <Text testID="banana-details">Details</Text>,
    },
    { initialUrl: '/banana' }
  );

  fireEvent.press(screen.getByText('Deep trigger'));
  expect(screen.getByTestId('banana-details')).toBeVisible();
});

it('pressing a deep trigger resolves its href in the focused tab', () => {
  renderRouter(
    {
      _layout: () => (
        <Tabs>
          <TabList>
            <TabTrigger name="banana" href="/banana/details" />
          </TabList>
          <TabTrigger name="banana" testID="deep-trigger" />
          <TabSlot />
        </Tabs>
      ),
      'banana/_layout': () => <Stack />,
      'banana/index': () => <Text testID="banana-index">Index</Text>,
      'banana/details': () => <Text testID="banana-details">Details</Text>,
    },
    { initialUrl: '/banana' }
  );

  fireEvent.press(screen.getByTestId('deep-trigger'));
  expect(screen.getByTestId('banana-details')).toBeVisible();
});

it('should respect `unstable_settings on native', () => {
  renderFruitApp({ initialUrl: '/orange' });
  expect(screen).toHaveSegments(['(group)', 'orange']);

  expect(screen.getByTestId('orange')).toBeVisible();
  expect(router.canGoBack()).toBe(false);

  // Reset the app, but start at /banana
  screen.unmount();
  renderFruitApp({ initialUrl: '/banana' });

  // Orange should be the initialRouteName, because we are now in (two)
  expect(screen.getByTestId('banana')).toBeVisible();
  act(() => router.back());
  expect(screen.getByTestId('orange')).toBeVisible();
});

it('should allow Href objects', () => {
  renderFruitApp({ initialUrl: '/pear/color' });
  expect(screen).toHaveSegments(['(group)', '[fruit]', 'color']);
  expect(screen.getByTestId('[fruit]-color')).toBeVisible();

  act(() => router.back());
  expect(screen).toHaveSegments(['(group)', '[fruit]']);
  expect(screen.getByTestId('[fruit]')).toBeVisible();
});

it('allows for custom elements', () => {
  const CustomTabs = forwardRef(({ children, ...props }: ViewProps, ref: Ref<View>) => {
    return (
      <View ref={ref} testID="custom-tabs" {...props}>
        {children}
      </View>
    );
  });
  const CustomTabList = forwardRef(({ children, ...props }: ViewProps, ref: Ref<View>) => {
    return (
      <View ref={ref} testID="custom-tablist" {...props}>
        {children}
      </View>
    );
  });
  const CustomTrigger = forwardRef((props: PressableProps, ref: Ref<any>) => {
    return <Pressable ref={ref} testID="custom-trigger" {...props} />;
  });

  renderRouter(
    {
      _layout: () => {
        return (
          <Tabs asChild>
            <CustomTabs>
              <TabList asChild>
                <CustomTabList>
                  <TabTrigger name="apple" href="/apple">
                    <Text>Apple</Text>
                  </TabTrigger>
                  <TabTrigger asChild name="orange" href="/orange">
                    <CustomTrigger>
                      <Text>Orange</Text>
                    </CustomTrigger>
                  </TabTrigger>
                </CustomTabList>
              </TabList>
              <TabSlot />
              <TabTrigger name="apple" testID="goto-apple">
                <Text>TabTrigger outside of a TabList</Text>
              </TabTrigger>
            </CustomTabs>
          </Tabs>
        );
      },
      apple: () => null,
      orange: () => null,
    },
    {
      initialUrl: '/apple',
    }
  );

  expect(screen.getByTestId('custom-tabs')).toBeVisible();
  expect(screen.getByTestId('custom-tablist')).toBeVisible();
  expect(screen.getByTestId('custom-trigger')).toBeVisible();

  expect(screen).toHaveSegments(['apple']);
  act(() => router.push('/orange'));
  expect(screen).toHaveSegments(['orange']);

  fireEvent.press(screen.getByTestId('goto-apple'));
  expect(screen).toHaveSegments(['apple']);
});

it('can dynamically add and remove tabs', () => {
  renderRouter(
    {
      _layout: function TabLayout() {
        const [showAll, setShowAll] = useState(false);

        const tabs = showAll ? (
          <>
            <TabTrigger name="apple" href="/apple" />
            <TabTrigger name="orange" href="/orange" />
          </>
        ) : (
          <TabTrigger name="apple" href="/apple" />
        );

        return (
          <Tabs>
            <TabList>{tabs}</TabList>
            <TabSlot />
            <Button testID="toggle-all" title="Toggle all" onPress={() => setShowAll((v) => !v)} />
          </Tabs>
        );
      },
      apple: () => null,
      orange: () => null,
    },
    {
      initialUrl: '/apple',
    }
  );

  expect(screen).toHaveSegments(['apple']);

  // This stays on /apple because there is no orange tab
  act(() => router.push('/orange'));
  expect(screen).toHaveSegments(['apple']);

  fireEvent.press(screen.getByTestId('toggle-all'));

  // This now works because there is an orange tab
  act(() => router.push('/orange'));
  expect(screen).toHaveSegments(['orange']);

  fireEvent.press(screen.getByTestId('toggle-all'));
  expect(screen).toHaveSegments(['apple']);
});

it('can dynamically remove the active tab', () => {
  renderRouter(
    {
      _layout: function TabLayout() {
        const [showAll, setShowAll] = useState(true);

        return (
          <Tabs>
            <TabList>
              <TabTrigger name="apple" href="/apple" />
              {showAll && <TabTrigger name="orange" href="/orange" />}
            </TabList>
            <TabSlot />
            <Button testID="hide-orange" title="Hide orange" onPress={() => setShowAll(false)} />
          </Tabs>
        );
      },
      apple: () => null,
      orange: () => null,
    },
    {
      initialUrl: '/orange',
    }
  );

  expect(screen).toHaveSegments(['orange']);

  fireEvent.press(screen.getByTestId('hide-orange'));

  expect(screen).toHaveSegments(['apple']);
});

it('preserves surviving tab content when the trigger set changes', () => {
  let appleMounts = 0;

  function Apple() {
    useState(() => appleMounts++);
    return null;
  }

  renderRouter(
    {
      _layout: function TabLayout() {
        const [showOrange, setShowOrange] = useState(true);
        return (
          <Tabs>
            <TabList>
              <TabTrigger name="apple" href="/apple" />
              {showOrange && <TabTrigger name="orange" href="/orange" />}
            </TabList>
            <TabSlot />
            <Button testID="hide-orange" title="Hide orange" onPress={() => setShowOrange(false)} />
          </Tabs>
        );
      },
      apple: Apple,
      orange: () => null,
    },
    { initialUrl: '/apple' }
  );

  expect(appleMounts).toBe(1);
  fireEvent.press(screen.getByTestId('hide-orange'));
  expect(appleMounts).toBe(1);
});

it('does not reset tab content when only a trigger href changes', () => {
  let appleMounts = 0;

  function Apple() {
    useState(() => appleMounts++);
    return null;
  }

  renderRouter(
    {
      _layout: function TabLayout() {
        const [withQuery, setWithQuery] = useState(false);
        return (
          <Tabs>
            <TabList>
              <TabTrigger name="apple" href={withQuery ? '/apple?updated=true' : '/apple'} />
            </TabList>
            <TabSlot />
            <Button testID="change-href" title="Change href" onPress={() => setWithQuery(true)} />
          </Tabs>
        );
      },
      apple: Apple,
    },
    { initialUrl: '/apple' }
  );

  expect(appleMounts).toBe(1);
  fireEvent.press(screen.getByTestId('change-href'));
  expect(appleMounts).toBe(1);
});

it('does not reset tab content when triggers are reordered', () => {
  let appleMounts = 0;
  let tabState: { routeNames: string[]; routes: string[] } | undefined;

  function Apple() {
    useState(() => appleMounts++);
    return null;
  }

  function StateProbe() {
    const { state } = useNavigatorContext();
    tabState = {
      routeNames: state.routeNames,
      routes: state.routes.map((route) => route.name),
    };
    return null;
  }

  renderRouter(
    {
      _layout: function TabLayout() {
        const [reversed, setReversed] = useState(false);
        const triggers = [
          <TabTrigger key="apple" name="apple" href="/apple" />,
          <TabTrigger key="orange" name="orange" href="/orange" />,
        ];
        return (
          <Tabs>
            <TabList>{reversed ? triggers.reverse() : triggers}</TabList>
            <TabSlot />
            <StateProbe />
            <Button testID="reorder" title="Reorder" onPress={() => setReversed(true)} />
          </Tabs>
        );
      },
      apple: Apple,
      orange: () => null,
    },
    { initialUrl: '/apple' }
  );

  expect(appleMounts).toBe(1);
  fireEvent.press(screen.getByTestId('reorder'));
  expect(appleMounts).toBe(1);
  expect(tabState).toEqual({
    routeNames: ['orange', 'apple'],
    routes: ['apple'],
  });
  act(() => router.back());
  expect(screen).toHaveSegments(['orange']);
});

it('uses the new trigger order for order back behavior', () => {
  renderRouter(
    {
      _layout: function TabLayout() {
        const [reordered, setReordered] = useState(false);
        const triggers = reordered
          ? [
              <TabTrigger key="orange" name="orange" href="/orange" />,
              <TabTrigger key="apple" name="apple" href="/apple" />,
              <TabTrigger key="pear" name="pear" href="/pear" />,
            ]
          : [
              <TabTrigger key="apple" name="apple" href="/apple" />,
              <TabTrigger key="orange" name="orange" href="/orange" />,
              <TabTrigger key="pear" name="pear" href="/pear" />,
            ];

        return (
          <Tabs options={{ backBehavior: 'order' }}>
            <TabList>{triggers}</TabList>
            <TabSlot />
            <Button testID="reorder" title="Reorder" onPress={() => setReordered(true)} />
          </Tabs>
        );
      },
      apple: () => null,
      orange: () => null,
      pear: () => null,
    },
    { initialUrl: '/pear' }
  );

  fireEvent.press(screen.getByTestId('reorder'));
  act(() => router.back());
  expect(screen).toHaveSegments(['apple']);
  act(() => router.back());
  expect(screen).toHaveSegments(['orange']);
});

it('returns to the initial route after triggers are reordered', () => {
  renderRouter(
    {
      _layout: {
        unstable_settings: { initialRouteName: 'orange' },
        default: function TabLayout() {
          const [reordered, setReordered] = useState(false);
          const triggers = [
            <TabTrigger key="apple" name="apple" href="/apple" />,
            <TabTrigger key="orange" name="orange" href="/orange" />,
            <TabTrigger key="pear" name="pear" href="/pear" />,
          ];

          return (
            <Tabs>
              <TabList>{reordered ? triggers.reverse() : triggers}</TabList>
              <TabSlot />
              <Button testID="reorder" title="Reorder" onPress={() => setReordered(true)} />
            </Tabs>
          );
        },
      },
      apple: () => null,
      orange: () => null,
      pear: () => null,
    },
    { initialUrl: '/pear' }
  );

  fireEvent.press(screen.getByTestId('reorder'));
  act(() => router.back());
  expect(screen).toHaveSegments(['orange']);
});

it('preserves visit history when triggers are reordered', () => {
  renderRouter(
    {
      _layout: function TabLayout() {
        const [reordered, setReordered] = useState(false);
        const triggers = [
          <TabTrigger key="apple" name="apple" href="/apple" />,
          <TabTrigger key="orange" name="orange" testID="goto-orange" href="/orange" />,
          <TabTrigger key="pear" name="pear" testID="goto-pear" href="/pear" />,
        ];

        return (
          <Tabs options={{ backBehavior: 'history' }}>
            <TabList>{reordered ? triggers.reverse() : triggers}</TabList>
            <TabSlot />
            <Button testID="reorder" title="Reorder" onPress={() => setReordered(true)} />
          </Tabs>
        );
      },
      apple: () => null,
      orange: () => null,
      pear: () => null,
    },
    { initialUrl: '/apple' }
  );

  fireEvent.press(screen.getByTestId('goto-orange'));
  fireEvent.press(screen.getByTestId('goto-pear'));
  fireEvent.press(screen.getByTestId('reorder'));
  act(() => router.back());
  expect(screen).toHaveSegments(['orange']);
});

it('scopes trigger reordering to a nested tab navigator', () => {
  let parentState: string | undefined;

  function ParentStateProbe() {
    const { state } = useNavigatorContext();
    parentState = JSON.stringify({
      routeNames: state.routeNames,
      routeKeys: state.routes.map((route) => route.key),
      index: state.index,
      history: state.history,
    });
    return null;
  }

  renderRouter(
    {
      _layout: () => (
        <Tabs options={{ backBehavior: 'history' }}>
          <TabList>
            <TabTrigger name="index" href="/" />
            <TabTrigger name="fruit" href="/fruit" />
          </TabList>
          <TabSlot />
          <ParentStateProbe />
        </Tabs>
      ),
      index: () => null,
      'fruit/_layout': function FruitTabs() {
        const [reordered, setReordered] = useState(false);
        const triggers = reordered
          ? [
              <TabTrigger key="orange" name="orange" href="/fruit/orange" />,
              <TabTrigger key="apple" name="apple" href="/fruit/apple" />,
              <TabTrigger key="pear" name="pear" href="/fruit/pear" />,
            ]
          : [
              <TabTrigger key="apple" name="apple" href="/fruit/apple" />,
              <TabTrigger key="orange" name="orange" href="/fruit/orange" />,
              <TabTrigger key="pear" name="pear" href="/fruit/pear" />,
            ];

        return (
          <Tabs options={{ backBehavior: 'order' }}>
            <TabList>{triggers}</TabList>
            <TabSlot />
            <Button testID="reorder-child" title="Reorder" onPress={() => setReordered(true)} />
          </Tabs>
        );
      },
      'fruit/apple': () => null,
      'fruit/orange': () => null,
      'fruit/pear': () => null,
    },
    { initialUrl: '/fruit/pear' }
  );

  const stateBeforeReorder = parentState;
  fireEvent.press(screen.getByTestId('reorder-child'));
  expect(parentState).toBe(stateBeforeReorder);
  act(() => router.back());
  expect(screen).toHaveSegments(['fruit', 'apple']);
});

it('keeps focus hooks correct after removing the active trigger', () => {
  function Apple() {
    return <Text testID="apple-focus">{useIsFocused() ? 'focused' : 'not focused'}</Text>;
  }

  renderRouter(
    {
      _layout: function TabLayout() {
        const [showOrange, setShowOrange] = useState(true);
        return (
          <Tabs>
            <TabList>
              <TabTrigger name="apple" href="/apple" />
              {showOrange && <TabTrigger name="orange" href="/orange" />}
            </TabList>
            <TabSlot />
            <Button testID="hide-orange" title="Hide orange" onPress={() => setShowOrange(false)} />
          </Tabs>
        );
      },
      apple: Apple,
      orange: () => null,
    },
    { initialUrl: '/orange' }
  );

  fireEvent.press(screen.getByTestId('hide-orange'));
  expect(screen.getByTestId('apple-focus')).toHaveTextContent('focused');
});

it('removes the active trigger from a nested dynamic tab navigator', () => {
  renderRouter(
    {
      _layout: () => (
        <Tabs>
          <TabList>
            <TabTrigger name="fruit" href="/fruit" />
          </TabList>
          <TabSlot />
        </Tabs>
      ),
      'fruit/_layout': function FruitTabs() {
        const [showOrange, setShowOrange] = useState(true);
        return (
          <Tabs>
            <TabList>
              <TabTrigger name="apple" href="/fruit/apple" />
              {showOrange && <TabTrigger name="orange" href="/fruit/orange" />}
            </TabList>
            <TabSlot />
            <Button testID="hide-orange" title="Hide orange" onPress={() => setShowOrange(false)} />
          </Tabs>
        );
      },
      'fruit/apple': () => null,
      'fruit/orange': () => null,
    },
    { initialUrl: '/fruit/orange' }
  );

  fireEvent.press(screen.getByTestId('hide-orange'));
  expect(screen).toHaveSegments(['fruit', 'apple']);
});

it('does not redirect from an inactive nested tab navigator', () => {
  let hideOrange!: () => void;

  renderRouter(
    {
      _layout: () => (
        <Tabs>
          <TabList>
            <TabTrigger name="index" testID="goto-index" href="/" />
            <TabTrigger name="fruit" href="/fruit" />
          </TabList>
          <TabSlot />
        </Tabs>
      ),
      index: () => null,
      'fruit/_layout': function FruitTabs() {
        const [showOrange, setShowOrange] = useState(true);
        hideOrange = () => setShowOrange(false);
        return (
          <Tabs>
            <TabList>
              <TabTrigger name="apple" href="/fruit/apple" />
              {showOrange && <TabTrigger name="orange" href="/fruit/orange" />}
            </TabList>
            <TabSlot />
          </Tabs>
        );
      },
      'fruit/apple': () => null,
      'fruit/orange': () => null,
    },
    { initialUrl: '/fruit/orange' }
  );

  fireEvent.press(screen.getByTestId('goto-index'));
  act(hideOrange);
  expect(screen).toHavePathname('/');
});

it('does works with shared groups', () => {
  renderRouter(
    {
      _layout: () => (
        <Tabs>
          <TabList>
            <TabTrigger
              name="apple"
              href={{ pathname: '/(one)/[fruit]', params: { fruit: 'apple' } }}>
              <Text>Apple</Text>
            </TabTrigger>
            <TabTrigger
              name="orange"
              testID="goto-orange"
              href={{ pathname: '/(two)/[fruit]', params: { fruit: 'orange' } }}>
              <Text>Orange</Text>
            </TabTrigger>
          </TabList>
          <TabSlot />
        </Tabs>
      ),
      '(one,two)/[fruit]': function Fruit() {
        const fruit = useLocalSearchParams().fruit!.toString();
        return <Text testID={fruit}>Fruit: {fruit}</Text>;
      },
    },
    {
      initialUrl: '/apple',
    }
  );

  expect(screen.getByTestId('apple')).toBeVisible();
  expect(screen).toHaveSegments(['(one)', '[fruit]']);

  fireEvent.press(screen.getByTestId('goto-orange'));
  expect(screen.getByTestId('orange')).toBeVisible();
  expect(screen).toHaveSegments(['(two)', '[fruit]']);
});

it('works with nested layouts', () => {
  renderRouter({
    _layout: () => (
      <Tabs>
        <TabList>
          <TabTrigger name="index" href="/(group)">
            <Text>Index</Text>
          </TabTrigger>
          <TabTrigger name="page" testID="goto-page" href="/page">
            <Text>Page</Text>
          </TabTrigger>
        </TabList>
        <TabSlot />
      </Tabs>
    ),
    '(group)/_layout': () => <Stack />,
    '(group)/index': () => <Text testID="index">Index</Text>,
    page: () => <Text testID="page">Page</Text>,
  });

  expect(screen.getByTestId('index')).toBeVisible();
  expect(screen).toHaveSegments(['(group)']);

  fireEvent.press(screen.getByTestId('goto-page'));
  expect(screen.getByTestId('page')).toBeVisible();
  expect(screen).toHaveSegments(['page']);
});

it('starts with only the initial declared route', () => {
  function StateProbe() {
    const { state } = useNavigatorContext();
    return (
      <Text testID="tab-state">
        {state.routes.map((route) => route.name).join(',')}:{state.routes[state.index]!.name}
      </Text>
    );
  }

  renderRouter(
    {
      _layout: () => (
        <Tabs>
          <TabList>
            <TabTrigger name="orange" href="/orange" />
            <TabTrigger name="apple" href="/apple" />
          </TabList>
          <TabSlot />
          <StateProbe />
        </Tabs>
      ),
      apple: () => null,
      orange: () => null,
    },
    { initialUrl: '/apple' }
  );

  expect(screen.getByTestId('tab-state')).toHaveTextContent('apple:apple');
});

it('redirects router.push from a filesystem route without a trigger', () => {
  renderRouter({
    _layout: () => (
      <Tabs>
        <TabList>
          <TabTrigger name="index" testID="goto-index" href="/" />
          <TabTrigger name="visible" testID="goto-visible" href="/visible" />
        </TabList>
        <TabSlot />
      </Tabs>
    ),
    index: () => <Text testID="index">Index</Text>,
    visible: () => <Text testID="visible">Visible</Text>,
    hidden: () => <Text testID="hidden">Hidden</Text>,
  });

  act(() => router.push('/hidden'));
  expect(screen).toHavePathname('/');
  expect(screen.queryByTestId('hidden')).toBeNull();
  expect(screen.getByTestId('goto-index')).toHaveProp('isFocused', true);
});

it('removes a redirected filesystem route from tab history', () => {
  renderRouter({
    _layout: () => (
      <Tabs options={{ backBehavior: 'history' }}>
        <TabList>
          <TabTrigger name="index" href="/" />
          <TabTrigger name="visible" testID="goto-visible" href="/visible" />
        </TabList>
        <TabSlot />
      </Tabs>
    ),
    index: () => null,
    visible: () => null,
    hidden: () => null,
  });

  fireEvent.press(screen.getByTestId('goto-visible'));
  act(() => router.push('/hidden'));
  expect(screen).toHavePathname('/');

  act(() => router.back());
  expect(screen).toHavePathname('/visible');
});

it('redirects a Link from a filesystem route without a trigger', () => {
  renderRouter({
    _layout: () => (
      <Tabs>
        <TabList>
          <TabTrigger name="index" href="/" />
        </TabList>
        <TabSlot />
      </Tabs>
    ),
    index: () => <Link testID="hidden-link" href="/hidden" />,
    hidden: () => <Text testID="hidden">Hidden</Text>,
  });

  fireEvent.press(screen.getByTestId('hidden-link'));
  expect(screen).toHavePathname('/');
  expect(screen.queryByTestId('hidden')).toBeNull();
});

it('redirects a deep link from a filesystem route without a trigger', () => {
  renderRouter(
    {
      _layout: () => (
        <Tabs>
          <TabList>
            <TabTrigger name="index" href="/" />
          </TabList>
          <TabSlot />
        </Tabs>
      ),
      index: () => <Text testID="index">Index</Text>,
      hidden: () => <Text testID="hidden">Hidden</Text>,
    },
    { initialUrl: '/hidden' }
  );

  expect(screen).toHavePathname('/');
  expect(screen.getByTestId('index')).toBeVisible();
  expect(screen.queryByTestId('hidden')).toBeNull();
});

it.each(['second', 'second/index'])('redirects to initial route %s', (initialRouteName) => {
  renderRouter(
    {
      _layout: {
        unstable_settings: { initialRouteName },
        default: () => (
          // The cast simulates a stale prop supplied by untyped JavaScript.
          <Tabs options={{ initialRouteName: 'index' } as never}>
            <TabList>
              <TabTrigger name="index" href="/" />
              <TabTrigger name="second" href="/second" />
            </TabList>
            <TabSlot />
          </Tabs>
        ),
      },
      index: () => <Text testID="index">Index</Text>,
      [initialRouteName]: () => <Text testID="second">Second</Text>,
      hidden: () => <Text testID="hidden">Hidden</Text>,
    },
    { initialUrl: '/hidden' }
  );

  expect(screen).toHavePathname('/second');
  expect(screen.getByTestId('second')).toBeVisible();
});

it('falls back to the first trigger when the initial route has no trigger', () => {
  renderRouter(
    {
      _layout: {
        unstable_settings: { initialRouteName: 'hidden' },
        default: () => (
          <Tabs>
            <TabList>
              <TabTrigger name="index" href="/" />
              <TabTrigger name="visible" href="/visible" />
            </TabList>
            <TabSlot />
          </Tabs>
        ),
      },
      index: () => <Text testID="index">Index</Text>,
      visible: () => <Text testID="visible">Visible</Text>,
      hidden: () => <Text testID="hidden">Hidden</Text>,
    },
    { initialUrl: '/hidden' }
  );

  expect(screen).toHavePathname('/');
  expect(screen.getByTestId('index')).toBeVisible();
});

it('throws when the configured initial route does not exist', () => {
  expect(() =>
    renderRouter({
      _layout: {
        unstable_settings: { initialRouteName: 'missing' },
        default: () => (
          <Tabs>
            <TabList>
              <TabTrigger name="index" href="/" />
              <TabTrigger name="second" href="/second" />
            </TabList>
            <TabSlot />
          </Tabs>
        ),
      },
      index: () => <Text testID="index">Index</Text>,
      second: () => <Text testID="second">Second</Text>,
    })
  ).toThrow(
    'The initial route name "missing" was not found in the layout at "./_layout.js". Available routes are: "index", "second". Set `unstable_settings.initialRouteName` to the name of a route in this layout.'
  );
});

describe('warnings/errors', () => {
  const originalWarn = console.warn;
  const originalError = console.error;

  const warn = jest.fn();
  const error = jest.fn();

  beforeEach(() => {
    console.warn = warn;
    console.error = error;
  });
  afterEach(() => {
    console.warn = originalWarn;
    console.error = originalError;
  });

  it('should warn when using an invalid href', () => {
    renderRouter({
      _layout: () => {
        return (
          <Tabs>
            <TabList>
              <TabTrigger name="index" href="/" />
              <TabTrigger name="apple" href="/apple" />
            </TabList>
            <TabSlot />
          </Tabs>
        );
      },
      index: () => null,
    });

    expect(error).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith(
      "Tab trigger 'apple' has the href '/apple' which points to a +not-found route."
    );
  });

  it('does not allow for nested triggers with the same name', () => {
    expect(() => {
      renderRouter(
        {
          _layout: () => (
            <Tabs>
              <TabSlot />
              <TabList>
                <TabTrigger name="one" href="/">
                  <Text>One</Text>
                </TabTrigger>
                <TabTrigger name="duplicate" href="/two">
                  <Text>Two</Text>
                </TabTrigger>
              </TabList>
            </Tabs>
          ),
          index: () => <Text testID="index">index</Text>,
          '/two/_layout': () => (
            <Tabs>
              <TabSlot />
              <TabList>
                <TabTrigger name="duplicate" href="http://expo.dev">
                  <Text>Two</Text>
                </TabTrigger>
              </TabList>
            </Tabs>
          ),
        },
        {
          initialUrl: '/two',
        }
      );
    }).toThrow(
      'Trigger {"name":"duplicate","href":"http://expo.dev"} has the same name as parent trigger {"name":"duplicate","href":"/two"}. Triggers must have unique names.'
    );
  });

  it('does not allow trigger hrefs outside a nested tabs layout', () => {
    expect(() =>
      renderRouter(
        {
          _layout: () => <Stack />,
          'fruit/_layout': () => (
            <Tabs>
              <TabList>
                <TabTrigger name="apple" href="/other/apple" />
              </TabList>
              <TabSlot />
            </Tabs>
          ),
          'fruit/apple': () => null,
          'other/_layout': () => <Stack />,
          'other/apple': () => null,
        },
        { initialUrl: '/fruit/apple' }
      )
    ).toThrow(
      `Tab trigger 'apple' with href '/other/apple' must point to a route within the tabs layout.`
    );
  });
});

it('can update a tab trigger href', () => {
  const MockContext = React.createContext({ href: '/a', setHref: (href: string) => {} });
  renderRouter({
    _layout: function TabLayout() {
      const [href, setHref] = useState('/a');
      return (
        <MockContext.Provider value={{ href, setHref }}>
          <Tabs>
            <TabSlot />
            <TabList>
              <TabTrigger name="[p]" href={href}>
                <Text>{href}</Text>
              </TabTrigger>
              <TabTrigger name="index" href="/">
                <Text>Index</Text>
              </TabTrigger>
            </TabList>
          </Tabs>
        </MockContext.Provider>
      );
    },
    index: function Index() {
      const { href, setHref } = React.useContext(MockContext);
      return (
        <View testID="index">
          <Button
            testID="toggle"
            title="Toggle"
            onPress={() => setHref(href === '/a' ? '/b?updated=true' : '/a')}
          />
        </View>
      );
    },
    '[p]': function P() {
      const { p, updated } = useLocalSearchParams();
      return <Text testID="page">{`${p}:${updated}`}</Text>;
    },
  });
  expect(screen.getByTestId('index')).toBeVisible();
  fireEvent.press(screen.getByText('/a'));
  expect(screen.getByTestId('page')).toHaveTextContent('a:undefined');
  fireEvent.press(screen.getByText('Index'));
  fireEvent.press(screen.getByTestId('toggle'));
  fireEvent.press(screen.getByText('/b?updated=true'));
  expect(screen.getByTestId('page')).toHaveTextContent('b:true');
});

it('passes query params to a direct child navigator', () => {
  renderRouter({
    _layout: () => (
      <Tabs>
        <TabList>
          <TabTrigger name="index" testID="goto-index" href="/" />
          <TabTrigger name="movies" testID="goto-movies" href="/movies?filter=recent" />
        </TabList>
        <TabSlot />
      </Tabs>
    ),
    index: () => null,
    'movies/_layout': function MoviesLayout() {
      return <Stack />;
    },
    'movies/index': function Movies() {
      const { filter } = useLocalSearchParams();
      return <Text testID="filter">{filter}</Text>;
    },
  });

  fireEvent.press(screen.getByTestId('goto-movies'));
  expect(screen.getByTestId('filter')).toHaveTextContent('recent');
});

it('can reference a parent trigger from nested tabs', () => {
  renderRouter(
    {
      _layout: () => (
        <Tabs>
          <TabList>
            <TabTrigger name="index" href="/" />
            <TabTrigger name="fruit" href="/fruit" />
          </TabList>
          <TabSlot />
        </Tabs>
      ),
      index: () => <Text testID="index">Index</Text>,
      'fruit/_layout': () => (
        <Tabs>
          <TabList>
            <TabTrigger name="apple" href="/fruit/apple" />
          </TabList>
          <TabTrigger name="fruit" testID="current-parent" />
          <TabTrigger name="index" testID="goto-parent" />
          <TabSlot />
        </Tabs>
      ),
      'fruit/apple': () => <Text testID="apple">Apple</Text>,
    },
    { initialUrl: '/fruit/apple' }
  );

  expect(screen.getByTestId('current-parent')).toHaveProp('isFocused', true);
  expect(screen.getByTestId('goto-parent')).toHaveProp('isFocused', false);
  fireEvent.press(screen.getByTestId('goto-parent'));
  expect(screen.getByTestId('index')).toBeVisible();
});

it('can reference a parent trigger from tabs nested three navigators deep', () => {
  renderRouter(
    {
      _layout: () => (
        <Tabs>
          <TabList>
            <TabTrigger name="index" href="/" />
            <TabTrigger name="fruit" href="/fruit" />
          </TabList>
          <TabSlot />
        </Tabs>
      ),
      index: () => <Text testID="index">Index</Text>,
      'fruit/_layout': () => (
        <Tabs>
          <TabList>
            <TabTrigger name="apple" href="/fruit/apple" />
          </TabList>
          <TabSlot />
        </Tabs>
      ),
      'fruit/apple/_layout': () => (
        <Tabs>
          <TabList>
            <TabTrigger name="red" href="/fruit/apple/red" />
          </TabList>
          <TabTrigger name="fruit" testID="current-root" />
          <TabTrigger name="index" testID="goto-root" />
          <TabSlot />
        </Tabs>
      ),
      'fruit/apple/red': () => <Text testID="red">Red Apple</Text>,
    },
    { initialUrl: '/fruit/apple/red' }
  );

  expect(screen.getByTestId('current-root')).toHaveProp('isFocused', true);
  expect(screen.getByTestId('goto-root')).toHaveProp('isFocused', false);
  fireEvent.press(screen.getByTestId('goto-root'));
  expect(screen.getByTestId('index')).toBeVisible();
});

it('does not reset on focus when resetOnFocus is false', () => {
  renderRouter({
    _layout: () => (
      <Tabs>
        <TabList>
          <TabTrigger name="index" testID="goto-index" href="/">
            <Text>Index</Text>
          </TabTrigger>
          <TabTrigger name="stack" testID="goto-stack" href="/stack">
            <Text>Stack</Text>
          </TabTrigger>
        </TabList>
        <TabSlot />
      </Tabs>
    ),
    index: () => <Text testID="index">Index</Text>,
    'stack/_layout': () => <Stack />,
    'stack/index': () => <Text testID="stack-index">Index</Text>,
    'stack/page': () => <Text testID="stack-page">Page</Text>,
  });

  expect(screen.getByTestId('index')).toBeVisible();
  expect(screen).toHaveSegments([]);

  fireEvent.press(screen.getByTestId('goto-stack'));
  expect(screen.getByTestId('stack-index')).toBeVisible();
  expect(screen).toHaveSegments(['stack']);

  act(() => router.push('/stack/page'));
  expect(screen.getByTestId('stack-page')).toBeVisible();
  expect(screen).toHaveSegments(['stack', 'page']);

  // Go back to index
  fireEvent.press(screen.getByTestId('goto-index'));
  expect(screen.getByTestId('index')).toBeVisible();
  expect(screen).toHaveSegments([]);

  // Go to stack, should reset to index
  fireEvent.press(screen.getByTestId('goto-stack'));
  expect(screen.getByTestId('stack-page')).toBeVisible();
  expect(screen).toHaveSegments(['stack', 'page']);
});

it('resets on focus when resetOnFocus is true', () => {
  renderRouter({
    _layout: () => (
      <Tabs>
        <TabList>
          <TabTrigger name="index" testID="goto-index" href="/">
            <Text>Index</Text>
          </TabTrigger>
          <TabTrigger name="stack" testID="goto-stack" href="/stack" resetOnFocus>
            <Text>Stack</Text>
          </TabTrigger>
        </TabList>
        <TabSlot />
      </Tabs>
    ),
    'stack/_layout': () => <Stack />,
    index: () => <Text testID="index">Index</Text>,
    'stack/index': () => <Text testID="stack-index">Index</Text>,
    'stack/page': () => <Text testID="stack-page">Page</Text>,
  });

  expect(screen.getByTestId('index')).toBeVisible();
  expect(screen).toHaveSegments([]);

  fireEvent.press(screen.getByTestId('goto-stack'));
  expect(screen.getByTestId('stack-index')).toBeVisible();
  expect(screen).toHaveSegments(['stack']);

  act(() => router.push('/stack/page'));
  expect(screen.getByTestId('stack-page')).toBeVisible();
  expect(screen).toHaveSegments(['stack', 'page']);

  // Go back to index
  fireEvent.press(screen.getByTestId('goto-index'));
  expect(screen.getByTestId('index')).toBeVisible();
  expect(screen).toHaveSegments([]);

  // Go to stack, should reset to index
  fireEvent.press(screen.getByTestId('goto-stack'));
  expect(screen.getByTestId('stack-index')).toBeVisible();
  expect(screen).toHaveSegments(['stack']);
});

it('resets before resolving a deep trigger destination', () => {
  renderRouter({
    _layout: () => (
      <Tabs>
        <TabList>
          <TabTrigger name="index" testID="goto-index" href="/" />
          <TabTrigger name="stack" testID="goto-stack" href="/stack/details" resetOnFocus />
        </TabList>
        <TabSlot />
      </Tabs>
    ),
    index: () => null,
    'stack/_layout': () => <Stack />,
    'stack/index': () => <Text testID="stack-index">Index</Text>,
    'stack/page': () => <Text testID="stack-page">Page</Text>,
    'stack/details': () => <Text testID="stack-details">Details</Text>,
  });

  fireEvent.press(screen.getByTestId('goto-stack'));
  act(() => router.push('/stack/page'));
  fireEvent.press(screen.getByTestId('goto-index'));
  fireEvent.press(screen.getByTestId('goto-stack'));
  expect(screen.getByTestId('stack-details')).toBeVisible();

  act(() => router.back());
  expect(screen).toHavePathname('/');
});

it('resets when focused tab is pressed again', async () => {
  renderRouter({
    _layout: () => (
      <Tabs>
        <TabList>
          <TabTrigger name="index" testID="goto-index" href="/">
            <Text>Index</Text>
          </TabTrigger>
          <TabTrigger name="stack" testID="goto-stack" href="/stack">
            <Text>Stack</Text>
          </TabTrigger>
        </TabList>
        <TabSlot />
      </Tabs>
    ),
    'stack/_layout': () => <Stack />,
    index: () => <Text testID="index">Index</Text>,
    'stack/index': () => <Text testID="stack-index">Index</Text>,
    'stack/page': () => <Text testID="stack-page">Page</Text>,
  });

  expect(screen.getByTestId('index')).toBeVisible();
  expect(screen).toHaveSegments([]);

  await userEvent.press(screen.getByTestId('goto-stack'));
  expect(screen.getByTestId('stack-index')).toBeVisible();
  expect(screen).toHaveSegments(['stack']);

  act(() => router.push('/stack/page'));
  expect(screen.getByTestId('stack-page')).toBeVisible();
  expect(screen).toHaveSegments(['stack', 'page']);

  await userEvent.press(screen.getByTestId('goto-stack'));
  // Need to wait, because react-navigation handles this async
  // https://github.com/react-navigation/react-navigation/blob/6f68ca674b5f36382edae220187db3db55f406bb/packages/native-stack/src/navigators/createNativeStackNavigator.tsx#L60
  await waitFor(() => expect(screen.getByTestId('stack-index')).toBeVisible());
  expect(screen).toHaveSegments(['stack']);
});

it('dispatches only one action when re-tapping active tab with nested stack', async () => {
  // Track all dispatched actions using a listener on the navigation container
  const dispatchedActions: unknown[] = [];

  renderRouter({
    _layout: () => (
      <Tabs>
        <TabList>
          <TabTrigger name="index" testID="goto-index" href="/">
            <Text>Index</Text>
          </TabTrigger>
          <TabTrigger name="movies" testID="goto-movies" href="/movies">
            <Text>Movies</Text>
          </TabTrigger>
        </TabList>
        <TabSlot />
      </Tabs>
    ),
    index: () => <Text testID="index">Index</Text>,
    'movies/_layout': () => <Stack />,
    'movies/index': () => <Text testID="movies-index">Movies Index</Text>,
    'movies/nested/_layout': () => <Stack />,
    'movies/nested/index': () => <Text testID="movies-nested">Movies Nested</Text>,
    'movies/nested/details': () => (
      <Text testID="movies-nested-details">Movies Nested Details</Text>
    ),
  });

  expect(screen.getByTestId('index')).toBeVisible();

  // Navigate to movies tab
  await userEvent.press(screen.getByTestId('goto-movies'));
  expect(screen.getByTestId('movies-index')).toBeVisible();

  // Navigate deep into nested stacks
  act(() => router.push('/movies/nested'));
  expect(screen.getByTestId('movies-nested')).toBeVisible();

  act(() => router.push('/movies/nested/details'));
  expect(screen.getByTestId('movies-nested-details')).toBeVisible();

  // Set up listener to track dispatched actions before re-tapping
  const unsubscribe = store.navigationRef.current!.addListener('__unsafe_action__', (e) => {
    dispatchedActions.push(e.data.action);
  });

  // Re-tap the movies tab
  await userEvent.press(screen.getByTestId('goto-movies'));

  // Wait for navigation to complete
  await waitFor(() => expect(screen.getByTestId('movies-index')).toBeVisible());

  unsubscribe();

  expect(dispatchedActions).toHaveLength(1);

  expect(dispatchedActions[0]).toMatchObject({
    type: 'POP_TO_TOP',
  });
});

it('JSTabs dispatches only one action when re-tapping active tab with nested stack', async () => {
  // Track all dispatched actions using a listener on the navigation container
  const dispatchedActions: unknown[] = [];

  renderRouter({
    _layout: () => (
      <JSTabs>
        <JSTabs.Screen name="index" />
        <JSTabs.Screen name="movies" />
      </JSTabs>
    ),
    index: () => <Text testID="index">Index</Text>,
    'movies/_layout': () => <Stack />,
    'movies/index': () => <Text testID="movies-index">Movies Index</Text>,
    'movies/nested/_layout': () => <Stack />,
    'movies/nested/index': () => <Text testID="movies-nested">Movies Nested</Text>,
    'movies/nested/details': () => (
      <Text testID="movies-nested-details">Movies Nested Details</Text>
    ),
  });

  expect(screen.getByTestId('index')).toBeVisible();

  // Navigate to movies tab
  await userEvent.press(screen.getByLabelText('movies, tab, 2 of 2'));
  expect(screen.getByTestId('movies-index')).toBeVisible();

  // Navigate deep into nested stacks
  act(() => router.push('/movies/nested'));
  expect(screen.getByTestId('movies-nested')).toBeVisible();

  act(() => router.push('/movies/nested/details'));
  expect(screen.getByTestId('movies-nested-details')).toBeVisible();

  // Set up listener to track dispatched actions before re-tapping
  const unsubscribe = store.navigationRef.current!.addListener('__unsafe_action__', (e) => {
    dispatchedActions.push(e.data.action);
  });

  // Re-tap the movies tab
  await userEvent.press(screen.getByLabelText('movies, tab, 2 of 2'));

  // Wait for navigation to complete
  await waitFor(() => expect(screen.getByTestId('movies-index')).toBeVisible());

  unsubscribe();

  expect(dispatchedActions).toHaveLength(1);

  expect(dispatchedActions[0]).toMatchObject({
    type: 'POP_TO_TOP',
  });
});

it('does not reset when focused tab is pressed again, but the press is prevented', async () => {
  renderRouter({
    _layout: () => (
      <Tabs>
        <TabList>
          <TabTrigger name="index" testID="goto-index" href="/">
            <Text>Index</Text>
          </TabTrigger>
          <TabTrigger
            name="stack"
            testID="goto-stack"
            href="/stack"
            onPress={(e) => e.preventDefault()}>
            <Text>Stack</Text>
          </TabTrigger>
        </TabList>
        <TabSlot />
      </Tabs>
    ),
    'stack/_layout': () => <Stack />,
    index: () => <Text testID="index">Index</Text>,
    'stack/index': () => <Text testID="stack-index">Index</Text>,
    'stack/page': () => <Text testID="stack-page">Page</Text>,
  });

  expect(screen.getByTestId('index')).toBeVisible();
  expect(screen).toHaveSegments([]);

  await userEvent.press(screen.getByTestId('goto-stack'));
  expect(screen.getByTestId('stack-index')).toBeVisible();
  expect(screen).toHaveSegments(['stack']);

  act(() => router.push('/stack/page'));
  expect(screen.getByTestId('stack-page')).toBeVisible();
  expect(screen).toHaveSegments(['stack', 'page']);

  await userEvent.press(screen.getByTestId('goto-stack'));
  // Need to wait, because react-navigation handles this async
  // https://github.com/react-navigation/react-navigation/blob/6f68ca674b5f36382edae220187db3db55f406bb/packages/native-stack/src/navigators/createNativeStackNavigator.tsx#L60
  await waitFor(() => expect(screen.getByTestId('stack-index')).toBeVisible());
  expect(screen).toHaveSegments(['stack']);
});

it('redirects to index when rendering a <Redirect/> inside a tab route', async () => {
  renderRouter(
    {
      _layout: () => (
        <Tabs>
          <TabList>
            <TabTrigger name="index" href="/" testID="goto-index">
              <Text>Index</Text>
            </TabTrigger>
            <TabTrigger name="redirect" href="/redirect" testID="goto-redirect">
              <Text>Redirect</Text>
            </TabTrigger>
          </TabList>
          <TabSlot />
        </Tabs>
      ),
      index: () => <Text testID="index">Index</Text>,
      redirect: () => <Redirect href="/" />,
    },
    { initialUrl: '/redirect' }
  );

  expect(screen.getByTestId('index')).toBeVisible();
  expect(screen).toHaveSegments([]);
});

it('router.replace works in headless tabs', async () => {
  renderRouter({
    _layout: () => (
      <Tabs>
        <TabList>
          <TabTrigger name="index" href="/" testID="goto-index">
            <Text>Index</Text>
          </TabTrigger>
          <TabTrigger name="second" testID="goto-second" href="/second">
            <Text>Second</Text>
          </TabTrigger>
        </TabList>
        <TabSlot />
      </Tabs>
    ),
    index: () => <Text testID="index">Index</Text>,
    second: () => <Text testID="second">Second</Text>,
  });

  expect(screen.getByTestId('index')).toBeVisible();

  act(() => {
    router.replace('/second');
  });

  expect(screen.getByTestId('second')).toBeVisible();
  expect(router.canGoBack()).toBe(false);
});

it('router.replace only removes the latest visit with full history', () => {
  renderRouter({
    _layout: () => (
      <Tabs options={{ backBehavior: 'fullHistory' }}>
        <TabList>
          <TabTrigger name="index" href="/" />
          <TabTrigger name="second" testID="goto-second" href="/second" />
          <TabTrigger name="third" href="/third" />
        </TabList>
        <TabSlot />
      </Tabs>
    ),
    index: () => null,
    second: () => null,
    third: () => null,
  });

  fireEvent.press(screen.getByTestId('goto-second'));
  act(() => router.push('/'));
  act(() => router.replace('/third'));

  act(() => router.back());
  expect(screen).toHavePathname('/second');
  act(() => router.back());
  expect(screen).toHavePathname('/');
});

it('Link with replace works in headless tabs', async () => {
  renderRouter(
    {
      _layout: () => (
        <Tabs>
          <TabList>
            <TabTrigger name="index" href="/" testID="goto-index">
              <Text>Index</Text>
            </TabTrigger>
            <TabTrigger name="link" href="/link" testID="goto-link">
              <Text>Link</Text>
            </TabTrigger>
          </TabList>
          <TabSlot />
        </Tabs>
      ),
      index: () => <Text testID="index">Index</Text>,
      link: () => (
        <View>
          <Link testID="replace-link" href="/" replace />
        </View>
      ),
    },
    { initialUrl: '/link' }
  );

  expect(screen.queryByTestId('index')).toBeNull();

  await userEvent.press(screen.getByTestId('replace-link'));

  await waitFor(() => expect(screen.getByTestId('index')).toBeVisible());
  // replace should not leave a back entry
  expect(router.canGoBack()).toBe(false);
});

it('hides a trigger when its screen sets hidden options', () => {
  function Second() {
    const navigation = useNavigation();
    useEffect(() => navigation.setOptions({ hidden: true }), [navigation]);
    return <Text testID="second">Second</Text>;
  }

  renderRouter(
    {
      _layout: () => (
        <Tabs>
          <TabList>
            <TabTrigger name="index" href="/" testID="goto-index" />
            <TabTrigger name="second" href="/second" testID="goto-second" />
          </TabList>
          <TabSlot />
        </Tabs>
      ),
      index: () => <Text testID="index">Index</Text>,
      second: Second,
    },
    { initialUrl: '/second' }
  );

  expect(screen.queryByTestId('goto-second')).toBeNull();
  expect(screen).toHavePathname('/');
  expect(screen.getByTestId('index')).toBeVisible();
});

it('does not hide an inherited trigger when a nested screen is hidden', () => {
  function HiddenTab() {
    const navigation = useNavigation();
    useEffect(() => navigation.setOptions({ hidden: true }), [navigation]);
    return <Text>Hidden</Text>;
  }

  renderRouter(
    {
      _layout: () => (
        <Tabs>
          <TabList>
            <TabTrigger name="a" href="/a" />
            <TabTrigger name="b" href="/b" />
          </TabList>
          <TabSlot />
        </Tabs>
      ),
      'a/_layout': () => (
        <Tabs>
          <TabList>
            <TabTrigger name="index" href="/a" />
            <TabTrigger name="y" href="/a/y" />
          </TabList>
          <TabTrigger name="b" testID="outer-b" />
          <TabSlot />
        </Tabs>
      ),
      'a/index': () => <Text>A</Text>,
      'a/y': HiddenTab,
      b: () => <Text>B</Text>,
    },
    { initialUrl: '/a/y' }
  );

  expect(screen.getByTestId('outer-b')).toBeVisible();
});

it('exposes hidden options from useTabTrigger', () => {
  function Second() {
    const navigation = useNavigation();
    useEffect(() => navigation.setOptions({ hidden: true }), [navigation]);
    return <Text>Second</Text>;
  }

  function CustomTrigger() {
    const { trigger, getTrigger } = useTabTrigger({ name: 'second' });
    return (
      <Text testID="custom-trigger">
        {String(trigger?.hidden)} {String(getTrigger('second')?.hidden)}
      </Text>
    );
  }

  renderRouter(
    {
      _layout: () => (
        <Tabs>
          <TabList>
            <TabTrigger name="index" href="/" />
            <TabTrigger name="second" href="/second" />
          </TabList>
          <CustomTrigger />
          <TabSlot />
        </Tabs>
      ),
      index: () => <Text>Index</Text>,
      second: Second,
    },
    { initialUrl: '/second' }
  );

  expect(screen.getByTestId('custom-trigger')).toHaveTextContent('true true');
});

it('renders an external trigger without a navigator route', () => {
  renderRouter({
    _layout: () => (
      <Tabs>
        <TabList>
          <TabTrigger name="index" href="/" />
          <TabTrigger name="external" href="https://expo.dev" testID="external" />
        </TabList>
        <TabSlot />
      </Tabs>
    ),
    index: () => <Text testID="index">Index</Text>,
  });

  expect(screen.getByTestId('external')).toBeVisible();
});

it('does not use a parent guard redirect for a tab with the same route name', () => {
  let inheritedGuardRedirect: ReturnType<typeof useGuardRedirect>;
  function TabsLayout() {
    inheritedGuardRedirect = useGuardRedirect('settings');
    return (
      <Tabs>
        <TabList>
          <TabTrigger name="index" href="/" testID="goto-index" />
        </TabList>
        <TabSlot />
      </Tabs>
    );
  }

  renderRouter({
    _layout: {
      unstable_settings: { initialRouteName: '(tabs)' },
      default: () => (
        <Stack>
          <Stack.Screen name="(tabs)" />
          <Stack.Protected guard={false} redirectTo="/login">
            <Stack.Screen name="settings" />
          </Stack.Protected>
          <Stack.Screen name="login" />
        </Stack>
      ),
    },
    '(tabs)/_layout': {
      unstable_settings: { initialRouteName: 'index' },
      default: TabsLayout,
    },
    '(tabs)/index': () => <Text testID="tabs-index">Index</Text>,
    '(tabs)/settings': () => <Text testID="tabs-settings">Settings</Text>,
    settings: () => <Text testID="root-settings">Settings</Text>,
    login: () => <Text testID="login">Login</Text>,
  });

  expect(inheritedGuardRedirect).toBe('/login');
  act(() => router.push('/(tabs)/settings'));

  expect(screen).toHavePathname('/');
  expect(screen.getByTestId('tabs-index')).toBeVisible();
  expect(screen.queryByTestId('login')).toBeNull();
});
