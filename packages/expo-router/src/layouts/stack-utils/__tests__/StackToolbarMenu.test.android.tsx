import { act, render, screen, within } from '@testing-library/react-native';
import React from 'react';

import { StackToolbarMenu } from '../toolbar/StackToolbarMenu';
import { NativeToolbarMenu, NativeToolbarMenuAction } from '../toolbar/StackToolbarMenu/native';
import type {
  NativeToolbarMenuActionProps,
  NativeToolbarMenuProps,
} from '../toolbar/StackToolbarMenu/types';
import { ToolbarPlacementContext } from '../toolbar/context';
import { StackToolbarLabel } from '../toolbar/toolbar-primitives';

jest.mock('@expo/ui/jetpack-compose', () => {
  const { View }: typeof import('react-native') = jest.requireActual('react-native');

  const DropdownMenu = jest.fn((props) => (
    <View testID="DropdownMenu" {...props} />
  )) as unknown as jest.MockedFunction<React.FC<Record<string, unknown>>> & {
    Trigger: jest.MockedFunction<React.FC<Record<string, unknown>>>;
    Items: jest.MockedFunction<React.FC<Record<string, unknown>>>;
  };
  DropdownMenu.Trigger = jest.fn((props) => <View testID="DropdownMenu.Trigger" {...props} />);
  DropdownMenu.Items = jest.fn((props) => <View testID="DropdownMenu.Items" {...props} />);

  const DropdownMenuItem = jest.fn((props) => (
    <View testID="DropdownMenuItem" {...props} />
  )) as unknown as jest.MockedFunction<React.FC<Record<string, unknown>>> & {
    Text: jest.MockedFunction<React.FC<Record<string, unknown>>>;
    LeadingIcon: jest.MockedFunction<React.FC<Record<string, unknown>>>;
    TrailingIcon: jest.MockedFunction<React.FC<Record<string, unknown>>>;
  };
  DropdownMenuItem.Text = jest.fn((props) => <View testID="DropdownMenuItem.Text" {...props} />);
  DropdownMenuItem.LeadingIcon = jest.fn((props) => (
    <View testID="DropdownMenuItem.LeadingIcon" {...props} />
  ));
  DropdownMenuItem.TrailingIcon = jest.fn((props) => (
    <View testID="DropdownMenuItem.TrailingIcon" {...props} />
  ));

  return {
    DropdownMenu,
    DropdownMenuItem,
    HorizontalDivider: jest.fn(() => <View testID="HorizontalDivider" />),
    Icon: jest.fn((props) => <View testID="Icon" {...props} />),
    IconButton: jest.fn((props) => <View testID="IconButton" {...props} />),
    Text: jest.fn((props) => <View testID="ComposeText" {...props} />),
  };
});

jest.mock('@expo/ui/jetpack-compose/modifiers', () => ({
  background: jest.fn((color: string) => ({ type: 'background', color })),
}));

jest.mock('../../../color', () => ({
  Color: {
    android: {
      dynamic: {
        onSurface: 'dynamic:onSurface',
        surfaceContainer: 'dynamic:surfaceContainer',
      },
      material: {
        error: 'material:error',
      },
    },
  },
}));

jest.mock('../../../../assets/arrow_right.xml', () => 'mocked-arrow-right');
jest.mock('../../../../assets/checkmark.xml', () => 'mocked-checkmark');

