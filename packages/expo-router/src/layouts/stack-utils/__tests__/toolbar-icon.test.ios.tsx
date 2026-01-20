import { useImage as _useImage } from 'expo-image';
import React from 'react';
import { Text } from 'react-native';
import { ScreenStackItem as _ScreenStackItem } from 'react-native-screens';

import { renderRouter, screen } from '../../../testing-library';
import { RouterToolbarItem as _RouterToolbarItem } from '../../../toolbar/native';
import Stack from '../../Stack';

// Mock react-native-screens
jest.mock('react-native-screens', () => {
  const actual = jest.requireActual(
    'react-native-screens'
  ) as typeof import('react-native-screens');
  return {
    ...actual,
    ScreenStackItem: jest.fn((props) => <actual.ScreenStackItem {...props} />),
  };
});

// Mock RouterToolbarItem from toolbar/native
jest.mock('../../../toolbar/native', () => {
  const actual = jest.requireActual(
    '../../../toolbar/native'
  ) as typeof import('../../../toolbar/native');
  return {
    ...actual,
    RouterToolbarItem: jest.fn((props) => <actual.RouterToolbarItem {...props} />),
  };
});

// Mock useImage from expo-image
jest.mock('expo-image', () => ({
  ...jest.requireActual('expo-image'),
  useImage: jest.fn(),
}));

const ScreenStackItem = _ScreenStackItem as jest.MockedFunction<typeof _ScreenStackItem>;
const RouterToolbarItem = _RouterToolbarItem as jest.MockedFunction<typeof _RouterToolbarItem>;
const useImage = _useImage as jest.MockedFunction<typeof _useImage>;

