import { act, screen } from '@testing-library/react-native';
import { useEffect } from 'react';
import { Text } from 'react-native';

import { router } from '../exports';
import Stack from '../layouts/Stack';
import Tabs from '../layouts/Tabs';
import { NativeTabs } from '../native-tabs/NativeTabs';
import { renderRouter } from '../testing-library';
import { TabList, TabSlot, TabTrigger, Tabs as HeadlessTabs } from '../ui';
import { Navigator, Slot } from '../views/Navigator';

jest.mock('react-native-screens', () => {
  const { View }: typeof import('react-native') = jest.requireActual('react-native');
  const actualModule =
    jest.requireActual<typeof import('react-native-screens')>('react-native-screens');
  return {
    ...actualModule,
    Tabs: {
      ...actualModule.Tabs,
      Host: jest.fn(({ children }) => <View>{children}</View>),
      Screen: jest.fn(({ children }) => <View>{children}</View>),
    },
  };
});

const HORIZONTAL_EDGES = { top: 'off', right: 'additive', bottom: 'off', left: 'additive' };

// Edges of every `SafeAreaView` from `react-native-safe-area-context` above the element.
function getSafeAreaViewEdges(testID: string) {
  const edges: { left?: string }[] = [];
  let node = screen.getByTestId(testID, { includeHiddenElements: true });
  while (node.parent) {
    node = node.parent;
    if (node.type === 'RNCSafeAreaView') {
      edges.push(node.props.edges);
    }
  }
  return edges;
}

it('wraps only the leaf screen in a horizontal SafeAreaView', async () => {
  await renderRouter({
    _layout: () => <Stack />,
    '(tabs)/_layout': () => (
      <Tabs>
        <Tabs.Screen name="index" />
      </Tabs>
    ),
    '(tabs)/index': () => <Text testID="index" />,
  });

  expect(getSafeAreaViewEdges('index')).toEqual([HORIZONTAL_EDGES]);
});

it('does not wrap screens nested in a navigator with disableAutomaticHorizontalSafeAreaInsets', async () => {
  await renderRouter({
    _layout: () => <Stack />,
    index: () => <Text testID="index" />,
    'disabled/_layout': () => <Stack disableAutomaticHorizontalSafeAreaInsets />,
    'disabled/(tabs)/_layout': () => (
      <Tabs>
        <Tabs.Screen name="index" />
      </Tabs>
    ),
    'disabled/(tabs)/index': () => <Text testID="nested" />,
  });

  await act(() => router.push('/disabled'));

  expect(getSafeAreaViewEdges('index')).toEqual([HORIZONTAL_EDGES]);
  expect(getSafeAreaViewEdges('nested')).toEqual([]);
});

it('does not wrap a screen whose layout sets disableAutomaticHorizontalSafeAreaInsets', async () => {
  await renderRouter({
    _layout: () => (
      <Stack>
        <Stack.Screen name="index" disableAutomaticHorizontalSafeAreaInsets />
        <Stack.Screen name="other" />
      </Stack>
    ),
    index: () => <Text testID="index" />,
    other: () => <Text testID="other" />,
  });

  await act(() => router.push('/other'));

  expect(getSafeAreaViewEdges('index')).toEqual([]);
  expect(getSafeAreaViewEdges('other')).toEqual([HORIZONTAL_EDGES]);
});

it('does not wrap a Tabs.Screen with disableAutomaticHorizontalSafeAreaInsets', async () => {
  await renderRouter({
    _layout: () => (
      <Tabs>
        <Tabs.Screen name="index" disableAutomaticHorizontalSafeAreaInsets />
        <Tabs.Screen name="other" />
      </Tabs>
    ),
    index: () => <Text testID="index" />,
    other: () => <Text testID="other" />,
  });

  await act(() => router.push('/other'));

  expect(getSafeAreaViewEdges('index')).toEqual([]);
  expect(getSafeAreaViewEdges('other')).toEqual([HORIZONTAL_EDGES]);
});

it('wraps a screen that sets the prop to false inside a disabled navigator', async () => {
  await renderRouter({
    _layout: () => (
      <Stack disableAutomaticHorizontalSafeAreaInsets>
        <Stack.Screen name="index" />
        <Stack.Screen name="other" disableAutomaticHorizontalSafeAreaInsets={false} />
      </Stack>
    ),
    index: () => <Text testID="index" />,
    other: () => <Text testID="other" />,
  });

  await act(() => router.push('/other'));

  expect(getSafeAreaViewEdges('index')).toEqual([]);
  expect(getSafeAreaViewEdges('other')).toEqual([HORIZONTAL_EDGES]);
});

it('does not wrap a form sheet that fits its contents', async () => {
  await renderRouter({
    _layout: () => (
      <Stack>
        <Stack.Screen name="index" />
        <Stack.Screen
          name="sheet"
          options={{ presentation: 'formSheet', sheetAllowedDetents: 'fitToContents' }}
        />
      </Stack>
    ),
    index: () => <Text testID="index" />,
    sheet: () => <Text testID="sheet" />,
  });

  await act(() => router.push('/sheet'));

  expect(getSafeAreaViewEdges('index')).toEqual([HORIZONTAL_EDGES]);
  expect(getSafeAreaViewEdges('sheet')).toEqual([]);
});

