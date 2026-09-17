import { act, screen } from '@testing-library/react-native';
import { createRef, useState, type ReactNode } from 'react';
import { Text, type ViewProps } from 'react-native';
import type { SplitHostCommands } from 'react-native-screens/experimental';

import { setSplitViewImplementation, SplitView, type SplitViewProps } from '..';
import { router } from '../../imperative-api';
import Stack from '../../layouts/StackClient';
import { renderRouter } from '../../testing-library';

const mockNavigationSplitView = jest.fn();

jest.mock('@expo/ui/swift-ui', () => {
  const { View }: typeof import('react-native') = jest.requireActual('react-native');
  const slot = (testID: string) =>
    function Slot({ children }: { children?: ReactNode }) {
      return <View testID={testID}>{children}</View>;
    };
  return {
    Host: slot('Host'),
    RNHostView: slot('RNHostView'),
    NavigationSplitView: Object.assign(
      (props: { children?: ReactNode }) => {
        mockNavigationSplitView(props);
        return <View testID="NavigationSplitView">{props.children}</View>;
      },
      { Sidebar: slot('Sidebar'), Content: slot('Content'), Detail: slot('Detail') }
    ),
    // The modifiers ride on the host element so tests can read them back per column.
    Toolbar: ({ children, modifiers }: { children?: ReactNode; modifiers?: unknown[] }) => (
      <View testID="Toolbar" {...({ modifiers } as ViewProps)}>
        {children}
      </View>
    ),
  };
});

beforeEach(() => {
  setSplitViewImplementation('expo-ui');
});

afterEach(() => {
  setSplitViewImplementation('rns');
});

function latestNavigationSplitViewProps() {
  return mockNavigationSplitView.mock.calls.at(-1)?.[0];
}

function toolbarModifiersFor(testID: string) {
  return screen.getByTestId(testID).findByProps({ testID: 'Toolbar' }).props.modifiers;
}

it('renders the columns as sidebar, content and detail', () => {
  renderRouter(
    {
      _layout: () => (
        <SplitView>
          <SplitView.Column>
            <Text>Sidebar</Text>
          </SplitView.Column>
          <SplitView.Column>
            <Text>Content</Text>
          </SplitView.Column>
        </SplitView>
      ),
      index: () => <Text>Detail</Text>,
    },
    { initialUrl: '/' }
  );

  expect(screen.getByTestId('Sidebar')).toHaveTextContent('Sidebar');
  expect(screen.getByTestId('Content')).toHaveTextContent('Content');
  expect(screen.getByTestId('Detail')).toHaveTextContent('Detail');
  expect(latestNavigationSplitViewProps()).toMatchObject({
    columnVisibility: undefined,
    preferredCompactColumn: undefined,
  });
});

it('renders a single column as the sidebar', () => {
  renderRouter(
    {
      _layout: () => (
        <SplitView>
          <SplitView.Column>
            <Text>Sidebar</Text>
          </SplitView.Column>
        </SplitView>
      ),
      index: () => <Text>Detail</Text>,
    },
    { initialUrl: '/' }
  );

  expect(screen.getByTestId('Sidebar')).toHaveTextContent('Sidebar');
  expect(screen.queryByTestId('Content')).toBeNull();
  expect(screen.getByTestId('Detail')).toHaveTextContent('Detail');
});

it('applies column header options as navigation bar modifiers', () => {
  renderRouter(
    {
      _layout: () => (
        <SplitView>
          <SplitView.Column title="Inbox" headerLargeTitle={false} headerBackVisible={false}>
            <Text>Sidebar</Text>
          </SplitView.Column>
          <SplitView.Column headerShown={false}>
            <Text>Content</Text>
          </SplitView.Column>
        </SplitView>
      ),
      index: () => <Text>Detail</Text>,
    },
    { initialUrl: '/' }
  );

  expect(toolbarModifiersFor('Sidebar')).toEqual([
    { $type: 'navigationTitle', title: 'Inbox' },
    { $type: 'navigationBarTitleDisplayMode', mode: 'inline' },
    { $type: 'navigationBarBackButtonHidden', hidden: true },
  ]);
  expect(toolbarModifiersFor('Content')).toEqual([
    { $type: 'navigationBarTitleDisplayMode', mode: 'automatic' },
    { $type: 'navigationBarBackButtonHidden', hidden: false },
    { $type: 'toolbarVisibility', visibility: 'hidden', bars: ['navigationBar'] },
  ]);
});

