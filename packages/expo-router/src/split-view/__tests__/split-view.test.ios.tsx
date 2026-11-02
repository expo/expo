import { act, fireEvent, screen, within } from '@testing-library/react-native';
import { Children, isValidElement, useState, type ReactNode } from 'react';
import { Button, Text, type NativeSyntheticEvent } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { IsWithinNativeNavigator } from '../../exports';
import { router } from '../../imperative-api';
import JSStack from '../../layouts/JSStack';
import Stack from '../../layouts/StackClient';
import { SafeAreaView, Split } from '../../optional-libraries/react-native-screens';
import { renderRouter } from '../../testing-library';
import { Slot } from '../../views/Navigator';
import { SplitViewColumnHeader } from '../header';
import { SplitViewNativeHeader, SplitViewNativeColumn } from '../native';
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
    SplitViewNativeColumn: (props: object) => <View testID="SplitViewNativeColumn" {...props} />,
    SplitViewNativeStackScreen: (props: object) => (
      <View testID="SplitViewNativeStackScreen" {...props} />
    ),
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
  ).toEqual([SafeAreaView, SplitViewNativeColumn]);
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

it('keeps the safe area wrappers with disabled edges when horizontal insets are disabled', async () => {
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

  expect(jest.mocked(SafeAreaView).mock.calls.map(([props]) => props.edges)).toEqual([
    { left: false, right: false },
    { left: false, right: false },
    { left: false, right: false },
  ]);
  // The first Split.Column is the sidebar column. The second is the detail column.
  const sidebarColumnProps = jest.mocked(Split.Column).mock.calls[0]![0];
  expect(
    Children.toArray(sidebarColumnProps.children).map(
      (child) => isValidElement(child) && child.type
    )
  ).toEqual([SafeAreaView]);
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

it('preserves sidebar and inspector state when global insets change during Stack ownership', async () => {
  function Sidebar() {
    const [count, setCount] = useState(0);
    return <Button title={`Sidebar count ${count}`} onPress={() => setCount(count + 1)} />;
  }
  function Inspector() {
    const [count, setCount] = useState(0);
    return <Button title={`Inspector count ${count}`} onPress={() => setCount(count + 1)} />;
  }
  await renderRouter({
    _layout: function Layout() {
      const [disabled, setDisabled] = useState(false);
      return (
        <>
          <Button title="Toggle all insets" onPress={() => setDisabled(!disabled)} />
          <SplitView disableHorizontalSafeAreaInsets={disabled}>
            <SplitView.Column>
              <Sidebar />
            </SplitView.Column>
            <SplitView.Inspector>
              <Inspector />
            </SplitView.Inspector>
          </SplitView>
        </>
      );
    },
    index: () => <Text>Content</Text>,
  });
  await fireEvent.press(screen.getByText('Sidebar count 0'));
  await fireEvent.press(screen.getByText('Inspector count 0'));
  await fireEvent(screen.getByTestId('SplitViewNativeColumn'), 'ownershipChange', {
    nativeEvent: { ownsHeader: true, isCollapsed: true },
  });
  expect(
    jest
      .mocked(SafeAreaView)
      .mock.calls.slice(-3)
      .map(([props]) => props.edges)
  ).toEqual([
    { left: true, right: true },
    { left: false, right: false },
    { left: true, right: true },
  ]);
  await fireEvent.press(screen.getByText('Toggle all insets'));
  expect(
    jest
      .mocked(SafeAreaView)
      .mock.calls.slice(-3)
      .map(([props]) => props.edges)
  ).toEqual([
    { left: false, right: false },
    { left: false, right: false },
    { left: false, right: false },
  ]);
  expect(screen.getByText('Sidebar count 1')).toBeVisible();
  expect(screen.getByText('Inspector count 1')).toBeVisible();
  await fireEvent.press(screen.getByText('Toggle all insets'));
  expect(
    jest
      .mocked(SafeAreaView)
      .mock.calls.slice(-3)
      .map(([props]) => props.edges)
  ).toEqual([
    { left: true, right: true },
    { left: false, right: false },
    { left: true, right: true },
  ]);
  expect(screen.getByText('Sidebar count 1')).toBeVisible();
  expect(screen.getByText('Inspector count 1')).toBeVisible();
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
          <SplitView.Content />
        </SplitView>
      ),
      index: () => <Text>Index</Text>,
    },
    { initialUrl: '/' }
  );

  expect(jest.mocked(SplitViewNativeHeader).mock.lastCall![0]).toEqual({
    title: 'Mailboxes',
    largeTitle: true,
    leftToolbarItems: [{ id: 'left.0', title: 'Edit' }],
    rightToolbarItems: [{ id: 'right.0', title: 'Search', icon: 'magnifyingglass' }],
    onToolbarItemPress: expect.any(Function),
  });
});

