import { screen, within } from '@testing-library/react-native';
import { View } from 'react-native';

import { renderRouter } from '../../../testing-library';
import Stack from '../../StackClient';

jest.mock('../../../utils/materialIcon', () => ({
  useMaterialIconSource: jest.fn(() => undefined),
}));

jest.mock('../../../toolbar/native', () => {
  const { View }: typeof import('react-native') = jest.requireActual('react-native');
  return {
    RouterToolbarHost: jest.fn(({ children }) => (
      <View testID="RouterToolbarHost">{children}</View>
    )),
    RouterToolbarItem: jest.fn((props) => <View testID="RouterToolbarItem" {...props} />),
    RouterToolbarMenu: jest.fn(({ children, ...props }) => (
      <View testID="RouterToolbarMenu" {...props}>
        {children}
      </View>
    )),
    RouterToolbarMenuItem: jest.fn((props) => <View testID="RouterToolbarMenuItem" {...props} />),
  };
});

const { RouterToolbarHost, RouterToolbarItem, RouterToolbarMenu } = jest.requireMock(
  '../../../toolbar/native'
) as typeof import('../../../toolbar/native');
const MockedRouterToolbarHost = RouterToolbarHost as jest.MockedFunction<typeof RouterToolbarHost>;
const MockedRouterToolbarItem = RouterToolbarItem as jest.MockedFunction<typeof RouterToolbarItem>;
const MockedRouterToolbarMenu = RouterToolbarMenu as jest.MockedFunction<typeof RouterToolbarMenu>;

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

    it('passes mdIconName through full component tree for md icon button', () => {
      renderRouter({
        index: () => (
          <>
            <Stack.Toolbar placement="bottom">
              <Stack.Toolbar.Button md="search" />
            </Stack.Toolbar>
            <View testID="index" />
          </>
        ),
      });

      expect(MockedRouterToolbarItem).toHaveBeenCalledWith(
        expect.objectContaining({
          mdIconName: 'search',
        }),
        undefined
      );
    });

    it('passes mdIconName from Icon child through full component tree', () => {
      renderRouter({
        index: () => (
          <>
            <Stack.Toolbar placement="bottom">
              <Stack.Toolbar.Button>
                <Stack.Toolbar.Icon md="star" />
              </Stack.Toolbar.Button>
            </Stack.Toolbar>
            <View testID="index" />
          </>
        ),
      });

      expect(MockedRouterToolbarItem).toHaveBeenCalledWith(
        expect.objectContaining({
          mdIconName: 'star',
        }),
        undefined
      );
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

    it('Menu renders RouterToolbarMenu on Android', () => {
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

      expect(MockedRouterToolbarMenu).toHaveBeenCalled();
      expect(screen.getByTestId('RouterToolbarMenu')).toBeTruthy();
    });

    it('Menu passes md icon through integration', () => {
      renderRouter({
        index: () => (
          <>
            <Stack.Toolbar placement="bottom">
              <Stack.Toolbar.Menu>
                <Stack.Toolbar.Icon md="more_vert" />
                <Stack.Toolbar.MenuAction onPress={() => {}}>Action</Stack.Toolbar.MenuAction>
              </Stack.Toolbar.Menu>
            </Stack.Toolbar>
            <View testID="index" />
          </>
        ),
      });

      expect(MockedRouterToolbarMenu).toHaveBeenCalledWith(
        expect.objectContaining({
          mdIconName: 'more_vert',
        }),
        undefined
      );
    });
  });
});