it('applies route options to the detail header', () => {
  renderRouter(
    {
      _layout: () => (
        <SplitView screenOptions={{ headerBackVisible: false }}>
          <SplitView.Column>
            <Text>Sidebar</Text>
          </SplitView.Column>
          <SplitView.Screen name="index" options={{ title: 'Home', headerLargeTitle: true }} />
        </SplitView>
      ),
      index: () => <Text>Detail</Text>,
      page: () => (
        <>
          <SplitView.Screen options={{ title: 'Page' }} />
          <Text>Page</Text>
        </>
      ),
    },
    { initialUrl: '/' }
  );

  expect(toolbarModifiersFor('Detail')).toEqual([
    { $type: 'navigationTitle', title: 'Home' },
    { $type: 'navigationBarTitleDisplayMode', mode: 'large' },
    { $type: 'navigationBarBackButtonHidden', hidden: true },
  ]);

  act(() => router.navigate('/page'));

  expect(toolbarModifiersFor('Detail')).toEqual([
    { $type: 'navigationTitle', title: 'Page' },
    { $type: 'navigationBarTitleDisplayMode', mode: 'automatic' },
    { $type: 'navigationBarBackButtonHidden', hidden: true },
  ]);
});

it('maps the collapse, display mode and split behavior props', () => {
  renderRouter(
    {
      _layout: () => (
        <SplitView
          topColumnForCollapsing="supplementary"
          preferredDisplayMode="twoBesideSecondary"
          preferredSplitBehavior="tile">
          <SplitView.Column>
            <Text>Sidebar</Text>
          </SplitView.Column>
          <SplitView.Column>
            <Text>Content</Text>
          </SplitView.Column>
        </SplitView>
      ),
      index: () => <Text>Detail</Text>,
    },
    { initialUrl: '/' }
  );

  expect(latestNavigationSplitViewProps()).toMatchObject({
    columnVisibility: 'all',
    preferredCompactColumn: 'content',
    modifiers: [{ $type: 'navigationSplitViewStyle', style: 'balanced' }],
  });
});

it('maps column metrics to column widths', () => {
  renderRouter(
    {
      _layout: () => (
        <SplitView
          columnMetrics={{
            minimumPrimaryColumnWidth: 200,
            preferredPrimaryColumnWidthOrFraction: 260,
            maximumPrimaryColumnWidth: 320,
            preferredSupplementaryColumnWidthOrFraction: 300,
          }}>
          <SplitView.Column>
            <Text>Sidebar</Text>
          </SplitView.Column>
          <SplitView.Column>
            <Text>Content</Text>
          </SplitView.Column>
        </SplitView>
      ),
      index: () => <Text>Detail</Text>,
    },
    { initialUrl: '/' }
  );

  expect(toolbarModifiersFor('Sidebar')).toContainEqual({
    $type: 'navigationSplitViewColumnWidth',
    min: 200,
    ideal: 260,
    max: 320,
  });
  expect(toolbarModifiersFor('Content')).toContainEqual({
    $type: 'navigationSplitViewColumnWidth',
    ideal: 300,
  });
});