it('passes the SplitView.Column header subtitle to the native header', async () => {
  await renderRouter(
    {
      _layout: () => (
        <SplitView>
          <SplitView.Column header={{ title: 'Inbox', subtitle: '3 unread' }} />
          <SplitView.Content />
        </SplitView>
      ),
      index: () => <Text>Index</Text>,
    },
    { initialUrl: '/' }
  );

  expect(jest.mocked(SplitViewNativeHeader).mock.lastCall![0].subtitle).toBe('3 unread');
});

it('passes the title colors of the SplitView.Column header to the native header', async () => {
  await renderRouter(
    {
      _layout: () => (
        <SplitView>
          <SplitView.Column
            header={{
              title: 'Inbox',
              largeTitle: true,
              titleStyle: { color: 'red' },
              largeTitleStyle: { color: 'blue' },
            }}
          />
          <SplitView.Content />
        </SplitView>
      ),
      index: () => <Text>Index</Text>,
    },
    { initialUrl: '/' }
  );

  const props = jest.mocked(SplitViewNativeHeader).mock.lastCall![0];
  expect(props.titleColor).toBe('red');
  expect(props.largeTitleColor).toBe('blue');
});

it('passes the back button options of the SplitView.Column header to the native header', async () => {
  await renderRouter(
    {
      _layout: () => (
        <SplitView>
          <SplitView.Column header={{ title: 'Mailboxes' }} />
          <SplitView.Column
            header={{
              title: 'Inbox',
              backButtonDisplayMode: 'minimal',
              backTitle: 'Mail',
              backVisible: false,
            }}
          />
          <SplitView.Content />
        </SplitView>
      ),
      index: () => <Text>Index</Text>,
    },
    { initialUrl: '/' }
  );

  const props = jest.mocked(SplitViewNativeHeader).mock.lastCall![0];
  expect(props.title).toBe('Inbox');
  expect(props.backButtonDisplayMode).toBe('minimal');
  expect(props.backTitle).toBe('Mail');
  expect(props.backVisible).toBe(false);
});

it('passes the hidden option of the SplitView.Column header to the native header', async () => {
  await renderRouter(
    {
      _layout: () => (
        <SplitView>
          <SplitView.Column header={{ hidden: true }} />
          <SplitView.Content />
        </SplitView>
      ),
      index: () => <Text>Index</Text>,
    },
    { initialUrl: '/' }
  );

  expect(jest.mocked(SplitViewNativeHeader).mock.lastCall![0]).toMatchObject({ hidden: true });
});

it('passes the toolbar item menu to the native header with an id for each action', async () => {
  await renderRouter(
    {
      _layout: () => (
        <SplitView>
          <SplitView.Column
            header={{
              rightToolbar: [
                { title: 'Edit', onPress: () => {} },
                {
                  title: 'Filter',
                  icon: 'line.3.horizontal.decrease.circle',
                  menu: {
                    title: 'Filter by',
                    items: [
                      { title: 'Unread', icon: 'envelope.badge', isOn: true, onPress: () => {} },
                      { title: 'Flagged', disabled: true },
                      { title: 'Delete All', destructive: true, onPress: () => {} },
                    ],
                  },
                },
              ],
            }}
          />
          <SplitView.Content />
        </SplitView>
      ),
      index: () => <Text>Index</Text>,
    },
    { initialUrl: '/' }
  );

  expect(jest.mocked(SplitViewNativeHeader).mock.lastCall![0].rightToolbarItems).toEqual([
    { id: 'right.0', title: 'Edit' },
    {
      id: 'right.1',
      title: 'Filter',
      icon: 'line.3.horizontal.decrease.circle',
      menu: {
        title: 'Filter by',
        items: [
          { id: 'right.1.0', title: 'Unread', icon: 'envelope.badge', isOn: true },
          { id: 'right.1.1', title: 'Flagged', disabled: true },
          { id: 'right.1.2', title: 'Delete All', destructive: true },
        ],
      },
    },
  ]);
});

