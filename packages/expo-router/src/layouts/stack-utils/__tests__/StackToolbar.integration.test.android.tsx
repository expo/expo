import { screen, within } from '@testing-library/react-native';
import { View } from 'react-native';

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

const { RouterToolbarHost, RouterToolbarItem } = jest.requireMock(
  '../../../toolbar/native'
) as typeof import('../../../toolbar/native');
const MockedRouterToolbarHost = RouterToolbarHost as jest.MockedFunction<typeof RouterToolbarHost>;
const MockedRouterToolbarItem = RouterToolbarItem as jest.MockedFunction<typeof RouterToolbarItem>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Stack.Toolbar integration tests (Android)', () => {
  describe('bottom placement', () => {
    it('renders RouterToolbarHost on Android', () => {
      renderRouter({
        index: () => (
          <>
            <Stack.Toolbar placement="bottom">
              <Stack.Toolbar.Button icon={{ uri: 'icon.png' }} />
            </Stack.Toolbar>
            <View testID="index" />
          </>
        ),
      });

      expect(screen.getByTestId('index')).toBeVisible();
      expect(screen.getByTestId('RouterToolbarHost')).toBeVisible();
      expect(MockedRouterToolbarHost).toHaveBeenCalled();
    });

    it('renders multiple buttons within the toolbar', () => {
      renderRouter({
        index: () => (
          <>
            <Stack.Toolbar placement="bottom">
              <Stack.Toolbar.Button icon={{ uri: 'icon1.png' }} />
              <Stack.Toolbar.Button icon={{ uri: 'icon2.png' }} />
            </Stack.Toolbar>
            <View testID="index" />
          </>
        ),
      });

      const host = screen.getByTestId('RouterToolbarHost');
      expect(within(host).getAllByTestId('RouterToolbarItem')).toHaveLength(2);
    });

    it('passes source for ImageSourcePropType icons', () => {
      const imageSource = { uri: 'https://example.com/icon.png' };
      renderRouter({
        index: () => (
          <>
            <Stack.Toolbar placement="bottom">
              <Stack.Toolbar.Button icon={imageSource} />
            </Stack.Toolbar>
            <View testID="index" />
          </>
        ),
      });

      expect(MockedRouterToolbarItem).toHaveBeenCalledWith(
        expect.objectContaining({
          source: imageSource,
        }),
        undefined
      );
    });

    it('defaults to bottom placement when no placement specified', () => {
      renderRouter({
        index: () => (
          <>
            <Stack.Toolbar>
              <Stack.Toolbar.Button icon={{ uri: 'icon.png' }} />
            </Stack.Toolbar>
            <View testID="index" />
          </>
        ),
      });

      expect(screen.getByTestId('RouterToolbarHost')).toBeVisible();
    });
  });

  describe('unsupported children warnings', () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('Spacer renders without crashing alongside buttons', () => {
      renderRouter({
        index: () => (
          <>
            <Stack.Toolbar placement="bottom">
              <Stack.Toolbar.Spacer />
              <Stack.Toolbar.Button icon={{ uri: 'icon.png' }} />
            </Stack.Toolbar>
            <View testID="index" />
          </>
        ),
      });

      expect(screen.getByTestId('index')).toBeVisible();
      // Spacer renders as RouterToolbarItem with type="fluidSpacer".
      // On real Android, RouterToolbarItem returns null for spacers.
      // Here RouterToolbarItem is mocked, so the warning is tested in native.test.android.tsx instead.
    });

    it('Menu produces dev warnings on Android', () => {
      renderRouter({
        index: () => (
          <>
            <Stack.Toolbar placement="bottom">
              <Stack.Toolbar.Menu icon="ellipsis.circle" title="Actions">
                <Stack.Toolbar.MenuAction onPress={() => {}}>Action 1</Stack.Toolbar.MenuAction>
              </Stack.Toolbar.Menu>
            </Stack.Toolbar>
            <View testID="index" />
          </>
        ),
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Stack.Toolbar.Menu is not supported on Android')
      );
    });
  });
});
