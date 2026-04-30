import { screen, within } from '@testing-library/react-native';
import React from 'react';
import { Text, View } from 'react-native';

import { renderRouter } from '../../../testing-library';
import Stack from '../../StackClient';

jest.mock('react-native-screens', () => {
  const actualScreens = jest.requireActual(
    'react-native-screens'
  ) as typeof import('react-native-screens');
  return {
    ...actualScreens,
    ScreenStackItem: jest.fn((props) => <actualScreens.ScreenStackItem {...props} />),
    ScreenStackHeaderLeftView: jest.fn((props) => (
      <actualScreens.ScreenStackHeaderLeftView {...props} />
    )),
    ScreenStackHeaderRightView: jest.fn((props) => (
      <actualScreens.ScreenStackHeaderRightView {...props} />
    )),
  };
});

jest.mock('@expo/ui/jetpack-compose', () => {
  const { View }: typeof import('react-native') = jest.requireActual('react-native');

  const DropdownMenu = jest.fn((props) => (
    <View testID="DropdownMenu" {...props} />
  )) as unknown as jest.MockedFunction<React.FC<Record<string, unknown>>> & {
    Trigger: jest.MockedFunction<React.FC<Record<string, unknown>>>;
    Items: jest.MockedFunction<React.FC<Record<string, unknown>>>;
  };
  DropdownMenu.Trigger = jest.fn((props) => <View testID="DropdownMenu.Trigger" {...props} />);
  DropdownMenu.Items = jest.fn((props) => <View testID="DropdownMenu.Items" {...props} />);

  const DropdownMenuItem = jest.fn((props) => (
    <View testID="DropdownMenuItem" {...props} />
  )) as unknown as jest.MockedFunction<React.FC<Record<string, unknown>>> & {
    Text: jest.MockedFunction<React.FC<Record<string, unknown>>>;
    LeadingIcon: jest.MockedFunction<React.FC<Record<string, unknown>>>;
    TrailingIcon: jest.MockedFunction<React.FC<Record<string, unknown>>>;
  };
  DropdownMenuItem.Text = jest.fn((props) => <View testID="DropdownMenuItem.Text" {...props} />);
  DropdownMenuItem.LeadingIcon = jest.fn((props) => (
    <View testID="DropdownMenuItem.LeadingIcon" {...props} />
  ));
  DropdownMenuItem.TrailingIcon = jest.fn((props) => (
    <View testID="DropdownMenuItem.TrailingIcon" {...props} />
  ));

  return {
    Host: jest.fn((props) => <View testID="Host" {...props} />),
    Row: jest.fn((props) => <View testID="Row" {...props} />),
    HorizontalFloatingToolbar: jest.fn((props) => (
      <View testID="HorizontalFloatingToolbar" {...props} />
    )),
    DropdownMenu,
    DropdownMenuItem,
    Divider: jest.fn(() => <View testID="Divider" />),
    Icon: jest.fn((props) => <View testID="Icon" {...props} />),
    IconButton: jest.fn((props) => <View testID="IconButton" {...props} />),
    Text: jest.fn((props) => <View testID="ComposeText" {...props} />),
    RNHostView: jest.fn((props) => <View testID="RNHostView" {...props} />),
  };
});

jest.mock('@expo/ui/jetpack-compose/modifiers', () => ({
  background: jest.fn((color: string) => ({ type: 'background', color })),
  fillMaxWidth: jest.fn(() => ({ type: 'fillMaxWidth' })),
  fillMaxHeight: jest.fn(() => ({ type: 'fillMaxHeight' })),
  height: jest.fn((h: number) => ({ type: 'height', height: h })),
  padding: jest.fn((...args: number[]) => ({ type: 'padding', values: args })),
  imePadding: jest.fn(() => ({ type: 'imePadding' })),
  width: jest.fn((w: number) => ({ type: 'width', width: w })),
}));

jest.mock('../../../color', () => ({
  Color: {
    android: {
      dynamic: {
        onSurface: 'dynamic:onSurface',
        surfaceContainer: 'dynamic:surfaceContainer',
      },
      material: {
        error: 'material:error',
      },
    },
  },
}));

jest.mock('../../../../assets/arrow_right.xml', () => 'mocked-arrow-right');
jest.mock('../../../../assets/checkmark.xml', () => 'mocked-checkmark');

