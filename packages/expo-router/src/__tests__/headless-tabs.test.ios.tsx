import { act, fireEvent, screen, userEvent } from '@testing-library/react-native';
import React, { forwardRef, Ref, useState } from 'react';
import { ViewProps, View, Text, Button } from 'react-native';

import { useLocalSearchParams } from '../hooks';
import { router } from '../imperative-api';
import { Stack } from '../layouts/Stack';
import { Link, Redirect } from '../link/Link';
import { type RenderRouterOptions, renderRouter, waitFor } from '../testing-library';
import { TabList, TabSlot, TabTrigger, Tabs } from '../ui';
import { Pressable, PressableProps } from '../views/Pressable';

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

  // Banana route should be preserved
  fireEvent.press(screen.getByTestId('goto-banana'));
  expect(screen).toHaveSegments(['(group)', 'banana', 'shape']);
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

it('can dynamically add tabs', () => {
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
            <Button testID="show-all" title="Show all" onPress={() => setShowAll(true)} />
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

  fireEvent.press(screen.getByTestId('show-all'));

  // This now works because there is an orange tab
  act(() => router.push('/orange'));
  expect(screen).toHaveSegments(['orange']);
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
        const fruit = useLocalSearchParams().fruit.toString();
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
});

it('can update href dynamically', () => {
  const MockContext = React.createContext({ href: '/a', setHref: (href: string) => {} });
  renderRouter({
    _layout: function TabLayout() {
      const [href, setHref] = useState('/a');
      return (
        <MockContext.Provider value={{ href, setHref }}>
          <Tabs>
            <TabSlot />
            <TabList>
              <TabTrigger name="index" href="/">
                <Text>Index</Text>
              </TabTrigger>
              <TabTrigger name="[p]" href={href}>
                <Text>{href}</Text>
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
            onPress={() => setHref(href === '/a' ? '/b' : '/a')}
          />
        </View>
      );
    },
    '[p]': function P() {
      const { p } = useLocalSearchParams();
      return <Text testID="page">{p}</Text>;
    },
  });
  expect(screen.getByTestId('index')).toBeVisible();
  expect(screen.queryByTestId('page')).toBeNull();
  expect(screen.getByText('/a')).toBeVisible();
  expect(screen.getByText('Index')).toBeVisible();

  fireEvent.press(screen.getByText('/a'));
  expect(screen.queryByTestId('index')).toBeNull();
  expect(screen.getByTestId('page')).toBeVisible();
  expect(screen.getByTestId('page')).toHaveTextContent('a');
  expect(screen.getByText('Index')).toBeVisible();

  fireEvent.press(screen.getByText('Index'));
  expect(screen.getByTestId('index')).toBeVisible();
  expect(screen.queryByTestId('page')).toBeNull();

  fireEvent.press(screen.getByTestId('toggle'));
  expect(screen.getByText('/b')).toBeVisible();
  expect(screen.queryByText('/a')).toBeNull();

  fireEvent.press(screen.getByText('/b'));
  expect(screen.getByTestId('page')).toBeVisible();
  expect(screen.getByTestId('page')).toHaveTextContent('b');
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