it('passes disabled and selected of toolbar items to the native header', async () => {
  await renderRouter(
    {
      _layout: () => (
        <SplitView>
          <SplitView.Column
            header={{
              leftToolbar: [{ title: 'Edit', disabled: true, onPress: () => {} }],
              rightToolbar: [
                { title: 'Unread', selected: true, onPress: () => {} },
                { title: 'Filter', disabled: false, selected: false, menu: { items: [] } },
              ],
            }}
          />
          <SplitView.Content />
        </SplitView>
      ),
      index: () => <Text>Index</Text>,
    },
    { initialUrl: '/' }
  );

  const { leftToolbarItems, rightToolbarItems } =
    jest.mocked(SplitViewNativeHeader).mock.lastCall![0];
  expect(leftToolbarItems).toEqual([{ id: 'left.0', title: 'Edit', disabled: true }]);
  expect(rightToolbarItems).toEqual([
    { id: 'right.0', title: 'Unread', selected: true },
    { id: 'right.1', title: 'Filter', disabled: false, selected: false, menu: { items: [] } },
  ]);
});

it('passes tintColor, hidesSharedBackground and accessibility props of toolbar items to the native header', async () => {
  await renderRouter(
    {
      _layout: () => (
        <SplitView>
          <SplitView.Column
            header={{
              rightToolbar: [
                {
                  title: 'Compose',
                  icon: 'square.and.pencil',
                  tintColor: 'red',
                  hidesSharedBackground: true,
                  accessibilityLabel: 'New message',
                  accessibilityHint: 'Opens a new message',
                  onPress: () => {},
                },
              ],
            }}
          />
          <SplitView.Content />
        </SplitView>
      ),
      index: () => <Text>Index</Text>,
    },
    { initialUrl: '/' }
  );

  expect(jest.mocked(SplitViewNativeHeader).mock.lastCall![0].rightToolbarItems).toEqual([
    {
      id: 'right.0',
      title: 'Compose',
      icon: 'square.and.pencil',
      tintColor: 'red',
      hidesSharedBackground: true,
      accessibilityLabel: 'New message',
      accessibilityHint: 'Opens a new message',
    },
  ]);
});

it('passes the variant of toolbar items to the native header as barButtonItemStyle', async () => {
  await renderRouter(
    {
      _layout: () => (
        <SplitView>
          <SplitView.Column
            header={{
              rightToolbar: [
                { title: 'Cancel', variant: 'plain', onPress: () => {} },
                { title: 'Done', variant: 'done', onPress: () => {} },
                { title: 'Send', variant: 'prominent', onPress: () => {} },
              ],
            }}
          />
          <SplitView.Content />
        </SplitView>
      ),
      index: () => <Text>Index</Text>,
    },
    { initialUrl: '/' }
  );

  expect(jest.mocked(SplitViewNativeHeader).mock.lastCall![0].rightToolbarItems).toEqual([
    { id: 'right.0', title: 'Cancel', barButtonItemStyle: 'plain' },
    { id: 'right.1', title: 'Done', barButtonItemStyle: 'prominent' },
    { id: 'right.2', title: 'Send', barButtonItemStyle: 'prominent' },
  ]);
});

it('passes separateBackground of toolbar items to the native header as sharesBackground', async () => {
  await renderRouter(
    {
      _layout: () => (
        <SplitView>
          <SplitView.Column
            header={{
              rightToolbar: [
                { title: 'Search', separateBackground: true, onPress: () => {} },
                { title: 'Move', separateBackground: false, onPress: () => {} },
              ],
            }}
          />
          <SplitView.Content />
        </SplitView>
      ),
      index: () => <Text>Index</Text>,
    },
    { initialUrl: '/' }
  );

  expect(jest.mocked(SplitViewNativeHeader).mock.lastCall![0].rightToolbarItems).toEqual([
    { id: 'right.0', title: 'Search', sharesBackground: false },
    { id: 'right.1', title: 'Move', sharesBackground: true },
  ]);
});

