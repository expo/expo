import { act, screen, waitFor } from '@testing-library/react-native';
import { createRef, type ReactNode } from 'react';
import { Text, type ViewProps } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { SplitHostCommands } from 'react-native-screens/experimental';

import { SplitView, type SplitViewProps } from '..';
import Stack from '../../layouts/StackClient';
import { renderRouter } from '../../testing-library';

const mockNavigationSplitView = jest.fn();
const mockRNHostView = jest.fn();
const mockSwiftUIButton = jest.fn();

jest.mock('@expo/ui/swift-ui', () => {
  const { View }: typeof import('react-native') = jest.requireActual('react-native');
  const slot = (testID: string) =>
    function Slot({ children }: { children?: ReactNode }) {
      return <View testID={testID}>{children}</View>;
    };
  return {
    Host: slot('Host'),
    RNHostView: ({ children }: { children?: ReactNode }) => {
      mockRNHostView(children);
      return <View testID="RNHostView">{children}</View>;
    },
    NavigationSplitView: Object.assign(
      ({ children, ...props }: { children?: ReactNode }) => {
        mockNavigationSplitView(props);
        return <View testID="NavigationSplitView">{children}</View>;
      },
      {
        Sidebar: slot('Sidebar'),
        Content: slot('Content'),
        Detail: slot('Detail'),
      }
    ),
    Button: (props: { label?: string; systemImage?: string; onPress?: () => void }) => {
      mockSwiftUIButton(props);
      return <View testID="SwiftUIButton" {...props} />;
    },
    Toolbar: Object.assign(
      ({ children, modifiers }: { children?: ReactNode; modifiers?: unknown[] }) => (
        <View testID="Toolbar" {...({ modifiers } as ViewProps)}>
          {children}
        </View>
      ),
      {
        Content: ({ children }: { children?: ReactNode }) => (
          <View testID="ToolbarContent">{children}</View>
        ),
      }
    ),
    ToolbarItem: ({
      children,
      placement,
    }: {
      children?: ReactNode;
      placement?: string;
    }) => (
      <View testID="ToolbarItem" {...({ placement } as ViewProps)}>
        {children}
      </View>
    ),
  };
});

jest.mock('@expo/ui/swift-ui/modifiers', () => ({
  labelStyle: (style: string) => ({ $type: 'labelStyle', style }),
  navigationBarBackButtonHidden: (hidden: boolean) => ({
    $type: 'navigationBarBackButtonHidden',
    hidden,
  }),
  navigationBarTitleDisplayMode: (mode: string) => ({
    $type: 'navigationBarTitleDisplayMode',
    mode,
  }),
  navigationSplitViewColumnWidth: (width: object) => ({
    $type: 'navigationSplitViewColumnWidth',
    ...width,
  }),
  navigationSplitViewStyle: (style: string) => ({ $type: 'navigationSplitViewStyle', style }),
  navigationTitle: (title: string) => ({ $type: 'navigationTitle', title }),
  toolbarVisibility: (visibility: string) => ({ $type: 'toolbarVisibility', visibility }),
}));

jest.mock('react-native-screens', () => {
  const actualScreens = jest.requireActual(
    'react-native-screens'
  ) as typeof import('react-native-screens');
  return {
    ...actualScreens,
    ScreenStackItem: jest.fn((props) => <actualScreens.ScreenStackItem {...props} />),
  };
});

const { ScreenStackItem } = jest.requireMock(
  'react-native-screens'
) as typeof import('react-native-screens');
const MockedScreenStackItem = ScreenStackItem as jest.MockedFunction<typeof ScreenStackItem>;

afterEach(() => jest.clearAllMocks());

type ExpoUIColumnMetrics = NonNullable<
  Extract<SplitViewProps, { implementation: 'expo-ui' }>['columnMetrics']
>;

const supportedColumnMetrics = {
  minimumPrimaryColumnWidth: 200,
  maximumSupplementaryColumnWidth: 400,
} satisfies ExpoUIColumnMetrics;

export const unsupportedColumnMetrics = {
  // @ts-expect-error The expo-ui implementation has no secondary column width mapping.
  minimumSecondaryColumnWidth: 300,
} satisfies ExpoUIColumnMetrics;

