import { useImage as _useImage } from 'expo-image';
import React from 'react';
import { Text, View } from 'react-native';
import { ScreenStackItem as _ScreenStackItem } from 'react-native-screens';

import { renderRouter, screen } from '../../../testing-library';
import { RouterToolbarItem } from '../../../toolbar/native';
import Stack from '../../Stack';

jest.mock('react-native-screens', () => {
  const actualScreens = jest.requireActual(
    'react-native-screens'
  ) as typeof import('react-native-screens');
  return {
    ...actualScreens,
    ScreenStackItem: jest.fn((props) => <actualScreens.ScreenStackItem {...props} />),
  };
});

jest.mock('../../../toolbar/native', () => {
  const { View } = require('react-native');
  return {
    RouterToolbarHost: jest.fn((props) => <View {...props} />),
    RouterToolbarItem: jest.fn((props) => <View {...props} />),
  };
});

jest.mock('expo-image', () => ({
  useImage: jest.fn(() => null),
}));

const ScreenStackItem = _ScreenStackItem as jest.MockedFunction<typeof _ScreenStackItem>;
const MockedRouterToolbarItem = RouterToolbarItem as jest.MockedFunction<typeof RouterToolbarItem>;
const useImage = _useImage as jest.MockedFunction<typeof _useImage>;

let consoleWarnMock: jest.SpyInstance;
beforeEach(() => {
  consoleWarnMock = jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.clearAllMocks();
});

afterEach(() => {
  consoleWarnMock.mockRestore();
});