it('passes the badge of toolbar items to the native header as a flat badgeConfiguration', async () => {
  await renderRouter(
    {
      _layout: () => (
        <SplitView>
          <SplitView.Column
            header={{
              rightToolbar: [
                {
                  title: 'Inbox',
                  badge: {
                    value: 3,
                    style: {
                      color: 'white',
                      backgroundColor: 'blue',
                      fontFamily: 'Menlo',
                      fontSize: 12,
                      fontWeight: 'bold',
                    },
                  },
                  onPress: () => {},
                },
                { title: 'Drafts', badge: { value: 'new' }, onPress: () => {} },
                { title: 'Sent', badge: {}, onPress: () => {} },
              ],
            }}
          />
          <SplitView.Content />
        </SplitView>
      ),
      index: () => <Text>Index</Text>,
    },
    { initialUrl: '/' }
  );

  expect(jest.mocked(SplitViewNativeHeader).mock.lastCall![0].rightToolbarItems).toEqual([
    {
      id: 'right.0',
      title: 'Inbox',
      badgeConfiguration: {
        value: '3',
        color: 'white',
        backgroundColor: 'blue',
        fontFamily: 'Menlo',
        fontSize: 12,
        fontWeight: 'bold',
      },
    },
    { id: 'right.1', title: 'Drafts', badgeConfiguration: { value: 'new' } },
    { id: 'right.2', title: 'Sent', badgeConfiguration: {} },
  ]);
});

it('passes an xcasset icon of toolbar items to the native header as xcassetName', async () => {
  await renderRouter(
    {
      _layout: () => (
        <SplitView>
          <SplitView.Column
            header={{
              rightToolbar: [{ title: 'Logo', icon: { xcasset: 'logo' }, onPress: () => {} }],
            }}
          />
          <SplitView.Content />
        </SplitView>
      ),
      index: () => <Text>Index</Text>,
    },
    { initialUrl: '/' }
  );

  expect(jest.mocked(SplitViewNativeHeader).mock.lastCall![0].rightToolbarItems).toEqual([
    { id: 'right.0', title: 'Logo', xcassetName: 'logo', imageRenderingMode: 'original' },
  ]);
});

it('renders xcasset icons of toolbar items as template when tintColor is set', async () => {
  await renderRouter(
    {
      _layout: () => (
        <SplitView>
          <SplitView.Column
            header={{
              rightToolbar: [
                { title: 'Logo', icon: { xcasset: 'logo' }, tintColor: 'red', onPress: () => {} },
                {
                  title: 'Original logo',
                  icon: { xcasset: 'logo' },
                  tintColor: 'red',
                  iconRenderingMode: 'original',
                  onPress: () => {},
                },
              ],
            }}
          />
          <SplitView.Content />
        </SplitView>
      ),
      index: () => <Text>Index</Text>,
    },
    { initialUrl: '/' }
  );

  expect(jest.mocked(SplitViewNativeHeader).mock.lastCall![0].rightToolbarItems).toEqual([
    {
      id: 'right.0',
      title: 'Logo',
      xcassetName: 'logo',
      tintColor: 'red',
      imageRenderingMode: 'template',
    },
    {
      id: 'right.1',
      title: 'Original logo',
      xcassetName: 'logo',
      tintColor: 'red',
      imageRenderingMode: 'original',
    },
  ]);
});

it('renders the SplitView.Column header as the last child of its Split.Column', async () => {
  await renderRouter(
    {
      _layout: () => (
        <SplitView>
          <SplitView.Column header={{ title: 'Mailboxes' }}>
            <Text>Sidebar</Text>
          </SplitView.Column>
          <SplitView.Content />
        </SplitView>
      ),
      index: () => <Text>Index</Text>,
    },
    { initialUrl: '/' }
  );

  // The first Split.Column is the sidebar column.
  const columnProps = jest.mocked(Split.Column).mock.calls[0]![0];
  expect(
    Children.toArray(columnProps.children).map((child) => isValidElement(child) && child.type)
  ).toEqual([SafeAreaView, SplitViewColumnHeader]);
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
          <SplitView.Content />
        </SplitView>
      ),
      index: () => <Text>Index</Text>,
    },
    { initialUrl: '/' }
  );

  const { onToolbarItemPress } = jest.mocked(SplitViewNativeHeader).mock.lastCall![0];
  onToolbarItemPress({ nativeEvent: { id: 'right.1' } });

  expect(onArchivePress).toHaveBeenCalledTimes(1);
  expect(onSearchPress).not.toHaveBeenCalled();
  expect(onEditPress).not.toHaveBeenCalled();
});

