import { useEffect, useState } from 'react';
import { Text } from 'react-native';

import { usePathname, useLocalSearchParams } from '../hooks';
import { router } from '../imperative-api';
import { Stack } from '../layouts/Stack';
import { Tabs } from '../layouts/Tabs';
import { renderRouter, fireEvent, act, waitFor, screen } from '../testing-library';
import { useIsFocused } from '../useIsFocused';

it('should return correct pathname for nested stack with initialRouteName', async () => {
  const indexRenderCount = jest.fn();
  const innerIndexRenderCount = jest.fn();
  const innerARenderCount = jest.fn();
  renderRouter({
    _layout: function Layout() {
      return <Tabs />;
    },
    index: function Index() {
      indexRenderCount();
      return <Text testID="index-pathname">{usePathname()}</Text>;
    },
    'inner/_layout': () => <Stack initialRouteName="a" />,
    'inner/index': function InnerIndex() {
      innerIndexRenderCount();
      return <Text testID="inner-index-pathname">{usePathname()}</Text>;
    },
    'inner/a': function InnerA() {
      innerARenderCount();
      return <Text testID="inner-a-pathname">{usePathname()}</Text>;
    },
  });

  expect(screen.getByTestId('index-pathname')).toBeVisible();
  expect(screen.queryByTestId('inner-index-pathname')).toBeNull();
  expect(screen.queryByTestId('inner-a-pathname')).toBeNull();
  expect(screen.getByTestId('index-pathname')).toHaveTextContent('/');
  expect(indexRenderCount).toHaveBeenCalledTimes(1);
  expect(innerIndexRenderCount).toHaveBeenCalledTimes(0);
  expect(innerARenderCount).toHaveBeenCalledTimes(0);

  indexRenderCount.mockClear();

  act(() => fireEvent.press(screen.getByLabelText('inner, tab, 2 of 2')));

  expect(screen.queryByTestId('index-pathname')).toBeNull();
  expect(screen.queryByTestId('inner-index-pathname')).toBeNull();
  expect(screen.getByTestId('inner-a-pathname')).toBeVisible();
  expect(screen.getByTestId('inner-a-pathname')).toHaveTextContent('/inner/a');
  expect(indexRenderCount).toHaveBeenCalledTimes(1);
  expect(innerIndexRenderCount).toHaveBeenCalledTimes(0);
  expect(innerARenderCount).toHaveBeenCalledTimes(1);
});

it('should return correct pathname for nested stack with initialRouteName, after push', async () => {
  const indexRenderCount = jest.fn();
  const innerIndexRenderCount = jest.fn();
  const innerARenderCount = jest.fn();
  renderRouter({
    _layout: function Layout() {
      return <Tabs />;
    },
    index: function Index() {
      indexRenderCount();
      return <Text testID="index-pathname">{usePathname()}</Text>;
    },
    'inner/_layout': () => <Stack initialRouteName="a" />,
    'inner/index': function InnerIndex() {
      innerIndexRenderCount();
      return <Text testID="inner-index-pathname">{usePathname()}</Text>;
    },
    'inner/a': function InnerA() {
      innerARenderCount();
      return <Text testID="inner-a-pathname">{usePathname()}</Text>;
    },
  });

  expect(screen.getByTestId('index-pathname')).toBeVisible();
  expect(screen.queryByTestId('inner-index-pathname')).toBeNull();
  expect(screen.queryByTestId('inner-a-pathname')).toBeNull();
  expect(screen.getByTestId('index-pathname')).toHaveTextContent('/');
  expect(indexRenderCount).toHaveBeenCalledTimes(1);
  expect(innerIndexRenderCount).toHaveBeenCalledTimes(0);
  expect(innerARenderCount).toHaveBeenCalledTimes(0);

  indexRenderCount.mockClear();

  act(() => router.push('/inner'));

  expect(screen.queryByTestId('index-pathname')).toBeNull();
  expect(screen.getByTestId('inner-index-pathname')).toBeVisible();
  expect(screen.queryByTestId('inner-a-pathname')).toBeNull();
  expect(screen.getByTestId('inner-index-pathname')).toHaveTextContent('/inner');
  expect(indexRenderCount).toHaveBeenCalledTimes(1);
  expect(innerIndexRenderCount).toHaveBeenCalledTimes(1);
  expect(innerARenderCount).toHaveBeenCalledTimes(0);
});

it('can navigate during first render', async () => {
  expect(() =>
    renderRouter({
      _layout: function Layout() {
        const [ready, setReady] = useState(false);
        useEffect(() => {
          setReady(true);
        }, []);
        if (!ready) {
          return null;
        }
        return <Stack />;
      },
      index: function Index() {
        useEffect(() => {
          router.push('/second');
        }, []);
        return <Text testID="index">Index</Text>;
      },
      second: () => <Text testID="second">Second</Text>,
    })
  ).not.toThrow(
    'Attempted to navigate before mounting the Root Layout component. Ensure the Root Layout component is rendering a Slot, or other navigator on the first render.'
  );

  expect(screen.getByTestId('second')).toBeVisible();
  expect(screen.queryByTestId('index')).toBeNull();

  act(() => router.back());

  await waitFor(() => expect(screen.getByTestId('index')).toBeVisible());
  expect(screen.queryByTestId('second')).toBeNull();
});

