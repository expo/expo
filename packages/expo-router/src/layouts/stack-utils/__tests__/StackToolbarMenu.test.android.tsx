import { render, screen } from '@testing-library/react-native';

import { StackToolbarMenu, StackToolbarMenuAction } from '../toolbar/StackToolbarMenu';
import { ToolbarPlacementContext } from '../toolbar/context';
import { StackToolbarIcon, StackToolbarLabel } from '../toolbar/toolbar-primitives';

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

const { RouterToolbarMenu: MockedRouterToolbarMenuRaw, RouterToolbarMenuItem } = jest.requireMock(
  '../../../toolbar/native'
) as typeof import('../../../toolbar/native');
const MockedRouterToolbarMenu = MockedRouterToolbarMenuRaw as jest.MockedFunction<
  typeof MockedRouterToolbarMenuRaw
>;
const MockedRouterToolbarMenuItem = RouterToolbarMenuItem as jest.MockedFunction<
  typeof RouterToolbarMenuItem
>;

const { useMaterialIconSource } = jest.requireMock(
  '../../../utils/materialIcon'
) as typeof import('../../../utils/materialIcon');
const MockedUseMaterialIconSource = useMaterialIconSource as jest.MockedFunction<
  typeof useMaterialIconSource
>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('StackToolbarMenu on Android', () => {
  it('renders RouterToolbarMenu instead of null', () => {
    render(
      <ToolbarPlacementContext.Provider value="bottom">
        <StackToolbarMenu icon="ellipsis.circle">
          <StackToolbarMenuAction onPress={() => {}}>Action 1</StackToolbarMenuAction>
        </StackToolbarMenu>
      </ToolbarPlacementContext.Provider>
    );

    expect(screen.getByTestId('RouterToolbarMenu')).toBeTruthy();
    expect(MockedRouterToolbarMenu).toHaveBeenCalled();
  });

  it('renders RouterToolbarMenuItem for each MenuAction child', () => {
    render(
      <ToolbarPlacementContext.Provider value="bottom">
        <StackToolbarMenu icon="ellipsis.circle">
          <StackToolbarMenuAction onPress={() => {}}>Action 1</StackToolbarMenuAction>
          <StackToolbarMenuAction onPress={() => {}}>Action 2</StackToolbarMenuAction>
        </StackToolbarMenu>
      </ToolbarPlacementContext.Provider>
    );

    expect(MockedRouterToolbarMenuItem).toHaveBeenCalledTimes(2);
    expect(MockedRouterToolbarMenuItem.mock.calls[0][0]).toMatchObject({ label: 'Action 1' });
    // [1] second MenuAction child
    expect(MockedRouterToolbarMenuItem.mock.calls[1][0]).toMatchObject({ label: 'Action 2' });
  });

  it('passes disabled, hidden, isOn on actions', () => {
    const onPress = jest.fn();
    render(
      <ToolbarPlacementContext.Provider value="bottom">
        <StackToolbarMenu icon="ellipsis.circle">
          <StackToolbarMenuAction onPress={onPress} disabled isOn>
            Action 1
          </StackToolbarMenuAction>
          <StackToolbarMenuAction onPress={() => {}} hidden>
            Action 2
          </StackToolbarMenuAction>
        </StackToolbarMenu>
      </ToolbarPlacementContext.Provider>
    );

    expect(MockedRouterToolbarMenuItem.mock.calls[0][0]).toMatchObject({
      label: 'Action 1',
      enabled: false,
      isOn: true,
      onPress,
    });
    // [1] second MenuAction child
    expect(MockedRouterToolbarMenuItem.mock.calls[1][0]).toMatchObject({
      label: 'Action 2',
      hidden: true,
    });
  });

  it('renders nested StackToolbarMenu as nested RouterToolbarMenu', () => {
    render(
      <ToolbarPlacementContext.Provider value="bottom">
        <StackToolbarMenu icon="ellipsis.circle">
          <StackToolbarMenu title="Submenu">
            <StackToolbarMenuAction onPress={() => {}}>Sub Action</StackToolbarMenuAction>
          </StackToolbarMenu>
        </StackToolbarMenu>
      </ToolbarPlacementContext.Provider>
    );

    // Root + nested = 2 calls
    expect(MockedRouterToolbarMenu).toHaveBeenCalledTimes(2);
    // [1] nested RouterToolbarMenu
    expect(MockedRouterToolbarMenu.mock.calls[1][0]).toMatchObject({
      label: 'Submenu',
    });
  });

  it('passes inline flag on nested submenus', () => {
    render(
      <ToolbarPlacementContext.Provider value="bottom">
        <StackToolbarMenu icon="ellipsis.circle">
          <StackToolbarMenu title="Inline" inline>
            <StackToolbarMenuAction onPress={() => {}}>Action</StackToolbarMenuAction>
          </StackToolbarMenu>
        </StackToolbarMenu>
      </ToolbarPlacementContext.Provider>
    );

    // [1] nested RouterToolbarMenu
    expect(MockedRouterToolbarMenu.mock.calls[1][0]).toMatchObject({
      label: 'Inline',
      inline: true,
    });
  });

  it('returns null when hidden', () => {
    render(
      <ToolbarPlacementContext.Provider value="bottom">
        <StackToolbarMenu icon="ellipsis.circle" hidden>
          <StackToolbarMenuAction onPress={() => {}}>Action</StackToolbarMenuAction>
        </StackToolbarMenu>
      </ToolbarPlacementContext.Provider>
    );

    expect(MockedRouterToolbarMenu).not.toHaveBeenCalled();
  });

  it('extracts trigger icon from ImageSourcePropType', () => {
    const imageSource = { uri: 'https://example.com/icon.png' };
    render(
      <ToolbarPlacementContext.Provider value="bottom">
        <StackToolbarMenu icon={imageSource}>
          <StackToolbarMenuAction onPress={() => {}}>Action</StackToolbarMenuAction>
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

  it('extracts md icon from Icon child', () => {
    render(
      <ToolbarPlacementContext.Provider value="bottom">
        <StackToolbarMenu>
          <StackToolbarIcon md="more_vert" />
          <StackToolbarMenuAction onPress={() => {}}>Action</StackToolbarMenuAction>
        </StackToolbarMenu>
      </ToolbarPlacementContext.Provider>
    );

    expect(MockedRouterToolbarMenu).toHaveBeenCalledWith(
      expect.objectContaining({
        mdIconName: 'more_vert',
      }),
      undefined
    );
  });

  it('passes mdIconName so native component resolves icon internally', () => {
    render(
      <ToolbarPlacementContext.Provider value="bottom">
        <StackToolbarMenu>
          <StackToolbarIcon md="more_vert" />
          <StackToolbarMenuAction onPress={() => {}}>Action</StackToolbarMenuAction>
        </StackToolbarMenu>
      </ToolbarPlacementContext.Provider>
    );

    expect(MockedRouterToolbarMenu).toHaveBeenCalledWith(
      expect.objectContaining({
        mdIconName: 'more_vert',
      }),
      undefined
    );
  });

  it('explicit image source takes priority over resolved material icon', () => {
    const imageSource = { uri: 'https://example.com/icon.png' };
    const materialSource = { uri: 'material://more_vert' };
    MockedUseMaterialIconSource.mockReturnValue(materialSource);

    render(
      <ToolbarPlacementContext.Provider value="bottom">
        <StackToolbarMenu icon={imageSource}>
          <StackToolbarIcon md="more_vert" />
          <StackToolbarMenuAction onPress={() => {}}>Action</StackToolbarMenuAction>
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

  it('passes tintColor through', () => {
    render(
      <ToolbarPlacementContext.Provider value="bottom">
        <StackToolbarMenu icon={{ uri: 'icon.png' }} tintColor="red">
          <StackToolbarMenuAction onPress={() => {}}>Action</StackToolbarMenuAction>
        </StackToolbarMenu>
      </ToolbarPlacementContext.Provider>
    );

    expect(MockedRouterToolbarMenu).toHaveBeenCalledWith(
      expect.objectContaining({
        tintColor: 'red',
      }),
      undefined
    );
  });

  it('passes disabled through', () => {
    render(
      <ToolbarPlacementContext.Provider value="bottom">
        <StackToolbarMenu icon={{ uri: 'icon.png' }} disabled>
          <StackToolbarMenuAction onPress={() => {}}>Action</StackToolbarMenuAction>
        </StackToolbarMenu>
      </ToolbarPlacementContext.Provider>
    );

    expect(MockedRouterToolbarMenu).toHaveBeenCalledWith(
      expect.objectContaining({
        disabled: true,
      }),
      undefined
    );
  });

  it('extracts image source from MenuAction icon prop', () => {
    const actionIcon = { uri: 'https://example.com/action-icon.png' };
    render(
      <ToolbarPlacementContext.Provider value="bottom">
        <StackToolbarMenu icon={{ uri: 'trigger.png' }}>
          <StackToolbarMenuAction onPress={() => {}} icon={actionIcon}>
            Action
          </StackToolbarMenuAction>
        </StackToolbarMenu>
      </ToolbarPlacementContext.Provider>
    );

    expect(MockedRouterToolbarMenuItem).toHaveBeenCalledWith(
      expect.objectContaining({
        label: 'Action',
        leadingIconSource: actionIcon,
      }),
      undefined
    );
  });

  it('extracts md icon name from MenuAction md prop', () => {
    render(
      <ToolbarPlacementContext.Provider value="bottom">
        <StackToolbarMenu icon={{ uri: 'trigger.png' }}>
          <StackToolbarMenuAction onPress={() => {}} md="star">
            Action
          </StackToolbarMenuAction>
        </StackToolbarMenu>
      </ToolbarPlacementContext.Provider>
    );

    expect(MockedRouterToolbarMenuItem).toHaveBeenCalledWith(
      expect.objectContaining({
        label: 'Action',
        leadingMdIconName: 'star',
      }),
      undefined
    );
  });

  it('extracts label from Label child in MenuAction', () => {
    render(
      <ToolbarPlacementContext.Provider value="bottom">
        <StackToolbarMenu icon={{ uri: 'trigger.png' }}>
          <StackToolbarMenuAction onPress={() => {}}>
            <StackToolbarLabel>Custom Label</StackToolbarLabel>
          </StackToolbarMenuAction>
        </StackToolbarMenu>
      </ToolbarPlacementContext.Provider>
    );

    expect(MockedRouterToolbarMenuItem).toHaveBeenCalledWith(
      expect.objectContaining({
        label: 'Custom Label',
      }),
      undefined
    );
  });
});
