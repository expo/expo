import { render, screen } from '@testing-library/react-native';

import {
  StackToolbarMenu,
  StackToolbarMenuAction,
  convertStackToolbarMenuPropsToRNHeaderItem,
  convertStackToolbarMenuActionPropsToRNHeaderItem,
} from '../toolbar/StackToolbarMenu';
import { ToolbarPlacementContext, type ToolbarPlacement } from '../toolbar/context';
import {
  StackToolbarIcon,
  StackToolbarLabel,
  StackToolbarBadge,
} from '../toolbar/toolbar-primitives';

jest.mock('../../../link/preview/native', () => {
  const { View }: typeof import('react-native') = jest.requireActual('react-native');
  return {
    NativeLinkPreviewAction: jest.fn((props) => (
      <View testID="NativeLinkPreviewAction" {...props} />
    )),
  };
});

jest.mock('../../../link/elements', () => {
  const { View }: typeof import('react-native') = jest.requireActual('react-native');
  return {
    LinkMenuAction: jest.fn((props) => <View testID="LinkMenuAction" {...props} />),
  };
});

const { NativeLinkPreviewAction } = jest.requireMock(
  '../../../link/preview/native'
) as typeof import('../../../link/preview/native');
const MockedNativeLinkPreviewAction = NativeLinkPreviewAction as jest.MockedFunction<
  typeof NativeLinkPreviewAction
>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe(convertStackToolbarMenuPropsToRNHeaderItem, () => {
  it('returns undefined when hidden is true', () => {
    const result = convertStackToolbarMenuPropsToRNHeaderItem({ hidden: true });
    expect(result).toBeUndefined();
  });

  it('returns menu type item with shared props', () => {
    const result = convertStackToolbarMenuPropsToRNHeaderItem({
      icon: 'ellipsis.circle',
      tintColor: 'blue',
    });
    expect(result).toMatchObject({
      type: 'menu',
      icon: { type: 'sfSymbol', name: 'ellipsis.circle' },
      tintColor: 'blue',
    });
  });

  describe('label and title computation', () => {
    it('uses title prop for both label and menuTitle when no Label child', () => {
      const result = convertStackToolbarMenuPropsToRNHeaderItem({
        title: 'Options',
      });
      expect(result?.label).toBe('Options');
      expect(result?.menu.title).toBe('Options');
    });

    it('uses Label child for label and empty menuTitle when no title prop', () => {
      const result = convertStackToolbarMenuPropsToRNHeaderItem({
        children: <StackToolbarLabel>Menu Label</StackToolbarLabel>,
      });
      expect(result?.label).toBe('Menu Label');
      expect(result?.menu.title).toBeUndefined();
    });

    it('uses Label child for label and title prop for menuTitle when both provided', () => {
      const result = convertStackToolbarMenuPropsToRNHeaderItem({
        children: <StackToolbarLabel>Button Label</StackToolbarLabel>,
        title: 'Menu Title',
      });
      expect(result?.label).toBe('Button Label');
      expect(result?.menu.title).toBe('Menu Title');
    });

    it('uses empty strings when neither Label child nor title prop provided', () => {
      const result = convertStackToolbarMenuPropsToRNHeaderItem({});
      expect(result?.label).toBe('');
      expect(result?.menu.title).toBeUndefined();
    });
  });

  it('sets multiselectable to true', () => {
    const result = convertStackToolbarMenuPropsToRNHeaderItem({});
    expect(result?.menu.multiselectable).toBe(true);
  });

  it('collects MenuAction children as items', () => {
    const result = convertStackToolbarMenuPropsToRNHeaderItem({
      children: [
        <StackToolbarMenuAction key="1" onPress={() => {}}>
          Action 1
        </StackToolbarMenuAction>,
        <StackToolbarMenuAction key="2" onPress={() => {}}>
          Action 2
        </StackToolbarMenuAction>,
      ],
    });
    expect(result?.menu.items).toHaveLength(2);
    expect(result?.menu.items[0]).toMatchObject({
      type: 'action',
      label: 'Action 1',
    });
    expect(result?.menu.items[1]).toMatchObject({
      type: 'action',
      label: 'Action 2',
    });
  });

  it('collects nested Menu children as submenus', () => {
    const result = convertStackToolbarMenuPropsToRNHeaderItem({
      children: (
        <StackToolbarMenu title="Submenu">
          <StackToolbarMenuAction onPress={() => {}}>Sub Action</StackToolbarMenuAction>
        </StackToolbarMenu>
      ),
    });
    expect(result?.menu.items).toHaveLength(1);
    expect(result?.menu.items[0]).toMatchObject({
      type: 'submenu',
      label: 'Submenu',
    });
  });
});