it('can navigate during first render of nested navigator', async () => {
  const layoutMount = jest.fn();
  const innerLayoutMount = jest.fn();
  const innerIndexMount = jest.fn();
  const innerSecondMount = jest.fn();
  renderRouter({
    _layout: function Layout() {
      useEffect(() => {
        layoutMount();
      }, []);
      return <Stack />;
    },
    index: () => <Text testID="index">Index</Text>,
    'inner/_layout': function InnerLayout() {
      useEffect(() => {
        innerLayoutMount();
      }, []);
      return <Stack />;
    },
    'inner/index': function Index() {
      const isFocused = useIsFocused();
      useEffect(() => {
        innerIndexMount();
      }, []);
      useEffect(() => {
        if (isFocused) {
          router.push('/inner/second');
        }
      }, [isFocused]);
      return <Text testID="inner-index">Inner Index</Text>;
    },
    'inner/second': function Second() {
      useEffect(() => {
        innerSecondMount();
      }, []);
      return <Text testID="inner-second">Inner Second</Text>;
    },
  });

  expect(screen.getByTestId('index')).toBeVisible();
  expect(screen.queryByTestId('inner-index')).toBeNull();
  expect(screen.queryByTestId('inner-second')).toBeNull();
  expect(layoutMount).toHaveBeenCalledTimes(1);
  expect(innerLayoutMount).toHaveBeenCalledTimes(0);
  expect(innerIndexMount).toHaveBeenCalledTimes(0);
  expect(innerSecondMount).toHaveBeenCalledTimes(0);

  act(() => {
    router.push('/inner');
  });

  expect(screen.queryByTestId('index')).toBeNull();
  expect(screen.queryByTestId('inner-index')).toBeNull();
  expect(screen.getByTestId('inner-second')).toBeVisible();
  expect(layoutMount).toHaveBeenCalledTimes(1);
  expect(innerLayoutMount).toHaveBeenCalledTimes(1);
  expect(innerIndexMount).toHaveBeenCalledTimes(1);
  expect(innerSecondMount).toHaveBeenCalledTimes(1);
});

it('push withAnchor into a nested stack whose only screen is a dynamic route does not create a param-less anchor', () => {
  // Issue #47114: withAnchor used to seed a param-less duplicate of the dynamic
  // route (its own initial route), so back landed on it instead of the parent.
  const userMount = jest.fn();
  renderRouter({
    '(tabs)/_layout': () => <Tabs />,
    '(tabs)/index': () => <Text testID="home">home</Text>,
    '(tabs)/social/_layout': () => <Stack />,
    '(tabs)/social/index': () => <Text testID="social-index">social</Text>,
    '(tabs)/social/users/_layout': () => <Stack />,
    '(tabs)/social/users/[userId]': function User() {
      const { userId } = useLocalSearchParams<{ userId: string }>();
      useEffect(() => {
        userMount();
      }, []);
      return <Text testID="user">userId: {userId}</Text>;
    },
  });

  act(() => router.navigate('/social'));
  act(() => router.push('/social/users/1', { withAnchor: true }));

  expect(screen).toHavePathname('/social/users/1');
  expect(screen.getByTestId('user')).toHaveTextContent('userId: 1');
  // Instantiated exactly once (no param-less anchor).
  expect(userMount).toHaveBeenCalledTimes(1);

  // Back returns to the parent, not a param-less [userId].
  act(() => router.back());

  expect(screen).toHavePathname('/social');
  expect(screen.getByTestId('social-index')).toBeVisible();
});

it('push withAnchor still seeds the real initial route of a nested stack with multiple screens', () => {
  // Issue #47114 guard: the self-anchor check must use the runtime initial route
  // (sorted: `index` before `[id]`), so `index` is still seeded as the anchor.
  const indexMount = jest.fn();
  renderRouter({
    '(tabs)/_layout': () => <Tabs />,
    '(tabs)/index': () => <Text testID="home">home</Text>,
    // `[id]` declared before `index`, but `index` is the runtime initial route.
    '(tabs)/shop/_layout': () => <Stack />,
    '(tabs)/shop/[id]': function ShopItem() {
      return <Text testID="shop-item">{useLocalSearchParams<{ id: string }>().id}</Text>;
    },
    '(tabs)/shop/index': function ShopIndex() {
      useEffect(() => {
        indexMount();
      }, []);
      return <Text testID="shop-index">shop</Text>;
    },
  });

  // Push into the fresh shop stack (still on the home tab).
  act(() => router.push('/shop/7', { withAnchor: true }));

  expect(screen).toHavePathname('/shop/7');
  expect(screen.getByTestId('shop-item')).toHaveTextContent('7');
  // The `index` anchor was seeded below the target.
  expect(indexMount).toHaveBeenCalledTimes(1);

  act(() => router.back());

  expect(screen).toHavePathname('/shop');
  expect(screen.getByTestId('shop-index')).toBeVisible();
});

it('push withAnchor seeds an anchor under a dynamic segment with its dynamic params', () => {
  // Issue #47114: when the seeded anchor lives under a dynamic segment (e.g.
  // `[id]/index` reached via `/posts/1/details`), the anchor must carry the
  // dynamic param, otherwise back lands on a param-less screen.
  renderRouter({
    '(tabs)/_layout': () => <Tabs />,
    '(tabs)/index': () => <Text testID="home">home</Text>,
    '(tabs)/posts/_layout': () => <Stack />,
    '(tabs)/posts/[id]/_layout': () => <Stack />,
    '(tabs)/posts/[id]/index': function PostDetail() {
      const { id } = useLocalSearchParams<{ id: string }>();
      return <Text testID="detail">id: {id}</Text>;
    },
    '(tabs)/posts/[id]/details': () => <Text testID="details">details</Text>,
  });

  act(() => router.push('/posts/1/details', { withAnchor: true }));
  expect(screen.getByTestId('details')).toBeVisible();

  // Back lands on the seeded anchor, which keeps the dynamic `id` param.
  act(() => router.back());

  expect(screen).toHavePathname('/posts/1');
  expect(screen.getByTestId('detail')).toHaveTextContent('id: 1');
});