jest.mock('../../../toolbar/AnimatedItemContainer', () => {
  const { View }: typeof import('react-native') = jest.requireActual('react-native');
  return {
    AnimatedItemContainer: jest.fn((props) => <View testID="AnimatedItemContainer" {...props} />),
  };
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('NativeToolbarMenu', () => {
  const defaultProps: NativeToolbarMenuProps = {
    source: { uri: 'test-icon' },
  };

  describe('root menu', () => {
    describe('missing source', () => {
      const originalEnv = process.env.NODE_ENV;
      let consoleSpy: jest.SpyInstance;

      beforeEach(() => {
        consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      });

      afterEach(() => {
        process.env.NODE_ENV = originalEnv;
        consoleSpy.mockRestore();
      });

      it('returns null and warns when source is missing in development', () => {
        process.env.NODE_ENV = 'development';

        const { toJSON } = render(<NativeToolbarMenu />);

        expect(toJSON()).toBeNull();
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Stack.Toolbar.Menu on Android requires an ImageSourcePropType')
        );
      });

      it('returns null without warning in production', () => {
        process.env.NODE_ENV = 'production';

        const { toJSON } = render(<NativeToolbarMenu />);

        expect(toJSON()).toBeNull();
        expect(consoleSpy).not.toHaveBeenCalled();
      });
    });

    describe('tint color logic', () => {
      it('sets tintColor to undefined when imageRenderingMode is original', () => {
        render(<NativeToolbarMenu {...defaultProps} imageRenderingMode="original" />);

        const icon = within(screen.getByTestId('IconButton')).getByTestId('Icon');
        expect(icon.props.tintColor).toBeUndefined();
      });

      it('sets tintColor to undefined when imageRenderingMode is original even with tintColor prop', () => {
        render(
          <NativeToolbarMenu {...defaultProps} imageRenderingMode="original" tintColor="red" />
        );

        const icon = within(screen.getByTestId('IconButton')).getByTestId('Icon');
        expect(icon.props.tintColor).toBeUndefined();
      });

      it('uses provided tintColor when imageRenderingMode is template', () => {
        render(
          <NativeToolbarMenu {...defaultProps} imageRenderingMode="template" tintColor="red" />
        );

        const icon = within(screen.getByTestId('IconButton')).getByTestId('Icon');
        expect(icon.props.tintColor).toBe('red');
      });

      it('falls back to dynamic onSurface when imageRenderingMode is template and no tintColor', () => {
        render(<NativeToolbarMenu {...defaultProps} imageRenderingMode="template" />);

        const icon = within(screen.getByTestId('IconButton')).getByTestId('Icon');
        expect(icon.props.tintColor).toBe('dynamic:onSurface');
      });

      it('uses provided tintColor when imageRenderingMode is undefined', () => {
        render(<NativeToolbarMenu {...defaultProps} tintColor="red" />);

        const icon = within(screen.getByTestId('IconButton')).getByTestId('Icon');
        expect(icon.props.tintColor).toBe('red');
      });

      it('falls back to dynamic onSurface when both imageRenderingMode and tintColor are undefined', () => {
        render(<NativeToolbarMenu {...defaultProps} />);

        const icon = within(screen.getByTestId('IconButton')).getByTestId('Icon');
        expect(icon.props.tintColor).toBe('dynamic:onSurface');
      });
    });

    describe('prop forwarding', () => {
      it.each([false, true, undefined])(
        'passes hidden %s as visible={!hidden} to AnimatedItemContainer',
        (hidden) => {
          render(<NativeToolbarMenu {...defaultProps} hidden={hidden} />);

          expect(screen.getByTestId('AnimatedItemContainer').props.visible).toBe(!hidden);
        }
      );

      it.each([false, true, undefined])(
        'passes disabled %s as enabled={!disabled} to IconButton',
        (disabled) => {
          render(<NativeToolbarMenu {...defaultProps} disabled={disabled} />);

          expect(screen.getByTestId('IconButton').props.enabled).toBe(!disabled);
        }
      );

      it('passes source and size=24 to Icon', () => {
        const source = { uri: 'my-icon' };
        render(<NativeToolbarMenu {...defaultProps} source={source} />);

        const icon = within(screen.getByTestId('IconButton')).getByTestId('Icon');
        expect(icon.props.source).toEqual(source);
        expect(icon.props.size).toBe(24);
      });

      it('renders DropdownMenu with IconButton trigger', () => {
        render(<NativeToolbarMenu {...defaultProps} />);

        expect(screen.getByTestId('DropdownMenu')).toBeDefined();
        expect(
          within(screen.getByTestId('DropdownMenu.Trigger')).getByTestId('IconButton')
        ).toBeDefined();
      });

      it('renders children inside DropdownMenu.Items', () => {
        render(
          <NativeToolbarMenu {...defaultProps}>
            <NativeToolbarMenuAction onPress={() => {}}>Action</NativeToolbarMenuAction>
          </NativeToolbarMenu>
        );

        expect(
          within(screen.getByTestId('DropdownMenu.Items')).getByTestId('DropdownMenuItem')
        ).toBeDefined();
      });
    });
  });

  describe('nested menu (non-inline)', () => {
    function renderNested(props: Partial<NativeToolbarMenuProps> = {}) {
      return render(
        <NativeToolbarMenu source={{ uri: 'root-icon' }}>
          <NativeToolbarMenu label="Submenu" {...props}>
            <NativeToolbarMenuAction onPress={() => {}}>Sub Action</NativeToolbarMenuAction>
          </NativeToolbarMenu>
        </NativeToolbarMenu>
      );
    }

    it('renders nested DropdownMenu with DropdownMenuItem trigger', () => {
      renderNested();

      const rootItems = screen.getAllByTestId('DropdownMenu.Items')[0];
      const nestedMenu = within(rootItems).getByTestId('DropdownMenu');
      const nestedTrigger = within(nestedMenu).getByTestId('DropdownMenu.Trigger');
      expect(within(nestedTrigger).getByTestId('DropdownMenuItem')).toBeDefined();
      const nestedItems = within(nestedMenu).getByTestId('DropdownMenu.Items');
      expect(within(nestedItems).getByTestId('DropdownMenuItem')).toBeDefined();
    });

    it('shows leading icon when source provided', () => {
      renderNested({ source: { uri: 'nested-icon' } });

      const leadingIcon = within(screen.getByTestId('DropdownMenuItem.LeadingIcon')).getByTestId(
        'Icon'
      );
      expect(leadingIcon.props.source).toEqual({ uri: 'nested-icon' });
    });

    it('shows arrow-right trailing icon', () => {
      renderNested();

      const trailingIcon = within(screen.getByTestId('DropdownMenuItem.TrailingIcon')).getByTestId(
        'Icon'
      );
      expect(trailingIcon.props.source).toBe('mocked-arrow-right');
    });

    it('forwards disabled prop', () => {
      renderNested({ disabled: true });

      const rootItems = screen.getAllByTestId('DropdownMenu.Items')[0];
      const nestedTrigger = within(rootItems).getByTestId('DropdownMenu.Trigger');
      const nestedMenuItem = within(nestedTrigger).getByTestId('DropdownMenuItem');
      expect(nestedMenuItem.props.enabled).toBe(false);
    });
  });

  describe('inline nested menu', () => {
    function renderInline(props: Partial<NativeToolbarMenuProps> = {}) {
      return render(
        <NativeToolbarMenu source={{ uri: 'root-icon' }}>
          <NativeToolbarMenu inline label="Inline Section" {...props}>
            <NativeToolbarMenuAction onPress={() => {}}>Inline Action</NativeToolbarMenuAction>
          </NativeToolbarMenu>
        </NativeToolbarMenu>
      );
    }

    it('renders HorizontalDivider and action inside root items', () => {
      renderInline();

      const rootItems = screen.getByTestId('DropdownMenu.Items');
      expect(within(rootItems).getByTestId('HorizontalDivider')).toBeDefined();
      expect(within(rootItems).getByTestId('DropdownMenuItem')).toBeDefined();
    });

    it('does NOT render a separate DropdownMenu for inline section', () => {
      renderInline();

      // Only 1 DropdownMenu for the root, not for the inline section
      expect(screen.getAllByTestId('DropdownMenu')).toHaveLength(1);
    });
  });
});

describe('NativeToolbarMenuAction', () => {
  const defaultProps: NativeToolbarMenuActionProps = {
    onPress: jest.fn(),
    children: 'Test Action',
  };

  it('renders DropdownMenuItem with text label', () => {
    render(
      <NativeToolbarMenu source={{ uri: 'icon' }}>
        <NativeToolbarMenuAction {...defaultProps} />
      </NativeToolbarMenu>
    );

    const menuItems = screen.getByTestId('DropdownMenu.Items');
    expect(within(menuItems).getByTestId('DropdownMenuItem')).toBeDefined();
    expect(within(menuItems).getByTestId('DropdownMenuItem.Text')).toBeDefined();
  });

  it('extracts label from string children', () => {
    render(
      <NativeToolbarMenu source={{ uri: 'icon' }}>
        <NativeToolbarMenuAction onPress={() => {}}>String Label</NativeToolbarMenuAction>
      </NativeToolbarMenu>
    );

    const menuItems = screen.getByTestId('DropdownMenu.Items');
    const text = within(menuItems).getByTestId('ComposeText');
    expect(text.props.children).toBe('String Label');
  });

  it('extracts label from Label child', () => {
    render(
      <NativeToolbarMenu source={{ uri: 'icon' }}>
        <NativeToolbarMenuAction onPress={() => {}}>
          <StackToolbarLabel>Label Child</StackToolbarLabel>
        </NativeToolbarMenuAction>
      </NativeToolbarMenu>
    );

    const menuItems = screen.getByTestId('DropdownMenu.Items');
    const text = within(menuItems).getByTestId('ComposeText');
    expect(text.props.children).toBe('Label Child');
  });

  it('falls back to empty string when no string or Label children', () => {
    render(
      <NativeToolbarMenu source={{ uri: 'icon' }}>
        <NativeToolbarMenuAction onPress={() => {}}>
          {/* Only non-Label elements */}
        </NativeToolbarMenuAction>
      </NativeToolbarMenu>
    );

    const menuItems = screen.getByTestId('DropdownMenu.Items');
    const text = within(menuItems).getByTestId('ComposeText');
    expect(text.props.children).toBe('');
  });

  it('calls onPress and closeMenu on click', () => {
    const onPress = jest.fn();
    render(
      <NativeToolbarMenu source={{ uri: 'icon' }}>
        <NativeToolbarMenuAction onPress={onPress}>Action</NativeToolbarMenuAction>
      </NativeToolbarMenu>
    );

    act(() => {
      screen.getByTestId('IconButton').props.onClick();
    });
    expect(screen.getByTestId('DropdownMenu').props.expanded).toBe(true);

    const actionItem = within(screen.getByTestId('DropdownMenu.Items')).getByTestId(
      'DropdownMenuItem'
    );
    act(() => {
      actionItem.props.onClick();
    });
    expect(onPress).toHaveBeenCalled();
    expect(screen.getByTestId('DropdownMenu').props.expanded).toBe(false);
  });

  it('does NOT call closeMenu when unstable_keepPresented is true', () => {
    const onPress = jest.fn();
    render(
      <NativeToolbarMenu source={{ uri: 'icon' }}>
        <NativeToolbarMenuAction onPress={onPress} unstable_keepPresented>
          Action
        </NativeToolbarMenuAction>
      </NativeToolbarMenu>
    );

    act(() => {
      screen.getByTestId('IconButton').props.onClick();
    });
    expect(screen.getByTestId('DropdownMenu').props.expanded).toBe(true);

    const actionItem = within(screen.getByTestId('DropdownMenu.Items')).getByTestId(
      'DropdownMenuItem'
    );
    act(() => {
      actionItem.props.onClick();
    });
    expect(onPress).toHaveBeenCalled();
    expect(screen.getByTestId('DropdownMenu').props.expanded).toBe(true);
  });

  it.each([false, true, undefined])('passes disabled=%s as enabled={!disabled}', (disabled) => {
    render(
      <NativeToolbarMenu source={{ uri: 'icon' }}>
        <NativeToolbarMenuAction {...defaultProps} disabled={disabled} />
      </NativeToolbarMenu>
    );

    const actionItem = within(screen.getByTestId('DropdownMenu.Items')).getByTestId(
      'DropdownMenuItem'
    );
    expect(actionItem.props.enabled).toBe(!disabled);
  });

  it('returns null when hidden is true', () => {
    render(
      <NativeToolbarMenu source={{ uri: 'icon' }}>
        <NativeToolbarMenuAction {...defaultProps} hidden />
      </NativeToolbarMenu>
    );

    const menuItems = screen.getByTestId('DropdownMenu.Items');
    expect(within(menuItems).queryByTestId('DropdownMenuItem')).toBeNull();
  });

  it('shows destructive text color', () => {
    render(
      <NativeToolbarMenu source={{ uri: 'icon' }}>
        <NativeToolbarMenuAction {...defaultProps} destructive />
      </NativeToolbarMenu>
    );

    const menuItems = screen.getByTestId('DropdownMenu.Items');
    const text = within(menuItems).getByTestId('ComposeText');
    expect(text.props.color).toBe('material:error');
  });

  it('uses default tint color when not destructive', () => {
    render(
      <NativeToolbarMenu source={{ uri: 'icon' }}>
        <NativeToolbarMenuAction {...defaultProps} />
      </NativeToolbarMenu>
    );

    const menuItems = screen.getByTestId('DropdownMenu.Items');
    const text = within(menuItems).getByTestId('ComposeText');
    expect(text.props.color).toBe('dynamic:onSurface');
  });

  it('shows checkmark trailing icon when isOn is true', () => {
    render(
      <NativeToolbarMenu source={{ uri: 'icon' }}>
        <NativeToolbarMenuAction {...defaultProps} isOn />
      </NativeToolbarMenu>
    );

    const menuItems = screen.getByTestId('DropdownMenu.Items');
    const trailingIcon = within(menuItems).getByTestId('DropdownMenuItem.TrailingIcon');
    const icon = within(trailingIcon).getByTestId('Icon');
    expect(icon.props.source).toBe('mocked-checkmark');
  });

  it('shows leading icon when source provided', () => {
    const actionSource = { uri: 'action-icon' };
    render(
      <NativeToolbarMenu source={{ uri: 'icon' }}>
        <NativeToolbarMenuAction {...defaultProps} source={actionSource} />
      </NativeToolbarMenu>
    );

    const menuItems = screen.getByTestId('DropdownMenu.Items');
    const leadingIcon = within(menuItems).getByTestId('DropdownMenuItem.LeadingIcon');
    const icon = within(leadingIcon).getByTestId('Icon');
    expect(icon.props.source).toEqual({ uri: 'action-icon' });
  });
});

describe('StackToolbarMenu', () => {
  it('renders AnimatedItemContainer even when hidden={true} so animation fires on toggle', () => {
    const icon = { uri: 'test-icon' };
    render(
      <ToolbarPlacementContext.Provider value="bottom">
        <StackToolbarMenu icon={icon} hidden>
          <NativeToolbarMenuAction onPress={() => {}}>Action</NativeToolbarMenuAction>
        </StackToolbarMenu>
      </ToolbarPlacementContext.Provider>
    );

    // AnimatedItemContainer should render (source is defined) so that toggling
    // hidden from true→false triggers an enter animation instead of a remount.
    expect(screen.getByTestId('AnimatedItemContainer')).toBeDefined();
    expect(screen.getByTestId('AnimatedItemContainer').props.visible).toBe(false);
  });

  it('renders with visible={true} when hidden={false}', () => {
    const icon = { uri: 'test-icon' };
    render(
      <ToolbarPlacementContext.Provider value="bottom">
        <StackToolbarMenu icon={icon} hidden={false}>
          <NativeToolbarMenuAction onPress={() => {}}>Action</NativeToolbarMenuAction>
        </StackToolbarMenu>
      </ToolbarPlacementContext.Provider>
    );

    expect(screen.getByTestId('AnimatedItemContainer')).toBeDefined();
    expect(screen.getByTestId('AnimatedItemContainer').props.visible).toBe(true);
  });

  it('keeps AnimatedItemContainer mounted when toggling hidden from true to false', () => {
    const icon = { uri: 'test-icon' };
    const tree = (hidden: boolean) => (
      <ToolbarPlacementContext.Provider value="bottom">
        <StackToolbarMenu icon={icon} hidden={hidden}>
          <NativeToolbarMenuAction onPress={() => {}}>Action</NativeToolbarMenuAction>
        </StackToolbarMenu>
      </ToolbarPlacementContext.Provider>
    );

    const { rerender } = render(tree(true));
    expect(screen.getByTestId('AnimatedItemContainer').props.visible).toBe(false);

    rerender(tree(false));
    expect(screen.getByTestId('AnimatedItemContainer').props.visible).toBe(true);
  });
});
