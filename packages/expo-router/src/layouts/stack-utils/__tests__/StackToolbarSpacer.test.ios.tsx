import { render, screen } from '@testing-library/react-native';

import {
  StackToolbarSpacer,
  convertStackToolbarSpacerPropsToRNHeaderItem,
} from '../toolbar/StackToolbarSpacer';
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

describe(convertStackToolbarSpacerPropsToRNHeaderItem, () => {
  it('returns undefined when hidden is true', () => {
    const result = convertStackToolbarSpacerPropsToRNHeaderItem({ hidden: true, width: 10 });
    expect(result).toBeUndefined();
  });

  it('returns spacing type with width value', () => {
    const result = convertStackToolbarSpacerPropsToRNHeaderItem({ width: 20 });
    expect(result).toEqual({
      type: 'spacing',
      spacing: 20,
    });
  });

  it('returns spacing with zero width', () => {
    const result = convertStackToolbarSpacerPropsToRNHeaderItem({ width: 0 });
    expect(result).toEqual({
      type: 'spacing',
      spacing: 0,
    });
  });

  describe('flexible spacer warning', () => {
    const originalEnv = process.env.NODE_ENV;
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    beforeEach(() => {
      consoleSpy.mockClear();
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    afterAll(() => {
      consoleSpy.mockRestore();
    });

    it('returns undefined and warns when width is undefined in development', () => {
      process.env.NODE_ENV = 'development';

      const result = convertStackToolbarSpacerPropsToRNHeaderItem({});

      expect(result).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Stack.Toolbar.Spacer requires `width` when used in left or right placement. Flexible spacers are only supported in Bottom placement.'
      );
    });

    it('returns undefined without warning in production', () => {
      process.env.NODE_ENV = 'production';

      const result = convertStackToolbarSpacerPropsToRNHeaderItem({});

      expect(result).toBeUndefined();
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });
});

describe('StackToolbarSpacer component', () => {
  it('renders RouterToolbarItem in bottom placement', () => {
    render(
      <ToolbarPlacementContext.Provider value="bottom">
        <StackToolbarSpacer width={20} />
      </ToolbarPlacementContext.Provider>
    );

    expect(screen.getByTestId('RouterToolbarItem')).toBeVisible();
    expect(MockedRouterToolbarItem).toHaveBeenCalled();
  });

  it.each(['left', 'right', undefined, 'xyz'] as const)(
    'throws error when not in bottom placement (placement=%s)',
    (placement) => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => {
        render(
          <ToolbarPlacementContext.Provider value={placement as any}>
            <StackToolbarSpacer width={20} />
          </ToolbarPlacementContext.Provider>
        );
      }).toThrow('Stack.Toolbar.Spacer must be used inside a Stack.Toolbar');
      jest.restoreAllMocks();
    }
  );

  it('renders fixedSpacer type when width is provided', () => {
    render(
      <ToolbarPlacementContext.Provider value="bottom">
        <StackToolbarSpacer width={30} />
      </ToolbarPlacementContext.Provider>
    );

    expect(MockedRouterToolbarItem).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'fixedSpacer',
        width: 30,
      }),
      undefined
    );
  });

  it('renders fluidSpacer type when width is not provided', () => {
    render(
      <ToolbarPlacementContext.Provider value="bottom">
        <StackToolbarSpacer />
      </ToolbarPlacementContext.Provider>
    );

    expect(MockedRouterToolbarItem).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'fluidSpacer',
      }),
      undefined
    );
  });

  it.each([true, false, undefined])('passes hidden=%s prop', (hidden) => {
    render(
      <ToolbarPlacementContext.Provider value="bottom">
        <StackToolbarSpacer hidden={hidden} width={20} />
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
    'passes hidesSharedBackground as inverted sharesBackground=%s (defaults to true)',
    (sharesBackground) => {
      render(
        <ToolbarPlacementContext.Provider value="bottom">
          <StackToolbarSpacer sharesBackground={sharesBackground} />
        </ToolbarPlacementContext.Provider>
      );

      expect(MockedRouterToolbarItem).toHaveBeenCalledWith(
        expect.objectContaining({
          hidesSharedBackground: sharesBackground === undefined ? true : !sharesBackground,
        }),
        undefined
      );
    }
  );
});
