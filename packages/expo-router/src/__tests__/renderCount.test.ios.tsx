import { act, screen } from '@testing-library/react-native';
import { useEffect, type ComponentType } from 'react';
import { Text } from 'react-native';

import { router, useNavigation, usePathname, useRouter } from '../exports';
import { store } from '../global-state/router-store';
import { Stack } from '../layouts/Stack';
import { Tabs } from '../layouts/Tabs';
import { renderRouter } from '../testing-library';

// TODO(@ubax): remove this once types are fixed in tests
const TestTabs = Tabs as unknown as ComponentType;
const TestStack = Stack as unknown as ComponentType;

const noop = () => {};

describe('Tabs render counts', () => {
  // noop = no hook
  it.each([noop, useNavigation, useRouter])(
    'when %p hook is used, screens are only rerendered on focus',
    (hook) => {
      const layoutRender = jest.fn();
      const indexRender = jest.fn();
      const twoRender = jest.fn();

      renderRouter({
        _layout: function Layout() {
          layoutRender();
          hook();
          return <TestTabs />;
        },
        index: function Index() {
          indexRender();
          hook();
          return <Text testID="index">Index</Text>;
        },
        two: function Two() {
          twoRender();
          hook();
          return <Text testID="two">Two</Text>;
        },
      });

      expect(screen.getByTestId('index')).toBeVisible();

      expect(layoutRender).toHaveBeenCalledTimes(1);
      expect(indexRender).toHaveBeenCalledTimes(1);
      expect(twoRender).not.toHaveBeenCalled();

      jest.clearAllMocks();

      act(() => router.push('/two'));

      expect(screen.getByTestId('two')).toBeVisible();

      expect(layoutRender).not.toHaveBeenCalled();
      expect(indexRender).not.toHaveBeenCalled();
      expect(twoRender).toHaveBeenCalledTimes(1);

      jest.clearAllMocks();

      act(() => router.push('/'));

      expect(screen.getByTestId('index')).toBeVisible();

      expect(layoutRender).not.toHaveBeenCalled();
      expect(indexRender).toHaveBeenCalledTimes(1);
      expect(twoRender).not.toHaveBeenCalled();
    }
  );

  it('screens are always rerendered when pathname changes', () => {
    const layoutRender = jest.fn();
    const indexRender = jest.fn();
    const twoRender = jest.fn();

    renderRouter({
      _layout: function Layout() {
        layoutRender();
        usePathname();
        return <TestTabs />;
      },
      index: function Index() {
        indexRender();
        usePathname();
        return <Text testID="index">Index</Text>;
      },
      two: function Two() {
        twoRender();
        usePathname();
        return <Text testID="two">Two</Text>;
      },
    });

    expect(screen.getByTestId('index')).toBeVisible();

    expect(layoutRender).toHaveBeenCalledTimes(1);
    expect(indexRender).toHaveBeenCalledTimes(1);
    expect(twoRender).not.toHaveBeenCalled();

    jest.clearAllMocks();

    act(() => router.push('/two'));

    expect(screen.getByTestId('two')).toBeVisible();

    expect(layoutRender).toHaveBeenCalledTimes(1);
    expect(indexRender).toHaveBeenCalledTimes(1);
    expect(twoRender).toHaveBeenCalledTimes(1);

    jest.clearAllMocks();

    act(() => router.push('/'));

    expect(screen.getByTestId('index')).toBeVisible();

    expect(layoutRender).toHaveBeenCalledTimes(1);
    expect(indexRender).toHaveBeenCalledTimes(1);
    expect(twoRender).toHaveBeenCalledTimes(1);
  });
});

