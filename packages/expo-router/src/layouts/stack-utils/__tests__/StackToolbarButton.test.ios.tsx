import { render, screen } from '@testing-library/react-native';

import {
  StackToolbarButton,
  convertStackToolbarButtonPropsToRNHeaderItem,
} from '../toolbar/StackToolbarButton';
import { ToolbarPlacementContext } from '../toolbar/context';
import {
  StackToolbarLabel,
  StackToolbarIcon,
  StackToolbarBadge,
} from '../toolbar/toolbar-primitives';

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

describe(convertStackToolbarButtonPropsToRNHeaderItem, () => {
  it('returns undefined when hidden is true', () => {
    const result = convertStackToolbarButtonPropsToRNHeaderItem({ hidden: true });
    expect(result).toBeUndefined();
  });

  it('returns button type item with shared props', () => {
    const result = convertStackToolbarButtonPropsToRNHeaderItem({
      children: 'Button Text',
      tintColor: 'blue',
    });
    expect(result).toMatchObject({
      type: 'button',
      label: 'Button Text',
      tintColor: 'blue',
    });
  });

  it.each([true, false, undefined])('sets selected to %s (defaults to false)', (selected) => {
    const result = convertStackToolbarButtonPropsToRNHeaderItem({ selected });
    expect(result?.selected).toBe(selected ?? false);
  });

  it('provides default empty onPress callback', () => {
    const result = convertStackToolbarButtonPropsToRNHeaderItem({});
    expect(result?.onPress).toBeDefined();
    expect(typeof result?.onPress).toBe('function');
    // Should not throw when called
    expect(() => result?.onPress()).not.toThrow();
  });

  it('uses provided onPress callback', () => {
    const onPress = jest.fn();
    const result = convertStackToolbarButtonPropsToRNHeaderItem({ onPress });
    expect(result?.onPress).toBe(onPress);
  });

  it('extracts icon from StackToolbarIcon child', () => {
    const result = convertStackToolbarButtonPropsToRNHeaderItem({
      children: <StackToolbarIcon sf="star.fill" />,
    });
    expect(result?.icon).toEqual({
      type: 'sfSymbol',
      name: 'star.fill',
    });
  });

  it('extracts label from StackToolbarLabel child', () => {
    const result = convertStackToolbarButtonPropsToRNHeaderItem({
      children: <StackToolbarLabel>My Button</StackToolbarLabel>,
    });
    expect(result?.label).toBe('My Button');
  });

  it('extracts badge from StackToolbarBadge child', () => {
    const result = convertStackToolbarButtonPropsToRNHeaderItem({
      children: <StackToolbarBadge>5</StackToolbarBadge>,
    });
    expect(result?.badge).toEqual({ value: '5' });
  });

  it('extracts xcasset icon from StackToolbarIcon child', () => {
    const result = convertStackToolbarButtonPropsToRNHeaderItem({
      children: <StackToolbarIcon xcasset="custom-icon" />,
    });
    expect(result?.icon).toEqual({
      type: 'xcasset',
      name: 'custom-icon',
    });
  });

  it('handles all children types together', () => {
    const result = convertStackToolbarButtonPropsToRNHeaderItem({
      children: [
        <StackToolbarIcon key="icon" sf="bell.fill" />,
        <StackToolbarLabel key="label">Notifications</StackToolbarLabel>,
        <StackToolbarBadge key="badge">3</StackToolbarBadge>,
      ],
    });
    expect(result).toMatchObject({
      type: 'button',
      label: 'Notifications',
      icon: { type: 'sfSymbol', name: 'bell.fill' },
      badge: { value: '3' },
    });
  });
});