jest.mock('../../../toolbar/AnimatedItemContainer', () => {
  const { View }: typeof import('react-native') = jest.requireActual('react-native');
  return {
    AnimatedItemContainer: jest.fn((props) => <View testID="AnimatedItemContainer" {...props} />),
  };
});

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const SafeAreaInsetsContext = React.createContext({ top: 0, bottom: 0, left: 0, right: 0 });
  const SafeAreaFrameContext = React.createContext({ x: 0, y: 0, width: 0, height: 0 });
  return {
    SafeAreaInsetsContext,
    SafeAreaFrameContext,
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 0, height: 0 }),
    initialWindowMetrics: {
      insets: { top: 0, bottom: 0, left: 0, right: 0 },
      frame: { x: 0, y: 0, width: 0, height: 0 },
    },
  };
});

jest.mock('../../../toolbar/native', () => {
  const { View }: typeof import('react-native') = jest.requireActual('react-native');
  return {
    RouterToolbarHost: jest.fn(({ children }) => (
      <View testID="RouterToolbarHost">{children}</View>
    )),
    RouterToolbarItem: jest.fn((props) => <View testID="RouterToolbarItem" {...props} />),
  };
});

const { ScreenStackItem, ScreenStackHeaderLeftView, ScreenStackHeaderRightView } = jest.requireMock(
  'react-native-screens'
) as typeof import('react-native-screens');
const MockedScreenStackItem = ScreenStackItem as jest.MockedFunction<typeof ScreenStackItem>;
const MockedScreenStackHeaderLeftView = ScreenStackHeaderLeftView as jest.MockedFunction<
  typeof ScreenStackHeaderLeftView
>;
const MockedScreenStackHeaderRightView = ScreenStackHeaderRightView as jest.MockedFunction<
  typeof ScreenStackHeaderRightView
