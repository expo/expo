import { render, screen } from '@testing-library/react-native';

import { StackToolbarSearchBarSlot } from '../toolbar/StackToolbarSearchBarSlot';
import { ToolbarPlacementContext } from '../toolbar/context';

jest.mock('../../../toolbar/native', () => {
  const { View }: typeof import('react-native') = jest.requireActual('react-native');
  return {
    RouterToolbarHost: jest.fn(({ children }) => (
      <View testID="RouterToolbarHost">{children}</View>
    )),
    RouterToolbarItem: jest.fn((props) => <View testID="RouterToolbarItem" {...props} />),
  };
});

const { RouterToolbarItem } = jest.requireMock(
  '../../../toolbar/native'
) as typeof import('../../../toolbar/native');
const MockedRouterToolbarItem = RouterToolbarItem as jest.MockedFunction<typeof RouterToolbarItem>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('StackToolbarSearchBarSlot component', () => {
  describe('placement checks', () => {
    it('renders RouterToolbarItem in bottom placement', () => {
      render(
        <ToolbarPlacementContext.Provider value="bottom">
          <StackToolbarSearchBarSlot />
        </ToolbarPlacementContext.Provider>
      );

      expect(screen.getByTestId('RouterToolbarItem')).toBeVisible();
      expect(MockedRouterToolbarItem).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'searchBar',
        }),
        undefined
      );
    });

    it.each(['left', 'right', undefined, 'xyz'] as const)(
      'throws error when not in bottom placement (placement=%s)',
      (placement) => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
        expect(() => {
          render(
            <ToolbarPlacementContext.Provider value={placement as any}>
              <StackToolbarSearchBarSlot />
            </ToolbarPlacementContext.Provider>
          );
        }).toThrow('Stack.Toolbar.SearchBarSlot must be used inside a Stack.Toolbar');
        jest.restoreAllMocks();
      }
    );
  });

  describe('hidden prop', () => {
    it('returns null when hidden is true', () => {
      const { toJSON } = render(
        <ToolbarPlacementContext.Provider value="bottom">
          <StackToolbarSearchBarSlot hidden />
        </ToolbarPlacementContext.Provider>
      );

      expect(toJSON()).toBeNull();
    });

    it('renders when hidden is false', () => {
      render(
        <ToolbarPlacementContext.Provider value="bottom">
          <StackToolbarSearchBarSlot hidden={false} />
        </ToolbarPlacementContext.Provider>
      );

      expect(screen.getByTestId('RouterToolbarItem')).toBeVisible();
    });
  });

  describe('props passthrough', () => {
    it.each([true, false, undefined])(
      'passes hidesSharedBackground=%s prop',
      (hidesSharedBackground) => {
        render(
          <ToolbarPlacementContext.Provider value="bottom">
            <StackToolbarSearchBarSlot hidesSharedBackground={hidesSharedBackground} />
          </ToolbarPlacementContext.Provider>
        );

        expect(MockedRouterToolbarItem).toHaveBeenCalledWith(
          expect.objectContaining({
            hidesSharedBackground,
          }),
          undefined
        );
      }
    );

    it.each([true, false, undefined])(
      'passes sharesBackground as inverted separateBackground=%s',
      (separateBackground) => {
        render(
          <ToolbarPlacementContext.Provider value="bottom">
            <StackToolbarSearchBarSlot separateBackground={separateBackground} />
          </ToolbarPlacementContext.Provider>
        );

        expect(MockedRouterToolbarItem).toHaveBeenCalledWith(
          expect.objectContaining({
            sharesBackground: separateBackground === undefined ? true : !separateBackground,
          }),
          undefined
        );
      }
    );

    it('renders with searchBar type', () => {
      render(
        <ToolbarPlacementContext.Provider value="bottom">
          <StackToolbarSearchBarSlot />
        </ToolbarPlacementContext.Provider>
      );

      expect(MockedRouterToolbarItem).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'searchBar',
        }),
        undefined
      );
    });

    it('passes unique identifier', () => {
      render(
        <ToolbarPlacementContext.Provider value="bottom">
          <StackToolbarSearchBarSlot />
        </ToolbarPlacementContext.Provider>
      );

      expect(MockedRouterToolbarItem).toHaveBeenCalledWith(
        expect.objectContaining({
          identifier: expect.any(String),
        }),
        undefined
      );
    });
  });
});
