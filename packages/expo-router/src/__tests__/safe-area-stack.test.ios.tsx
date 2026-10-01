import { Platform, ScrollView, View } from 'react-native';
import { ScreenStackItem } from 'react-native-screens';

import { router } from '../imperative-api';
import { Stack } from '../layouts/Stack';
import { NativeTabs } from '../native-tabs';
import { act, renderRouter, screen } from '../testing-library';

jest.mock('react-native-screens/experimental', () => {
  const { View } = jest.requireActual('react-native');
  return {
    ...jest.requireActual('react-native-screens/experimental'),
    SafeAreaView: (props: object) => <View {...props} testID="leaf-safe-area" />,
  };
});

jest.mock('react-native-screens', () => {
  const actual = jest.requireActual('react-native-screens');
  const { View } = jest.requireActual('react-native');
  return {
    ...actual,
    ScreenStackItem: jest.fn((props) => <actual.ScreenStackItem {...props} />),
    Tabs: {
      ...actual.Tabs,
      Host: ({ children }: React.PropsWithChildren) => <View>{children}</View>,
      Screen: ({ children }: React.PropsWithChildren) => <View>{children}</View>,
    },
  };
});

afterEach(() => jest.restoreAllMocks());

test.each(['18', '26'])(
  'does not wrap iOS %s form sheet content, even with explicit edges',
  (version) => {
    jest.spyOn(Platform, 'Version', 'get').mockReturnValue(version);
    renderRouter({
      _layout: () => (
        <Stack>
          <Stack.Screen
            name="sheet"
            options={{ presentation: 'formSheet' }}
            safeAreaEdges={{ vertical: true }}
          />
        </Stack>
      ),
      index: () => <View />,
      sheet: () => <ScrollView testID="sheet" />,
    });
    act(() => router.push('/sheet'));
    expect(screen.getByTestId('sheet')).toBeVisible();
    // The underlying index screen keeps its wrapper; the form sheet must not add another.
    expect(screen.getAllByTestId('leaf-safe-area', { includeHiddenElements: true })).toHaveLength(
      1
    );
    expect(ScreenStackItem).toHaveBeenCalledWith(
      expect.objectContaining({ stackPresentation: 'formSheet' }),
      undefined
    );
  }
);

test.each([
  ['26', {}, true, false],
  ['26', { headerTransparent: true }, true, true],
  ['26', { headerShown: false }, true, true],
  ['18', {}, true, true],
  ['18', { headerTransparent: true }, true, true],
  ['18', { headerShown: false }, true, true],
  ['26', {}, false, false],
] as const)(
  'iOS %s header=%j with top=%s avoids duplicate top padding',
  (version, options, top, expectedTop) => {
    jest.spyOn(Platform, 'Version', 'get').mockReturnValue(version);
    renderRouter({
      _layout: () => (
        <Stack>
          <Stack.Screen name="index" options={options} safeAreaEdges={{ vertical: top }} />
        </Stack>
      ),
      index: () => <View />,
    });
    // ScreenStackItem is reached through the real NativeStackView.native, not a navigator mock.
    expect(ScreenStackItem).toHaveBeenCalledWith(
      expect.objectContaining({
        headerConfig: expect.objectContaining({
          hidden: 'headerShown' in options && options.headerShown === false,
          translucent: 'headerTransparent' in options && options.headerTransparent === true,
        }),
      }),
      undefined
    );
    expect(screen.getByTestId('leaf-safe-area').props.edges).toEqual({
      left: true,
      right: true,
      top: expectedTop,
      bottom: top,
    });
  }
);

test('iOS 26 opaque headers also consume an individually enabled top edge', () => {
  jest.spyOn(Platform, 'Version', 'get').mockReturnValue('26');
  renderRouter({
    _layout: () => (
      <Stack>
        <Stack.Screen name="index" safeAreaEdges={{ top: true }} />
      </Stack>
    ),
    index: () => <View />,
  });
  expect(screen.getByTestId('leaf-safe-area').props.edges.top).toBe(false);
});

test('a hidden nested header does not inherit the parent header top suppression', () => {
  jest.spyOn(Platform, 'Version', 'get').mockReturnValue('26');
  renderRouter(
    {
      _layout: () => (
        <Stack>
          <Stack.Screen name="nested" safeAreaEdges={{ top: true }} />
        </Stack>
      ),
      'nested/_layout': () => <Stack screenOptions={{ headerShown: false }} />,
      'nested/index': () => <View />,
    },
    { initialUrl: '/nested' }
  );
  expect(screen.getByTestId('leaf-safe-area').props.edges.top).toBe(true);
});

test('iOS 26 NativeTabs retain explicitly enabled top padding', () => {
  jest.spyOn(Platform, 'Version', 'get').mockReturnValue('26');
  renderRouter({
    _layout: () => (
      <NativeTabs>
        <NativeTabs.Trigger name="index" safeAreaEdges={{ top: true }} />
      </NativeTabs>
    ),
    index: () => <View />,
  });
  expect(screen.getByTestId('leaf-safe-area').props.edges.top).toBe(true);
});