>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Stack.Toolbar Android integration tests', () => {
  describe('left/right placement from layout', () => {
    it.each(['left', 'right'] as const)(
      'renders Host > Row for %s toolbar with no headerBarButtonItems',
      (placement) => {
        renderRouter({
          _layout: () => (
            <Stack>
              <Stack.Screen name="index">
                <Stack.Toolbar placement={placement}>
                  <Stack.Toolbar.Button icon={{ uri: 'icon' }} />
                </Stack.Toolbar>
              </Stack.Screen>
            </Stack>
          ),
          index: () => <View testID="index" />,
        });

        expect(screen.getByTestId('index')).toBeVisible();

        // On Android, toolbar renders native Compose content via Host > Row
        const host = screen.getByTestId('Host');
        expect(host.props.matchContents).toBe(true);
        expect(within(host).getByTestId('Row')).toBeDefined();
        expect(within(host).getByTestId('IconButton')).toBeDefined();

        // Android uses headerLeft/headerRight (ScreenStackHeaderLeftView/RightView),
        // NOT headerLeftBarButtonItems/headerRightBarButtonItems (iOS-only)
        const headerConfig = MockedScreenStackItem.mock.calls[0]![0].headerConfig;
        expect(headerConfig?.headerLeftBarButtonItems).toBeUndefined();
        expect(headerConfig?.headerRightBarButtonItems).toBeUndefined();

        // Verify the correct ScreenStackHeader*View was rendered
        if (placement === 'left') {
          expect(MockedScreenStackHeaderLeftView).toHaveBeenCalled();
        } else {
          expect(MockedScreenStackHeaderRightView).toHaveBeenCalled();
        }
      }
    );

    it('renders both left and right toolbars simultaneously', () => {
      renderRouter({
        _layout: () => (
          <Stack>
            <Stack.Screen name="index">
              <Stack.Toolbar placement="left">
                <Stack.Toolbar.Button icon={{ uri: 'menu-icon' }} />
              </Stack.Toolbar>
              <Stack.Toolbar placement="right">
                <Stack.Toolbar.Button icon={{ uri: 'settings-icon' }} />
              </Stack.Toolbar>
            </Stack.Screen>
          </Stack>
        ),
        index: () => <View testID="index" />,
      });

      expect(screen.getByTestId('index')).toBeVisible();

      // Both left and right render their own Host > Row wrappers
      const hosts = screen.getAllByTestId('Host');
      expect(hosts).toHaveLength(2);
      expect(screen.getAllByTestId('IconButton')).toHaveLength(2);

      // Android uses headerLeft/headerRight, not iOS bar button items
      const headerConfig = MockedScreenStackItem.mock.calls[0]![0].headerConfig;
      expect(headerConfig?.headerLeftBarButtonItems).toBeUndefined();
      expect(headerConfig?.headerRightBarButtonItems).toBeUndefined();

      expect(MockedScreenStackHeaderLeftView).toHaveBeenCalled();
      expect(MockedScreenStackHeaderRightView).toHaveBeenCalled();
    });

    it.each(['left', 'right'] as const)(
      'asChild mode for %s placement renders children directly',
      (placement) => {
        renderRouter({
          _layout: () => (
            <Stack>
              <Stack.Screen name="index">
                <Stack.Toolbar placement={placement} asChild>
                  <Text testID={`custom-${placement}`}>Custom</Text>
                </Stack.Toolbar>
              </Stack.Screen>
            </Stack>
          ),
          index: () => <View testID="index" />,
        });

        expect(screen.getByTestId('index')).toBeVisible();
        expect(screen.getByTestId(`custom-${placement}`)).toBeVisible();

        const headerConfig = MockedScreenStackItem.mock.calls[0]![0].headerConfig;
        expect(headerConfig?.headerLeftBarButtonItems).toBeUndefined();
        expect(headerConfig?.headerRightBarButtonItems).toBeUndefined();

        if (placement === 'left') {
          expect(MockedScreenStackHeaderLeftView).toHaveBeenCalled();
        } else {
          expect(MockedScreenStackHeaderRightView).toHaveBeenCalled();
        }
      }
    );
  });

  it.each(['left', 'right'] as const)(
    'renders menu with DropdownMenu inside %s toolbar',
    (placement) => {
      renderRouter({
        _layout: () => (
          <Stack>
            <Stack.Screen name="index">
              <Stack.Toolbar placement={placement}>
                <Stack.Toolbar.Menu icon={{ uri: 'menu-icon' }}>
                  <Stack.Toolbar.MenuAction onPress={() => {}}>Action 1</Stack.Toolbar.MenuAction>
                </Stack.Toolbar.Menu>
              </Stack.Toolbar>
            </Stack.Screen>
          </Stack>
        ),
        index: () => <View testID="index" />,
      });

      expect(screen.getByTestId('index')).toBeVisible();

      const host = screen.getByTestId('Host');
      expect(host).toBeDefined();
      expect(within(host).getByTestId('DropdownMenu')).toBeDefined();
      expect(within(host).getByTestId('IconButton')).toBeDefined();

      if (placement === 'left') {
        expect(MockedScreenStackHeaderLeftView).toHaveBeenCalled();
      } else {
        expect(MockedScreenStackHeaderRightView).toHaveBeenCalled();
      }
    }
  );

  it('renders RouterToolbarHost for bottom toolbar', () => {
    renderRouter({
      index: () => (
        <>
          <Stack.Toolbar placement="bottom">
            <Stack.Toolbar.Button icon={{ uri: 'icon' }} />
          </Stack.Toolbar>
          <View testID="index" />
        </>
      ),
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(screen.getByTestId('RouterToolbarHost')).toBeVisible();
  });

  it.each(['left', 'right'] as const)(
    'renders %s toolbar from page with Host > Row wrapper',
    (placement) => {
      renderRouter({
        _layout: () => <Stack />,
        index: () => (
          <>
            <Stack.Toolbar placement={placement}>
              <Stack.Toolbar.Button icon={{ uri: 'page-icon' }} />
            </Stack.Toolbar>
            <View testID="index" />
          </>
        ),
      });

      expect(screen.getByTestId('index')).toBeVisible();

      const host = screen.getByTestId('Host');
      expect(host).toBeDefined();
      expect(within(host).getByTestId('Row')).toBeDefined();

      if (placement === 'left') {
        expect(MockedScreenStackHeaderLeftView).toHaveBeenCalled();
      } else {
        expect(MockedScreenStackHeaderRightView).toHaveBeenCalled();
      }
    }
  );
});
