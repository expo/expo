import { render, screen, within } from '@testing-library/react-native';
import { Text } from 'react-native';

import {
  StackToolbarView,
  convertStackToolbarViewPropsToRNHeaderItem,
} from '../toolbar/StackToolbarView';
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

describe(convertStackToolbarViewPropsToRNHeaderItem, () => {
  it('returns undefined when hidden is true', () => {
    const result = convertStackToolbarViewPropsToRNHeaderItem({
      hidden: true,
      children: <Text>Content</Text>,
    });
    expect(result).toBeUndefined();
  });

  it('returns custom type with element', () => {
    const CustomContent = <Text>Custom Content</Text>;
    const result = convertStackToolbarViewPropsToRNHeaderItem({
      children: CustomContent,
    });
    expect(result).toEqual({
      type: 'custom',
      element: CustomContent,
      hidesSharedBackground: undefined,
    });
  });

  it.each([true, false, undefined])('passes hidesSharedBackground=%s', (hidesSharedBackground) => {
    const result = convertStackToolbarViewPropsToRNHeaderItem({
      children: <Text>Content</Text>,
      hidesSharedBackground,
    });
    expect(result).toMatchObject({
      type: 'custom',
      hidesSharedBackground,
    });
  });

  describe('no children warning', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    beforeEach(() => {
      consoleSpy.mockClear();
    });

    afterAll(() => {
      consoleSpy.mockRestore();
    });

    it('warns when no children provided', () => {
      const result = convertStackToolbarViewPropsToRNHeaderItem({});

      expect(consoleSpy).toHaveBeenCalledWith(
        'Stack.Toolbar.View requires a child element to render custom content in the toolbar.'
      );
      expect(result).toEqual({
        type: 'custom',
        element: <></>,
        hidesSharedBackground: undefined,
      });
    });

    it('does not warn when children provided', () => {
      convertStackToolbarViewPropsToRNHeaderItem({
        children: <Text>Content</Text>,
      });

      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });
});

describe('StackToolbarView component', () => {
  let consoleErrorSpy: jest.SpyInstance<void, Parameters<typeof console.error>>;
  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('renders RouterToolbarItem in bottom placement', () => {
    render(
      <ToolbarPlacementContext.Provider value="bottom">
        <StackToolbarView>
          <Text>Custom Content</Text>
        </StackToolbarView>
      </ToolbarPlacementContext.Provider>
    );

    expect(screen.getByTestId('RouterToolbarItem')).toBeVisible();
    expect(MockedRouterToolbarItem).toHaveBeenCalled();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it.each(['left', 'right', undefined, 'xyz'] as const)(
    'throws error when not in bottom placement (placement=%s)',
    (placement) => {
      expect(() => {
        render(
          <ToolbarPlacementContext.Provider value={placement as any}>
            <StackToolbarView>
              <Text>Custom Content</Text>
            </StackToolbarView>
          </ToolbarPlacementContext.Provider>
        );
      }).toThrow('Stack.Toolbar.View must be used inside a Stack.Toolbar');
    }
  );

  it('passes children to RouterToolbarItem', () => {
    const CustomContent = <Text testID="custom-content">Custom Content</Text>;
    render(
      <ToolbarPlacementContext.Provider value="bottom">
        <StackToolbarView>{CustomContent}</StackToolbarView>
      </ToolbarPlacementContext.Provider>
    );

    const toolbarItem = screen.getByTestId('RouterToolbarItem');
    expect(within(toolbarItem).getByTestId('custom-content')).toBeVisible();
  });

  it.each([true, false, undefined])('passes hidden=%s prop', (hidden) => {
    render(
      <ToolbarPlacementContext.Provider value="bottom">
        <StackToolbarView hidden={hidden}>
          <Text>Content</Text>
        </StackToolbarView>
      </ToolbarPlacementContext.Provider>
    );

    expect(MockedRouterToolbarItem).toHaveBeenCalledWith(
      expect.objectContaining({
        hidden,
      }),
      undefined
    );
  });

  it.each([true, false, undefined])(
    'passes hidesSharedBackground=%s prop',
    (hidesSharedBackground) => {
      render(
        <ToolbarPlacementContext.Provider value="bottom">
          <StackToolbarView hidesSharedBackground={hidesSharedBackground}>
            <Text>Content</Text>
          </StackToolbarView>
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
          <StackToolbarView separateBackground={separateBackground}>
            <Text>Content</Text>
          </StackToolbarView>
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
});
