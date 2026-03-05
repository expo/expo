import { render } from '@testing-library/react-native';
import React from 'react';

import {
  StackToolbarMenu,
  StackToolbarMenuAction,
  collectActions,
  collectSubmenus,
} from '../toolbar/StackToolbarMenu';
import { ToolbarPlacementContext, type ToolbarPlacement } from '../toolbar/context';
import {
  StackToolbarLabel,
  StackToolbarIcon,
  StackToolbarBadge,
} from '../toolbar/toolbar-primitives';

const mockUseMaterialIconSource = jest.fn(
  () => undefined as import('react-native').ImageSourcePropType | undefined
);

jest.mock('../../../utils/materialIcon', () => ({
  useMaterialIconSource: (...args: Parameters<typeof mockUseMaterialIconSource>) =>
    mockUseMaterialIconSource(...args),
}));

jest.mock('../../../toolbar/native', () => {
  const { View }: typeof import('react-native') = jest.requireActual('react-native');
  return {
    RouterToolbarMenu: jest.fn((props) => <View testID="RouterToolbarMenu" {...props} />),
  };
});

const { RouterToolbarMenu } = jest.requireMock(
  '../../../toolbar/native'
) as typeof import('../../../toolbar/native');
const MockedRouterToolbarMenu = RouterToolbarMenu as jest.MockedFunction<typeof RouterToolbarMenu>;

beforeEach(() => {
  jest.clearAllMocks();
  mockUseMaterialIconSource.mockReturnValue(undefined);
});

