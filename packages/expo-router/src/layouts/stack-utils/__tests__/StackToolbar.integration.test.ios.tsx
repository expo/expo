import { screen, within } from '@testing-library/react-native';
import { Text, View } from 'react-native';

import { renderRouter } from '../../../testing-library';
import Stack from '../../StackClient';

jest.mock('../../../toolbar/native', () => {
  const { View }: typeof import('react-native') = jest.requireActual('react-native');
  return {
    RouterToolbarHost: jest.fn(({ children }) => (
      <View testID="RouterToolbarHost">{children}</View>
    )),
    RouterToolbarItem: jest.fn((props) => <View testID="RouterToolbarItem" {...props} />),
  };
});

jest.mock('react-native-screens', () => {
  const actualScreens = jest.requireActual(
    'react-native-screens'
  ) as typeof import('react-native-screens');
  return {
    ...actualScreens,
    ScreenStackItem: jest.fn((props) => <actualScreens.ScreenStackItem {...props} />),
  };
});

const { RouterToolbarHost, RouterToolbarItem } = jest.requireMock(
  '../../../toolbar/native'
) as typeof import('../../../toolbar/native');
const MockedRouterToolbarHost = RouterToolbarHost as jest.MockedFunction<typeof RouterToolbarHost>;
const MockedRouterToolbarItem = RouterToolbarItem as jest.MockedFunction<typeof RouterToolbarItem>;