describe(convertStackToolbarMenuActionPropsToRNHeaderItem, () => {
  it('returns action type item', () => {
    const result = convertStackToolbarMenuActionPropsToRNHeaderItem({
      children: 'Test Action',
    });
    expect(result.type).toBe('action');
    expect(result.label).toBe('Test Action');
  });

  it.each([true, false, undefined])('sets state based on isOn=%s (defaults to off)', (isOn) => {
    const result = convertStackToolbarMenuActionPropsToRNHeaderItem({ isOn });
    expect(result.state).toBe(isOn ? 'on' : 'off');
  });

  it('sets keepsMenuPresented from unstable_keepPresented', () => {
    const result = convertStackToolbarMenuActionPropsToRNHeaderItem({
      unstable_keepPresented: true,
    });
    expect(result.keepsMenuPresented).toBe(true);
  });

  it('does not set keepsMenuPresented when unstable_keepPresented is undefined', () => {
    const result = convertStackToolbarMenuActionPropsToRNHeaderItem({});
    expect(result.keepsMenuPresented).toBeUndefined();
  });

  it.each([true, false, undefined])('sets destructive=%s prop', (destructive) => {
    const result = convertStackToolbarMenuActionPropsToRNHeaderItem({ destructive });
    expect(result.destructive).toBe(destructive);
  });

  it.each([true, false, undefined])('sets disabled=%s prop', (disabled) => {
    const result = convertStackToolbarMenuActionPropsToRNHeaderItem({ disabled });
    expect(result.disabled).toBe(disabled);
  });

  it('sets description prop', () => {
    const result = convertStackToolbarMenuActionPropsToRNHeaderItem({
      subtitle: 'Additional info',
    });
    expect(result.description).toBe('Additional info');
  });

  it('sets discoverabilityLabel prop', () => {
    const result = convertStackToolbarMenuActionPropsToRNHeaderItem({
      discoverabilityLabel: 'Performs an action',
    });
    expect(result.discoverabilityLabel).toBe('Performs an action');
  });

  it('extracts SF Symbol icon', () => {
    const result = convertStackToolbarMenuActionPropsToRNHeaderItem({
      icon: 'star.fill',
    });
    expect(result.icon).toEqual({
      type: 'sfSymbol',
      name: 'star.fill',
    });
  });

  it('provides default empty onPress callback', () => {
    const result = convertStackToolbarMenuActionPropsToRNHeaderItem({});
    expect(result.onPress).toBeDefined();
    expect(typeof result.onPress).toBe('function');
    expect(() => result.onPress()).not.toThrow();
  });

  it('uses provided onPress callback', () => {
    const onPress = jest.fn();
    const result = convertStackToolbarMenuActionPropsToRNHeaderItem({ onPress });
    expect(result.onPress).toBe(onPress);
  });

  describe('icon warnings', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    beforeEach(() => {
      consoleSpy.mockClear();
    });

    afterAll(() => {
      consoleSpy.mockRestore();
    });

    it('warns for non-SF Symbol icons', () => {
      convertStackToolbarMenuActionPropsToRNHeaderItem({
        icon: { uri: 'https://example.com/icon.png' },
      });

      // TODO: https://linear.app/expo/issue/ENG-19155/support-images-in-submenus-and-actions-in-react-native-screens
      expect(consoleSpy).toHaveBeenCalledWith(
        'When Icon is used inside Stack.Toolbar.MenuAction, only sfSymbol icons are supported. This is a limitation of React Native Screens.'
      );
    });

    it('does not warn for SF Symbol icons', () => {
      convertStackToolbarMenuActionPropsToRNHeaderItem({
        icon: 'star.fill',
      });

      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });
});

describe('submenu conversion', () => {
  it('converts inline prop', () => {
    const result = convertStackToolbarMenuPropsToRNHeaderItem({
      children: (
        <StackToolbarMenu title="Submenu" inline>
          <StackToolbarMenuAction onPress={() => {}}>Action</StackToolbarMenuAction>
        </StackToolbarMenu>
      ),
    });
    expect(result?.menu.items[0]).toMatchObject({
      type: 'submenu',
      inline: true,
    });
  });

  it('converts palette prop to layout', () => {
    const result = convertStackToolbarMenuPropsToRNHeaderItem({
      children: (
        <StackToolbarMenu title="Submenu" palette>
          <StackToolbarMenuAction onPress={() => {}}>Action</StackToolbarMenuAction>
        </StackToolbarMenu>
      ),
    });
    expect(result?.menu.items[0]).toMatchObject({
      type: 'submenu',
      layout: 'palette',
    });
  });

  it('converts palette=false to layout default', () => {
    const result = convertStackToolbarMenuPropsToRNHeaderItem({
      children: (
        <StackToolbarMenu title="Submenu" palette={false}>
          <StackToolbarMenuAction onPress={() => {}}>Action</StackToolbarMenuAction>
        </StackToolbarMenu>
      ),
    });
    expect(result?.menu.items[0]).toMatchObject({
      type: 'submenu',
      layout: 'default',
    });
  });

  it('converts destructive prop', () => {
    const result = convertStackToolbarMenuPropsToRNHeaderItem({
      children: (
        <StackToolbarMenu title="Submenu" destructive>
          <StackToolbarMenuAction onPress={() => {}}>Action</StackToolbarMenuAction>
        </StackToolbarMenu>
      ),
    });
    expect(result?.menu.items[0]).toMatchObject({
      type: 'submenu',
      destructive: true,
    });
  });

  it('sets submenu multiselectable to true', () => {
    const result = convertStackToolbarMenuPropsToRNHeaderItem({
      children: (
        <StackToolbarMenu title="Submenu">
          <StackToolbarMenuAction onPress={() => {}}>Action</StackToolbarMenuAction>
        </StackToolbarMenu>
      ),
    });
    expect(result?.menu.items[0]).toMatchObject({
      type: 'submenu',
      multiselectable: true,
    });
  });

  it('handles recursive submenus', () => {
    const result = convertStackToolbarMenuPropsToRNHeaderItem({
      children: (
        <StackToolbarMenu title="Level 1">
          <StackToolbarMenu title="Level 2">
            <StackToolbarMenuAction onPress={() => {}}>Deep Action</StackToolbarMenuAction>
          </StackToolbarMenu>
        </StackToolbarMenu>
      ),
    });
    expect(result?.menu.items[0]).toMatchObject({
      type: 'submenu',
      label: 'Level 1',
      items: [
        {
          type: 'submenu',
          label: 'Level 2',
          items: [
            {
              type: 'action',
              label: 'Deep Action',
            },
          ],
        },
      ],
    });
  });

  it('converts nested menu with inline submenu', () => {
    const result = convertStackToolbarMenuPropsToRNHeaderItem({
      icon: 'ellipsis.circle',
      children: [
        <StackToolbarMenuAction key="1" onPress={() => {}}>
          Action 1
        </StackToolbarMenuAction>,
        <StackToolbarMenu key="2" inline title="Submenu">
          <StackToolbarMenuAction onPress={() => {}}>Sub Action</StackToolbarMenuAction>
        </StackToolbarMenu>,
      ],
    });

    expect(result?.type).toBe('menu');
    expect(result?.menu.items).toHaveLength(2);
    expect(result?.menu.items[0]).toMatchObject({ type: 'action' });
    expect(result?.menu.items[1]).toMatchObject({
      type: 'submenu',
      inline: true,
    });
  });

  it('converts deeply nested menu structure', () => {
    const result = convertStackToolbarMenuPropsToRNHeaderItem({
      icon: 'ellipsis.circle',
      children: [
        <StackToolbarMenuAction key="1" onPress={() => {}}>
          Top Action
        </StackToolbarMenuAction>,
        <StackToolbarMenu key="2" title="Level 1">
          <StackToolbarMenuAction onPress={() => {}}>L1 Action</StackToolbarMenuAction>
          <StackToolbarMenu title="Level 2">
            <StackToolbarMenuAction onPress={() => {}}>L2 Action</StackToolbarMenuAction>
          </StackToolbarMenu>
        </StackToolbarMenu>,
      ],
    });

    expect(result?.type).toBe('menu');
    // Top level menu
    expect(result?.menu.items).toHaveLength(2);
    // Level 1 submenu
    expect(result?.menu.items[1]).toMatchObject({
      type: 'submenu',
      items: expect.arrayContaining([
        expect.objectContaining({ type: 'action', label: 'L1 Action' }),
        expect.objectContaining({
          type: 'submenu',
          label: 'Level 2',
          items: [expect.objectContaining({ type: 'action', label: 'L2 Action' })],
        }),
      ]),
    });
  });

  it('returns undefined for hidden submenu', () => {
    const result = convertStackToolbarMenuPropsToRNHeaderItem({
      children: (
        <StackToolbarMenu title="Submenu" hidden>
          <StackToolbarMenuAction onPress={() => {}}>Action</StackToolbarMenuAction>
        </StackToolbarMenu>
      ),
    });
    expect(result?.menu.items).toHaveLength(0);
  });

  describe('submenu icon warnings', () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('warns for non-SF Symbol icons in submenu', () => {
      convertStackToolbarMenuPropsToRNHeaderItem({
        children: (
          <StackToolbarMenu title="Submenu" icon={{ uri: 'https://example.com/icon.png' }}>
            <StackToolbarMenuAction onPress={() => {}}>Action</StackToolbarMenuAction>
          </StackToolbarMenu>
        ),
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'When Icon is used inside Stack.Toolbar.Menu used as a submenu, only sfSymbol icons are supported. This is a limitation of React Native Screens.'
      );
    });

    it('warns for xcasset icons in submenu', () => {
      convertStackToolbarMenuPropsToRNHeaderItem({
        children: (
          <StackToolbarMenu title="Submenu">
            <StackToolbarIcon xcasset="custom-icon" />
            <StackToolbarMenuAction onPress={() => {}}>Action</StackToolbarMenuAction>
          </StackToolbarMenu>
        ),
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'When Icon is used inside Stack.Toolbar.Menu used as a submenu, only sfSymbol icons are supported. This is a limitation of React Native Screens.'
      );
    });

    it('accepts SF Symbol icons in submenu', () => {
      const result = convertStackToolbarMenuPropsToRNHeaderItem({
        children: (
          <StackToolbarMenu title="Submenu" icon="folder.fill">
            <StackToolbarMenuAction onPress={() => {}}>Action</StackToolbarMenuAction>
          </StackToolbarMenu>
        ),
      });

      expect(consoleSpy).not.toHaveBeenCalled();
      expect(result?.menu.items[0]).toMatchObject({
        icon: { type: 'sfSymbol', name: 'folder.fill' },
      });
    });
  });
});

describe('StackToolbarMenu component', () => {
  it.each(['left', 'right', undefined, 'xyz'] as const)(
    'throws error when not in bottom placement (placement=%s)',
    (placement) => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => {
        render(
          // Intentionally passing invalid placement as well
          <ToolbarPlacementContext.Provider value={placement as ToolbarPlacement}>
            <StackToolbarMenu icon="ellipsis.circle">
              <StackToolbarMenuAction onPress={() => {}}>Action</StackToolbarMenuAction>
            </StackToolbarMenu>
          </ToolbarPlacementContext.Provider>
        );
      }).toThrow('Stack.Toolbar.Menu must be used inside a Stack.Toolbar');
      jest.restoreAllMocks();
    }
  );

  it('renders NativeLinkPreviewAction in bottom placement', () => {
    render(
      <ToolbarPlacementContext.Provider value="bottom">
        <StackToolbarMenu icon="ellipsis.circle">
          <StackToolbarMenuAction onPress={() => {}}>Action</StackToolbarMenuAction>
        </StackToolbarMenu>
      </ToolbarPlacementContext.Provider>
    );

    expect(screen.getByTestId('NativeLinkPreviewAction')).toBeVisible();
    expect(MockedNativeLinkPreviewAction).toHaveBeenCalled();
  });

  it('passes icon to NativeLinkPreviewAction', () => {
    render(
      <ToolbarPlacementContext.Provider value="bottom">
        <StackToolbarMenu icon="ellipsis.circle">
          <StackToolbarMenuAction onPress={() => {}}>Action</StackToolbarMenuAction>
        </StackToolbarMenu>
      </ToolbarPlacementContext.Provider>
    );

    expect(MockedNativeLinkPreviewAction).toHaveBeenCalledWith(
      expect.objectContaining({
        icon: 'ellipsis.circle',
      }),
      undefined
    );
  });

  it('passes computed label and title', () => {
    render(
      <ToolbarPlacementContext.Provider value="bottom">
        <StackToolbarMenu title="Menu Title">
          <StackToolbarLabel>Button Label</StackToolbarLabel>
          <StackToolbarMenuAction onPress={() => {}}>Action</StackToolbarMenuAction>
        </StackToolbarMenu>
      </ToolbarPlacementContext.Provider>
    );

    expect(MockedNativeLinkPreviewAction).toHaveBeenCalledWith(
      expect.objectContaining({
        label: 'Button Label',
        title: 'Menu Title',
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
            <StackToolbarMenu icon="ellipsis.circle">
              <div>Invalid Child</div>
            </StackToolbarMenu>
          </ToolbarPlacementContext.Provider>
        );
      }).toThrow(
        'Stack.Toolbar.Menu only accepts Stack.Toolbar.Menu, Stack.Toolbar.MenuAction, Stack.Toolbar.Label, Stack.Toolbar.Icon, and Stack.Toolbar.Badge as its children.'
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
          <StackToolbarMenu icon="ellipsis.circle">
            <StackToolbarBadge>3</StackToolbarBadge>
            <StackToolbarMenuAction onPress={() => {}}>Action</StackToolbarMenuAction>
          </StackToolbarMenu>
        </ToolbarPlacementContext.Provider>
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        'Stack.Toolbar.Badge is not supported in bottom toolbar (iOS limitation). The badge will be ignored.'
      );
    });
  });
});

describe('StackToolbarMenuAction component', () => {
  it.each(['left', 'right', undefined, 'xyz'] as const)(
    'throws error when not in bottom placement (placement=%s)',
    (placement) => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => {
        render(
          // Intentionally passing invalid placement as well
          <ToolbarPlacementContext.Provider value={placement as ToolbarPlacement}>
            <StackToolbarMenuAction onPress={() => {}}>Action</StackToolbarMenuAction>
          </ToolbarPlacementContext.Provider>
        );
      }).toThrow('Stack.Toolbar.MenuAction must be used inside a Stack.Toolbar.Menu');
      jest.restoreAllMocks();
    }
  );

  it('renders LinkMenuAction in bottom placement', () => {
    render(
      <ToolbarPlacementContext.Provider value="bottom">
        <StackToolbarMenuAction onPress={() => {}}>Action</StackToolbarMenuAction>
      </ToolbarPlacementContext.Provider>
    );

    expect(screen.getByTestId('LinkMenuAction')).toBeVisible();
  });
});
