import { act, render, screen, within } from '@testing-library/react-native';
import React from 'react';

import { StackToolbarMenu } from '../toolbar/StackToolbarMenu';
import { NativeToolbarMenu, NativeToolbarMenuAction } from '../toolbar/StackToolbarMenu/native';
import type {
  NativeToolbarMenuActionProps,
  NativeToolbarMenuProps,
} from '../toolbar/StackToolbarMenu/types';
import {
  ToolbarColorContext,
  type ToolbarColors,
  ToolbarPlacementContext,
} from '../toolbar/context';
import { StackToolbarLabel } from '../toolbar/toolbar-primitives';

jest.mock('@expo/ui/jetpack-compose', () => {
  const { Text, View }: typeof import('react-native') = jest.requireActual('react-native');

  const DropdownMenuItem = jest.fn((props) => (
    <View testID="DropdownMenuItem" {...props} />
  )) as unknown as jest.MockedFunction<React.FC<Record<string, unknown>>> & {
    Text: jest.MockedFunction<React.FC<Record<string, unknown>>>;
    LeadingIcon: jest.MockedFunction<React.FC<Record<string, unknown>>>;
    TrailingIcon: jest.MockedFunction<React.FC<Record<string, unknown>>>;
  };
  DropdownMenuItem.Text = jest.fn((props) => <Text testID="DropdownMenuItem.Text" {...props} />);
  DropdownMenuItem.LeadingIcon = jest.fn((props) => (
    <View testID="DropdownMenuItem.LeadingIcon" {...props} />
  ));
  DropdownMenuItem.TrailingIcon = jest.fn((props) => (
    <View testID="DropdownMenuItem.TrailingIcon" {...props} />
  ));

  const SelectableDropdownMenuItem = jest.fn((props) => (
    <View testID="SelectableDropdownMenuItem" {...props} />
  )) as unknown as jest.MockedFunction<React.FC<Record<string, unknown>>> & {
    Text: jest.MockedFunction<React.FC<Record<string, unknown>>>;
    LeadingIcon: jest.MockedFunction<React.FC<Record<string, unknown>>>;
    SelectedLeadingIcon: jest.MockedFunction<React.FC<Record<string, unknown>>>;
  };
  SelectableDropdownMenuItem.Text = jest.fn((props) => (
    <Text testID="SelectableDropdownMenuItem.Text" {...props} />
  ));
  SelectableDropdownMenuItem.LeadingIcon = jest.fn((props) => (
    <View testID="SelectableDropdownMenuItem.LeadingIcon" {...props} />
  ));
  SelectableDropdownMenuItem.SelectedLeadingIcon = jest.fn((props) => (
    <View testID="SelectableDropdownMenuItem.SelectedLeadingIcon" {...props} />
  ));

  return {
    Box: jest.fn((props) => <View testID="Box" {...props} />),
    DropdownMenuGroup: jest.fn((props) => <View testID="DropdownMenuGroup" {...props} />),
    DropdownMenuItem,
    DropdownMenuPopup: jest.fn((props) => <View testID="DropdownMenuPopup" {...props} />),
    Icon: jest.fn((props) => <View testID="Icon" {...props} />),
    IconButton: jest.fn((props) => <View testID="IconButton" {...props} />),
    SelectableDropdownMenuItem,
    Spacer: jest.fn((props) => <View testID="Spacer" {...props} />),
    Text: jest.fn((props) => <Text testID="ComposeText" {...props} />),
  };
});