const { ScreenStackItem } = jest.requireMock(
  'react-native-screens'
) as typeof import('react-native-screens');
const MockedScreenStackItem = ScreenStackItem as jest.MockedFunction<typeof ScreenStackItem>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Stack.Toolbar integration tests', () => {
  describe('bottom placement', () => {
    it('renders RouterToolbarHost', () => {
      renderRouter({
        index: () => (
          <>
            <Stack.Toolbar placement="bottom">
              <Stack.Toolbar.Button icon="magnifyingglass" />
            </Stack.Toolbar>
            <View testID="index" />
          </>
        ),
      });

      expect(screen.getByTestId('index')).toBeVisible();
      expect(screen.getByTestId('RouterToolbarHost')).toBeVisible();
      expect(MockedRouterToolbarHost).toHaveBeenCalled();
    });

    it('renders toolbar items inside RouterToolbarHost', () => {
      renderRouter({
        index: () => (
          <>
            <Stack.Toolbar placement="bottom">
              <Stack.Toolbar.Button icon="folder" />
              <Stack.Toolbar.Spacer />
              <Stack.Toolbar.Button icon="square.and.pencil" />
            </Stack.Toolbar>
            <View testID="index" />
          </>
        ),
      });

      expect(screen.getByTestId('index')).toBeVisible();

      const host = screen.getByTestId('RouterToolbarHost');
      expect(within(host).getAllByTestId('RouterToolbarItem')).toHaveLength(3);
    });

    it('defaults to bottom placement when no placement specified', () => {
      renderRouter({
        index: () => (
          <>
            <Stack.Toolbar>
              <Stack.Toolbar.Button icon="magnifyingglass" />
            </Stack.Toolbar>
            <View testID="index" />
          </>
        ),
      });

      expect(screen.getByTestId('index')).toBeVisible();
      expect(screen.getByTestId('RouterToolbarHost')).toBeVisible();
    });

    it('renders multiple buttons with correct icons', () => {
      renderRouter({
        index: () => (
          <>
            <Stack.Toolbar placement="bottom">
              <Stack.Toolbar.Button icon="star" />
              <Stack.Toolbar.Button icon="heart" />
            </Stack.Toolbar>
            <View testID="index" />
          </>
        ),
      });

      expect(MockedRouterToolbarItem).toHaveBeenCalledWith(
        expect.objectContaining({
          systemImageName: 'star',
        }),
        undefined
      );
      expect(MockedRouterToolbarItem).toHaveBeenCalledWith(
        expect.objectContaining({
          systemImageName: 'heart',
        }),
        undefined
      );
    });
  });

  describe('nested toolbar prevention', () => {
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    it('throws error when toolbar is nested inside another toolbar', () => {
      expect(() => {
        renderRouter({
          index: () => (
            <>
              <Stack.Toolbar placement="bottom">
                <Stack.Toolbar>
                  <Stack.Toolbar.Button icon="star" />
                </Stack.Toolbar>
              </Stack.Toolbar>
              <View testID="index" />
            </>
          ),
        });
      }).toThrow('Stack.Toolbar cannot be nested inside another Stack.Toolbar.');
    });
  });

  describe('toolbar from page component', () => {
    it('renders bottom toolbar from page', () => {
      renderRouter({
        _layout: () => <Stack />,
        index: () => (
          <>
            <Stack.Toolbar placement="bottom">
              <Stack.Toolbar.Button icon="plus" />
            </Stack.Toolbar>
            <View testID="index" />
          </>
        ),
      });

      expect(screen.getByTestId('index')).toBeVisible();
      expect(screen.getByTestId('RouterToolbarHost')).toBeVisible();
    });
  });

  describe('left/right placement from layout', () => {
    it('passes headerLeftBarButtonItems to ScreenStackItem for left toolbar', () => {
      renderRouter({
        _layout: () => (
          <Stack>
            <Stack.Screen name="index">
              <Stack.Toolbar placement="left">
                <Stack.Toolbar.Button icon="sidebar.left" />
              </Stack.Toolbar>
            </Stack.Screen>
          </Stack>
        ),
        index: () => <View testID="index" />,
      });

      expect(screen.getByTestId('index')).toBeVisible();

      const items = MockedScreenStackItem.mock.calls[0][0].headerConfig?.headerLeftBarButtonItems;
      expect(items).toHaveLength(1);
      expect(items?.[0]).toMatchObject({
        type: 'button',
        icon: { type: 'sfSymbol', name: 'sidebar.left' },
      });
    });

    it('passes headerRightBarButtonItems to ScreenStackItem for right toolbar', () => {
      renderRouter({
        _layout: () => (
          <Stack>
            <Stack.Screen name="index">
              <Stack.Toolbar placement="right">
                <Stack.Toolbar.Button icon="ellipsis.circle" />
              </Stack.Toolbar>
            </Stack.Screen>
          </Stack>
        ),
        index: () => <View testID="index" />,
      });

      expect(screen.getByTestId('index')).toBeVisible();

      const items = MockedScreenStackItem.mock.calls[0][0].headerConfig?.headerRightBarButtonItems;
      expect(items).toHaveLength(1);
      expect(items?.[0]).toMatchObject({
        type: 'button',
        icon: { type: 'sfSymbol', name: 'ellipsis.circle' },
      });
    });

    it('passes both left and right items to ScreenStackItem', () => {
      renderRouter({
        _layout: () => (
          <Stack>
            <Stack.Screen name="index">
              <Stack.Toolbar placement="left">
                <Stack.Toolbar.Button icon="sidebar.left" />
              </Stack.Toolbar>
              <Stack.Toolbar placement="right">
                <Stack.Toolbar.Button icon="gear" />
              </Stack.Toolbar>
            </Stack.Screen>
          </Stack>
        ),
        index: () => <View testID="index" />,
      });

      expect(screen.getByTestId('index')).toBeVisible();

      const headerConfig = MockedScreenStackItem.mock.calls[0][0].headerConfig;
      const leftItems = headerConfig?.headerLeftBarButtonItems;
      const rightItems = headerConfig?.headerRightBarButtonItems;

      expect(leftItems).toHaveLength(1);
      expect(leftItems?.[0]).toMatchObject({
        type: 'button',
        icon: { type: 'sfSymbol', name: 'sidebar.left' },
      });

      expect(rightItems).toHaveLength(1);
      expect(rightItems?.[0]).toMatchObject({
        type: 'button',
        icon: { type: 'sfSymbol', name: 'gear' },
      });
    });

    it('renders custom left content for asChild left toolbar', () => {
      renderRouter({
        _layout: () => (
          <Stack>
            <Stack.Screen name="index">
              <Stack.Toolbar placement="left" asChild>
                <Text testID="custom-left">Custom Left</Text>
              </Stack.Toolbar>
            </Stack.Screen>
          </Stack>
        ),
        index: () => <View testID="index" />,
      });

      expect(screen.getByTestId('index')).toBeVisible();
      expect(screen.getByTestId('custom-left')).toBeVisible();
    });

    it('renders custom right content for asChild right toolbar', () => {
      renderRouter({
        _layout: () => (
          <Stack>
            <Stack.Screen name="index">
              <Stack.Toolbar placement="right" asChild>
                <Text testID="custom-right">Custom Right</Text>
              </Stack.Toolbar>
            </Stack.Screen>
          </Stack>
        ),
        index: () => <View testID="index" />,
      });

      expect(screen.getByTestId('index')).toBeVisible();
      expect(screen.getByTestId('custom-right')).toBeVisible();
    });
  });

  describe('invalid children warning', () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('warns about invalid children in left/right placement', () => {
      renderRouter({
        _layout: () => (
          <Stack>
            <Stack.Screen name="index">
              <Stack.Toolbar placement="right">
                <Text>Invalid Child</Text>
                <Stack.Toolbar.Button icon="star" />
              </Stack.Toolbar>
            </Stack.Screen>
          </Stack>
        ),
        index: () => <View testID="index" />,
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Stack.Toolbar with placement="right" only accepts')
      );
    });
  });

  describe('bottom toolbar from layout throws error', () => {
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    it('throws error when bottom toolbar is in layout', () => {
      expect(() => {
        renderRouter({
          _layout: () => (
            <Stack>
              <Stack.Screen name="index">
                <Stack.Toolbar placement="bottom">
                  <Stack.Toolbar.Button icon="star" />
                </Stack.Toolbar>
              </Stack.Screen>
            </Stack>
          ),
          index: () => <View testID="index" />,
        });
      }).toThrow('Stack.Toolbar with placement="bottom" cannot be used inside Stack.Screen');
    });
  });

  describe('screen with toolbar and other components', () => {
    it('passes title and toolbar items to ScreenStackItem', () => {
      renderRouter({
        _layout: () => (
          <Stack>
            <Stack.Screen name="index">
              <Stack.Screen.Title>Page Title</Stack.Screen.Title>
              <Stack.Toolbar placement="right">
                <Stack.Toolbar.Button icon="gear" />
              </Stack.Toolbar>
            </Stack.Screen>
          </Stack>
        ),
        index: () => <View testID="index" />,
      });

      expect(screen.getByTestId('index')).toBeVisible();

      const headerConfig = MockedScreenStackItem.mock.calls[0][0].headerConfig;
      expect(headerConfig?.title).toBe('Page Title');

      const rightItems = headerConfig?.headerRightBarButtonItems;
      expect(rightItems).toHaveLength(1);
      expect(rightItems?.[0]).toMatchObject({
        type: 'button',
        icon: { type: 'sfSymbol', name: 'gear' },
      });
    });

    it('passes back button config and toolbar items to ScreenStackItem', () => {
      renderRouter({
        _layout: () => (
          <Stack>
            <Stack.Screen name="index">
              <Stack.Screen.BackButton style={{ fontSize: 18 }} />
              <Stack.Toolbar placement="right">
                <Stack.Toolbar.Button icon="gear" />
              </Stack.Toolbar>
            </Stack.Screen>
          </Stack>
        ),
        index: () => <View testID="index" />,
      });

      expect(screen.getByTestId('index')).toBeVisible();

      const headerConfig = MockedScreenStackItem.mock.calls[0][0].headerConfig;
      expect(headerConfig?.backTitleFontSize).toBe(18);

      const rightItems = headerConfig?.headerRightBarButtonItems;
      expect(rightItems).toHaveLength(1);
      expect(rightItems?.[0]).toMatchObject({
        type: 'button',
        icon: { type: 'sfSymbol', name: 'gear' },
      });
    });
  });
});