describe('Stack render counts', () => {
  // noop = no hook
  it.each([noop, useNavigation, useRouter])(
    'when %p hook is used, screens are only rerendered on push',
    (hook) => {
      const layoutRender = jest.fn();
      const indexRender = jest.fn();
      const twoRender = jest.fn();

      function expectNoRerenders() {
        expect(layoutRender).not.toHaveBeenCalled();
        expect(indexRender).not.toHaveBeenCalled();
        expect(twoRender).not.toHaveBeenCalled();
      }

      renderRouter({
        _layout: function Layout() {
          layoutRender();
          hook();
          return <TestStack />;
        },
        index: function Index() {
          indexRender();
          hook();
          return <Text testID="index">Index</Text>;
        },
        two: function Two() {
          twoRender();
          hook();
          return <Text testID="two">Two</Text>;
        },
      });

      expect(screen.getByTestId('index')).toBeVisible();

      expect(layoutRender).toHaveBeenCalledTimes(1);
      expect(indexRender).toHaveBeenCalledTimes(1);
      expect(twoRender).not.toHaveBeenCalled();

      jest.clearAllMocks();

      act(() => router.push('/two'));

      expect(screen.getByTestId('two')).toBeVisible();

      expect(layoutRender).not.toHaveBeenCalled();
      expect(indexRender).not.toHaveBeenCalled();
      expect(twoRender).toHaveBeenCalledTimes(1);

      jest.clearAllMocks();

      act(() => router.push('/'));

      expect(screen.getByTestId('index')).toBeVisible();

      expect(layoutRender).not.toHaveBeenCalled();
      expect(indexRender).toHaveBeenCalledTimes(1);
      expect(twoRender).not.toHaveBeenCalled();

      jest.clearAllMocks();

      act(() => router.back());

      expect(screen.getByTestId('two')).toBeVisible();

      expectNoRerenders();

      jest.clearAllMocks();

      act(() => router.back());

      expect(screen.getByTestId('index')).toBeVisible();

      expectNoRerenders();
    }
  );

  it('screens are always rerendered when pathname changes', () => {
    const layoutRender = jest.fn();
    const indexRender = jest.fn();
    const twoRender = jest.fn();

    renderRouter({
      _layout: function Layout() {
        layoutRender();
        usePathname();
        return <TestStack />;
      },
      index: function Index() {
        indexRender();
        usePathname();
        return <Text testID="index">Index</Text>;
      },
      two: function Two() {
        twoRender();
        usePathname();
        return <Text testID="two">Two</Text>;
      },
    });

    expect(screen.getByTestId('index')).toBeVisible();

    expect(layoutRender).toHaveBeenCalledTimes(1);
    expect(indexRender).toHaveBeenCalledTimes(1);
    expect(twoRender).not.toHaveBeenCalled();

    jest.clearAllMocks();

    act(() => router.push('/two'));

    expect(screen.getByTestId('two')).toBeVisible();

    expect(layoutRender).toHaveBeenCalledTimes(1);
    expect(indexRender).toHaveBeenCalledTimes(1);
    expect(twoRender).toHaveBeenCalledTimes(1);

    jest.clearAllMocks();

    act(() => router.push('/'));

    expect(screen.getByTestId('index')).toBeVisible();

    expect(layoutRender).toHaveBeenCalledTimes(1);
    expect(indexRender).toHaveBeenCalledTimes(2);
    expect(twoRender).toHaveBeenCalledTimes(1);

    jest.clearAllMocks();

    act(() => router.back());

    expect(screen.getByTestId('two')).toBeVisible();

    expect(layoutRender).toHaveBeenCalledTimes(1);
    expect(indexRender).toHaveBeenCalledTimes(1);
    expect(twoRender).toHaveBeenCalledTimes(1);

    jest.clearAllMocks();

    act(() => router.back());

    expect(screen.getByTestId('index')).toBeVisible();

    expect(layoutRender).toHaveBeenCalledTimes(1);
    expect(indexRender).toHaveBeenCalledTimes(1);
    expect(twoRender).not.toHaveBeenCalled();
  });

  it('screens are pushed when query params change with push', () => {
    const layoutRender = jest.fn();
    const indexRender = jest.fn();
    const indexMount = jest.fn();

    renderRouter({
      _layout: function Layout() {
        layoutRender();
        return <TestStack />;
      },
      index: function Index() {
        indexRender();
        useEffect(() => {
          indexMount();
        }, []);
        return <Text testID="index">Index</Text>;
      },
    });

    expect(screen.getByTestId('index')).toBeVisible();

    expect(layoutRender).toHaveBeenCalledTimes(1);
    expect(indexMount).toHaveBeenCalledTimes(1);
    expect(indexRender).toHaveBeenCalledTimes(1);

    expect(store.state.routes.length).toBe(1);
    expect(store.state.routes[0].name).toBe('__root');
    expect(store.state.routes[0].state.routes.length).toBe(1);
    expect(store.state.routes[0].state.routes[0].name).toBe('index');
    expect(store.state.routes[0].state.routes[0].state).toBeUndefined();

    jest.clearAllMocks();

    act(() => router.push('/?a=1'));

    expect(screen.getByTestId('index')).toBeVisible();

    expect(store.state.routes.length).toBe(1);
    expect(store.state.routes[0].name).toBe('__root');
    expect(store.state.routes[0].state.routes.length).toBe(2);
    expect(store.state.routes[0].state.routes[0].name).toBe('index');
    expect(store.state.routes[0].state.routes[0].params).toBeUndefined();
    expect(store.state.routes[0].state.routes[0].state).toBeUndefined();
    expect(store.state.routes[0].state.routes[1].name).toBe('index');
    expect(store.state.routes[0].state.routes[1].params).toStrictEqual({ a: '1' });
    expect(store.state.routes[0].state.routes[1].state).toBeUndefined();

    expect(layoutRender).not.toHaveBeenCalled();
    expect(indexMount).toHaveBeenCalledTimes(1);
    expect(indexRender).toHaveBeenCalledTimes(1);

    jest.clearAllMocks();

    act(() => router.push('/?a=2'));

    expect(screen.getByTestId('index')).toBeVisible();

    expect(store.state.routes.length).toBe(1);
    expect(store.state.routes[0].name).toBe('__root');
    expect(store.state.routes[0].state.routes.length).toBe(3);
    expect(store.state.routes[0].state.routes[0].name).toBe('index');
    expect(store.state.routes[0].state.routes[0].params).toBeUndefined();
    expect(store.state.routes[0].state.routes[0].state).toBeUndefined();
    expect(store.state.routes[0].state.routes[1].name).toBe('index');
    expect(store.state.routes[0].state.routes[1].params).toStrictEqual({ a: '1' });
    expect(store.state.routes[0].state.routes[1].state).toBeUndefined();
    expect(store.state.routes[0].state.routes[2].name).toBe('index');
    expect(store.state.routes[0].state.routes[2].params).toStrictEqual({ a: '2' });
    expect(store.state.routes[0].state.routes[2].state).toBeUndefined();

    expect(layoutRender).not.toHaveBeenCalled();
    expect(indexMount).toHaveBeenCalledTimes(1);
    expect(indexRender).toHaveBeenCalledTimes(1);
  });

  it('screens are rerendered when query params change with navigate', () => {
    const layoutRender = jest.fn();
    const indexRender = jest.fn();
    const indexMount = jest.fn();

    renderRouter({
      _layout: function Layout() {
        layoutRender();
        return <TestStack />;
      },
      index: function Index() {
        indexRender();
        useEffect(() => {
          indexMount();
        }, []);
        return <Text testID="index">Index</Text>;
      },
    });

    expect(screen.getByTestId('index')).toBeVisible();

    expect(layoutRender).toHaveBeenCalledTimes(1);
    expect(indexMount).toHaveBeenCalledTimes(1);
    expect(indexRender).toHaveBeenCalledTimes(1);

    expect(store.state.routes.length).toBe(1);
    expect(store.state.routes[0].name).toBe('__root');
    expect(store.state.routes[0].state.routes.length).toBe(1);
    expect(store.state.routes[0].state.routes[0].name).toBe('index');
    expect(store.state.routes[0].state.routes[0].state).toBeUndefined();

    jest.clearAllMocks();

    act(() => router.navigate('/?a=1'));

    expect(screen.getByTestId('index')).toBeVisible();

    expect(store.state.routes.length).toBe(1);
    expect(store.state.routes[0].name).toBe('__root');
    expect(store.state.routes[0].state.routes.length).toBe(1);
    expect(store.state.routes[0].state.routes[0].name).toBe('index');
    expect(store.state.routes[0].state.routes[0].params).toStrictEqual({ a: '1' });
    expect(store.state.routes[0].state.routes[0].state).toBeUndefined();

    expect(layoutRender).not.toHaveBeenCalled();
    expect(indexMount).not.toHaveBeenCalled();
    expect(indexRender).toHaveBeenCalledTimes(1);

    jest.clearAllMocks();

    act(() => router.navigate('/?a=2'));

    expect(screen.getByTestId('index')).toBeVisible();

    expect(store.state.routes.length).toBe(1);
    expect(store.state.routes[0].name).toBe('__root');
    expect(store.state.routes[0].state.routes.length).toBe(1);
    expect(store.state.routes[0].state.routes[0].name).toBe('index');
    expect(store.state.routes[0].state.routes[0].params).toStrictEqual({ a: '2' });
    expect(store.state.routes[0].state.routes[0].state).toBeUndefined();

    expect(layoutRender).not.toHaveBeenCalled();
    expect(indexMount).not.toHaveBeenCalled();
    expect(indexRender).toHaveBeenCalledTimes(1);
  });
});