it('mounts a page once when the page sets fitToContents', async () => {
  const onMount = jest.fn();
  await renderRouter({
    _layout: () => <Stack />,
    index: function Index() {
      useEffect(() => onMount(), []);
      return (
        <>
          <Stack.Screen
            options={{ presentation: 'formSheet', sheetAllowedDetents: 'fitToContents' }}
          />
          <Text testID="index" />
        </>
      );
    },
  });

  expect(onMount).toHaveBeenCalledTimes(1);
});

it('does not wrap a sheet that fits its contents through screenOptions', async () => {
  await renderRouter({
    _layout: () => (
      <Stack>
        <Stack.Screen name="index" />
        <Stack.Screen name="(sheet)" />
      </Stack>
    ),
    index: () => <Text testID="index" />,
    '(sheet)/_layout': () => (
      <Stack screenOptions={{ presentation: 'formSheet', sheetAllowedDetents: 'fitToContents' }} />
    ),
    '(sheet)/sheet': () => <Text testID="sheet" />,
  });

  await act(() => router.push('/sheet'));

  expect(getSafeAreaViewEdges('index')).toEqual([HORIZONTAL_EDGES]);
  expect(getSafeAreaViewEdges('sheet')).toEqual([]);
});

it.each([
  [true, []],
  [undefined, [HORIZONTAL_EDGES]],
])(
  'applies disableAutomaticHorizontalSafeAreaInsets=%p on a custom Navigator',
  async (disable, edges) => {
    await renderRouter({
      _layout: () => (
        <Navigator disableAutomaticHorizontalSafeAreaInsets={disable}>
          <Slot />
        </Navigator>
      ),
      index: () => <Text testID="index" />,
    });

    expect(getSafeAreaViewEdges('index')).toEqual(edges);
  }
);

it.each([
  [true, []],
  [undefined, [HORIZONTAL_EDGES]],
])(
  'applies disableAutomaticHorizontalSafeAreaInsets=%p on headless Tabs',
  async (disable, edges) => {
    await renderRouter({
      _layout: () => (
        <HeadlessTabs disableAutomaticHorizontalSafeAreaInsets={disable}>
          <TabSlot />
          <TabList>
            <TabTrigger name="index" href="/" />
          </TabList>
        </HeadlessTabs>
      ),
      index: () => <Text testID="index" />,
    });

    expect(getSafeAreaViewEdges('index')).toEqual(edges);
  }
);

it('applies the horizontal insets once when there is no root layout', async () => {
  await renderRouter({
    index: () => <Text testID="index" />,
  });

  const edges = getSafeAreaViewEdges('index');
  expect(edges.filter(({ left }) => left === 'additive')).toEqual([HORIZONTAL_EDGES]);
});

describe('NativeTabs', () => {
  it('does not wrap a tab screen when disableAutomaticContentInsets wins over a false horizontal prop', async () => {
    await renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger
            name="index"
            disableAutomaticContentInsets
            disableAutomaticHorizontalSafeAreaInsets={false}
          />
          <NativeTabs.Trigger name="other" />
        </NativeTabs>
      ),
      index: () => <Text testID="index" />,
      other: () => <Text testID="other" />,
    });

    expect(getSafeAreaViewEdges('index')).toEqual([]);
    expect(getSafeAreaViewEdges('other')).toEqual([HORIZONTAL_EDGES]);
  });

  it.each(['disableAutomaticContentInsets', 'disableAutomaticHorizontalSafeAreaInsets'])(
    'does not wrap a tab screen when the trigger sets %s',
    async (prop) => {
      await renderRouter({
        _layout: () => (
          <NativeTabs>
            <NativeTabs.Trigger name="index" {...{ [prop]: true }} />
            <NativeTabs.Trigger name="other" />
          </NativeTabs>
        ),
        index: () => <Text testID="index" />,
        other: () => <Text testID="other" />,
      });

      expect(getSafeAreaViewEdges('index')).toEqual([]);
      expect(getSafeAreaViewEdges('other')).toEqual([HORIZONTAL_EDGES]);
    }
  );

  it('does not wrap tab screens when NativeTabs sets disableAutomaticHorizontalSafeAreaInsets', async () => {
    await renderRouter({
      _layout: () => (
        <NativeTabs disableAutomaticHorizontalSafeAreaInsets>
          <NativeTabs.Trigger name="index" />
          <NativeTabs.Trigger name="other" disableAutomaticHorizontalSafeAreaInsets={false} />
        </NativeTabs>
      ),
      index: () => <Text testID="index" />,
      other: () => <Text testID="other" />,
    });

    expect(getSafeAreaViewEdges('index')).toEqual([]);
    expect(getSafeAreaViewEdges('other')).toEqual([HORIZONTAL_EDGES]);
  });
});