jest.mock('@expo/ui/jetpack-compose/modifiers', () => ({
  background: jest.fn((color: string) => ({ type: 'background', color })),
  height: jest.fn((value: number) => ({ type: 'height', value })),
  verticalScroll: jest.fn(() => ({ type: 'verticalScroll' })),
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

const { background } = jest.requireMock(
  '@expo/ui/jetpack-compose/modifiers'
) as typeof import('@expo/ui/jetpack-compose/modifiers');
const MockedBackground = background as jest.MockedFunction<typeof background>;

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

      it('returns null and warns when source is missing in development', async () => {
        process.env.NODE_ENV = 'development';

        const { toJSON } = await render(<NativeToolbarMenu />);

        expect(toJSON()).toBeNull();
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Stack.Toolbar.Menu on Android requires an ImageSourcePropType')
        );
      });

      it('returns null without warning in production', async () => {
        process.env.NODE_ENV = 'production';

        const { toJSON } = await render(<NativeToolbarMenu />);

        expect(toJSON()).toBeNull();
        expect(consoleSpy).not.toHaveBeenCalled();
      });
    });

    describe('tint color logic', () => {
      it('sets source tint to null when imageRenderingMode is original', async () => {
        await render(<NativeToolbarMenu {...defaultProps} imageRenderingMode="original" />);

        const icon = within(screen.getByTestId('IconButton')).getByTestId('Icon');
        expect(icon.props.tint).toBeNull();
      });

      it('sets source tint to null when imageRenderingMode is original even with tintColor prop', async () => {
        await render(
          <NativeToolbarMenu {...defaultProps} imageRenderingMode="original" tintColor="red" />
        );

        const icon = within(screen.getByTestId('IconButton')).getByTestId('Icon');
        expect(icon.props.tint).toBeNull();
      });

      it('uses provided tintColor when imageRenderingMode is template', async () => {
        await render(
          <NativeToolbarMenu {...defaultProps} imageRenderingMode="template" tintColor="red" />
        );

        const icon = within(screen.getByTestId('IconButton')).getByTestId('Icon');
        expect(icon.props.tint).toBe('red');
      });

      it('falls back to dynamic onSurface when imageRenderingMode is template and no tintColor', async () => {
        await render(<NativeToolbarMenu {...defaultProps} imageRenderingMode="template" />);

        const icon = within(screen.getByTestId('IconButton')).getByTestId('Icon');
        expect(icon.props.tint).toBe('dynamic:onSurface');
      });

      it('uses provided tintColor when imageRenderingMode is undefined', async () => {
        await render(<NativeToolbarMenu {...defaultProps} tintColor="red" />);

        const icon = within(screen.getByTestId('IconButton')).getByTestId('Icon');
        expect(icon.props.tint).toBe('red');
      });

      it('falls back to dynamic onSurface when both imageRenderingMode and tintColor are undefined', async () => {
        await render(<NativeToolbarMenu {...defaultProps} />);

        const icon = within(screen.getByTestId('IconButton')).getByTestId('Icon');
        expect(icon.props.tint).toBe('dynamic:onSurface');
      });
    });

    describe('toolbar color context', () => {
      function renderWithColors(
        menuProps: NativeToolbarMenuProps,
        colors: ToolbarColors,
        children?: React.ReactNode
      ) {
        return render(
          <ToolbarColorContext.Provider value={colors}>
            <NativeToolbarMenu {...menuProps}>{children}</NativeToolbarMenu>
          </ToolbarColorContext.Provider>
        );
      }

      it('uses context tintColor for icon when no prop tintColor', async () => {
        await renderWithColors(defaultProps, { tintColor: 'context-tint' });

        const icon = within(screen.getByTestId('IconButton')).getByTestId('Icon');
        expect(icon.props.tint).toBe('context-tint');
      });

      it('prop tintColor takes precedence over context', async () => {
        await renderWithColors(
          { ...defaultProps, tintColor: 'prop-tint' },
          { tintColor: 'context-tint' }
        );

        const icon = within(screen.getByTestId('IconButton')).getByTestId('Icon');
        expect(icon.props.tint).toBe('prop-tint');
      });

      it('uses context backgroundColor for the IconButton background', async () => {
        await renderWithColors(defaultProps, { backgroundColor: 'context-bg' });

        expect(MockedBackground).toHaveBeenCalledWith('context-bg');
      });

      it('falls back to default surfaceContainer for the IconButton background', async () => {
        await renderWithColors(defaultProps, {});

        expect(MockedBackground).toHaveBeenCalledWith('dynamic:surfaceContainer');
      });

      it('uses context backgroundColor for the menu group container', async () => {
        await renderWithColors(
          defaultProps,
          { backgroundColor: 'context-bg' },
          <NativeToolbarMenuAction onPress={() => {}}>Action</NativeToolbarMenuAction>
        );

        expect(screen.getByTestId('DropdownMenuGroup').props.containerColor).toBe('context-bg');
      });

      it('falls back to default surfaceContainer for the menu group container', async () => {
        await renderWithColors(
          defaultProps,
          {},
          <NativeToolbarMenuAction onPress={() => {}}>Action</NativeToolbarMenuAction>
        );

        expect(screen.getByTestId('DropdownMenuGroup').props.containerColor).toBe(
          'dynamic:surfaceContainer'
        );
      });

      it('uses context buttonContainerColor for the IconButton container', async () => {
        await renderWithColors(defaultProps, { buttonContainerColor: 'context-container' });

        const iconButton = screen.getByTestId('IconButton');
        expect(iconButton.props.colors).toEqual({
          containerColor: 'context-container',
          disabledContainerColor: 'context-container',
        });
      });

      it('does not apply the background modifier to the IconButton when context buttonContainerColor is set', async () => {
        await renderWithColors(defaultProps, { buttonContainerColor: 'context-container' });

        const iconButton = screen.getByTestId('IconButton');
        expect(iconButton.props.modifiers).toEqual([]);
      });

      it('passes empty IconButton colors when no context buttonContainerColor', async () => {
        await renderWithColors(defaultProps, {});

        const iconButton = screen.getByTestId('IconButton');
        expect(iconButton.props.colors).toEqual({});
      });
    });

    describe('prop forwarding', () => {
      it.each([false, true, undefined])(
        'passes hidden %s as visible={!hidden} to AnimatedItemContainer',
        async (hidden) => {
          await render(<NativeToolbarMenu {...defaultProps} hidden={hidden} />);

          expect(screen.getByTestId('AnimatedItemContainer').props.visible).toBe(!hidden);
        }
      );

      it.each([false, true, undefined])(
        'passes disabled %s as enabled={!disabled} to IconButton',
        async (disabled) => {
          await render(<NativeToolbarMenu {...defaultProps} disabled={disabled} />);

          expect(screen.getByTestId('IconButton').props.enabled).toBe(!disabled);
        }
      );

      it('passes source and size=24 to Icon', async () => {
        const source = { uri: 'my-icon' };
        await render(<NativeToolbarMenu {...defaultProps} source={source} />);

        const icon = within(screen.getByTestId('IconButton')).getByTestId('Icon');
        expect(icon.props.source).toEqual(source);
        expect(icon.props.size).toBe(24);
      });

      it('passes accessibilityLabel to root Icon as contentDescription', async () => {
        await render(<NativeToolbarMenu {...defaultProps} accessibilityLabel="More options" />);

        const icon = within(screen.getByTestId('IconButton')).getByTestId('Icon');
        expect(icon.props.contentDescription).toBe('More options');
      });

      it('omits contentDescription when accessibilityLabel is not provided', async () => {
        await render(<NativeToolbarMenu {...defaultProps} />);

        const icon = within(screen.getByTestId('IconButton')).getByTestId('Icon');
        expect(icon.props.contentDescription).toBeUndefined();
      });

      it('renders the IconButton and the DropdownMenuPopup in one Box', async () => {
        await render(<NativeToolbarMenu {...defaultProps} />);

        const box = screen.getByTestId('Box');
        expect(within(box).getByTestId('IconButton')).toBeDefined();
        expect(within(box).getByTestId('DropdownMenuPopup')).toBeDefined();
      });

      it('opens the root DropdownMenuPopup below the IconButton', async () => {
        await render(<NativeToolbarMenu {...defaultProps} />);

        expect(screen.getByTestId('DropdownMenuPopup').props.anchorPosition).toBeUndefined();
      });

      it('makes the root DropdownMenuPopup scrollable', async () => {
        await render(<NativeToolbarMenu {...defaultProps} />);

        expect(screen.getByTestId('DropdownMenuPopup').props.modifiers).toEqual([
          { type: 'verticalScroll' },
        ]);
      });

      it('renders children inside a DropdownMenuGroup of the DropdownMenuPopup', async () => {
        await render(
          <NativeToolbarMenu {...defaultProps}>
            <NativeToolbarMenuAction onPress={() => {}}>Action</NativeToolbarMenuAction>
          </NativeToolbarMenu>
        );

        const group = within(screen.getByTestId('DropdownMenuPopup')).getByTestId(
          'DropdownMenuGroup'
        );
        expect(within(group).getByTestId('DropdownMenuItem')).toBeDefined();
      });
    });

    describe('cornerRadius', () => {
      const originalEnv = process.env.NODE_ENV;
      let consoleSpy: jest.SpyInstance;

      beforeEach(() => {
        consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      });

      afterEach(() => {
        process.env.NODE_ENV = originalEnv;
        consoleSpy.mockRestore();
      });

      it('warns once in development that cornerRadius is deprecated', async () => {
        process.env.NODE_ENV = 'development';

        const { rerender } = await render(<NativeToolbarMenu {...defaultProps} cornerRadius={8} />);
        await rerender(<NativeToolbarMenu {...defaultProps} cornerRadius={8} />);

        expect(consoleSpy).toHaveBeenCalledTimes(1);
        expect(consoleSpy).toHaveBeenCalledWith(
          'Stack.Toolbar.Menu `cornerRadius` is deprecated and has no effect on Android. The Material 3 Expressive menu sets the corner shape of each group. Remove the `cornerRadius` prop.'
        );
      });
    });
  });

  describe('groups', () => {
    it('puts actions next to each other in one group', async () => {
      await render(
        <NativeToolbarMenu source={{ uri: 'root-icon' }}>
          <NativeToolbarMenuAction onPress={() => {}}>First</NativeToolbarMenuAction>
          <NativeToolbarMenuAction onPress={() => {}}>Second</NativeToolbarMenuAction>
        </NativeToolbarMenu>
      );

      const groups = screen.getAllByTestId('DropdownMenuGroup');
      expect(groups).toHaveLength(1);
      expect(groups[0]!.props.shapes).toEqual({ index: 0, count: 1 });
      const items = within(groups[0]!).getAllByTestId('DropdownMenuItem');
      expect(items[0]!.props.shape).toEqual({ index: 0, count: 2 });
      expect(items[1]!.props.shape).toEqual({ index: 1, count: 2 });
    });

    it('puts each inline submenu in its own group', async () => {
      await render(
        <NativeToolbarMenu source={{ uri: 'root-icon' }}>
          <NativeToolbarMenuAction onPress={() => {}}>Before</NativeToolbarMenuAction>
          <NativeToolbarMenu inline label="Section">
            <NativeToolbarMenuAction onPress={() => {}}>Inside 1</NativeToolbarMenuAction>
            <NativeToolbarMenuAction onPress={() => {}}>Inside 2</NativeToolbarMenuAction>
          </NativeToolbarMenu>
          <NativeToolbarMenuAction onPress={() => {}}>After</NativeToolbarMenuAction>
        </NativeToolbarMenu>
      );

      const groups = screen.getAllByTestId('DropdownMenuGroup');
      expect(groups).toHaveLength(3);
      expect(groups[0]!.props.shapes).toEqual({ index: 0, count: 3 });
      expect(groups[1]!.props.shapes).toEqual({ index: 1, count: 3 });
      expect(groups[2]!.props.shapes).toEqual({ index: 2, count: 3 });
      const sectionItems = within(groups[1]!).getAllByTestId('DropdownMenuItem');
      expect(sectionItems).toHaveLength(2);
      expect(sectionItems[0]!.props.shape).toEqual({ index: 0, count: 2 });
      expect(sectionItems[1]!.props.shape).toEqual({ index: 1, count: 2 });
      expect(within(groups[2]!).getByTestId('DropdownMenuItem').props.shape).toEqual({
        index: 0,
        count: 1,
      });
    });

    it('puts an inline submenu inside an inline submenu in its own group', async () => {
      await render(
        <NativeToolbarMenu source={{ uri: 'root-icon' }}>
          <NativeToolbarMenu inline label="Outer">
            <NativeToolbarMenuAction onPress={() => {}}>A</NativeToolbarMenuAction>
            <NativeToolbarMenu inline label="Inner">
              <NativeToolbarMenuAction onPress={() => {}}>B</NativeToolbarMenuAction>
              <NativeToolbarMenuAction onPress={() => {}}>C</NativeToolbarMenuAction>
            </NativeToolbarMenu>
            <NativeToolbarMenuAction onPress={() => {}}>D</NativeToolbarMenuAction>
          </NativeToolbarMenu>
        </NativeToolbarMenu>
      );

      const groups = screen.getAllByTestId('DropdownMenuGroup');
      expect(groups.map((group) => group.props.shapes)).toEqual([
        { index: 0, count: 3 },
        { index: 1, count: 3 },
        { index: 2, count: 3 },
      ]);
      const innerItems = within(groups[1]!).getAllByTestId('DropdownMenuItem');
      expect(innerItems.map((item) => item.props.shape)).toEqual([
        { index: 0, count: 2 },
        { index: 1, count: 2 },
      ]);
    });

    it('puts a Spacer between groups', async () => {
      await render(
        <NativeToolbarMenu source={{ uri: 'root-icon' }}>
          <NativeToolbarMenuAction onPress={() => {}}>Before</NativeToolbarMenuAction>
          <NativeToolbarMenu inline label="Section">
            <NativeToolbarMenuAction onPress={() => {}}>Inside</NativeToolbarMenuAction>
          </NativeToolbarMenu>
        </NativeToolbarMenu>
      );

      const spacers = screen.getAllByTestId('Spacer');
      expect(spacers).toHaveLength(1);
      expect(spacers[0]!.props.modifiers).toEqual([{ type: 'height', value: 2 }]);
    });

    it('does not count hidden actions in the item shapes', async () => {
      await render(
        <NativeToolbarMenu source={{ uri: 'root-icon' }}>
          <NativeToolbarMenuAction onPress={() => {}}>Visible</NativeToolbarMenuAction>
          <NativeToolbarMenuAction onPress={() => {}} hidden>
            Hidden
          </NativeToolbarMenuAction>
        </NativeToolbarMenu>
      );

      expect(screen.getByTestId('DropdownMenuItem').props.shape).toEqual({ index: 0, count: 1 });
    });

    it('does not render a group for a hidden inline submenu', async () => {
      await render(
        <NativeToolbarMenu source={{ uri: 'root-icon' }}>
          <NativeToolbarMenuAction onPress={() => {}}>Visible</NativeToolbarMenuAction>
          <NativeToolbarMenu inline hidden label="Section">
            <NativeToolbarMenuAction onPress={() => {}}>Inside</NativeToolbarMenuAction>
          </NativeToolbarMenu>
        </NativeToolbarMenu>
      );

      expect(screen.getAllByTestId('DropdownMenuGroup')).toHaveLength(1);
    });

    it('does not render a group for an inline submenu with only hidden actions', async () => {
      await render(
        <NativeToolbarMenu source={{ uri: 'root-icon' }}>
          <NativeToolbarMenuAction onPress={() => {}}>Visible</NativeToolbarMenuAction>
          <NativeToolbarMenu inline label="Section">
            <NativeToolbarMenuAction onPress={() => {}} hidden>
              Inside
            </NativeToolbarMenuAction>
          </NativeToolbarMenu>
        </NativeToolbarMenu>
      );

      expect(screen.getAllByTestId('DropdownMenuGroup')).toHaveLength(1);
    });

    it('does not count a Label child as a menu item', async () => {
      await render(
        <NativeToolbarMenu source={{ uri: 'root-icon' }}>
          <StackToolbarLabel>Menu</StackToolbarLabel>
          <NativeToolbarMenuAction onPress={() => {}}>Action</NativeToolbarMenuAction>
        </NativeToolbarMenu>
      );

      expect(screen.getByTestId('DropdownMenuItem').props.shape).toEqual({ index: 0, count: 1 });
    });

    // If the group remounted, the submenu would lose its `expanded` state and close.
    it.each([
      ['the first group', false],
      ['a group after an inline submenu', true],
    ])(
      'keeps a submenu open when an action before it in %s hides',
      async (_, withSection: boolean) => {
        const tree = (hideFirst: boolean) => (
          <NativeToolbarMenu source={{ uri: 'root-icon' }}>
            {withSection && (
              <NativeToolbarMenu inline label="Section">
                <NativeToolbarMenuAction onPress={() => {}}>Inside</NativeToolbarMenuAction>
              </NativeToolbarMenu>
            )}
            <NativeToolbarMenuAction onPress={() => {}} hidden={hideFirst}>
              First
            </NativeToolbarMenuAction>
            <NativeToolbarMenu label="Submenu">
              <NativeToolbarMenuAction onPress={() => {}}>Sub Action</NativeToolbarMenuAction>
            </NativeToolbarMenu>
          </NativeToolbarMenu>
        );
        const getSubmenuPopup = () => {
          const popups = screen.getAllByTestId('DropdownMenuPopup');
          return popups[popups.length - 1]!;
        };

        const { rerender } = await render(tree(false));
        const boxes = screen.getAllByTestId('Box');
        const trigger = within(boxes[boxes.length - 1]!).getAllByTestId('DropdownMenuItem')[0]!;
        await act(() => {
          trigger.props.onClick();
        });
        expect(getSubmenuPopup().props.expanded).toBe(true);

        await rerender(tree(true));

        expect(screen.queryByText('First')).toBeNull();
        expect(getSubmenuPopup().props.expanded).toBe(true);
      }
    );
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

    it('renders a DropdownMenuItem trigger and a DropdownMenuPopup in one Box', async () => {
      await renderNested();

      const rootGroup = within(screen.getAllByTestId('DropdownMenuPopup')[0]!).getAllByTestId(
        'DropdownMenuGroup'
      )[0]!;
      const nestedBox = within(rootGroup).getByTestId('Box');
      const nestedPopup = within(nestedBox).getByTestId('DropdownMenuPopup');
      expect(within(nestedBox).getAllByTestId('DropdownMenuItem')).toHaveLength(2);
      expect(within(nestedPopup).getByTestId('DropdownMenuItem')).toBeDefined();
    });

    it('opens the nested DropdownMenuPopup at the end of its item', async () => {
      await renderNested();

      // Index 0 is the root popup. Index 1 is the submenu popup.
      expect(screen.getAllByTestId('DropdownMenuPopup')[1]!.props.anchorPosition).toBe('end');
    });

    it('makes the nested DropdownMenuPopup scrollable', async () => {
      await renderNested();

      // Index 0 is the root popup. Index 1 is the submenu popup.
      expect(screen.getAllByTestId('DropdownMenuPopup')[1]!.props.modifiers).toEqual([
        { type: 'verticalScroll' },
      ]);
    });

    it('opens the nested DropdownMenuPopup when its item is clicked', async () => {
      await renderNested();

      // Index 0 is the submenu trigger. Index 1 is the action in the submenu.
      const nestedTrigger = screen.getAllByTestId('DropdownMenuItem')[0]!;
      await act(() => {
        nestedTrigger.props.onClick();
      });

      expect(screen.getAllByTestId('DropdownMenuPopup')[1]!.props.expanded).toBe(true);
    });

    it('shows leading icon when source provided', async () => {
      await renderNested({ source: { uri: 'nested-icon' } });

      const leadingIcon = within(screen.getByTestId('DropdownMenuItem.LeadingIcon')).getByTestId(
        'Icon'
      );
      expect(leadingIcon.props.source).toEqual({ uri: 'nested-icon' });
    });

    it('uses null tint on leading icon when imageRenderingMode is original', async () => {
      await renderNested({ source: { uri: 'nested-icon' }, imageRenderingMode: 'original' });

      const leadingIcon = within(screen.getByTestId('DropdownMenuItem.LeadingIcon')).getByTestId(
        'Icon'
      );
      expect(leadingIcon.props.tint).toBeNull();
    });

    it('shows arrow-right trailing icon', async () => {
      await renderNested();

      const trailingIcon = within(screen.getByTestId('DropdownMenuItem.TrailingIcon')).getByTestId(
        'Icon'
      );
      expect(trailingIcon.props.source).toBe('mocked-arrow-right');
    });

    it('still tints the trailing arrow when imageRenderingMode is original', async () => {
      await renderNested({ imageRenderingMode: 'original' });

      const trailingIcon = within(screen.getByTestId('DropdownMenuItem.TrailingIcon')).getByTestId(
        'Icon'
      );
      expect(trailingIcon.props.tint).toBe('dynamic:onSurface');
    });

    it('forwards disabled prop', async () => {
      await renderNested({ disabled: true });

      // Index 0 is the submenu trigger.
      expect(screen.getAllByTestId('DropdownMenuItem')[0]!.props.enabled).toBe(false);
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

    it('renders the inline action inside a DropdownMenuGroup of the root popup', async () => {
      await renderInline();

      const group = within(screen.getByTestId('DropdownMenuPopup')).getByTestId(
        'DropdownMenuGroup'
      );
      expect(within(group).getByTestId('DropdownMenuItem')).toBeDefined();
    });

    it('does NOT render a separate DropdownMenuPopup for inline section', async () => {
      await renderInline();

      // Only 1 DropdownMenuPopup for the root, not for the inline section
      expect(screen.getAllByTestId('DropdownMenuPopup')).toHaveLength(1);
    });
  });
});