describe('Stack.Toolbar icon handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useImage.mockReturnValue(null); // Default to no loaded image
  });

  describe('placement="bottom"', () => {
    it('calls useImage with SF symbol icon', () => {
      renderRouter({
        _layout: () => <Stack />,
        index: () => (
          <>
            <Stack.Toolbar>
              <Stack.Toolbar.Button icon="sf:star.fill" onPress={() => {}} />
            </Stack.Toolbar>
            <Text testID="index">index</Text>
          </>
        ),
      });

      expect(screen.getByTestId('index')).toBeVisible();
      // SF symbols should pass an empty object to useImage (they're handled via systemImageName)
      expect(useImage).toHaveBeenCalledWith('sf:star.fill', { maxWidth: 24, maxHeight: 24 });
    });

    it('calls useImage with plain URL string', () => {
      const imageUrl = 'https://example.com/image.png';
      renderRouter({
        _layout: () => <Stack />,
        index: () => (
          <>
            <Stack.Toolbar>
              <Stack.Toolbar.Button icon={imageUrl} onPress={() => {}} />
            </Stack.Toolbar>
            <Text testID="index">index</Text>
          </>
        ),
      });

      expect(screen.getByTestId('index')).toBeVisible();
      expect(useImage).toHaveBeenCalledWith({ uri: imageUrl }, { maxWidth: 24, maxHeight: 24 });
    });

    it('calls useImage with ImageSourcePropType', () => {
      const imageSource = { uri: 'https://example.com/image.png' };
      renderRouter({
        _layout: () => <Stack />,
        index: () => (
          <>
            <Stack.Toolbar>
              <Stack.Toolbar.Button icon={imageSource} onPress={() => {}} />
            </Stack.Toolbar>
            <Text testID="index">index</Text>
          </>
        ),
      });

      expect(screen.getByTestId('index')).toBeVisible();
      expect(useImage).toHaveBeenCalledWith(imageSource, { maxWidth: 24, maxHeight: 24 });
    });

    it('passes loaded image to NativeToolbarButton when useImage returns a value', () => {
      const mockImageRef = { width: 24, height: 24, nativeRef: {} } as any;
      useImage.mockReturnValue(mockImageRef);

      renderRouter({
        _layout: () => <Stack />,
        index: () => (
          <>
            <Stack.Toolbar>
              <Stack.Toolbar.Button icon="https://example.com/image.png" onPress={() => {}} />
            </Stack.Toolbar>
            <Text testID="index">index</Text>
          </>
        ),
      });

      expect(screen.getByTestId('index')).toBeVisible();
      // The component uses the loaded image when available
      expect(useImage).toHaveBeenCalled();
      // Verify the image ref is passed to RouterToolbarItem
      expect(RouterToolbarItem).toHaveBeenCalledWith(
        expect.objectContaining({ image: mockImageRef }),
        undefined
      );
    });
  });

  describe('placement="left"', () => {
    it('removes sf: prefix from SF symbol and passes to headerBarButtonItems', () => {
      renderRouter({
        _layout: () => (
          <Stack>
            <Stack.Screen name="index">
              <Stack.Toolbar placement="left">
                <Stack.Toolbar.Button icon="sf:star.fill" onPress={() => {}} />
              </Stack.Toolbar>
            </Stack.Screen>
          </Stack>
        ),
        index: () => <Text testID="index">index</Text>,
      });

      expect(screen.getByTestId('index')).toBeVisible();
      expect(ScreenStackItem).toHaveBeenCalled();
      const leftItems = ScreenStackItem.mock.calls[0][0].headerConfig.headerLeftBarButtonItems;
      expect(leftItems).toHaveLength(1);
      expect(leftItems[0].icon).toEqual({ type: 'sfSymbol', name: 'star.fill' });
    });

    it('wraps plain URL string as { uri } in headerBarButtonItems', () => {
      const imageUrl = 'https://example.com/image.png';
      renderRouter({
        _layout: () => (
          <Stack>
            <Stack.Screen name="index">
              <Stack.Toolbar placement="left">
                <Stack.Toolbar.Button icon={imageUrl} onPress={() => {}} />
              </Stack.Toolbar>
            </Stack.Screen>
          </Stack>
        ),
        index: () => <Text testID="index">index</Text>,
      });

      expect(screen.getByTestId('index')).toBeVisible();
      expect(ScreenStackItem).toHaveBeenCalled();
      const leftItems = ScreenStackItem.mock.calls[0][0].headerConfig.headerLeftBarButtonItems;
      expect(leftItems).toHaveLength(1);
      expect(leftItems[0].icon).toEqual({
        type: 'imageSource',
        imageSource: { uri: imageUrl },
      });
    });

    it('passes ImageSourcePropType as-is to headerBarButtonItems', () => {
      const imageSource = { uri: 'https://example.com/image.png' };
      renderRouter({
        _layout: () => (
          <Stack>
            <Stack.Screen name="index">
              <Stack.Toolbar placement="left">
                <Stack.Toolbar.Button icon={imageSource} onPress={() => {}} />
              </Stack.Toolbar>
            </Stack.Screen>
          </Stack>
        ),
        index: () => <Text testID="index">index</Text>,
      });

      expect(screen.getByTestId('index')).toBeVisible();
      expect(ScreenStackItem).toHaveBeenCalled();
      const leftItems = ScreenStackItem.mock.calls[0][0].headerConfig.headerLeftBarButtonItems;
      expect(leftItems).toHaveLength(1);
      expect(leftItems[0].icon).toEqual({ type: 'imageSource', imageSource });
    });
  });

  describe('placement="right"', () => {
    it('removes sf: prefix from SF symbol and passes to headerBarButtonItems', () => {
      renderRouter({
        _layout: () => (
          <Stack>
            <Stack.Screen name="index">
              <Stack.Toolbar placement="right">
                <Stack.Toolbar.Button icon="sf:heart.fill" onPress={() => {}} />
              </Stack.Toolbar>
            </Stack.Screen>
          </Stack>
        ),
        index: () => <Text testID="index">index</Text>,
      });

      expect(screen.getByTestId('index')).toBeVisible();
      expect(ScreenStackItem).toHaveBeenCalled();
      const rightItems = ScreenStackItem.mock.calls[0][0].headerConfig.headerRightBarButtonItems;
      expect(rightItems).toHaveLength(1);
      expect(rightItems[0].icon).toEqual({ type: 'sfSymbol', name: 'heart.fill' });
    });

    it('wraps plain URL string as { uri } in headerBarButtonItems', () => {
      const imageUrl = 'https://example.com/icon.png';
      renderRouter({
        _layout: () => (
          <Stack>
            <Stack.Screen name="index">
              <Stack.Toolbar placement="right">
                <Stack.Toolbar.Button icon={imageUrl} onPress={() => {}} />
              </Stack.Toolbar>
            </Stack.Screen>
          </Stack>
        ),
        index: () => <Text testID="index">index</Text>,
      });

      expect(screen.getByTestId('index')).toBeVisible();
      expect(ScreenStackItem).toHaveBeenCalled();
      const rightItems = ScreenStackItem.mock.calls[0][0].headerConfig.headerRightBarButtonItems;
      expect(rightItems).toHaveLength(1);
      expect(rightItems[0].icon).toEqual({
        type: 'imageSource',
        imageSource: { uri: imageUrl },
      });
    });

    it('passes ImageSourcePropType as-is to headerBarButtonItems', () => {
      const imageSource = { uri: 'https://example.com/icon.png' };
      renderRouter({
        _layout: () => (
          <Stack>
            <Stack.Screen name="index">
              <Stack.Toolbar placement="right">
                <Stack.Toolbar.Button icon={imageSource} onPress={() => {}} />
              </Stack.Toolbar>
            </Stack.Screen>
          </Stack>
        ),
        index: () => <Text testID="index">index</Text>,
      });

      expect(screen.getByTestId('index')).toBeVisible();
      expect(ScreenStackItem).toHaveBeenCalled();
      const rightItems = ScreenStackItem.mock.calls[0][0].headerConfig.headerRightBarButtonItems;
      expect(rightItems).toHaveLength(1);
      expect(rightItems[0].icon).toEqual({ type: 'imageSource', imageSource });
    });
  });

  describe('Stack.Toolbar.Menu icon handling', () => {
    describe('placement="bottom"', () => {
      it('calls useImage with SF symbol icon for menu', () => {
        renderRouter({
          _layout: () => <Stack />,
          index: () => (
            <>
              <Stack.Toolbar>
                <Stack.Toolbar.Menu icon="sf:ellipsis.circle">
                  <Stack.Toolbar.MenuAction onPress={() => {}}>Action</Stack.Toolbar.MenuAction>
                </Stack.Toolbar.Menu>
              </Stack.Toolbar>
              <Text testID="index">index</Text>
            </>
          ),
        });

        expect(screen.getByTestId('index')).toBeVisible();
        // SF symbols pass empty object to useImage
        expect(useImage).toHaveBeenCalledWith('sf:ellipsis.circle', {
          maxWidth: 24,
          maxHeight: 24,
        });
      });

      it('calls useImage with plain URL string for menu', () => {
        const imageUrl = 'https://example.com/menu-icon.png';
        renderRouter({
          _layout: () => <Stack />,
          index: () => (
            <>
              <Stack.Toolbar>
                <Stack.Toolbar.Menu icon={imageUrl}>
                  <Stack.Toolbar.MenuAction onPress={() => {}}>Action</Stack.Toolbar.MenuAction>
                </Stack.Toolbar.Menu>
              </Stack.Toolbar>
              <Text testID="index">index</Text>
            </>
          ),
        });

        expect(screen.getByTestId('index')).toBeVisible();
        expect(useImage).toHaveBeenCalledWith(imageUrl, { maxWidth: 24, maxHeight: 24 });
      });

      it('calls useImage with ImageSourcePropType for menu', () => {
        const imageSource = { uri: 'https://example.com/menu-icon.png' };
        renderRouter({
          _layout: () => <Stack />,
          index: () => (
            <>
              <Stack.Toolbar>
                <Stack.Toolbar.Menu icon={imageSource}>
                  <Stack.Toolbar.MenuAction onPress={() => {}}>Action</Stack.Toolbar.MenuAction>
                </Stack.Toolbar.Menu>
              </Stack.Toolbar>
              <Text testID="index">index</Text>
            </>
          ),
        });

        expect(screen.getByTestId('index')).toBeVisible();
        expect(useImage).toHaveBeenCalledWith(imageSource, { maxWidth: 24, maxHeight: 24 });
      });
    });

    describe('placement="right"', () => {
      it('removes sf: prefix from SF symbol for menu in headerBarButtonItems', () => {
        renderRouter({
          _layout: () => (
            <Stack>
              <Stack.Screen name="index">
                <Stack.Toolbar placement="right">
                  <Stack.Toolbar.Menu icon="sf:ellipsis.circle">
                    <Stack.Toolbar.MenuAction onPress={() => {}}>Action</Stack.Toolbar.MenuAction>
                  </Stack.Toolbar.Menu>
                </Stack.Toolbar>
              </Stack.Screen>
            </Stack>
          ),
          index: () => <Text testID="index">index</Text>,
        });

        expect(screen.getByTestId('index')).toBeVisible();
        expect(ScreenStackItem).toHaveBeenCalled();
        const rightItems = ScreenStackItem.mock.calls[0][0].headerConfig.headerRightBarButtonItems;
        expect(rightItems).toHaveLength(1);
        expect(rightItems[0].icon).toEqual({ type: 'sfSymbol', name: 'ellipsis.circle' });
      });

      it('wraps plain URL string as { uri } for menu in headerBarButtonItems', () => {
        const imageUrl = 'https://example.com/menu.png';
        renderRouter({
          _layout: () => (
            <Stack>
              <Stack.Screen name="index">
                <Stack.Toolbar placement="right">
                  <Stack.Toolbar.Menu icon={imageUrl}>
                    <Stack.Toolbar.MenuAction onPress={() => {}}>Action</Stack.Toolbar.MenuAction>
                  </Stack.Toolbar.Menu>
                </Stack.Toolbar>
              </Stack.Screen>
            </Stack>
          ),
          index: () => <Text testID="index">index</Text>,
        });

        expect(screen.getByTestId('index')).toBeVisible();
        expect(ScreenStackItem).toHaveBeenCalled();
        const rightItems = ScreenStackItem.mock.calls[0][0].headerConfig.headerRightBarButtonItems;
        expect(rightItems).toHaveLength(1);
        expect(rightItems[0].icon).toEqual({
          type: 'imageSource',
          imageSource: { uri: imageUrl },
        });
      });
    });
  });
});