it('calls onPress of the pressed native menu action', async () => {
  const onFilterPress = jest.fn();
  const onUnreadPress = jest.fn();
  const onFlaggedPress = jest.fn();
  await renderRouter(
    {
      _layout: () => (
        <SplitView>
          <SplitView.Column
            header={{
              leftToolbar: [
                {
                  title: 'Filter',
                  onPress: onFilterPress,
                  menu: {
                    items: [
                      { title: 'Unread', onPress: onUnreadPress },
                      { title: 'Flagged', onPress: onFlaggedPress },
                    ],
                  },
                },
              ],
            }}
          />
          <SplitView.Content />
        </SplitView>
      ),
      index: () => <Text>Index</Text>,
    },
    { initialUrl: '/' }
  );

  const { onToolbarItemPress } = jest.mocked(SplitViewNativeHeader).mock.lastCall![0];
  onToolbarItemPress({ nativeEvent: { id: 'left.0.1' } });

  expect(onFlaggedPress).toHaveBeenCalledTimes(1);
  expect(onUnreadPress).not.toHaveBeenCalled();
  expect(onFilterPress).not.toHaveBeenCalled();
});

it('passes the search bar placeholder to the native header without callbacks', async () => {
  await renderRouter(
    {
      _layout: () => (
        <SplitView>
          <SplitView.Column
            header={{
              searchBar: {
                placeholder: 'Search mailboxes',
                onChangeText: () => {},
                onSearchButtonPress: () => {},
              },
            }}
          />
          <SplitView.Content />
        </SplitView>
      ),
      index: () => <Text>Index</Text>,
    },
    { initialUrl: '/' }
  );

  expect(jest.mocked(SplitViewNativeHeader).mock.lastCall![0].searchBar).toEqual({
    placeholder: 'Search mailboxes',
  });
});

it('calls onChangeText of the search bar when the native search text changes', async () => {
  const onChangeText = jest.fn();
  const onSearchButtonPress = jest.fn();
  await renderRouter(
    {
      _layout: () => (
        <SplitView>
          <SplitView.Column header={{ searchBar: { onChangeText, onSearchButtonPress } }} />
          <SplitView.Content />
        </SplitView>
      ),
      index: () => <Text>Index</Text>,
    },
    { initialUrl: '/' }
  );

  // The test sends only the fields that the native header sends.
  const event = { nativeEvent: { text: 'Inbox' } } as NativeSyntheticEvent<{ text: string }>;
  jest.mocked(SplitViewNativeHeader).mock.lastCall![0].onSearchBarChangeText!(event);

  expect(onChangeText).toHaveBeenCalledTimes(1);
  expect(onChangeText).toHaveBeenCalledWith(event);
  expect(onSearchButtonPress).not.toHaveBeenCalled();
});

it('calls onSearchButtonPress of the search bar when the native search button is pressed', async () => {
  const onChangeText = jest.fn();
  const onSearchButtonPress = jest.fn();
  await renderRouter(
    {
      _layout: () => (
        <SplitView>
          <SplitView.Column header={{ searchBar: { onChangeText, onSearchButtonPress } }} />
          <SplitView.Content />
        </SplitView>
      ),
      index: () => <Text>Index</Text>,
    },
    { initialUrl: '/' }
  );

  // The test sends only the fields that the native header sends.
  const event = { nativeEvent: { text: 'Inbox' } } as NativeSyntheticEvent<{ text: string }>;
  jest.mocked(SplitViewNativeHeader).mock.lastCall![0].onSearchBarSearchButtonPress!(event);

  expect(onSearchButtonPress).toHaveBeenCalledTimes(1);
  expect(onSearchButtonPress).toHaveBeenCalledWith(event);
  expect(onChangeText).not.toHaveBeenCalled();
});