describe(collectActions, () => {
  it('collects actions with string children as labels', () => {
    const result = collectActions([
      <StackToolbarMenuAction key="1">Action 1</StackToolbarMenuAction>,
      <StackToolbarMenuAction key="2">Action 2</StackToolbarMenuAction>,
    ]);
    expect(result).toEqual([
      { label: 'Action 1', onPress: undefined, disabled: undefined, destructive: undefined },
      { label: 'Action 2', onPress: undefined, disabled: undefined, destructive: undefined },
    ]);
  });

  it('collects actions with StackToolbarLabel child as label', () => {
    const result = collectActions([
      <StackToolbarMenuAction key="1">
        <StackToolbarLabel>Label Text</StackToolbarLabel>
      </StackToolbarMenuAction>,
    ]);
    expect(result).toEqual([
      { label: 'Label Text', onPress: undefined, disabled: undefined, destructive: undefined },
    ]);
  });

  it('falls back to empty string when no label', () => {
    const result = collectActions([
      <StackToolbarMenuAction key="1">
        <StackToolbarIcon sfSymbol="star" />
      </StackToolbarMenuAction>,
    ]);
    expect(result).toEqual([
      { label: '', onPress: undefined, disabled: undefined, destructive: undefined },
    ]);
  });

  it('passes onPress, disabled, destructive props', () => {
    const onPress = jest.fn();
    const result = collectActions([
      <StackToolbarMenuAction key="1" onPress={onPress} disabled destructive>
        Action
      </StackToolbarMenuAction>,
    ]);
    expect(result).toEqual([{ label: 'Action', onPress, disabled: true, destructive: true }]);
  });

  it('filters out hidden actions', () => {
    const result = collectActions([
      <StackToolbarMenuAction key="1">Visible</StackToolbarMenuAction>,
      <StackToolbarMenuAction key="2" hidden>
        Hidden
      </StackToolbarMenuAction>,
      <StackToolbarMenuAction key="3">Also Visible</StackToolbarMenuAction>,
    ]);
    expect(result).toHaveLength(2);
    expect(result[0].label).toBe('Visible');
    expect(result[1].label).toBe('Also Visible');
  });

  it('ignores non-MenuAction children', () => {
    const result = collectActions([
      <StackToolbarMenuAction key="1">Action</StackToolbarMenuAction>,
      <StackToolbarMenu key="2" title="Submenu" />,
      <StackToolbarIcon key="3" sfSymbol="star" />,
      <StackToolbarLabel key="4">Label</StackToolbarLabel>,
      <StackToolbarBadge key="5">5</StackToolbarBadge>,
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe('Action');
  });
});

describe(collectSubmenus, () => {
  it('collects submenus with title as label', () => {
    const result = collectSubmenus([
      <StackToolbarMenu key="1" title="Submenu Title">
        <StackToolbarMenuAction key="a">Action</StackToolbarMenuAction>
      </StackToolbarMenu>,
    ]);
    expect(result).toEqual([
      {
        label: 'Submenu Title',
        actions: [
          { label: 'Action', onPress: undefined, disabled: undefined, destructive: undefined },
        ],
      },
    ]);
  });

  it('collects submenus with StackToolbarLabel child as label', () => {
    const result = collectSubmenus([
      <StackToolbarMenu key="1">
        <StackToolbarLabel>Custom Label</StackToolbarLabel>
        <StackToolbarMenuAction key="a">Action</StackToolbarMenuAction>
      </StackToolbarMenu>,
    ]);
    expect(result).toEqual([
      {
        label: 'Custom Label',
        actions: [
          { label: 'Action', onPress: undefined, disabled: undefined, destructive: undefined },
        ],
      },
    ]);
  });

  it('collects actions within submenus', () => {
    const onPress1 = jest.fn();
    const onPress2 = jest.fn();
    const result = collectSubmenus([
      <StackToolbarMenu key="1" title="Menu">
        <StackToolbarMenuAction key="a" onPress={onPress1}>
          First
        </StackToolbarMenuAction>
        <StackToolbarMenuAction key="b" onPress={onPress2} destructive>
          Second
        </StackToolbarMenuAction>
      </StackToolbarMenu>,
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].actions).toEqual([
      { label: 'First', onPress: onPress1, disabled: undefined, destructive: undefined },
      { label: 'Second', onPress: onPress2, disabled: undefined, destructive: true },
    ]);
  });

  it('recursively collects nested submenus', () => {
    const result = collectSubmenus([
      <StackToolbarMenu key="1" title="Outer">
        <StackToolbarMenuAction key="a">Outer Action</StackToolbarMenuAction>
        <StackToolbarMenu key="inner" title="Inner">
          <StackToolbarMenuAction key="b">Inner Action</StackToolbarMenuAction>
        </StackToolbarMenu>
      </StackToolbarMenu>,
    ]);
    expect(result).toEqual([
      {
        label: 'Outer',
        actions: [
          {
            label: 'Outer Action',
            onPress: undefined,
            disabled: undefined,
            destructive: undefined,
          },
        ],
        submenus: [
          {
            label: 'Inner',
            actions: [
              {
                label: 'Inner Action',
                onPress: undefined,
                disabled: undefined,
                destructive: undefined,
              },
            ],
          },
        ],
      },
    ]);
  });

  it('omits submenus key when no nested submenus exist', () => {
    const result = collectSubmenus([
      <StackToolbarMenu key="1" title="Flat">
        <StackToolbarMenuAction key="a">Action</StackToolbarMenuAction>
      </StackToolbarMenu>,
    ]);
    expect(result[0]).not.toHaveProperty('submenus');
  });

  it('handles deeply nested structure (3 levels)', () => {
    const result = collectSubmenus([
      <StackToolbarMenu key="1" title="Level 1">
        <StackToolbarMenuAction key="a">L1 Action</StackToolbarMenuAction>
        <StackToolbarMenu key="2" title="Level 2">
          <StackToolbarMenuAction key="b">L2 Action</StackToolbarMenuAction>
          <StackToolbarMenu key="3" title="Level 3">
            <StackToolbarMenuAction key="c">L3 Action</StackToolbarMenuAction>
          </StackToolbarMenu>
        </StackToolbarMenu>
      </StackToolbarMenu>,
    ]);
    expect(result[0].label).toBe('Level 1');
    expect(result[0].submenus).toHaveLength(1);
    expect(result[0].submenus![0].label).toBe('Level 2');
    expect(result[0].submenus![0].submenus).toHaveLength(1);
    expect(result[0].submenus![0].submenus![0].label).toBe('Level 3');
    expect(result[0].submenus![0].submenus![0].actions).toEqual([
      { label: 'L3 Action', onPress: undefined, disabled: undefined, destructive: undefined },
    ]);
    // Level 3 has no nested submenus
    expect(result[0].submenus![0].submenus![0]).not.toHaveProperty('submenus');
  });

  it('handles mix of actions and submenus at the same level', () => {
    const result = collectSubmenus([
      <StackToolbarMenuAction key="action1">Top Action</StackToolbarMenuAction>,
      <StackToolbarMenu key="sub1" title="Sub 1">
        <StackToolbarMenuAction key="a">Sub1 Action</StackToolbarMenuAction>
      </StackToolbarMenu>,
      <StackToolbarMenu key="sub2" title="Sub 2">
        <StackToolbarMenuAction key="b">Sub2 Action</StackToolbarMenuAction>
      </StackToolbarMenu>,
      <StackToolbarIcon key="icon" sfSymbol="star" />,
    ]);
    // collectSubmenus only collects StackToolbarMenu children, ignoring actions and other elements
    expect(result).toHaveLength(2);
    expect(result[0].label).toBe('Sub 1');
    expect(result[1].label).toBe('Sub 2');
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

  it('passes actions and submenus to RouterToolbarMenu', () => {
    const onPress = jest.fn();
    render(
      <ToolbarPlacementContext.Provider value="bottom">
        <StackToolbarMenu>
          <StackToolbarMenuAction onPress={onPress}>Action 1</StackToolbarMenuAction>
          <StackToolbarMenuAction>Action 2</StackToolbarMenuAction>
        </StackToolbarMenu>
      </ToolbarPlacementContext.Provider>
    );

    expect(MockedRouterToolbarMenu).toHaveBeenCalledWith(
      expect.objectContaining({
        actions: [
          { label: 'Action 1', onPress, disabled: undefined, destructive: undefined },
          { label: 'Action 2', onPress: undefined, disabled: undefined, destructive: undefined },
        ],
        submenus: [],
      }),
      undefined
    );
  });

  it('passes nested submenus to RouterToolbarMenu', () => {
    render(
      <ToolbarPlacementContext.Provider value="bottom">
        <StackToolbarMenu>
          <StackToolbarMenu title="Sub">
            <StackToolbarMenuAction>Inner Action</StackToolbarMenuAction>
          </StackToolbarMenu>
        </StackToolbarMenu>
      </ToolbarPlacementContext.Provider>
    );

    expect(MockedRouterToolbarMenu).toHaveBeenCalledWith(
      expect.objectContaining({
        actions: [],
        submenus: [
          {
            label: 'Sub',
            actions: [
              {
                label: 'Inner Action',
                onPress: undefined,
                disabled: undefined,
                destructive: undefined,
              },
            ],
          },
        ],
      }),
      undefined
    );
  });

  it('passes source from Icon child src prop', () => {
    const imageSource = { uri: 'https://example.com/icon.png' };
    render(
      <ToolbarPlacementContext.Provider value="bottom">
        <StackToolbarMenu>
          <StackToolbarIcon src={imageSource} />
        </StackToolbarMenu>
      </ToolbarPlacementContext.Provider>
    );

    expect(MockedRouterToolbarMenu).toHaveBeenCalledWith(
      expect.objectContaining({
        source: imageSource,
      }),
      undefined
    );
  });

  it('passes source from icon prop (ImageSourcePropType)', () => {
    const imageSource = { uri: 'https://example.com/icon.png' };
    render(
      <ToolbarPlacementContext.Provider value="bottom">
        <StackToolbarMenu icon={imageSource} />
      </ToolbarPlacementContext.Provider>
    );

    expect(MockedRouterToolbarMenu).toHaveBeenCalledWith(
      expect.objectContaining({
        source: imageSource,
      }),
      undefined
    );
  });

  it('explicit source takes priority over material source', () => {
    const explicitSource = { uri: 'https://example.com/explicit.png' };
    const materialSource = { uri: 'resolved-material-icon' };
    mockUseMaterialIconSource.mockReturnValue(materialSource);

    render(
      <ToolbarPlacementContext.Provider value="bottom">
        <StackToolbarMenu icon={explicitSource} md="search" />
      </ToolbarPlacementContext.Provider>
    );

    const props = MockedRouterToolbarMenu.mock.calls[0][0];
    expect(props.source).toBe(explicitSource);
    // The mdIconName prop is still passed to RouterToolbarMenu even if the resolved source is not used
    expect(props.mdIconName).toBe('search');
  });

  it('passes md icon name from md prop', () => {
    render(
      <ToolbarPlacementContext.Provider value="bottom">
        <StackToolbarMenu md="search" />
      </ToolbarPlacementContext.Provider>
    );

    expect(mockUseMaterialIconSource).toHaveBeenCalledWith('search');
    expect(MockedRouterToolbarMenu).toHaveBeenCalledWith(
      expect.objectContaining({
        mdIconName: 'search',
      }),
      undefined
    );
  });

  it('passes md icon name from Icon child', () => {
    render(
      <ToolbarPlacementContext.Provider value="bottom">
        <StackToolbarMenu>
          <StackToolbarIcon md="search" />
        </StackToolbarMenu>
      </ToolbarPlacementContext.Provider>
    );

    expect(mockUseMaterialIconSource).toHaveBeenCalledWith('search');
    expect(MockedRouterToolbarMenu).toHaveBeenCalledWith(
      expect.objectContaining({
        mdIconName: 'search',
      }),
      undefined
    );
  });

  it('passes tintColor, disabled, hidden props', () => {
    render(
      <ToolbarPlacementContext.Provider value="bottom">
        <StackToolbarMenu tintColor="red" disabled hidden />
      </ToolbarPlacementContext.Provider>
    );

    expect(MockedRouterToolbarMenu).toHaveBeenCalledWith(
      expect.objectContaining({
        tintColor: 'red',
        disabled: true,
        hidden: true,
      }),
      undefined
    );
  });
});