describe('NativeToolbarMenuAction', () => {
  const defaultProps: NativeToolbarMenuActionProps = {
    onPress: jest.fn(),
    children: 'Test Action',
  };

  it('renders DropdownMenuItem with text label', async () => {
    await render(
      <NativeToolbarMenu source={{ uri: 'icon' }}>
        <NativeToolbarMenuAction {...defaultProps} />
      </NativeToolbarMenu>
    );

    const menuItems = screen.getByTestId('DropdownMenuPopup');
    expect(within(menuItems).getByTestId('DropdownMenuItem')).toBeDefined();
    expect(within(menuItems).getByTestId('DropdownMenuItem.Text')).toBeDefined();
  });

  it('extracts label from string children', async () => {
    await render(
      <NativeToolbarMenu source={{ uri: 'icon' }}>
        <NativeToolbarMenuAction onPress={() => {}}>String Label</NativeToolbarMenuAction>
      </NativeToolbarMenu>
    );

    const menuItems = screen.getByTestId('DropdownMenuPopup');
    const text = within(menuItems).getByTestId('ComposeText');
    expect(text.props.children).toBe('String Label');
  });

  it('extracts label from Label child', async () => {
    await render(
      <NativeToolbarMenu source={{ uri: 'icon' }}>
        <NativeToolbarMenuAction onPress={() => {}}>
          <StackToolbarLabel>Label Child</StackToolbarLabel>
        </NativeToolbarMenuAction>
      </NativeToolbarMenu>
    );

    const menuItems = screen.getByTestId('DropdownMenuPopup');
    const text = within(menuItems).getByTestId('ComposeText');
    expect(text.props.children).toBe('Label Child');
  });

  it('falls back to empty string when no string or Label children', async () => {
    await render(
      <NativeToolbarMenu source={{ uri: 'icon' }}>
        <NativeToolbarMenuAction onPress={() => {}}>
          {/* Only non-Label elements */}
        </NativeToolbarMenuAction>
      </NativeToolbarMenu>
    );

    const menuItems = screen.getByTestId('DropdownMenuPopup');
    const text = within(menuItems).getByTestId('ComposeText');
    expect(text.props.children).toBe('');
  });

  it('calls onPress and closeMenu on click', async () => {
    const onPress = jest.fn();
    await render(
      <NativeToolbarMenu source={{ uri: 'icon' }}>
        <NativeToolbarMenuAction onPress={onPress}>Action</NativeToolbarMenuAction>
      </NativeToolbarMenu>
    );

    await act(() => {
      screen.getByTestId('IconButton').props.onClick();
    });
    expect(screen.getByTestId('DropdownMenuPopup').props.expanded).toBe(true);

    const actionItem = within(screen.getByTestId('DropdownMenuPopup')).getByTestId(
      'DropdownMenuItem'
    );
    await act(() => {
      actionItem.props.onClick();
    });
    expect(onPress).toHaveBeenCalled();
    expect(screen.getByTestId('DropdownMenuPopup').props.expanded).toBe(false);
  });

  it('does NOT call closeMenu when unstable_keepPresented is true', async () => {
    const onPress = jest.fn();
    await render(
      <NativeToolbarMenu source={{ uri: 'icon' }}>
        <NativeToolbarMenuAction onPress={onPress} unstable_keepPresented>
          Action
        </NativeToolbarMenuAction>
      </NativeToolbarMenu>
    );

    await act(() => {
      screen.getByTestId('IconButton').props.onClick();
    });
    expect(screen.getByTestId('DropdownMenuPopup').props.expanded).toBe(true);

    const actionItem = within(screen.getByTestId('DropdownMenuPopup')).getByTestId(
      'DropdownMenuItem'
    );
    await act(() => {
      actionItem.props.onClick();
    });
    expect(onPress).toHaveBeenCalled();
    expect(screen.getByTestId('DropdownMenuPopup').props.expanded).toBe(true);
  });

  it.each([false, true, undefined])(
    'passes disabled=%s as enabled={!disabled}',
    async (disabled) => {
      await render(
        <NativeToolbarMenu source={{ uri: 'icon' }}>
          <NativeToolbarMenuAction {...defaultProps} disabled={disabled} />
        </NativeToolbarMenu>
      );

      const actionItem = within(screen.getByTestId('DropdownMenuPopup')).getByTestId(
        'DropdownMenuItem'
      );
      expect(actionItem.props.enabled).toBe(!disabled);
    }
  );

  it('returns null when hidden is true', async () => {
    await render(
      <NativeToolbarMenu source={{ uri: 'icon' }}>
        <NativeToolbarMenuAction {...defaultProps} hidden />
      </NativeToolbarMenu>
    );

    const menuItems = screen.getByTestId('DropdownMenuPopup');
    expect(within(menuItems).queryByTestId('DropdownMenuItem')).toBeNull();
  });

  describe('toolbar color context', () => {
    function renderActionWithColors(
      actionProps: NativeToolbarMenuActionProps,
      colors: ToolbarColors
    ) {
      return render(
        <ToolbarColorContext.Provider value={colors}>
          <NativeToolbarMenu source={{ uri: 'icon' }}>
            <NativeToolbarMenuAction {...actionProps} />
          </NativeToolbarMenu>
        </ToolbarColorContext.Provider>
      );
    }

    it('uses context tintColor for non-destructive action text', async () => {
      await renderActionWithColors(
        { onPress: jest.fn(), children: 'Action' },
        { tintColor: 'context-tint' }
      );

      const item = screen.getByTestId('DropdownMenuItem');
      expect(item.props.elementColors).toEqual({
        textColor: 'context-tint',
        leadingIconColor: 'context-tint',
      });
    });

    it('uses context backgroundColor for the unselected and disabled containers of a selectable action', async () => {
      await renderActionWithColors(
        { onPress: jest.fn(), children: 'Action', isOn: false },
        { tintColor: 'context-tint', backgroundColor: 'context-bg' }
      );

      expect(screen.getByTestId('SelectableDropdownMenuItem').props.colors).toEqual({
        textColor: 'context-tint',
        leadingIconColor: 'context-tint',
        containerColor: 'context-bg',
        disabledContainerColor: 'context-bg',
      });
    });

    it('falls back to default surfaceContainer for the containers of a selectable action', async () => {
      await renderActionWithColors(
        { onPress: jest.fn(), children: 'Action', isOn: false },
        { tintColor: 'context-tint' }
      );

      expect(screen.getByTestId('SelectableDropdownMenuItem').props.colors).toEqual({
        textColor: 'context-tint',
        leadingIconColor: 'context-tint',
        containerColor: 'dynamic:surfaceContainer',
        disabledContainerColor: 'dynamic:surfaceContainer',
      });
    });

    it('destructive action ignores context tintColor', async () => {
      await renderActionWithColors(
        { onPress: jest.fn(), children: 'Action', destructive: true },
        { tintColor: 'context-tint' }
      );

      const item = screen.getByTestId('DropdownMenuItem');
      expect(item.props.elementColors).toEqual({
        textColor: 'material:error',
        leadingIconColor: 'material:error',
      });
    });
  });

  it('shows destructive text color', async () => {
    await render(
      <NativeToolbarMenu source={{ uri: 'icon' }}>
        <NativeToolbarMenuAction {...defaultProps} destructive />
      </NativeToolbarMenu>
    );

    const item = screen.getByTestId('DropdownMenuItem');
    expect(item.props.elementColors).toEqual({
      textColor: 'material:error',
      leadingIconColor: 'material:error',
    });
  });

  it('keeps the destructive color when a selectable action is selected', async () => {
    await render(
      <NativeToolbarMenu source={{ uri: 'icon' }}>
        <NativeToolbarMenuAction {...defaultProps} destructive isOn />
      </NativeToolbarMenu>
    );

    expect(screen.getByTestId('SelectableDropdownMenuItem').props.colors).toEqual({
      textColor: 'material:error',
      leadingIconColor: 'material:error',
      selectedTextColor: 'material:error',
      selectedLeadingIconColor: 'material:error',
      containerColor: 'dynamic:surfaceContainer',
      disabledContainerColor: 'dynamic:surfaceContainer',
    });
  });

  it('uses default tint color when not destructive', async () => {
    await render(
      <NativeToolbarMenu source={{ uri: 'icon' }}>
        <NativeToolbarMenuAction {...defaultProps} />
      </NativeToolbarMenu>
    );

    const item = screen.getByTestId('DropdownMenuItem');
    expect(item.props.elementColors).toEqual({
      textColor: 'dynamic:onSurface',
      leadingIconColor: 'dynamic:onSurface',
    });
  });

  it('renders a selected SelectableDropdownMenuItem when isOn is true', async () => {
    await render(
      <NativeToolbarMenu source={{ uri: 'icon' }}>
        <NativeToolbarMenuAction {...defaultProps} isOn />
      </NativeToolbarMenu>
    );

    expect(screen.getByTestId('SelectableDropdownMenuItem').props.selected).toBe(true);
    expect(screen.queryByTestId('DropdownMenuItem')).toBeNull();
  });

  it('renders an unselected SelectableDropdownMenuItem when isOn is false', async () => {
    await render(
      <NativeToolbarMenu source={{ uri: 'icon' }}>
        <NativeToolbarMenuAction {...defaultProps} isOn={false} />
      </NativeToolbarMenu>
    );

    expect(screen.getByTestId('SelectableDropdownMenuItem').props.selected).toBe(false);
  });

  it('shows the checkmark as the selected leading icon when isOn is set', async () => {
    await render(
      <NativeToolbarMenu source={{ uri: 'icon' }}>
        <NativeToolbarMenuAction {...defaultProps} isOn />
      </NativeToolbarMenu>
    );

    const selectedIcon = screen.getByTestId('SelectableDropdownMenuItem.SelectedLeadingIcon');
    expect(within(selectedIcon).getByTestId('Icon').props.source).toBe('mocked-checkmark');
  });

  it('shows leading icon when source provided', async () => {
    const actionSource = { uri: 'action-icon' };
    await render(
      <NativeToolbarMenu source={{ uri: 'icon' }}>
        <NativeToolbarMenuAction {...defaultProps} source={actionSource} />
      </NativeToolbarMenu>
    );

    const menuItems = screen.getByTestId('DropdownMenuPopup');
    const leadingIcon = within(menuItems).getByTestId('DropdownMenuItem.LeadingIcon');
    const icon = within(leadingIcon).getByTestId('Icon');
    expect(icon.props.source).toEqual({ uri: 'action-icon' });
  });
});

