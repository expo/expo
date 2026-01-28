import { Text } from 'react-native';
import { ScreenStackItem as _ScreenStackItem } from 'react-native-screens';

import { renderRouter, screen } from '../../../testing-library';
import Stack from '../../Stack';
import { NativeToolbarMenu as _NativeToolbarMenu } from '../toolbar/bottom-toolbar-native-elements';

jest.mock('react-native-screens', () => {
  const actualScreens = jest.requireActual(
    'react-native-screens'
  ) as typeof import('react-native-screens');
  return {
    ...actualScreens,
    ScreenStackItem: jest.fn((props) => <actualScreens.ScreenStackItem {...props} />),
  };
});

jest.mock('../toolbar/bottom-toolbar-native-elements', () => {
  const actual = jest.requireActual('../toolbar/bottom-toolbar-native-elements');
  return {
    ...actual,
    NativeToolbarMenu: jest.fn((props) => <actual.NativeToolbarMenu {...props} />),
  };
});

const ScreenStackItem = _ScreenStackItem as jest.MockedFunction<typeof _ScreenStackItem>;
const NativeToolbarMenu = _NativeToolbarMenu as jest.MockedFunction<typeof _NativeToolbarMenu>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Stack.Toolbar.Menu label and title logic', () => {
  describe.each(['left', 'right'] as const)('placement="%s" (header toolbar)', (placement) => {
    const getHeaderItems = () => {
      const lastCallIndex = ScreenStackItem.mock.calls.length - 1;
      const headerConfig = ScreenStackItem.mock.calls[lastCallIndex][0].headerConfig;
      return placement === 'left'
        ? headerConfig.headerLeftBarButtonItems
        : headerConfig.headerRightBarButtonItems;
    };

    it('uses title prop for both label and menu title when only title is provided', () => {
      renderRouter({
        _layout: () => <Stack />,
        index: () => (
          <>
            <Stack.Toolbar placement={placement}>
              <Stack.Toolbar.Menu title="My Menu Title">
                <Stack.Toolbar.MenuAction onPress={() => {}}>Action</Stack.Toolbar.MenuAction>
              </Stack.Toolbar.Menu>
            </Stack.Toolbar>
            <Text testID="content">Content</Text>
          </>
        ),
      });

      expect(screen.getByTestId('content')).toBeVisible();
      const items = getHeaderItems();
      expect(items).toHaveLength(1);
      expect(items[0].type).toBe('menu');
      // Label should be the title
      expect(items[0].title).toBe('My Menu Title');
      // Menu title should also be the title
      expect(items[0].menu.title).toBe('My Menu Title');
    });

    it('uses Label child for label only and no menu title when only Label is provided', () => {
      renderRouter({
        _layout: () => <Stack />,
        index: () => (
          <>
            <Stack.Toolbar placement={placement}>
              <Stack.Toolbar.Menu>
                <Stack.Toolbar.Label>Label From Child</Stack.Toolbar.Label>
                <Stack.Toolbar.MenuAction onPress={() => {}}>Action</Stack.Toolbar.MenuAction>
              </Stack.Toolbar.Menu>
            </Stack.Toolbar>
            <Text testID="content">Content</Text>
          </>
        ),
      });

      expect(screen.getByTestId('content')).toBeVisible();
      const items = getHeaderItems();
      expect(items).toHaveLength(1);
      expect(items[0].type).toBe('menu');
      // Label should come from the Label child
      expect(items[0].title).toBe('Label From Child');
      // Menu title should be empty (not set)
      expect(items[0].menu.title).toBeUndefined();
    });

    it('uses Label child for label and title prop for menu title when both are provided', () => {
      renderRouter({
        _layout: () => <Stack />,
        index: () => (
          <>
            <Stack.Toolbar placement={placement}>
              <Stack.Toolbar.Menu title="Menu Title">
                <Stack.Toolbar.Label>Button Label</Stack.Toolbar.Label>
                <Stack.Toolbar.MenuAction onPress={() => {}}>Action</Stack.Toolbar.MenuAction>
              </Stack.Toolbar.Menu>
            </Stack.Toolbar>
            <Text testID="content">Content</Text>
          </>
        ),
      });

      expect(screen.getByTestId('content')).toBeVisible();
      const items = getHeaderItems();
      expect(items).toHaveLength(1);
      expect(items[0].type).toBe('menu');
      // Label should come from the Label child
      expect(items[0].title).toBe('Button Label');
      // Menu title should be the title prop
      expect(items[0].menu.title).toBe('Menu Title');
    });
  });

  describe('placement="bottom" (NativeToolbarMenu)', () => {
    it('uses title prop for both label and menu title when only title is provided', () => {
      renderRouter({
        _layout: () => <Stack />,
        index: () => (
          <>
            <Stack.Toolbar placement="bottom">
              <Stack.Toolbar.Menu title="My Menu Title">
                <Stack.Toolbar.MenuAction onPress={() => {}}>Action</Stack.Toolbar.MenuAction>
              </Stack.Toolbar.Menu>
            </Stack.Toolbar>
            <Text testID="content">Content</Text>
          </>
        ),
      });

      expect(screen.getByTestId('content')).toBeVisible();
      expect(NativeToolbarMenu).toHaveBeenCalled();
      const lastCall = NativeToolbarMenu.mock.calls[NativeToolbarMenu.mock.calls.length - 1][0];
      // Label should be the title
      expect(lastCall.label).toBe('My Menu Title');
      // Menu title should also be the title
      expect(lastCall.title).toBe('My Menu Title');
    });

    it('uses Label child for label only and empty menu title when only Label is provided', () => {
      renderRouter({
        _layout: () => <Stack />,
        index: () => (
          <>
            <Stack.Toolbar placement="bottom">
              <Stack.Toolbar.Menu>
                <Stack.Toolbar.Label>Label From Child</Stack.Toolbar.Label>
                <Stack.Toolbar.MenuAction onPress={() => {}}>Action</Stack.Toolbar.MenuAction>
              </Stack.Toolbar.Menu>
            </Stack.Toolbar>
            <Text testID="content">Content</Text>
          </>
        ),
      });

      expect(screen.getByTestId('content')).toBeVisible();
      expect(NativeToolbarMenu).toHaveBeenCalled();
      const lastCall = NativeToolbarMenu.mock.calls[NativeToolbarMenu.mock.calls.length - 1][0];
      // Label should come from the Label child
      expect(lastCall.label).toBe('Label From Child');
      // Menu title should be empty string
      expect(lastCall.title).toBe('');
    });

    it('uses Label child for label and title prop for menu title when both are provided', () => {
      renderRouter({
        _layout: () => <Stack />,
        index: () => (
          <>
            <Stack.Toolbar placement="bottom">
              <Stack.Toolbar.Menu title="Menu Title">
                <Stack.Toolbar.Label>Button Label</Stack.Toolbar.Label>
                <Stack.Toolbar.MenuAction onPress={() => {}}>Action</Stack.Toolbar.MenuAction>
              </Stack.Toolbar.Menu>
            </Stack.Toolbar>
            <Text testID="content">Content</Text>
          </>
        ),
      });

      expect(screen.getByTestId('content')).toBeVisible();
      expect(NativeToolbarMenu).toHaveBeenCalled();
      const lastCall = NativeToolbarMenu.mock.calls[NativeToolbarMenu.mock.calls.length - 1][0];
      // Label should come from the Label child
      expect(lastCall.label).toBe('Button Label');
      // Menu title should be the title prop
      expect(lastCall.title).toBe('Menu Title');
    });
  });
});
