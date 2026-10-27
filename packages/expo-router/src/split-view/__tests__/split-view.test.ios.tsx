import { screen, within } from '@testing-library/react-native';
import { Children, isValidElement, type ReactNode } from 'react';
import { Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { IsWithinNativeNavigator } from '../../exports';
import JSStack from '../../layouts/JSStack';
import Stack from '../../layouts/StackClient';
import { SafeAreaView, Split } from '../../optional-libraries/react-native-screens';
import { renderRouter } from '../../testing-library';
import { Slot } from '../../views/Navigator';
import { SplitViewNativeHeader } from '../native';
import { SplitView } from '../split-view';

jest.mock('../../optional-libraries/react-native-screens', () => {
  const { View }: typeof import('react-native') = jest.requireActual('react-native');
  const actual = jest.requireActual(
    '../../optional-libraries/react-native-screens'
  ) as typeof import('../../optional-libraries/react-native-screens');

  return {
    ...actual,
    SafeAreaView: jest.fn(({ children }: { children?: ReactNode }) => (
      <View testID="SafeAreaView">{children}</View>
    )),
    Split: {
      ...actual.Split,
      Host: jest.fn(({ children }: { children?: ReactNode }) => (
        <View testID="Split.Host">{children}</View>
      )),
      Column: jest.fn(({ children }: { children?: ReactNode }) => (
        <View testID="Split.Column">{children}</View>
      )),
      Inspector: jest.fn(({ children }: { children?: ReactNode }) => (
        <View testID="Split.Inspector">{children}</View>
      )),
      // Added in react-native-screens 5.
      Stack: jest.fn(({ children }: { children?: ReactNode }) => (
        <View testID="Split.Stack">{children}</View>
      )),
      HeaderConfig: jest.fn(() => null),
    },
  };
});

jest.mock('../native', () => {
  const { View }: typeof import('react-native') = jest.requireActual('react-native');
  return {
    SplitViewNativeHeader: jest.fn(() => <View testID="SplitViewNativeHeader" />),
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
  ).toEqual([SplitHeaderConfig, SafeAreaView]);
});

it('wraps SplitView.Column content in a horizontal SafeAreaView around a SafeAreaProvider', async () => {
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

  // The first Split.Column is the sidebar column. The second is the detail column.
  const columnProps = jest.mocked(Split.Column).mock.calls[0]![0];
  expect(
    Children.toArray(columnProps.children).map((child) => isValidElement(child) && child.type)
  ).toEqual([SafeAreaView]);
  // The first SafeAreaView is in the sidebar column.
  const safeAreaViewProps = jest.mocked(SafeAreaView).mock.calls[0]![0];
  expect(safeAreaViewProps.edges).toEqual({ left: true, right: true });
  expect(
    Children.toArray(safeAreaViewProps.children).map((child) => isValidElement(child) && child.type)
  ).toEqual([SafeAreaProvider]);
});

it('wraps the detail column content in a horizontal SafeAreaView', async () => {
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

  // The first Split.Column is the sidebar column. The second is the detail column.
  const columnProps = jest.mocked(Split.Column).mock.calls[1]![0];
  expect(
    Children.toArray(columnProps.children).map((child) => isValidElement(child) && child.type)
  ).toEqual([SafeAreaView]);
  // The second SafeAreaView is in the detail column.
  expect(jest.mocked(SafeAreaView).mock.calls[1]![0].edges).toEqual({ left: true, right: true });
});

it('wraps SplitView.Inspector content in a horizontal SafeAreaView', async () => {
  await renderRouter(
    {
      _layout: () => (
        <SplitView>
          <SplitView.Column>
            <SplitStack />
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

  const inspectorProps = jest.mocked(Split.Inspector).mock.calls[0]![0];
  expect(
    Children.toArray(inspectorProps.children).map((child) => isValidElement(child) && child.type)
  ).toEqual([SafeAreaView]);
  // The sidebar column has only a Split.Stack, so the first SafeAreaView is in the detail column and the second is in
  // the inspector.
  expect(jest.mocked(SafeAreaView).mock.calls[1]![0].edges).toEqual({ left: true, right: true });
});

it('does not render a SafeAreaView when disableHorizontalSafeAreaInsets is true', async () => {
  await renderRouter(
    {
      _layout: () => (
        <SplitView disableHorizontalSafeAreaInsets>
          <SplitView.Column>
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

  expect(SafeAreaView).not.toHaveBeenCalled();
  // The first Split.Column is the sidebar column. The second is the detail column.
  const sidebarColumnProps = jest.mocked(Split.Column).mock.calls[0]![0];
  expect(
    Children.toArray(sidebarColumnProps.children).map(
      (child) => isValidElement(child) && child.type
    )
  ).toEqual([SafeAreaProvider]);
});

it('does not pass disableHorizontalSafeAreaInsets to Split.Host', async () => {
  await renderRouter(
    {
      _layout: () => (
        <SplitView disableHorizontalSafeAreaInsets>
          <SplitView.Column>
            <Text>Sidebar</Text>
          </SplitView.Column>
        </SplitView>
      ),
      index: () => <Text>Index</Text>,
    },
    { initialUrl: '/' }
  );

  const hostProps = jest.mocked(Split.Host).mock.lastCall![0];
  expect('disableHorizontalSafeAreaInsets' in hostProps).toBe(false);
});

it('passes the SplitView.Column header to the native header as flat props', async () => {
  await renderRouter(
    {
      _layout: () => (
        <SplitView>
          <SplitView.Column
            header={{
              title: 'Mailboxes',
              largeTitle: true,
              leftToolbar: [{ title: 'Edit', onPress: () => {} }],
              rightToolbar: [{ title: 'Search', icon: 'magnifyingglass', onPress: () => {} }],
            }}>
            <Text>Sidebar</Text>
          </SplitView.Column>
          <SplitView.Stack />
        </SplitView>
      ),
      index: () => <Text>Index</Text>,
    },
    { initialUrl: '/' }
  );

  expect(jest.mocked(SplitViewNativeHeader).mock.lastCall![0]).toEqual({
    title: 'Mailboxes',
    largeTitle: true,
    leftToolbarItems: [{ title: 'Edit' }],
    rightToolbarItems: [{ title: 'Search', icon: 'magnifyingglass' }],
    onToolbarItemPress: expect.any(Function),
  });
});

it('calls onPress of the pressed native toolbar item', async () => {
  const onEditPress = jest.fn();
  const onSearchPress = jest.fn();
  const onArchivePress = jest.fn();
  await renderRouter(
    {
      _layout: () => (
        <SplitView>
          <SplitView.Column
            header={{
              leftToolbar: [{ title: 'Edit', onPress: onEditPress }],
              rightToolbar: [
                { title: 'Search', onPress: onSearchPress },
                { title: 'Archive', onPress: onArchivePress },
              ],
            }}
          />
          <SplitView.Stack />
        </SplitView>
      ),
      index: () => <Text>Index</Text>,
    },
    { initialUrl: '/' }
  );

  const { onToolbarItemPress } = jest.mocked(SplitViewNativeHeader).mock.lastCall![0];
  onToolbarItemPress({ nativeEvent: { side: 'right', index: 1 } });

  expect(onArchivePress).toHaveBeenCalledTimes(1);
  expect(onSearchPress).not.toHaveBeenCalled();
  expect(onEditPress).not.toHaveBeenCalled();
});

it('renders the SplitView.Stack header in the content column', async () => {
  await renderRouter(
    {
      _layout: () => (
        <SplitView>
          <SplitView.Column />
          <SplitView.Stack header={{ title: 'Message' }} />
        </SplitView>
      ),
      index: () => <Text testID="index">Index</Text>,
    },
    { initialUrl: '/' }
  );

  // The first Split.Column is the sidebar column. The second is the content column.
  const contentColumn = screen.getAllByTestId('Split.Column')[1]!;
  expect(within(contentColumn).getByTestId('SplitViewNativeHeader')).toBeVisible();
  expect(within(contentColumn).getByTestId('index')).toBeVisible();
  expect(jest.mocked(SplitViewNativeHeader).mock.lastCall![0].title).toBe('Message');
});

it('renders the SplitView.Inspector header in the inspector', async () => {
  await renderRouter(
    {
      _layout: () => (
        <SplitView>
          <SplitView.Column />
          <SplitView.Stack />
          <SplitView.Inspector header={{ title: 'Details' }}>
            <Text>Inspector</Text>
          </SplitView.Inspector>
        </SplitView>
      ),
      index: () => <Text>Index</Text>,
    },
    { initialUrl: '/' }
  );

  expect(
    within(screen.getByTestId('Split.Inspector')).getByTestId('SplitViewNativeHeader')
  ).toBeVisible();
  expect(jest.mocked(SplitViewNativeHeader).mock.lastCall![0].title).toBe('Details');
});

it('renders no native header for a SplitView.Column without header', async () => {
  await renderRouter(
    {
      _layout: () => (
        <SplitView>
          <SplitView.Column>
            <Text>Sidebar</Text>
          </SplitView.Column>
          <SplitView.Stack />
        </SplitView>
      ),
      index: () => <Text>Index</Text>,
    },
    { initialUrl: '/' }
  );

  expect(screen.queryByTestId('SplitViewNativeHeader')).toBeNull();
  expect(SplitViewNativeHeader).not.toHaveBeenCalled();
});

it('rejects two SplitView.Stack in a SplitView', async () => {
  await expect(
    async () =>
      await renderRouter({
        _layout: () => (
          <SplitView>
            <SplitView.Column />
            <SplitView.Stack />
            <SplitView.Stack />
          </SplitView>
        ),
        index: () => <Text>Index</Text>,
      })
  ).rejects.toThrow('There can only be one SplitView.Stack in the SplitView.');
});