describe('StackToolbarMenu', () => {
  it('renders AnimatedItemContainer even when hidden={true} so animation fires on toggle', async () => {
    const icon = { uri: 'test-icon' };
    await render(
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

  it('renders with visible={true} when hidden={false}', async () => {
    const icon = { uri: 'test-icon' };
    await render(
      <ToolbarPlacementContext.Provider value="bottom">
        <StackToolbarMenu icon={icon} hidden={false}>
          <NativeToolbarMenuAction onPress={() => {}}>Action</NativeToolbarMenuAction>
        </StackToolbarMenu>
      </ToolbarPlacementContext.Provider>
    );

    expect(screen.getByTestId('AnimatedItemContainer')).toBeDefined();
    expect(screen.getByTestId('AnimatedItemContainer').props.visible).toBe(true);
  });

  it('keeps AnimatedItemContainer mounted when toggling hidden from true to false', async () => {
    const icon = { uri: 'test-icon' };
    const tree = (hidden: boolean) => (
      <ToolbarPlacementContext.Provider value="bottom">
        <StackToolbarMenu icon={icon} hidden={hidden}>
          <NativeToolbarMenuAction onPress={() => {}}>Action</NativeToolbarMenuAction>
        </StackToolbarMenu>
      </ToolbarPlacementContext.Provider>
    );

    const { rerender } = await render(tree(true));
    expect(screen.getByTestId('AnimatedItemContainer').props.visible).toBe(false);

    await rerender(tree(false));
    expect(screen.getByTestId('AnimatedItemContainer').props.visible).toBe(true);
  });

  describe('inline submenu children validation', () => {
    const originalEnv = process.env.NODE_ENV;
    const tree = (
      <ToolbarPlacementContext.Provider value="right">
        <StackToolbarMenu icon={{ uri: 'test-icon' }}>
          <StackToolbarMenu inline>
            <NativeToolbarMenuAction onPress={() => {}}>Valid</NativeToolbarMenuAction>
            <>
              <NativeToolbarMenuAction onPress={() => {}}>In fragment</NativeToolbarMenuAction>
            </>
          </StackToolbarMenu>
        </StackToolbarMenu>
      </ToolbarPlacementContext.Provider>
    );

    beforeEach(() => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
      jest.restoreAllMocks();
    });

    it('throws in development for an invalid child of an inline submenu', async () => {
      process.env.NODE_ENV = 'development';

      await expect(async () => {
        await render(tree);
      }).rejects.toThrow(
        'Stack.Toolbar.Menu only accepts Stack.Toolbar.Menu, Stack.Toolbar.MenuAction, Stack.Toolbar.Label, Stack.Toolbar.Icon, and Stack.Toolbar.Badge as its children.'
      );
    });

    it('drops an invalid child of an inline submenu in production', async () => {
      process.env.NODE_ENV = 'production';

      await render(tree);

      expect(screen.queryByText('In fragment')).toBeNull();
      const items = screen.getAllByTestId('DropdownMenuItem');
      expect(items.map((item) => item.props.shape)).toEqual([{ index: 0, count: 1 }]);
    });
  });
});