describe('StackToolbarButton component', () => {
  it('renders RouterToolbarItem in bottom placement', () => {
    render(
      <ToolbarPlacementContext.Provider value="bottom">
        <StackToolbarButton icon="star.fill">Test</StackToolbarButton>
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
            <StackToolbarButton icon="star.fill">Test</StackToolbarButton>
          </ToolbarPlacementContext.Provider>
        );
      }).toThrow('Stack.Toolbar.Button must be used inside a Stack.Toolbar');
      jest.restoreAllMocks();
    }
  );

  it('passes SF Symbol icon to RouterToolbarItem', () => {
    render(
      <ToolbarPlacementContext.Provider value="bottom">
        <StackToolbarButton icon="star.fill" />
      </ToolbarPlacementContext.Provider>
    );

    expect(MockedRouterToolbarItem).toHaveBeenCalledWith(
      expect.objectContaining({
        systemImageName: 'star.fill',
      }),
      undefined
    );
  });

  it('passes variant done as barButtonItemStyle prominent', () => {
    render(
      <ToolbarPlacementContext.Provider value="bottom">
        <StackToolbarButton variant="done">Done</StackToolbarButton>
      </ToolbarPlacementContext.Provider>
    );

    expect(MockedRouterToolbarItem).toHaveBeenCalledWith(
      expect.objectContaining({
        barButtonItemStyle: 'prominent',
      }),
      undefined
    );
  });

  it('passes variant plain correctly', () => {
    render(
      <ToolbarPlacementContext.Provider value="bottom">
        <StackToolbarButton variant="plain">Plain</StackToolbarButton>
      </ToolbarPlacementContext.Provider>
    );

    expect(MockedRouterToolbarItem).toHaveBeenCalledWith(
      expect.objectContaining({
        barButtonItemStyle: 'plain',
      }),
      undefined
    );
  });

  it('passes onPress as onSelected', () => {
    const onPress = jest.fn();
    render(
      <ToolbarPlacementContext.Provider value="bottom">
        <StackToolbarButton onPress={onPress}>Test</StackToolbarButton>
      </ToolbarPlacementContext.Provider>
    );

    expect(MockedRouterToolbarItem).toHaveBeenCalledWith(
      expect.objectContaining({
        onSelected: onPress,
      }),
      undefined
    );
  });

  it.each([true, false, undefined])('passes disabled=%s prop', (disabled) => {
    render(
      <ToolbarPlacementContext.Provider value="bottom">
        <StackToolbarButton disabled={disabled}>Test</StackToolbarButton>
      </ToolbarPlacementContext.Provider>
    );

    expect(MockedRouterToolbarItem).toHaveBeenCalledWith(
      expect.objectContaining({
        disabled,
      }),
      undefined
    );
  });

  it.each([true, false, undefined])('passes hidden=%s prop', (hidden) => {
    render(
      <ToolbarPlacementContext.Provider value="bottom">
        <StackToolbarButton hidden={hidden}>Test</StackToolbarButton>
      </ToolbarPlacementContext.Provider>
    );

    expect(MockedRouterToolbarItem).toHaveBeenCalledWith(
      expect.objectContaining({
        hidden,
      }),
      undefined
    );
  });

  it('passes tintColor prop', () => {
    render(
      <ToolbarPlacementContext.Provider value="bottom">
        <StackToolbarButton tintColor="red">Test</StackToolbarButton>
      </ToolbarPlacementContext.Provider>
    );

    expect(MockedRouterToolbarItem).toHaveBeenCalledWith(
      expect.objectContaining({
        tintColor: 'red',
      }),
      undefined
    );
  });

  it('passes imageRenderingMode as template when tintColor is set', () => {
    render(
      <ToolbarPlacementContext.Provider value="bottom">
        <StackToolbarButton icon={{ uri: 'image' }} tintColor="blue">
          Test
        </StackToolbarButton>
      </ToolbarPlacementContext.Provider>
    );

    expect(MockedRouterToolbarItem).toHaveBeenCalledWith(
      expect.objectContaining({
        imageRenderingMode: 'template',
      }),
      undefined
    );
  });

  it('passes imageRenderingMode as original when no tintColor', () => {
    render(
      <ToolbarPlacementContext.Provider value="bottom">
        <StackToolbarButton icon={{ uri: 'image' }}>Test</StackToolbarButton>
      </ToolbarPlacementContext.Provider>
    );

    expect(MockedRouterToolbarItem).toHaveBeenCalledWith(
      expect.objectContaining({
        imageRenderingMode: 'original',
      }),
      undefined
    );
  });

  it('uses explicit iconRenderingMode prop', () => {
    render(
      <ToolbarPlacementContext.Provider value="bottom">
        <StackToolbarButton icon={{ uri: 'image' }} iconRenderingMode="template">
          Test
        </StackToolbarButton>
      </ToolbarPlacementContext.Provider>
    );

    expect(MockedRouterToolbarItem).toHaveBeenCalledWith(
      expect.objectContaining({
        imageRenderingMode: 'template',
      }),
      undefined
    );
  });

  it('extracts label from StackToolbarLabel child in bottom placement', () => {
    render(
      <ToolbarPlacementContext.Provider value="bottom">
        <StackToolbarButton>
          <StackToolbarLabel>Custom Label</StackToolbarLabel>
        </StackToolbarButton>
      </ToolbarPlacementContext.Provider>
    );

    expect(MockedRouterToolbarItem).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Custom Label',
      }),
      undefined
    );
  });

  describe('children validation', () => {
    const originalEnv = process.env.NODE_ENV;

    beforeEach(() => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
      jest.restoreAllMocks();
    });

    it('throws error for invalid children in development', () => {
      process.env.NODE_ENV = 'development';

      expect(() => {
        render(
          <ToolbarPlacementContext.Provider value="bottom">
            <StackToolbarButton>
              <div>Invalid Child</div>
            </StackToolbarButton>
          </ToolbarPlacementContext.Provider>
        );
      }).toThrow(
        'Stack.Toolbar.Button only accepts a single string or Stack.Toolbar.Label, Stack.Toolbar.Icon, and Stack.Toolbar.Badge as its children.'
      );
    });
  });

  describe('badge warning in bottom placement', () => {
    const originalEnv = process.env.NODE_ENV;
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
      consoleSpy.mockRestore();
    });

    it('warns about Badge in bottom placement', () => {
      process.env.NODE_ENV = 'development';

      render(
        <ToolbarPlacementContext.Provider value="bottom">
          <StackToolbarButton>
            <StackToolbarBadge>3</StackToolbarBadge>
          </StackToolbarButton>
        </ToolbarPlacementContext.Provider>
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        'Stack.Toolbar.Badge is not supported in bottom toolbar (iOS limitation). The badge will be ignored.'
      );
    });
  });
});