describe('Stack nested in Tabs render counts', () => {
  it.each([noop, useNavigation, useRouter])(
    'when %p hook is used, nested stack screens are only rerendered on push',
    (hook) => {
      const layoutRender = jest.fn();
      const homeTabRender = jest.fn();
      const indexRender = jest.fn();
      const indexMount = jest.fn();
      const twoRender = jest.fn();
      const otherRender = jest.fn();

      function expectNoRerenders() {
        expect(layoutRender).not.toHaveBeenCalled();
        expect(homeTabRender).not.toHaveBeenCalled();
        expect(indexMount).not.toHaveBeenCalled();
        expect(indexRender).not.toHaveBeenCalled();
        expect(twoRender).not.toHaveBeenCalled();
        expect(otherRender).not.toHaveBeenCalled();
      }

      renderRouter({
        _layout: function Layout() {
          layoutRender();
          hook();
          return <TestTabs />;
        },
        '(index)/_layout': function HomeTab() {
          homeTabRender();
          hook();
          return <TestStack />;
        },
        '(index)/index': function Index() {
          indexRender();
          useEffect(() => {
            indexMount();
          }, []);
          hook();
          return <Text testID="index">Index</Text>;
        },
        '(index)/two': function Two() {
          twoRender();
          hook();
          return <Text testID="two">Two</Text>;
        },
        other: function Other() {
          otherRender();
          hook();
          return <Text testID="other">Other</Text>;
        },
      });

      expect(screen.getByTestId('index')).toBeVisible();

      expect(layoutRender).toHaveBeenCalledTimes(1);
      expect(homeTabRender).toHaveBeenCalledTimes(1);
      expect(indexMount).toHaveBeenCalledTimes(1);
      expect(indexRender).toHaveBeenCalledTimes(1);
      expect(twoRender).not.toHaveBeenCalled();
      expect(otherRender).not.toHaveBeenCalled();

      jest.clearAllMocks();

      act(() => router.push('/two'));

      expect(screen.getByTestId('two')).toBeVisible();

      expect(layoutRender).not.toHaveBeenCalled();
      expect(homeTabRender).not.toHaveBeenCalled();
      expect(indexMount).not.toHaveBeenCalled();
      expect(indexRender).not.toHaveBeenCalled();
      expect(twoRender).toHaveBeenCalledTimes(1);
      expect(otherRender).not.toHaveBeenCalled();

      jest.clearAllMocks();

      act(() => router.push('/other'));

      expect(screen.getByTestId('other')).toBeVisible();

      expect(layoutRender).not.toHaveBeenCalled();
      expect(homeTabRender).not.toHaveBeenCalled();
      expect(indexMount).not.toHaveBeenCalled();
      expect(indexRender).not.toHaveBeenCalled();
      expect(twoRender).not.toHaveBeenCalled();
      expect(otherRender).toHaveBeenCalledTimes(1);

      jest.clearAllMocks();

      act(() => router.push('/'));

      expect(screen.getByTestId('index')).toBeVisible();

      expect(layoutRender).not.toHaveBeenCalled();
      // TODO(@ubax): reduce the number of renders
      expect(homeTabRender).toHaveBeenCalledTimes(2);
      expect(indexMount).toHaveBeenCalledTimes(1);
      // TODO(@ubax): reduce the number of renders
      expect(indexRender).toHaveBeenCalledTimes(4);
      // TODO(@ubax): reduce the number of renders
      expect(twoRender).toHaveBeenCalledTimes(2);
      expect(otherRender).not.toHaveBeenCalled();
      expect(router.canGoBack()).toBe(true);

      jest.clearAllMocks();

      act(() => router.back());

      expect(screen.getByTestId('two')).toBeVisible();
      expectNoRerenders();
      expect(router.canGoBack()).toBe(true);

      jest.clearAllMocks();

      act(() => router.back());

      expect(screen.getByTestId('index')).toBeVisible();

      expectNoRerenders();
      expect(router.canGoBack()).toBe(false);
    }
  );

  it('nested stack screens are always rerendered when pathname changes', () => {
    const layoutRender = jest.fn();
    const homeTabRender = jest.fn();
    const indexRender = jest.fn();
    const indexMount = jest.fn();
    const twoRender = jest.fn();
    const otherRender = jest.fn();

    renderRouter({
      _layout: function Layout() {
        layoutRender();
        usePathname();
        return <TestTabs />;
      },
      '(index)/_layout': function HomeTab() {
        homeTabRender();
        usePathname();
        return <TestStack />;
      },
      '(index)/index': function Index() {
        indexRender();
        useEffect(() => {
          indexMount();
        }, []);
        usePathname();
        return <Text testID="index">Index</Text>;
      },
      '(index)/two': function Two() {
        twoRender();
        usePathname();
        return <Text testID="two">Two</Text>;
      },
      other: function Other() {
        otherRender();
        usePathname();
        return <Text testID="other">Other</Text>;
      },
    });

    expect(screen.getByTestId('index')).toBeVisible();

    expect(layoutRender).toHaveBeenCalledTimes(1);
    expect(homeTabRender).toHaveBeenCalledTimes(1);
    expect(indexMount).toHaveBeenCalledTimes(1);
    expect(indexRender).toHaveBeenCalledTimes(1);
    expect(twoRender).not.toHaveBeenCalled();
    expect(otherRender).not.toHaveBeenCalled();

    jest.clearAllMocks();

    act(() => router.push('/two'));

    expect(screen.getByTestId('two')).toBeVisible();

    expect(layoutRender).toHaveBeenCalledTimes(1);
    expect(homeTabRender).toHaveBeenCalledTimes(1);
    expect(indexMount).not.toHaveBeenCalled();
    expect(indexRender).toHaveBeenCalledTimes(1);
    expect(twoRender).toHaveBeenCalledTimes(1);
    expect(otherRender).not.toHaveBeenCalled();

    jest.clearAllMocks();

    act(() => router.push('/other'));

    expect(screen.getByTestId('other')).toBeVisible();

    expect(layoutRender).toHaveBeenCalledTimes(1);
    expect(homeTabRender).toHaveBeenCalledTimes(1);
    expect(indexMount).not.toHaveBeenCalled();
    expect(indexRender).toHaveBeenCalledTimes(1);
    expect(twoRender).toHaveBeenCalledTimes(1);
    expect(otherRender).toHaveBeenCalledTimes(1);

    jest.clearAllMocks();

    act(() => router.push('/'));

    expect(screen.getByTestId('index')).toBeVisible();

    expect(layoutRender).toHaveBeenCalledTimes(1);
    // TODO(@ubax): reduce the number of renders
    expect(homeTabRender).toHaveBeenCalledTimes(2);
    expect(indexMount).toHaveBeenCalledTimes(1);
    // TODO(@ubax): reduce the number of renders
    expect(indexRender).toHaveBeenCalledTimes(4); // pathname change causes rerender
    // TODO(@ubax): reduce the number of renders
    expect(twoRender).toHaveBeenCalledTimes(2);
    expect(otherRender).toHaveBeenCalledTimes(1);
    expect(router.canGoBack()).toBe(true);

    jest.clearAllMocks();

    act(() => router.back());

    expect(screen.getByTestId('two')).toBeVisible();
    expect(layoutRender).toHaveBeenCalledTimes(1);
    expect(homeTabRender).toHaveBeenCalledTimes(1);
    expect(indexMount).not.toHaveBeenCalled();
    expect(indexRender).toHaveBeenCalledTimes(1);
    expect(twoRender).toHaveBeenCalledTimes(1);
    expect(otherRender).toHaveBeenCalledTimes(1);
    expect(router.canGoBack()).toBe(true);

    jest.clearAllMocks();

    act(() => router.back());

    expect(screen.getByTestId('index')).toBeVisible();

    expect(layoutRender).toHaveBeenCalledTimes(1);
    expect(homeTabRender).toHaveBeenCalledTimes(1);
    expect(indexMount).not.toHaveBeenCalled();
    expect(indexRender).toHaveBeenCalledTimes(1);
    expect(twoRender).not.toHaveBeenCalled();
    expect(otherRender).toHaveBeenCalledTimes(1);
    expect(router.canGoBack()).toBe(false);
  });
});