it('renders the SplitView.Content header in the content column', async () => {
  await renderRouter(
    {
      _layout: () => (
        <SplitView>
          <SplitView.Column />
          <SplitView.Content header={{ title: 'Message' }} />
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

it('renders the SplitView.Content header as the last child of the content column', async () => {
  await renderRouter(
    {
      _layout: () => (
        <SplitView>
          <SplitView.Column />
          <SplitView.Content header={{ title: 'Message' }} />
        </SplitView>
      ),
      index: () => <Text testID="index">Index</Text>,
    },
    { initialUrl: '/' }
  );

  // The first Split.Column is the sidebar column. The second is the content column.
  const contentColumnProps = jest.mocked(Split.Column).mock.calls[1]![0];
  expect(
    Children.toArray(contentColumnProps.children).map(
      (child) => isValidElement(child) && child.type
    )
  ).toEqual([SafeAreaView, SplitViewNativeColumn, SplitViewColumnHeader]);
});

it('renders the SplitView.Inspector header in the inspector', async () => {
  await renderRouter(
    {
      _layout: () => (
        <SplitView>
          <SplitView.Column />
          <SplitView.Content />
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

it('renders the SplitView.Inspector header as the last child of the inspector', async () => {
  await renderRouter(
    {
      _layout: () => (
        <SplitView>
          <SplitView.Column />
          <SplitView.Content />
          <SplitView.Inspector header={{ title: 'Details' }}>
            <Text>Inspector</Text>
          </SplitView.Inspector>
        </SplitView>
      ),
      index: () => <Text>Index</Text>,
    },
    { initialUrl: '/' }
  );

  const inspectorProps = jest.mocked(Split.Inspector).mock.lastCall![0];
  expect(
    Children.toArray(inspectorProps.children).map((child) => isValidElement(child) && child.type)
  ).toEqual([SafeAreaView, SplitViewColumnHeader]);
});

it('renders no native header for a SplitView.Column without header', async () => {
  await renderRouter(
    {
      _layout: () => (
        <SplitView>
          <SplitView.Column>
            <Text>Sidebar</Text>
          </SplitView.Column>
          <SplitView.Content />
        </SplitView>
      ),
      index: () => <Text>Index</Text>,
    },
    { initialUrl: '/' }
  );

  expect(screen.queryByTestId('SplitViewNativeHeader')).toBeNull();
  expect(SplitViewNativeHeader).not.toHaveBeenCalled();
});

it('rejects two SplitView.Content in a SplitView', async () => {
  await expect(
    async () =>
      await renderRouter({
        _layout: () => (
          <SplitView>
            <SplitView.Column />
            <SplitView.Content />
            <SplitView.Content />
          </SplitView>
        ),
        index: () => <Text>Index</Text>,
      })
  ).rejects.toThrow('There can only be one SplitView.Content in the SplitView.');
});

it('keeps automatic column ownership available without Content or a header', async () => {
  await renderRouter({
    _layout: () => (
      <SplitView>
        <SplitView.Column />
      </SplitView>
    ),
    index: () => <Text>Plain content</Text>,
  });
  expect(screen.getByTestId('SplitViewNativeColumn')).toBeVisible();
  expect(screen.queryByTestId('SplitViewNativeHeader')).toBeNull();
});

it('removes only collapsed owned content insets without remounting routes', async () => {
  await renderRouter({
    _layout: () => (
      <SplitView>
        <SplitView.Column>
          <Text>Sidebar</Text>
        </SplitView.Column>
      </SplitView>
    ),
    index: function Index() {
      const [count, setCount] = useState(0);
      return <Button title={`Count ${count}`} onPress={() => setCount(count + 1)} />;
    },
  });
  await fireEvent.press(screen.getByText('Count 0'));
  await fireEvent(screen.getByTestId('SplitViewNativeColumn'), 'ownershipChange', {
    nativeEvent: { ownsHeader: true, isCollapsed: true },
  });
  expect(jest.mocked(SafeAreaView).mock.lastCall![0].edges).toEqual({ left: false, right: false });
  expect(jest.mocked(SafeAreaView).mock.calls.at(-2)![0].edges).toEqual({
    left: true,
    right: true,
  });
  expect(screen.getByText('Count 1')).toBeVisible();
  await fireEvent(screen.getByTestId('SplitViewNativeColumn'), 'ownershipChange', {
    nativeEvent: { ownsHeader: true, isCollapsed: false },
  });
  expect(jest.mocked(SafeAreaView).mock.lastCall![0].edges).toEqual({ left: true, right: true });
  expect(screen.getByText('Count 1')).toBeVisible();
  await fireEvent(screen.getByTestId('SplitViewNativeColumn'), 'ownershipChange', {
    nativeEvent: { ownsHeader: false, isCollapsed: true },
  });
  expect(jest.mocked(SafeAreaView).mock.lastCall![0].edges).toEqual({ left: true, right: true });
});

it('automatically registers the outermost Stack even with its header explicitly hidden', async () => {
  await renderRouter(
    {
      _layout: () => (
        <SplitView>
          <SplitView.Column />
          <SplitView.Content />
        </SplitView>
      ),
      'stack/_layout': () => <Stack screenOptions={{ headerShown: false }} />,
      'stack/index': () => <Text>Stack root</Text>,
    },
    { initialUrl: '/stack' }
  );
  const marker = screen.getByTestId('SplitViewNativeStackScreen');
  expect(marker.props.columnId).toBe(screen.getByTestId('SplitViewNativeColumn').props.columnId);
  expect(marker.props.active).toBe(true);
});

it('does not register a second Stack inside the owning Stack', async () => {
  await renderRouter(
    {
      _layout: () => (
        <SplitView>
          <SplitView.Column />
          <SplitView.Content />
        </SplitView>
      ),
      'stack/_layout': () => <Stack />,
      'stack/inner/_layout': () => <Stack />,
      'stack/inner/index': () => <Text>Inner Stack</Text>,
    },
    { initialUrl: '/stack/inner' }
  );
  expect(screen.getAllByTestId('SplitViewNativeStackScreen')).toHaveLength(1);
});

it('does not register a Stack outside a SplitView', async () => {
  await renderRouter({
    _layout: () => <Stack />,
    index: () => <Text>Stack root</Text>,
  });
  expect(screen.queryByTestId('SplitViewNativeStackScreen')).toBeNull();
});

it('unregisters the Stack automatically when navigating to plain content', async () => {
  await renderRouter(
    {
      _layout: () => (
        <SplitView>
          <SplitView.Column />
          <SplitView.Content />
        </SplitView>
      ),
      'stack/_layout': () => <Stack />,
      'stack/index': () => <Text>Stack root</Text>,
      plain: () => <Text>Plain content</Text>,
    },
    { initialUrl: '/stack' }
  );
  expect(screen.getAllByTestId('SplitViewNativeStackScreen')).toHaveLength(1);
  await act(() => router.navigate('/plain'));
  expect(screen.queryByTestId('SplitViewNativeStackScreen')).toBeNull();
  expect(screen.getByText('Plain content')).toBeVisible();
});

it('keeps the underlying Stack registration while excluding a presented modal', async () => {
  await renderRouter(
    {
      _layout: () => (
        <SplitView>
          <SplitView.Column />
          <SplitView.Content />
        </SplitView>
      ),
      'stack/_layout': () => (
        <Stack>
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        </Stack>
      ),
      'stack/index': () => <Text>Stack root</Text>,
      'stack/modal': () => <Text>Modal</Text>,
    },
    { initialUrl: '/stack' }
  );
  await act(() => router.push('/stack/modal'));
  expect(
    screen.getAllByTestId('SplitViewNativeStackScreen', { includeHiddenElements: true })
  ).toHaveLength(1);
  expect(
    screen.getByTestId('SplitViewNativeStackScreen', { includeHiddenElements: true }).props.active
  ).toBe(true);
  await act(() => router.back());
  expect(screen.getAllByTestId('SplitViewNativeStackScreen')).toHaveLength(1);
});

it('registers a first screen configured as modal because native presents it as a card', async () => {
  await renderRouter(
    {
      _layout: () => (
        <SplitView>
          <SplitView.Column />
          <SplitView.Content />
        </SplitView>
      ),
      'stack/_layout': () => <Stack screenOptions={{ presentation: 'modal' }} />,
      'stack/index': () => <Text>Stack root</Text>,
    },
    { initialUrl: '/stack' }
  );
  expect(screen.getAllByTestId('SplitViewNativeStackScreen')).toHaveLength(1);
});
