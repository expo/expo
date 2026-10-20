import { act, screen } from '@testing-library/react-native';
import { useEffect, type ComponentType, type ReactNode } from 'react';
import { Text } from 'react-native';

import { router, useLocalSearchParams, useNavigation, usePathname, useRouter } from '../exports';
import { Stack } from '../layouts/Stack';
import { Tabs } from '../layouts/Tabs';
import { renderRouter } from '../testing-library';

// TODO(@ubax): remove this once types are fixed in tests
const TestTabs = Tabs as unknown as ComponentType<{ children: ReactNode }>;
const TestStack = Stack as unknown as ComponentType;

const noop = () => {};

describe('Tabs render counts', () => {
  // noop = no hook
  it.each([noop, useNavigation, useRouter])(
    'when %p hook is used, screens are only rerendered on focus',
    async (hook) => {
      const layoutRender = jest.fn();
      const indexRender = jest.fn();
      const twoRender = jest.fn();

      await renderRouter({
        _layout: function Layout() {
          layoutRender();
          hook();
          return (
            <TestTabs>
              <Tabs.Screen name="index" />
              <Tabs.Screen name="two" />
            </TestTabs>
          );
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

      await act(() => router.push('/two'));

      expect(screen.getByTestId('two')).toBeVisible();

      expect(layoutRender).not.toHaveBeenCalled();
      expect(indexRender).not.toHaveBeenCalled();
      expect(twoRender).toHaveBeenCalledTimes(1);

      jest.clearAllMocks();

      await act(() => router.push('/'));

      expect(screen.getByTestId('index')).toBeVisible();

      expect(layoutRender).not.toHaveBeenCalled();
      expect(indexRender).toHaveBeenCalledTimes(1);
      expect(twoRender).not.toHaveBeenCalled();
    }
  );

  it('screens are always rerendered when pathname changes', async () => {
    const layoutRender = jest.fn();
    const indexRender = jest.fn();
    const twoRender = jest.fn();

    await renderRouter({
      _layout: function Layout() {
        layoutRender();
        usePathname();
        return (
          <TestTabs>
            <Tabs.Screen name="index" />
            <Tabs.Screen name="two" />
          </TestTabs>
        );
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

    await act(() => router.push('/two'));

    expect(screen.getByTestId('two')).toBeVisible();

    expect(layoutRender).toHaveBeenCalledTimes(1);
    expect(indexRender).toHaveBeenCalledTimes(1);
    expect(twoRender).toHaveBeenCalledTimes(1);

    jest.clearAllMocks();

    await act(() => router.push('/'));

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
    async (hook) => {
      const layoutRender = jest.fn();
      const indexRender = jest.fn();
      const twoRender = jest.fn();

      function expectNoRerenders() {
        expect(layoutRender).not.toHaveBeenCalled();
        expect(indexRender).not.toHaveBeenCalled();
        expect(twoRender).not.toHaveBeenCalled();
      }

      await renderRouter({
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

      await act(() => router.push('/two'));

      expect(screen.getByTestId('two')).toBeVisible();

      expect(layoutRender).not.toHaveBeenCalled();
      expect(indexRender).not.toHaveBeenCalled();
      expect(twoRender).toHaveBeenCalledTimes(1);

      jest.clearAllMocks();

      await act(() => router.push('/'));

      expect(screen.getByTestId('index')).toBeVisible();

      expect(layoutRender).not.toHaveBeenCalled();
      expect(indexRender).toHaveBeenCalledTimes(1);
      expect(twoRender).not.toHaveBeenCalled();

      jest.clearAllMocks();

      await act(() => router.back());

      expect(screen.getByTestId('two')).toBeVisible();

      expectNoRerenders();

      jest.clearAllMocks();

      await act(() => router.back());

      expect(screen.getByTestId('index')).toBeVisible();

      expectNoRerenders();
    }
  );

  it('screens are always rerendered when pathname changes', async () => {
    const layoutRender = jest.fn();
    const indexRender = jest.fn();
    const twoRender = jest.fn();

    await renderRouter({
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

    await act(() => router.push('/two'));

    expect(screen.getByTestId('two')).toBeVisible();

    expect(layoutRender).toHaveBeenCalledTimes(1);
    expect(indexRender).toHaveBeenCalledTimes(1);
    expect(twoRender).toHaveBeenCalledTimes(1);

    jest.clearAllMocks();

    await act(() => router.push('/'));

    expect(screen.getByTestId('index')).toBeVisible();

    expect(layoutRender).toHaveBeenCalledTimes(1);
    expect(indexRender).toHaveBeenCalledTimes(2);
    expect(twoRender).toHaveBeenCalledTimes(1);

    jest.clearAllMocks();

    await act(() => router.back());

    expect(screen.getByTestId('two')).toBeVisible();

    expect(layoutRender).toHaveBeenCalledTimes(1);
    expect(indexRender).toHaveBeenCalledTimes(1);
    expect(twoRender).toHaveBeenCalledTimes(1);

    jest.clearAllMocks();

    await act(() => router.back());

    expect(screen.getByTestId('index')).toBeVisible();

    expect(layoutRender).toHaveBeenCalledTimes(1);
    expect(indexRender).toHaveBeenCalledTimes(1);
    expect(twoRender).not.toHaveBeenCalled();
  });
});

describe('Stack nested in Tabs render counts', () => {
  it.each([noop, useNavigation, useRouter])(
    'when %p hook is used, nested stack screens are only rerendered on push',
    async (hook) => {
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

      await renderRouter({
        _layout: function Layout() {
          layoutRender();
          hook();
          return (
            <TestTabs>
              <Tabs.Screen name="(index)" />
              <Tabs.Screen name="other" />
            </TestTabs>
          );
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

      await act(() => router.push('/two'));

      expect(screen.getByTestId('two')).toBeVisible();

      expect(layoutRender).not.toHaveBeenCalled();
      expect(homeTabRender).not.toHaveBeenCalled();
      expect(indexMount).not.toHaveBeenCalled();
      expect(indexRender).not.toHaveBeenCalled();
      expect(twoRender).toHaveBeenCalledTimes(1);
      expect(otherRender).not.toHaveBeenCalled();

      jest.clearAllMocks();

      await act(() => router.push('/other'));

      expect(screen.getByTestId('other')).toBeVisible();

      expect(layoutRender).not.toHaveBeenCalled();
      expect(homeTabRender).not.toHaveBeenCalled();
      expect(indexMount).not.toHaveBeenCalled();
      expect(indexRender).not.toHaveBeenCalled();
      expect(twoRender).not.toHaveBeenCalled();
      expect(otherRender).toHaveBeenCalledTimes(1);

      jest.clearAllMocks();

      await act(() => router.push('/'));

      expect(screen.getByTestId('index')).toBeVisible();

      expect(layoutRender).not.toHaveBeenCalled();
      expect(homeTabRender).toHaveBeenCalledTimes(1);
      expect(indexMount).toHaveBeenCalledTimes(1);
      expect(indexRender).toHaveBeenCalledTimes(2);
      expect(twoRender).toHaveBeenCalledTimes(1);
      expect(otherRender).not.toHaveBeenCalled();
      expect(router.canGoBack()).toBe(true);

      jest.clearAllMocks();

      await act(() => router.back());

      expect(screen.getByTestId('two')).toBeVisible();
      expectNoRerenders();
      expect(router.canGoBack()).toBe(true);

      jest.clearAllMocks();

      await act(() => router.back());

      expect(screen.getByTestId('index')).toBeVisible();

      expectNoRerenders();
      expect(router.canGoBack()).toBe(false);
    }
  );

  it('nested stack screens are always rerendered when pathname changes', async () => {
    const layoutRender = jest.fn();
    const homeTabRender = jest.fn();
    const indexRender = jest.fn();
    const indexMount = jest.fn();
    const twoRender = jest.fn();
    const otherRender = jest.fn();

    await renderRouter({
      _layout: function Layout() {
        layoutRender();
        usePathname();
        return (
          <TestTabs>
            <Tabs.Screen name="(index)" />
            <Tabs.Screen name="other" />
          </TestTabs>
        );
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

    await act(() => router.push('/two'));

    expect(screen.getByTestId('two')).toBeVisible();

    expect(layoutRender).toHaveBeenCalledTimes(1);
    expect(homeTabRender).toHaveBeenCalledTimes(1);
    expect(indexMount).not.toHaveBeenCalled();
    expect(indexRender).toHaveBeenCalledTimes(1);
    expect(twoRender).toHaveBeenCalledTimes(1);
    expect(otherRender).not.toHaveBeenCalled();

    jest.clearAllMocks();

    await act(() => router.push('/other'));

    expect(screen.getByTestId('other')).toBeVisible();

    expect(layoutRender).toHaveBeenCalledTimes(1);
    expect(homeTabRender).toHaveBeenCalledTimes(1);
    expect(indexMount).not.toHaveBeenCalled();
    expect(indexRender).toHaveBeenCalledTimes(1);
    expect(twoRender).toHaveBeenCalledTimes(1);
    expect(otherRender).toHaveBeenCalledTimes(1);

    jest.clearAllMocks();

    await act(() => router.push('/'));

    expect(screen.getByTestId('index')).toBeVisible();

    expect(layoutRender).toHaveBeenCalledTimes(1);
    expect(homeTabRender).toHaveBeenCalledTimes(1);
    expect(indexMount).toHaveBeenCalledTimes(1);
    expect(indexRender).toHaveBeenCalledTimes(2);
    expect(twoRender).toHaveBeenCalledTimes(1);
    expect(otherRender).toHaveBeenCalledTimes(1);
    expect(router.canGoBack()).toBe(true);

    jest.clearAllMocks();

    await act(() => router.back());

    expect(screen.getByTestId('two')).toBeVisible();
    expect(layoutRender).toHaveBeenCalledTimes(1);
    expect(homeTabRender).toHaveBeenCalledTimes(1);
    expect(indexMount).not.toHaveBeenCalled();
    expect(indexRender).toHaveBeenCalledTimes(1);
    expect(twoRender).toHaveBeenCalledTimes(1);
    expect(otherRender).toHaveBeenCalledTimes(1);
    expect(router.canGoBack()).toBe(true);

    jest.clearAllMocks();

    await act(() => router.back());

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

describe('useLocalSearchParams render counts', () => {
  let layoutRender: jest.Mock;
  let idLayoutRender: jest.Mock;
  let indexRender: jest.Mock;
  let detailsRender: jest.Mock;

  beforeEach(() => {
    layoutRender = jest.fn();
    idLayoutRender = jest.fn();
    indexRender = jest.fn();
    detailsRender = jest.fn();
  });

  const renderApp = (layoutHook: () => unknown, pageHook: () => unknown) =>
    renderRouter(
      {
        _layout: function Layout() {
          layoutRender();
          layoutHook();
          return <TestStack />;
        },
        '[id]/_layout': function IdLayout() {
          idLayoutRender();
          layoutHook();
          return <TestStack />;
        },
        '[id]/index': function Index() {
          indexRender();
          pageHook();
          return <Text testID="index">Index</Text>;
        },
        '[id]/details': function Details() {
          detailsRender();
          pageHook();
          return <Text testID="details">Details</Text>;
        },
      },
      { initialUrl: '/1' }
    );

  it('rerenders layouts on push and setParams when used in layouts only', async () => {
    await renderApp(useLocalSearchParams, noop);

    expect(screen.getByTestId('index')).toBeVisible();

    expect(layoutRender).toHaveBeenCalledTimes(1);
    expect(idLayoutRender).toHaveBeenCalledTimes(1);
    expect(indexRender).toHaveBeenCalledTimes(1);
    expect(detailsRender).not.toHaveBeenCalled();

    jest.clearAllMocks();

    await act(() => router.push('/1/details?tab=info'));

    expect(screen.getByTestId('details')).toBeVisible();

    expect(layoutRender).toHaveBeenCalledTimes(1);
    expect(idLayoutRender).toHaveBeenCalledTimes(1);
    expect(indexRender).not.toHaveBeenCalled();
    expect(detailsRender).toHaveBeenCalledTimes(1);

    jest.clearAllMocks();

    await act(() => router.setParams({ tab: 'more' }));

    expect(layoutRender).toHaveBeenCalledTimes(1);
    expect(idLayoutRender).toHaveBeenCalledTimes(1);
    expect(indexRender).not.toHaveBeenCalled();
    expect(detailsRender).toHaveBeenCalledTimes(1);
  });

  it('does not rerender layouts on push and setParams when used in pages only', async () => {
    await renderApp(noop, useLocalSearchParams);

    expect(screen.getByTestId('index')).toBeVisible();

    expect(layoutRender).toHaveBeenCalledTimes(1);
    expect(idLayoutRender).toHaveBeenCalledTimes(1);
    expect(indexRender).toHaveBeenCalledTimes(1);
    expect(detailsRender).not.toHaveBeenCalled();

    jest.clearAllMocks();

    await act(() => router.push('/1/details?tab=info'));

    expect(screen.getByTestId('details')).toBeVisible();

    expect(layoutRender).not.toHaveBeenCalled();
    expect(idLayoutRender).not.toHaveBeenCalled();
    expect(indexRender).not.toHaveBeenCalled();
    expect(detailsRender).toHaveBeenCalledTimes(1);

    jest.clearAllMocks();

    await act(() => router.setParams({ tab: 'more' }));

    expect(layoutRender).not.toHaveBeenCalled();
    expect(idLayoutRender).not.toHaveBeenCalled();
    expect(indexRender).not.toHaveBeenCalled();
    expect(detailsRender).toHaveBeenCalledTimes(1);
  });

  it('rerenders layouts on push and setParams when used in layouts and pages', async () => {
    await renderApp(useLocalSearchParams, useLocalSearchParams);

    expect(screen.getByTestId('index')).toBeVisible();

    expect(layoutRender).toHaveBeenCalledTimes(1);
    expect(idLayoutRender).toHaveBeenCalledTimes(1);
    expect(indexRender).toHaveBeenCalledTimes(1);
    expect(detailsRender).not.toHaveBeenCalled();

    jest.clearAllMocks();

    await act(() => router.push('/1/details?tab=info'));

    expect(screen.getByTestId('details')).toBeVisible();

    expect(layoutRender).toHaveBeenCalledTimes(1);
    expect(idLayoutRender).toHaveBeenCalledTimes(1);
    expect(indexRender).not.toHaveBeenCalled();
    expect(detailsRender).toHaveBeenCalledTimes(1);

    jest.clearAllMocks();

    await act(() => router.setParams({ tab: 'more' }));

    expect(layoutRender).toHaveBeenCalledTimes(1);
    expect(idLayoutRender).toHaveBeenCalledTimes(1);
    expect(indexRender).not.toHaveBeenCalled();
    expect(detailsRender).toHaveBeenCalledTimes(1);
  });

  it('rerenders layouts on push without params change', async () => {
    await renderApp(useLocalSearchParams, noop);

    expect(screen.getByTestId('index')).toBeVisible();

    expect(layoutRender).toHaveBeenCalledTimes(1);
    expect(idLayoutRender).toHaveBeenCalledTimes(1);
    expect(indexRender).toHaveBeenCalledTimes(1);
    expect(detailsRender).not.toHaveBeenCalled();

    jest.clearAllMocks();

    await act(() => router.push('/1/details'));

    expect(screen.getByTestId('details')).toBeVisible();

    expect(layoutRender).toHaveBeenCalledTimes(1);
    expect(idLayoutRender).toHaveBeenCalledTimes(1);
    expect(indexRender).not.toHaveBeenCalled();
    expect(detailsRender).toHaveBeenCalledTimes(1);
  });

  it('rerenders a sibling tab layout on navigation in another tab', async () => {
    const tab1LayoutRender = jest.fn();
    const tab2LayoutRender = jest.fn();

    await renderRouter(
      {
        _layout: function Layout() {
          layoutRender();
          return (
            <TestTabs>
              <Tabs.Screen name="tab1" />
              <Tabs.Screen name="tab2" />
            </TestTabs>
          );
        },
        'tab1/_layout': function Tab1Layout() {
          tab1LayoutRender();
          useLocalSearchParams();
          return <TestStack />;
        },
        'tab1/index': () => <Text testID="tab1">Tab1</Text>,
        'tab2/_layout': function Tab2Layout() {
          tab2LayoutRender();
          useLocalSearchParams();
          return <TestStack />;
        },
        'tab2/index': () => <Text testID="tab2">Tab2</Text>,
        'tab2/details': () => <Text testID="details">Details</Text>,
      },
      { initialUrl: '/tab1' }
    );

    expect(screen.getByTestId('tab1')).toBeVisible();

    expect(layoutRender).toHaveBeenCalledTimes(1);
    expect(tab1LayoutRender).toHaveBeenCalledTimes(1);
    expect(tab2LayoutRender).not.toHaveBeenCalled();

    jest.clearAllMocks();

    await act(() => router.push('/tab2'));

    expect(screen.getByTestId('tab2')).toBeVisible();

    expect(layoutRender).not.toHaveBeenCalled();
    // Should be 0: React 19 re-renders it when an outer provider changes
    // (https://github.com/react/react/issues/35397).
    expect(tab1LayoutRender).toHaveBeenCalledTimes(1);
    expect(tab2LayoutRender).toHaveBeenCalledTimes(1);

    jest.clearAllMocks();

    await act(() => router.push('/tab2/details'));

    expect(screen.getByTestId('details')).toBeVisible();

    expect(layoutRender).not.toHaveBeenCalled();
    // Should be 0: React 19 re-renders it when an outer provider changes
    // (https://github.com/react/react/issues/35397).
    expect(tab1LayoutRender).toHaveBeenCalledTimes(1);
    expect(tab2LayoutRender).toHaveBeenCalledTimes(1);
  });
});