it('shows columns through the ref', () => {
  const ref = createRef<SplitHostCommands>();
  renderRouter(
    {
      _layout: () => (
        <SplitView ref={ref}>
          <SplitView.Column>
            <Text>Sidebar</Text>
          </SplitView.Column>
          <SplitView.Column>
            <Text>Content</Text>
          </SplitView.Column>
        </SplitView>
      ),
      index: () => <Text>Detail</Text>,
    },
    { initialUrl: '/' }
  );

  act(() => ref.current?.show('secondary'));
  expect(latestNavigationSplitViewProps()).toMatchObject({
    columnVisibility: undefined,
    preferredCompactColumn: 'detail',
  });

  act(() => ref.current?.show('supplementary'));
  expect(latestNavigationSplitViewProps()).toMatchObject({
    columnVisibility: 'doubleColumn',
    preferredCompactColumn: 'content',
  });

  act(() => ref.current?.show('primary'));
  expect(latestNavigationSplitViewProps()).toMatchObject({
    columnVisibility: 'all',
    preferredCompactColumn: 'sidebar',
  });
});

it('follows column changes made by the user', () => {
  renderRouter(
    {
      _layout: () => (
        <SplitView topColumnForCollapsing="secondary" preferredDisplayMode="secondaryOnly">
          <SplitView.Column>
            <Text>Sidebar</Text>
          </SplitView.Column>
        </SplitView>
      ),
      index: () => <Text>Detail</Text>,
    },
    { initialUrl: '/' }
  );

  expect(latestNavigationSplitViewProps()).toMatchObject({
    columnVisibility: 'detailOnly',
    preferredCompactColumn: 'detail',
  });

  act(() => latestNavigationSplitViewProps().onPreferredCompactColumnChange('sidebar'));
  act(() => latestNavigationSplitViewProps().onColumnVisibilityChange('doubleColumn'));

  expect(latestNavigationSplitViewProps()).toMatchObject({
    columnVisibility: 'doubleColumn',
    preferredCompactColumn: 'sidebar',
  });
});

it('follows prop updates after mount', () => {
  let setProps: (props: Partial<SplitViewProps>) => void = () => {};
  function Layout() {
    const [props, set] = useState<Partial<SplitViewProps>>({});
    setProps = set;
    return (
      <SplitView {...props}>
        <SplitView.Column>
          <Text>Sidebar</Text>
        </SplitView.Column>
      </SplitView>
    );
  }
  renderRouter({ _layout: Layout, index: () => <Text>Detail</Text> }, { initialUrl: '/' });

  act(() =>
    setProps({ topColumnForCollapsing: 'primary', preferredDisplayMode: 'oneBesideSecondary' })
  );

  expect(latestNavigationSplitViewProps()).toMatchObject({
    columnVisibility: 'doubleColumn',
    preferredCompactColumn: 'sidebar',
  });
});

it('ignores SplitView.Inspector with a warning', () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

  renderRouter(
    {
      _layout: () => (
        <SplitView>
          <SplitView.Column>
            <Text>Sidebar</Text>
          </SplitView.Column>
          <SplitView.Inspector>
            <Text>Inspector</Text>
          </SplitView.Inspector>
        </SplitView>
      ),
      index: () => <Text>Detail</Text>,
    },
    { initialUrl: '/' }
  );

  expect(screen.queryByText('Inspector')).toBeNull();
  expect(warn).toHaveBeenCalledWith(
    'SplitView.Inspector is not supported by the expo-ui implementation and will be ignored.'
  );
});

it('renders inside a native stack', () => {
  renderRouter(
    {
      _layout: () => <Stack screenOptions={{ headerShown: false }} />,
      'nested/_layout': () => (
        <SplitView>
          <SplitView.Column>
            <Text>Sidebar</Text>
          </SplitView.Column>
        </SplitView>
      ),
      'nested/index': () => <Text>Detail</Text>,
    },
    { initialUrl: '/nested' }
  );

  expect(screen.getByTestId('Sidebar')).toHaveTextContent('Sidebar');
  expect(screen.getByTestId('Detail')).toHaveTextContent('Detail');
});