it('renders expo-ui columns and a stack detail navigator', async () => {
  await renderRouter(
    {
      _layout: () => (
        <SplitView implementation="expo-ui">
          <SplitView.Column title="Mailboxes">
            <Text>Sidebar</Text>
          </SplitView.Column>
          <SplitView.Screen name="index" options={{ title: 'Inbox' }} />
        </SplitView>
      ),
      index: () => <Text>Message</Text>,
    },
    { initialUrl: '/' }
  );

  expect(screen.getByTestId('NavigationSplitView')).toBeVisible();
  expect(screen.getByTestId('Sidebar')).toHaveTextContent('Sidebar');
  expect(screen.getByTestId('Detail')).toHaveTextContent('Message');
  expect(screen.getAllByTestId('Toolbar')[0]?.props.modifiers).toContainEqual({
    $type: 'navigationTitle',
    title: 'Mailboxes',
  });
  expect(mockRNHostView).toHaveBeenLastCalledWith(
    expect.not.objectContaining({ type: SafeAreaProvider })
  );
});

it('show secondary reveals the detail column', async () => {
  const ref = createRef<SplitHostCommands>();
  await renderRouter(
    {
      _layout: () => (
        <SplitView implementation="expo-ui" ref={ref}>
          <SplitView.Column>
            <Text>Sidebar</Text>
          </SplitView.Column>
        </SplitView>
      ),
      index: () => <Text>Message</Text>,
    },
    { initialUrl: '/' }
  );

  expect(ref.current).not.toBeNull();
  await act(async () => ref.current?.show('secondary'));

  await waitFor(() =>
    expect(mockNavigationSplitView).toHaveBeenLastCalledWith(
      expect.objectContaining({
        columnVisibility: 'detailOnly',
        preferredCompactColumn: 'detail',
      })
    )
  );
});

it('maps accepted column width bounds without a preferred width', async () => {
  await renderRouter(
    {
      _layout: () => (
        <SplitView implementation="expo-ui" columnMetrics={supportedColumnMetrics}>
          <SplitView.Column>
            <Text>Sidebar</Text>
          </SplitView.Column>
          <SplitView.Column>
            <Text>Content</Text>
          </SplitView.Column>
        </SplitView>
      ),
      index: () => <Text>Message</Text>,
    },
    { initialUrl: '/' }
  );

  const [sidebar, content] = screen.getAllByTestId('Toolbar');
  expect(sidebar).toBeDefined();
  expect(content).toBeDefined();
  expect(sidebar!.props.modifiers).toContainEqual({
    $type: 'navigationSplitViewColumnWidth',
    min: 200,
    ideal: 200,
    max: undefined,
  });
  expect(content!.props.modifiers).toContainEqual({
    $type: 'navigationSplitViewColumnWidth',
    min: undefined,
    ideal: 400,
    max: 400,
  });
});

it('renders page-level Stack.Title and Stack.Toolbar in the expo-ui detail toolbar', async () => {
  await renderRouter(
    {
      _layout: () => (
        <SplitView implementation="expo-ui">
          <SplitView.Column>
            <Text>Sidebar</Text>
          </SplitView.Column>
        </SplitView>
      ),
      index: () => (
        <>
          <Stack.Title>Inbox</Stack.Title>
          <Stack.Toolbar placement="right">
            <Stack.Toolbar.Button icon="magnifyingglass" onPress={() => {}} />
          </Stack.Toolbar>
          <Text>Message</Text>
        </>
      ),
    },
    { initialUrl: '/' }
  );

  await waitFor(() => {
    const detailToolbar = screen.getAllByTestId('Toolbar')[1];
    expect(detailToolbar?.props.modifiers).toContainEqual({
      $type: 'navigationTitle',
      title: 'Inbox',
    });
    expect(screen.getByTestId('ToolbarItem').props.placement).toBe('topBarTrailing');
    expect(mockSwiftUIButton).toHaveBeenCalledWith(
      expect.objectContaining({
        label: 'magnifyingglass',
        modifiers: [{ $type: 'labelStyle', style: 'iconOnly' }],
        systemImage: 'magnifyingglass',
      })
    );
  });

  expect(
    MockedScreenStackItem.mock.calls.find(
      ([props]) => props.headerConfig?.headerRightBarButtonItems?.length === 1
    )
  ).toBeUndefined();
  expect(
    MockedScreenStackItem.mock.calls.every(([props]) => props.headerConfig?.hidden === true)
  ).toBe(true);
});
