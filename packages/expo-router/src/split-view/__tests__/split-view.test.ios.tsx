import { screen, within } from '@testing-library/react-native';
import { Children, isValidElement, type ReactNode } from 'react';
import { Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { IsWithinNativeNavigator } from '../../exports';
import JSStack from '../../layouts/JSStack';
import Stack from '../../layouts/StackClient';
import { Split } from '../../optional-libraries/react-native-screens';
import { renderRouter } from '../../testing-library';
import { Slot } from '../../views/Navigator';
import { SplitView } from '../split-view';

jest.mock('../../optional-libraries/react-native-screens', () => {
  const { View }: typeof import('react-native') = jest.requireActual('react-native');
  const actual = jest.requireActual(
    '../../optional-libraries/react-native-screens'
  ) as typeof import('../../optional-libraries/react-native-screens');

  return {
    ...actual,
    Split: {
      ...actual.Split,
      Host: jest.fn(({ children }: { children?: ReactNode }) => (
        <View testID="Split.Host">{children}</View>
      )),
      Column: jest.fn(({ children }: { children?: ReactNode }) => (
        <View testID="Split.Column">{children}</View>
      )),
      // Added in react-native-screens 5.
      Stack: jest.fn(({ children }: { children?: ReactNode }) => (
        <View testID="Split.Stack">{children}</View>
      )),
      HeaderConfig: jest.fn(() => null),
      Inspector: jest.fn(({ children }: { children?: ReactNode }) => (
        <View testID="Split.Inspector">{children}</View>
      )),
    },
  };
});

jest.mock('../native', () => {
  const { View }: typeof import('react-native') = jest.requireActual('react-native');
  return {
    SplitViewColumnOptionsView: jest.fn((props: object) => (
      <View testID="SplitViewColumnOptionsView" {...props} />
    )),
  };
});

afterEach(() => {
  jest.clearAllMocks();
});

// The mock above adds the react-native-screens 5 components, which 4.x types mark as optional.
const SplitStack = Split.Stack!;
const SplitHeaderConfig = Split.HeaderConfig!;

const SplitLayout = () => (
  <SplitView>
    <SplitView.Column />
  </SplitView>
);

it('renders a SplitView nested under Slot', async () => {
  await renderRouter(
    {
      _layout: () => <Slot />,
      'nested/_layout': SplitLayout,
      'nested/index': () => <Text testID="child">Child</Text>,
    },
    { initialUrl: '/nested' }
  );

  expect(screen.getByTestId('Split.Host')).toBeVisible();
  expect(screen.getByTestId('child')).toBeVisible();
});

it('renders a SplitView nested under the default navigator', async () => {
  await renderRouter(
    {
      'nested/_layout': SplitLayout,
      'nested/index': () => <Text testID="child">Child</Text>,
    },
    { initialUrl: '/nested' }
  );

  expect(screen.getByTestId('Split.Host')).toBeVisible();
  expect(screen.getByTestId('child')).toBeVisible();
});

it('rejects a SplitView nested under a native navigator', async () => {
  await expect(
    async () =>
      await renderRouter(
        {
          _layout: () => <Stack />,
          'nested/_layout': SplitLayout,
          'nested/index': () => <Text>Child</Text>,
        },
        { initialUrl: '/nested' }
      )
  ).rejects.toThrow('SplitView cannot be used inside another native navigator.');
});

it('rejects a SplitView nested under a custom native navigator', async () => {
  await expect(
    async () =>
      await renderRouter(
        {
          _layout: () => (
            <IsWithinNativeNavigator value>
              <Slot />
            </IsWithinNativeNavigator>
          ),
          'nested/_layout': SplitLayout,
          'nested/index': () => <Text>Child</Text>,
        },
        { initialUrl: '/nested' }
      )
  ).rejects.toThrow('SplitView cannot be used inside another native navigator.');
});

it('rejects a SplitView nested inside a SplitView column', async () => {
  await expect(
    async () =>
      await renderRouter({
        _layout: () => (
          <SplitView>
            <SplitView.Column>
              <SplitLayout />
            </SplitView.Column>
          </SplitView>
        ),
        index: () => <Text>Index</Text>,
      })
  ).rejects.toThrow('SplitView cannot be used inside another native navigator.');
});

it('renders a SplitView nested under a JavaScript navigator', async () => {
  await renderRouter(
    {
      _layout: () => <JSStack />,
      'nested/_layout': SplitLayout,
      'nested/index': () => <Text testID="child">Child</Text>,
    },
    { initialUrl: '/nested' }
  );

  expect(screen.getByTestId('Split.Host')).toBeVisible();
  expect(screen.getByTestId('child')).toBeVisible();
});

it('passes each SplitView.Column to Split.Host as a direct Split.Column', async () => {
  await renderRouter(
    {
      _layout: () => (
        <SplitView>
          <SplitView.Column>
            <Text>Sidebar</Text>
          </SplitView.Column>
        </SplitView>
      ),
      index: () => <Text>Index</Text>,
    },
    { initialUrl: '/' }
  );

  // The last render of Split.Host has the final children.
  const hostProps = jest.mocked(Split.Host).mock.lastCall![0];
  expect(
    Children.toArray(hostProps.children).map((child) => isValidElement(child) && child.type)
  ).toEqual([Split.Column, Split.Column]);
});

it('renders a Split.Stack as the only direct child of its Split.Column', async () => {
  await renderRouter(
    {
      _layout: () => (
        <SplitView>
          <SplitView.Column>
            <SplitStack />
          </SplitView.Column>
        </SplitView>
      ),
      index: () => <Text>Index</Text>,
    },
    { initialUrl: '/' }
  );

  // The first Split.Column is the sidebar column. The second is the detail column.
  const columnProps = jest.mocked(Split.Column).mock.calls[0]![0];
  expect(
    Children.toArray(columnProps.children).map((child) => isValidElement(child) && child.type)
  ).toEqual([SplitStack]);
});

it('renders a Split.HeaderConfig as a direct child of its Split.Column', async () => {
  await renderRouter(
    {
      _layout: () => (
        <SplitView>
          <SplitView.Column>
            <SplitHeaderConfig />
            <Text>Sidebar</Text>
          </SplitView.Column>
        </SplitView>
      ),
      index: () => <Text>Index</Text>,
    },
    { initialUrl: '/' }
  );

  // The first Split.Column is the sidebar column. The second is the detail column.
  const columnProps = jest.mocked(Split.Column).mock.calls[0]![0];
  expect(
    Children.toArray(columnProps.children).map((child) => isValidElement(child) && child.type)
  ).toEqual([SplitHeaderConfig, SafeAreaProvider]);
});

it('passes column options and detail options to the options view of their Split.Column', async () => {
  await renderRouter(
    {
      _layout: () => (
        <SplitView
          showSecondaryToggleButton
          detailOptions={{ title: 'Detail', headerShown: false }}>
          <SplitView.Column options={{ title: 'Sidebar', headerLargeTitle: true }}>
            <Text>Sidebar</Text>
          </SplitView.Column>
          <SplitView.Inspector>
            <Text>Inspector</Text>
          </SplitView.Inspector>
        </SplitView>
      ),
      index: () => <Text>Index</Text>,
    },
    { initialUrl: '/' }
  );

  // The first Split.Column is the sidebar column. The second is the detail column.
  const [sidebarColumn, detailColumn] = screen.getAllByTestId('Split.Column');
  const sidebarOptions = within(sidebarColumn!).getByTestId('SplitViewColumnOptionsView');
  expect(sidebarOptions.props.title).toBe('Sidebar');
  expect(sidebarOptions.props.headerLargeTitle).toBe(true);
  const detailOptions = within(detailColumn!).getByTestId('SplitViewColumnOptionsView');
  expect(detailOptions.props.title).toBe('Detail');
  expect(detailOptions.props.headerShown).toBe(false);
  expect(detailOptions.props.showSecondaryToggleButton).toBe(true);
  expect(
    within(screen.getByTestId('Split.Inspector')).queryByTestId('SplitViewColumnOptionsView')
  ).toBeNull();
});

it('renders no options view when no column has options', async () => {
  await renderRouter(
    {
      _layout: () => (
        <SplitView>
          <SplitView.Column>
            <Text>Sidebar</Text>
          </SplitView.Column>
        </SplitView>
      ),
      index: () => <Text>Index</Text>,
    },
    { initialUrl: '/' }
  );

  expect(screen.queryByTestId('SplitViewColumnOptionsView')).toBeNull();
});

it('renders an options view in a SplitView.Column without options when the detail has options', async () => {
  await renderRouter(
    {
      _layout: () => (
        <SplitView detailOptions={{ title: 'Detail' }}>
          <SplitView.Column>
            <Text>Sidebar</Text>
          </SplitView.Column>
        </SplitView>
      ),
      index: () => <Text>Index</Text>,
    },
    { initialUrl: '/' }
  );

  // The first Split.Column is the sidebar column.
  const [sidebarColumn] = screen.getAllByTestId('Split.Column');
  expect(within(sidebarColumn!).getByTestId('SplitViewColumnOptionsView').props.title).toBe(
    undefined
  );
});