describe('Stack.Toolbar unified API', () => {
  describe('Stack.Screen.Title', () => {
    it('sets title via Stack.Screen.Title in layout', () => {
      renderRouter({
        _layout: () => (
          <Stack>
            <Stack.Screen name="index">
              <Stack.Screen.Title>My Title</Stack.Screen.Title>
            </Stack.Screen>
          </Stack>
        ),
        index: () => <Text testID="index">index</Text>,
      });

      expect(screen.getByTestId('index')).toBeVisible();
      expect(ScreenStackItem).toHaveBeenCalledTimes(1);
      expect(ScreenStackItem.mock.calls[0][0].headerConfig.title).toBe('My Title');
    });

    it('sets title via Stack.Screen.Title in screen component (dynamic)', () => {
      renderRouter({
        _layout: () => <Stack />,
        index: () => (
          <>
            <Stack.Screen.Title>Dynamic Title</Stack.Screen.Title>
            <Text testID="index">index</Text>
          </>
        ),
      });

      expect(screen.getByTestId('index')).toBeVisible();
      expect(ScreenStackItem).toHaveBeenCalledTimes(2);
      // Second call has the dynamic title
      expect(ScreenStackItem.mock.calls[1][0].headerConfig.title).toBe('Dynamic Title');
    });

    it('supports large title', () => {
      renderRouter({
        _layout: () => (
          <Stack>
            <Stack.Screen name="index">
              <Stack.Screen.Title large>Large Title</Stack.Screen.Title>
            </Stack.Screen>
          </Stack>
        ),
        index: () => <Text testID="index">index</Text>,
      });

      expect(screen.getByTestId('index')).toBeVisible();
      expect(ScreenStackItem).toHaveBeenCalledTimes(1);
      expect(ScreenStackItem.mock.calls[0][0].headerConfig.title).toBe('Large Title');
      expect(ScreenStackItem.mock.calls[0][0].headerConfig.largeTitle).toBe(true);
    });

    it('supports title styling', () => {
      renderRouter({
        _layout: () => (
          <Stack>
            <Stack.Screen name="index">
              <Stack.Screen.Title style={{ fontSize: 20, fontWeight: 'bold', color: 'red' }}>
                Styled Title
              </Stack.Screen.Title>
            </Stack.Screen>
          </Stack>
        ),
        index: () => <Text testID="index">index</Text>,
      });

      expect(screen.getByTestId('index')).toBeVisible();
      expect(ScreenStackItem).toHaveBeenCalledTimes(1);
      expect(ScreenStackItem.mock.calls[0][0].headerConfig.title).toBe('Styled Title');
      expect(ScreenStackItem.mock.calls[0][0].headerConfig.titleFontSize).toBe(20);
      expect(ScreenStackItem.mock.calls[0][0].headerConfig.titleFontWeight).toBe('bold');
      expect(ScreenStackItem.mock.calls[0][0].headerConfig.titleColor).toBe('red');
    });
  });

  describe('Stack.Screen.BackButton', () => {
    it('sets back button title', () => {
      renderRouter({
        _layout: () => (
          <Stack>
            <Stack.Screen name="index" />
            <Stack.Screen name="detail">
              <Stack.Screen.BackButton>Go Back</Stack.Screen.BackButton>
            </Stack.Screen>
          </Stack>
        ),
        index: () => <Text testID="index">index</Text>,
        detail: () => <Text testID="detail">detail</Text>,
      });

      expect(screen.getByTestId('index')).toBeVisible();
      // Navigate to check back button config would require navigation
      // For now just verify basic structure works
      expect(ScreenStackItem).toHaveBeenCalled();
    });

    it('can hide back button', () => {
      renderRouter({
        _layout: () => (
          <Stack>
            <Stack.Screen name="index" />
            <Stack.Screen name="detail">
              <Stack.Screen.BackButton hidden />
            </Stack.Screen>
          </Stack>
        ),
        index: () => <Text testID="index">index</Text>,
        detail: () => <Text testID="detail">detail</Text>,
      });

      expect(screen.getByTestId('index')).toBeVisible();
      expect(ScreenStackItem).toHaveBeenCalled();
    });
  });

  describe('Stack.Header (styling only)', () => {
    it('sets header style', () => {
      renderRouter({
        _layout: () => (
          <Stack>
            <Stack.Screen name="index">
              <Stack.Header style={{ backgroundColor: '#fff' }} />
            </Stack.Screen>
          </Stack>
        ),
        index: () => <Text testID="index">index</Text>,
      });

      expect(screen.getByTestId('index')).toBeVisible();
      expect(ScreenStackItem).toHaveBeenCalledTimes(1);
      expect(ScreenStackItem.mock.calls[0][0].headerConfig.backgroundColor).toBe('#fff');
    });

    it('sets blur effect', () => {
      renderRouter({
        _layout: () => (
          <Stack>
            <Stack.Screen name="index">
              <Stack.Header blurEffect="systemMaterial" />
            </Stack.Screen>
          </Stack>
        ),
        index: () => <Text testID="index">index</Text>,
      });

      expect(screen.getByTestId('index')).toBeVisible();
      expect(ScreenStackItem).toHaveBeenCalledTimes(1);
      expect(ScreenStackItem.mock.calls[0][0].headerConfig.blurEffect).toBe('systemMaterial');
    });

    it('hides header shadow', () => {
      renderRouter({
        _layout: () => (
          <Stack>
            <Stack.Screen name="index">
              <Stack.Header style={{ shadowColor: 'transparent' }} />
            </Stack.Screen>
          </Stack>
        ),
        index: () => <Text testID="index">index</Text>,
      });

      expect(screen.getByTestId('index')).toBeVisible();
      expect(ScreenStackItem).toHaveBeenCalledTimes(1);
      expect(ScreenStackItem.mock.calls[0][0].headerConfig.hideShadow).toBe(true);
    });
  });

  describe('Stack.Toolbar placement="left"', () => {
    it('renders button in header left', () => {
      renderRouter({
        _layout: () => (
          <Stack>
            <Stack.Screen name="index">
              <Stack.Toolbar placement="left">
                <Stack.Toolbar.Button icon="sf:sidebar.left" onPress={() => {}} />
              </Stack.Toolbar>
            </Stack.Screen>
          </Stack>
        ),
        index: () => <Text testID="index">index</Text>,
      });

      expect(screen.getByTestId('index')).toBeVisible();
      expect(ScreenStackItem).toHaveBeenCalledTimes(1);
      const leftItems = ScreenStackItem.mock.calls[0][0].headerConfig.headerLeftBarButtonItems;
      expect(leftItems).toBeDefined();
      expect(leftItems).toHaveLength(1);
      expect(leftItems[0].type).toBe('button');
      expect(leftItems[0].icon).toEqual({ type: 'sfSymbol', name: 'sidebar.left' });
    });

    it('renders multiple items in header left', () => {
      renderRouter({
        _layout: () => (
          <Stack>
            <Stack.Screen name="index">
              <Stack.Toolbar placement="left">
                <Stack.Toolbar.Button icon="sf:star" onPress={() => {}} />
                <Stack.Toolbar.Spacer width={8} />
                <Stack.Toolbar.Button icon="sf:heart" onPress={() => {}} />
              </Stack.Toolbar>
            </Stack.Screen>
          </Stack>
        ),
        index: () => <Text testID="index">index</Text>,
      });

      expect(screen.getByTestId('index')).toBeVisible();
      expect(ScreenStackItem).toHaveBeenCalledTimes(1);
      const leftItems = ScreenStackItem.mock.calls[0][0].headerConfig.headerLeftBarButtonItems;
      expect(leftItems).toHaveLength(3);
      expect(leftItems[0].type).toBe('button');
      expect(leftItems[1].type).toBe('spacing');
      expect(leftItems[1].spacing).toBe(8);
      expect(leftItems[2].type).toBe('button');
    });

    it('works in screen component (dynamic)', () => {
      renderRouter({
        _layout: () => <Stack />,
        index: () => (
          <>
            <Stack.Toolbar placement="left">
              <Stack.Toolbar.Button icon="sf:star" onPress={() => {}} />
            </Stack.Toolbar>
            <Text testID="index">index</Text>
          </>
        ),
      });

      expect(screen.getByTestId('index')).toBeVisible();
      expect(ScreenStackItem).toHaveBeenCalledTimes(2);
      const leftItems = ScreenStackItem.mock.calls[1][0].headerConfig.headerLeftBarButtonItems;
      expect(leftItems).toBeDefined();
      expect(leftItems).toHaveLength(1);
      expect(leftItems[0].type).toBe('button');
    });

    describe('iconRenderingMode', () => {
      it('passes iconRenderingMode="template" with image icon (templateSource)', () => {
        renderRouter({
          _layout: () => (
            <Stack>
              <Stack.Screen name="index">
                <Stack.Toolbar placement="left">
                  <Stack.Toolbar.Button
                    icon={{ uri: 'https://example.com/icon.png' }}
                    iconRenderingMode="template"
                    onPress={() => {}}
                  />
                </Stack.Toolbar>
              </Stack.Screen>
            </Stack>
          ),
          index: () => <Text testID="index">index</Text>,
        });

        expect(screen.getByTestId('index')).toBeVisible();
        const leftItems = ScreenStackItem.mock.calls[0][0].headerConfig.headerLeftBarButtonItems;
        expect(leftItems[0].icon).toEqual({
          type: 'templateSource',
          templateSource: { uri: 'https://example.com/icon.png' },
        });
      });

      it('passes iconRenderingMode="original" with image icon (imageSource)', () => {
        renderRouter({
          _layout: () => (
            <Stack>
              <Stack.Screen name="index">
                <Stack.Toolbar placement="left">
                  <Stack.Toolbar.Button
                    icon={{ uri: 'https://example.com/icon.png' }}
                    iconRenderingMode="original"
                    onPress={() => {}}
                  />
                </Stack.Toolbar>
              </Stack.Screen>
            </Stack>
          ),
          index: () => <Text testID="index">index</Text>,
        });

        expect(screen.getByTestId('index')).toBeVisible();
        const leftItems = ScreenStackItem.mock.calls[0][0].headerConfig.headerLeftBarButtonItems;
        expect(leftItems[0].icon).toEqual({
          type: 'imageSource',
          imageSource: { uri: 'https://example.com/icon.png' },
        });
      });

      it('defaults to template when tintColor is set', () => {
        renderRouter({
          _layout: () => (
            <Stack>
              <Stack.Screen name="index">
                <Stack.Toolbar placement="left">
                  <Stack.Toolbar.Button
                    icon={{ uri: 'https://example.com/icon.png' }}
                    tintColor="red"
                    onPress={() => {}}
                  />
                </Stack.Toolbar>
              </Stack.Screen>
            </Stack>
          ),
          index: () => <Text testID="index">index</Text>,
        });

        expect(screen.getByTestId('index')).toBeVisible();
        const leftItems = ScreenStackItem.mock.calls[0][0].headerConfig.headerLeftBarButtonItems;
        expect(leftItems[0].icon).toEqual({
          type: 'templateSource',
          templateSource: { uri: 'https://example.com/icon.png' },
        });
      });

      it('defaults to original when no tintColor', () => {
        renderRouter({
          _layout: () => (
            <Stack>
              <Stack.Screen name="index">
                <Stack.Toolbar placement="left">
                  <Stack.Toolbar.Button
                    icon={{ uri: 'https://example.com/icon.png' }}
                    onPress={() => {}}
                  />
                </Stack.Toolbar>
              </Stack.Screen>
            </Stack>
          ),
          index: () => <Text testID="index">index</Text>,
        });

        expect(screen.getByTestId('index')).toBeVisible();
        const leftItems = ScreenStackItem.mock.calls[0][0].headerConfig.headerLeftBarButtonItems;
        expect(leftItems[0].icon).toEqual({
          type: 'imageSource',
          imageSource: { uri: 'https://example.com/icon.png' },
        });
      });
    });
  });

  describe('Stack.Toolbar placement="right"', () => {
    it('renders menu in header right', () => {
      renderRouter({
        _layout: () => (
          <Stack>
            <Stack.Screen name="index">
              <Stack.Toolbar placement="right">
                <Stack.Toolbar.Menu icon="sf:ellipsis.circle">
                  <Stack.Toolbar.MenuAction onPress={() => {}}>Action 1</Stack.Toolbar.MenuAction>
                </Stack.Toolbar.Menu>
              </Stack.Toolbar>
            </Stack.Screen>
          </Stack>
        ),
        index: () => <Text testID="index">index</Text>,
      });

      expect(screen.getByTestId('index')).toBeVisible();
      expect(ScreenStackItem).toHaveBeenCalledTimes(1);
      const rightItems = ScreenStackItem.mock.calls[0][0].headerConfig.headerRightBarButtonItems;
      expect(rightItems).toBeDefined();
      expect(rightItems).toHaveLength(1);
      expect(rightItems[0].type).toBe('menu');
      expect(rightItems[0].icon).toEqual({ type: 'sfSymbol', name: 'ellipsis.circle' });
      expect(rightItems[0].menu.items).toHaveLength(1);
      expect(rightItems[0].menu.items[0].title).toBe('Action 1');
    });

    it('supports button variants', () => {
      renderRouter({
        _layout: () => (
          <Stack>
            <Stack.Screen name="index">
              <Stack.Toolbar placement="right">
                <Stack.Toolbar.Button variant="done" onPress={() => {}}>
                  Done
                </Stack.Toolbar.Button>
              </Stack.Toolbar>
            </Stack.Screen>
          </Stack>
        ),
        index: () => <Text testID="index">index</Text>,
      });

      expect(screen.getByTestId('index')).toBeVisible();
      expect(ScreenStackItem).toHaveBeenCalledTimes(1);
      const rightItems = ScreenStackItem.mock.calls[0][0].headerConfig.headerRightBarButtonItems;
      expect(rightItems).toBeDefined();
      expect(rightItems).toHaveLength(1);
      expect(rightItems[0].type).toBe('button');
      expect(rightItems[0].title).toBe('Done');
      expect(rightItems[0].variant).toBe('done');
    });

    it('works in screen component (dynamic)', () => {
      renderRouter({
        _layout: () => <Stack />,
        index: () => (
          <>
            <Stack.Toolbar placement="right">
              <Stack.Toolbar.Button icon="sf:plus" onPress={() => {}} />
            </Stack.Toolbar>
            <Text testID="index">index</Text>
          </>
        ),
      });

      expect(screen.getByTestId('index')).toBeVisible();
      expect(ScreenStackItem).toHaveBeenCalledTimes(2);
      const rightItems = ScreenStackItem.mock.calls[1][0].headerConfig.headerRightBarButtonItems;
      expect(rightItems).toBeDefined();
      expect(rightItems).toHaveLength(1);
      expect(rightItems[0].type).toBe('button');
    });

    describe('iconRenderingMode', () => {
      it('passes iconRenderingMode="template" with image icon (templateSource)', () => {
        renderRouter({
          _layout: () => (
            <Stack>
              <Stack.Screen name="index">
                <Stack.Toolbar placement="right">
                  <Stack.Toolbar.Button
                    icon={{ uri: 'https://example.com/icon.png' }}
                    iconRenderingMode="template"
                    onPress={() => {}}
                  />
                </Stack.Toolbar>
              </Stack.Screen>
            </Stack>
          ),
          index: () => <Text testID="index">index</Text>,
        });

        expect(screen.getByTestId('index')).toBeVisible();
        const rightItems = ScreenStackItem.mock.calls[0][0].headerConfig.headerRightBarButtonItems;
        expect(rightItems[0].icon).toEqual({
          type: 'templateSource',
          templateSource: { uri: 'https://example.com/icon.png' },
        });
      });

      it('passes iconRenderingMode="original" with image icon (imageSource)', () => {
        renderRouter({
          _layout: () => (
            <Stack>
              <Stack.Screen name="index">
                <Stack.Toolbar placement="right">
                  <Stack.Toolbar.Button
                    icon={{ uri: 'https://example.com/icon.png' }}
                    iconRenderingMode="original"
                    onPress={() => {}}
                  />
                </Stack.Toolbar>
              </Stack.Screen>
            </Stack>
          ),
          index: () => <Text testID="index">index</Text>,
        });

        expect(screen.getByTestId('index')).toBeVisible();
        const rightItems = ScreenStackItem.mock.calls[0][0].headerConfig.headerRightBarButtonItems;
        expect(rightItems[0].icon).toEqual({
          type: 'imageSource',
          imageSource: { uri: 'https://example.com/icon.png' },
        });
      });

      it('defaults to template when tintColor is set', () => {
        renderRouter({
          _layout: () => (
            <Stack>
              <Stack.Screen name="index">
                <Stack.Toolbar placement="right">
                  <Stack.Toolbar.Button
                    icon={{ uri: 'https://example.com/icon.png' }}
                    tintColor="blue"
                    onPress={() => {}}
                  />
                </Stack.Toolbar>
              </Stack.Screen>
            </Stack>
          ),
          index: () => <Text testID="index">index</Text>,
        });

        expect(screen.getByTestId('index')).toBeVisible();
        const rightItems = ScreenStackItem.mock.calls[0][0].headerConfig.headerRightBarButtonItems;
        expect(rightItems[0].icon).toEqual({
          type: 'templateSource',
          templateSource: { uri: 'https://example.com/icon.png' },
        });
      });

      it('defaults to original when no tintColor', () => {
        renderRouter({
          _layout: () => (
            <Stack>
              <Stack.Screen name="index">
                <Stack.Toolbar placement="right">
                  <Stack.Toolbar.Button
                    icon={{ uri: 'https://example.com/icon.png' }}
                    onPress={() => {}}
                  />
                </Stack.Toolbar>
              </Stack.Screen>
            </Stack>
          ),
          index: () => <Text testID="index">index</Text>,
        });

        expect(screen.getByTestId('index')).toBeVisible();
        const rightItems = ScreenStackItem.mock.calls[0][0].headerConfig.headerRightBarButtonItems;
        expect(rightItems[0].icon).toEqual({
          type: 'imageSource',
          imageSource: { uri: 'https://example.com/icon.png' },
        });
      });
    });
  });

  describe('Stack.Toolbar placement="bottom" (default)', () => {
    // Note: Bottom toolbar uses a different native module (RouterToolbarHost)
    // These tests verify the component structure is correct
    it('renders bottom toolbar', () => {
      renderRouter({
        _layout: () => <Stack />,
        index: () => (
          <>
            <Stack.Toolbar>
              <Stack.Toolbar.Spacer />
              <Stack.Toolbar.Button icon="sf:magnifyingglass" onPress={() => {}} />
              <Stack.Toolbar.Spacer />
            </Stack.Toolbar>
            <Text testID="index">index</Text>
          </>
        ),
      });

      expect(screen.getByTestId('index')).toBeVisible();
      expect(ScreenStackItem).toHaveBeenCalled();
      // Bottom toolbar renders separately via RouterToolbarHost
      // The key assertion is that no error occurs
    });

    it('supports flexible spacers (no width)', () => {
      renderRouter({
        _layout: () => <Stack />,
        index: () => (
          <>
            <Stack.Toolbar>
              <Stack.Toolbar.Button icon="sf:star" onPress={() => {}} />
              <Stack.Toolbar.Spacer /> {/* flexible - no width */}
              <Stack.Toolbar.Button icon="sf:heart" onPress={() => {}} />
            </Stack.Toolbar>
            <Text testID="index">index</Text>
          </>
        ),
      });

      expect(screen.getByTestId('index')).toBeVisible();
      // No error should occur - flexible spacers are allowed in Bottom
      expect(consoleWarnMock).not.toHaveBeenCalled();
    });

    it('throws error when used in layout', () => {
      expect(() => {
        renderRouter({
          _layout: () => (
            <Stack>
              <Stack.Screen name="index">
                <Stack.Toolbar>
                  <Stack.Toolbar.Button icon="sf:star" onPress={() => {}} />
                </Stack.Toolbar>
              </Stack.Screen>
            </Stack>
          ),
          index: () => <Text testID="index">index</Text>,
        });
      }).toThrow(
        'Stack.Toolbar with placement="bottom" cannot be used inside Stack.Screen in _layout.tsx. Please move it to the page component.'
      );
    });

    it('works in screen component (dynamic)', () => {
      renderRouter({
        _layout: () => <Stack />,
        index: () => (
          <>
            <Stack.Toolbar>
              <Stack.Toolbar.Spacer />
              <Stack.Toolbar.Button icon="sf:magnifyingglass" onPress={() => {}} />
              <Stack.Toolbar.Spacer />
            </Stack.Toolbar>
            <Text testID="index">index</Text>
          </>
        ),
      });

      expect(screen.getByTestId('index')).toBeVisible();
      // No error should occur
      expect(ScreenStackItem).toHaveBeenCalled();
    });

    describe('iconRenderingMode', () => {
      it('passes imageRenderingMode="template" to RouterToolbarItem', () => {
        renderRouter({
          _layout: () => <Stack />,
          index: () => (
            <>
              <Stack.Toolbar>
                <Stack.Toolbar.Button
                  icon="sf:star"
                  iconRenderingMode="template"
                  onPress={() => {}}
                />
              </Stack.Toolbar>
              <Text testID="index">index</Text>
            </>
          ),
        });

        expect(screen.getByTestId('index')).toBeVisible();
        expect(MockedRouterToolbarItem).toHaveBeenCalledTimes(1);
        expect(useImage).toHaveBeenCalledWith('sf:star', { maxWidth: 24, maxHeight: 24 });
        expect(MockedRouterToolbarItem.mock.calls[0][0].imageRenderingMode).toBe('template');
      });

      it('passes imageRenderingMode="original" to RouterToolbarItem', () => {
        renderRouter({
          _layout: () => <Stack />,
          index: () => (
            <>
              <Stack.Toolbar>
                <Stack.Toolbar.Button
                  icon="sf:star"
                  iconRenderingMode="original"
                  onPress={() => {}}
                />
              </Stack.Toolbar>
              <Text testID="index">index</Text>
            </>
          ),
        });

        expect(screen.getByTestId('index')).toBeVisible();
        expect(MockedRouterToolbarItem).toHaveBeenCalledTimes(1);
        expect(useImage).toHaveBeenCalledWith('sf:star', { maxWidth: 24, maxHeight: 24 });
        expect(MockedRouterToolbarItem.mock.calls[0][0].imageRenderingMode).toBe('original');
      });

      it('defaults to template when tintColor is set', () => {
        renderRouter({
          _layout: () => <Stack />,
          index: () => (
            <>
              <Stack.Toolbar>
                <Stack.Toolbar.Button icon="sf:star" tintColor="green" onPress={() => {}} />
              </Stack.Toolbar>
              <Text testID="index">index</Text>
            </>
          ),
        });

        expect(screen.getByTestId('index')).toBeVisible();
        expect(MockedRouterToolbarItem).toHaveBeenCalledTimes(1);
        expect(useImage).toHaveBeenCalledWith('sf:star', { maxWidth: 24, maxHeight: 24 });
        expect(MockedRouterToolbarItem.mock.calls[0][0].imageRenderingMode).toBe('template');
      });

      it('defaults to original when no tintColor', () => {
        renderRouter({
          _layout: () => <Stack />,
          index: () => (
            <>
              <Stack.Toolbar>
                <Stack.Toolbar.Button icon="sf:star" onPress={() => {}} />
              </Stack.Toolbar>
              <Text testID="index">index</Text>
            </>
          ),
        });

        expect(screen.getByTestId('index')).toBeVisible();
        expect(MockedRouterToolbarItem).toHaveBeenCalledTimes(1);
        expect(useImage).toHaveBeenCalledWith('sf:star', { maxWidth: 24, maxHeight: 24 });
        expect(MockedRouterToolbarItem.mock.calls[0][0].imageRenderingMode).toBe('original');
      });
    });
  });

  describe('Combined usage', () => {
    it('supports all placements together', () => {
      renderRouter({
        _layout: () => (
          <Stack>
            <Stack.Screen name="index">
              <Stack.Screen.Title large>Home</Stack.Screen.Title>
              <Stack.Header blurEffect="systemMaterial" />

              <Stack.Toolbar placement="left">
                <Stack.Toolbar.Button icon="sf:sidebar.left" onPress={() => {}} />
              </Stack.Toolbar>

              <Stack.Toolbar placement="right">
                <Stack.Toolbar.Menu icon="sf:ellipsis.circle">
                  <Stack.Toolbar.MenuAction onPress={() => {}}>Settings</Stack.Toolbar.MenuAction>
                </Stack.Toolbar.Menu>
              </Stack.Toolbar>
            </Stack.Screen>
          </Stack>
        ),
        index: () => (
          <>
            <Stack.Toolbar>
              <Stack.Toolbar.Spacer />
              <Stack.Toolbar.Button icon="sf:mic" onPress={() => {}} />
              <Stack.Toolbar.Spacer />
            </Stack.Toolbar>
            <Text testID="index">index</Text>
          </>
        ),
      });

      expect(screen.getByTestId('index')).toBeVisible();
      // Bottom toolbar renders via RouterToolbarHost, not in headerConfig,
      // so it doesn't cause additional ScreenStackItem render
      expect(ScreenStackItem).toHaveBeenCalledTimes(1);

      const headerConfig = ScreenStackItem.mock.calls[0][0].headerConfig;
      expect(headerConfig.title).toBe('Home');
      expect(headerConfig.largeTitle).toBe(true);
      expect(headerConfig.blurEffect).toBe('systemMaterial');
      expect(headerConfig.headerLeftBarButtonItems).toHaveLength(1);
      expect(headerConfig.headerRightBarButtonItems).toHaveLength(1);
    });

    it('supports mixed layout and screen configuration', () => {
      renderRouter({
        _layout: () => (
          <Stack>
            <Stack.Screen name="index">
              <Stack.Header blurEffect="systemMaterial" />
            </Stack.Screen>
          </Stack>
        ),
        index: () => (
          <>
            <Stack.Screen.Title>Dynamic Title</Stack.Screen.Title>
            <Stack.Toolbar placement="right">
              <Stack.Toolbar.Button icon="sf:plus" onPress={() => {}} />
            </Stack.Toolbar>
            <Stack.Toolbar>
              <Stack.Toolbar.Button icon="sf:star" onPress={() => {}} />
            </Stack.Toolbar>
            <Text testID="index">index</Text>
          </>
        ),
      });

      expect(screen.getByTestId('index')).toBeVisible();
      expect(ScreenStackItem).toHaveBeenCalledTimes(2);

      // First call is layout config
      expect(ScreenStackItem.mock.calls[0][0].headerConfig.blurEffect).toBe('systemMaterial');

      // Second call includes dynamic screen config
      const headerConfig = ScreenStackItem.mock.calls[1][0].headerConfig;
      expect(headerConfig.title).toBe('Dynamic Title');
      expect(headerConfig.headerRightBarButtonItems).toHaveLength(1);
    });
  });

  describe('Placement-specific behavior', () => {
    it('warns when using flexible spacer in left/right placement', () => {
      renderRouter({
        _layout: () => (
          <Stack>
            <Stack.Screen name="index">
              <Stack.Toolbar placement="left">
                <Stack.Toolbar.Spacer /> {/* No width - should warn */}
              </Stack.Toolbar>
            </Stack.Screen>
          </Stack>
        ),
        index: () => <Text testID="index">index</Text>,
      });

      expect(screen.getByTestId('index')).toBeVisible();
      expect(consoleWarnMock).toHaveBeenCalledWith(
        expect.stringContaining('Spacer requires `width` when used in Left or Right')
      );
    });

    // Note: Badge warning in Bottom placement is not yet implemented
    // The native toolbar module doesn't support badges (iOS limitation)
    // TODO: Consider adding runtime warning when Badge is used in Bottom placement
  });

  describe('Hidden items', () => {
    it('omits hidden Stack.Toolbar.Button from header items', () => {
      renderRouter({
        _layout: () => (
          <Stack>
            <Stack.Screen name="index">
              <Stack.Toolbar placement="right">
                <Stack.Toolbar.Button hidden icon="sf:star" onPress={() => {}} />
                <Stack.Toolbar.Button icon="sf:heart" onPress={() => {}} />
              </Stack.Toolbar>
            </Stack.Screen>
          </Stack>
        ),
        index: () => <Text testID="index">index</Text>,
      });

      expect(screen.getByTestId('index')).toBeVisible();
      const rightItems = ScreenStackItem.mock.calls[0][0].headerConfig.headerRightBarButtonItems;
      expect(rightItems).toHaveLength(1);
      expect(rightItems[0].icon).toEqual({ type: 'sfSymbol', name: 'heart' });
    });

    it('omits hidden Stack.Toolbar.Menu from header items', () => {
      renderRouter({
        _layout: () => (
          <Stack>
            <Stack.Screen name="index">
              <Stack.Toolbar placement="right">
                <Stack.Toolbar.Menu hidden icon="sf:ellipsis.circle">
                  <Stack.Toolbar.MenuAction onPress={() => {}}>Hidden</Stack.Toolbar.MenuAction>
                </Stack.Toolbar.Menu>
                <Stack.Toolbar.Menu icon="sf:plus.circle">
                  <Stack.Toolbar.MenuAction onPress={() => {}}>Visible</Stack.Toolbar.MenuAction>
                </Stack.Toolbar.Menu>
              </Stack.Toolbar>
            </Stack.Screen>
          </Stack>
        ),
        index: () => <Text testID="index">index</Text>,
      });

      expect(screen.getByTestId('index')).toBeVisible();
      const rightItems = ScreenStackItem.mock.calls[0][0].headerConfig.headerRightBarButtonItems;
      expect(rightItems).toHaveLength(1);
      expect(rightItems[0].icon).toEqual({ type: 'sfSymbol', name: 'plus.circle' });
    });
  });

  describe('Custom views', () => {
    it('renders custom view in header', () => {
      function CustomElement() {
        return <Text testID="custom">Custom</Text>;
      }

      renderRouter({
        _layout: () => (
          <Stack>
            <Stack.Screen name="index">
              <Stack.Toolbar placement="right">
                <Stack.Toolbar.View>
                  <CustomElement />
                </Stack.Toolbar.View>
              </Stack.Toolbar>
            </Stack.Screen>
          </Stack>
        ),
        index: () => <Text testID="index">index</Text>,
      });

      expect(screen.getByTestId('index')).toBeVisible();
      // Note: Custom views are rendered via ScreenStackHeaderRightView, not headerRightBarButtonItems
      // React Navigation filters out type='custom' items from headerRightBarButtonItems (returns null)
      // and renders them separately. We verify the custom element renders in the tree.
      expect(screen.getByTestId('custom')).toBeVisible();
    });
  });

  describe('Nested menus', () => {
    it('supports nested menu structure', () => {
      renderRouter({
        _layout: () => (
          <Stack>
            <Stack.Screen name="index">
              <Stack.Toolbar placement="right">
                <Stack.Toolbar.Menu icon="sf:ellipsis.circle">
                  <Stack.Toolbar.MenuAction onPress={() => {}}>Action 1</Stack.Toolbar.MenuAction>
                  <Stack.Toolbar.Menu inline title="Submenu">
                    <Stack.Toolbar.MenuAction onPress={() => {}}>
                      Sub Action
                    </Stack.Toolbar.MenuAction>
                  </Stack.Toolbar.Menu>
                </Stack.Toolbar.Menu>
              </Stack.Toolbar>
            </Stack.Screen>
          </Stack>
        ),
        index: () => <Text testID="index">index</Text>,
      });

      expect(screen.getByTestId('index')).toBeVisible();
      const rightItems = ScreenStackItem.mock.calls[0][0].headerConfig.headerRightBarButtonItems;
      expect(rightItems).toHaveLength(1);
      expect(rightItems[0].type).toBe('menu');
      expect(rightItems[0].menu.items).toHaveLength(2);
      expect(rightItems[0].menu.items[0].type).toBe('action');
      expect(rightItems[0].menu.items[1].type).toBe('submenu');
      expect(rightItems[0].menu.items[1].displayInline).toBe(true);
    });

    it('supports palette menu', () => {
      renderRouter({
        _layout: () => (
          <Stack>
            <Stack.Screen name="index">
              <Stack.Toolbar placement="right">
                <Stack.Toolbar.Menu icon="sf:ellipsis.circle">
                  <Stack.Toolbar.Menu palette title="Quick Actions">
                    <Stack.Toolbar.MenuAction icon="sf:star" isOn onPress={() => {}} />
                    <Stack.Toolbar.MenuAction icon="sf:heart" onPress={() => {}} />
                  </Stack.Toolbar.Menu>
                </Stack.Toolbar.Menu>
              </Stack.Toolbar>
            </Stack.Screen>
          </Stack>
        ),
        index: () => <Text testID="index">index</Text>,
      });

      expect(screen.getByTestId('index')).toBeVisible();
      const rightItems = ScreenStackItem.mock.calls[0][0].headerConfig.headerRightBarButtonItems;
      expect(rightItems[0].menu.items[0].type).toBe('submenu');
      expect(rightItems[0].menu.items[0].displayAsPalette).toBe(true);
    });
  });
});
