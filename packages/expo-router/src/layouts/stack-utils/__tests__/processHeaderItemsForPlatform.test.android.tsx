import { render, screen, within } from '@testing-library/react-native';
import React from 'react';

import { NativeMenuContext } from '../../../link/NativeMenuContext';
import { ToolbarColorContext, ToolbarPlacementContext } from '../toolbar/context';
import { processHeaderItemsForPlatform } from '../toolbar/processHeaderItemsForPlatform';

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
    Host: jest.fn((props) => <View testID="Host" {...props} />),
    Row: jest.fn((props) => <View testID="Row" {...props} />),
    DropdownMenu,
    DropdownMenuItem,
    Divider: jest.fn(() => <View testID="Divider" />),
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

const { Row } = jest.requireMock(
  '@expo/ui/jetpack-compose'
) as typeof import('@expo/ui/jetpack-compose');
const MockedRow = Row as jest.MockedFunction<typeof Row>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('processHeaderItemsForPlatform', () => {
  it('returns null for bottom placement', () => {
    const result = processHeaderItemsForPlatform(<></>, 'bottom');
    expect(result).toBeNull();
  });

  it('returns headerLeft for left placement', () => {
    const result = processHeaderItemsForPlatform(<></>, 'left');
    expect(result).not.toBeNull();
    expect(result).toHaveProperty('headerShown', true);
    expect(result).toHaveProperty('headerLeft');
    expect(result?.headerLeft).toBeDefined();
    expect(result).not.toHaveProperty('headerRight');
  });

  it('returns headerRight for right placement', () => {
    const result = processHeaderItemsForPlatform(<></>, 'right');
    expect(result).not.toBeNull();
    expect(result).toHaveProperty('headerShown', true);
    expect(result).toHaveProperty('headerRight');
    expect(result?.headerRight).toBeDefined();
    expect(result).not.toHaveProperty('headerLeft');
  });

  it('headerLeft renders Host > Row wrapper', () => {
    const result = processHeaderItemsForPlatform(<></>, 'left')!;
    const HeaderLeft = result.headerLeft!;
    render(<HeaderLeft canGoBack={false} />);

    const host = screen.getByTestId('Host');
    expect(host).toBeDefined();
    expect(host.props.matchContents).toBe(true);
    expect(within(host).getByTestId('Row')).toBeDefined();
  });

  it('headerRight renders Host > Row wrapper', () => {
    const result = processHeaderItemsForPlatform(<></>, 'right')!;
    const HeaderRight = result.headerRight!;
    render(<HeaderRight canGoBack={false} />);

    const host = screen.getByTestId('Host');
    expect(host).toBeDefined();
    expect(within(host).getByTestId('Row')).toBeDefined();
  });

  it('Row is rendered inside Host', () => {
    const result = processHeaderItemsForPlatform(<></>, 'left')!;
    const HeaderLeft = result.headerLeft!;
    render(<HeaderLeft canGoBack={false} />);

    expect(MockedRow).toHaveBeenCalled();
  });

  it('provides ToolbarPlacementContext with actual placement "left"', () => {
    let capturedPlacement: string | null = null;
    const PlacementCapture = () => {
      const placement = React.useContext(ToolbarPlacementContext);
      capturedPlacement = placement;
      return null;
    };

    const result = processHeaderItemsForPlatform(<PlacementCapture />, 'left')!;
    const HeaderLeft = result.headerLeft!;
    render(<HeaderLeft canGoBack={false} />);

    expect(capturedPlacement).toBe('left');
  });

  it('provides ToolbarPlacementContext with actual placement "right"', () => {
    let capturedPlacement: string | null = null;
    const PlacementCapture = () => {
      const placement = React.useContext(ToolbarPlacementContext);
      capturedPlacement = placement;
      return null;
    };

    const result = processHeaderItemsForPlatform(<PlacementCapture />, 'right')!;
    const HeaderRight = result.headerRight!;
    render(<HeaderRight canGoBack={false} />);

    expect(capturedPlacement).toBe('right');
  });

  it('provides NativeMenuContext with value true', () => {
    let capturedMenuContext: boolean | null = null;
    const MenuContextCapture = () => {
      const isNativeMenu = React.useContext(NativeMenuContext);
      capturedMenuContext = isNativeMenu;
      return null;
    };

    const result = processHeaderItemsForPlatform(<MenuContextCapture />, 'left')!;
    const HeaderLeft = result.headerLeft!;
    render(<HeaderLeft canGoBack={false} />);

    expect(capturedMenuContext).toBe(true);
  });

  it('renders menu children with DropdownMenu and IconButton trigger', () => {
    // Import the native components directly to test rendering inside the header
    const {
      NativeToolbarMenu,
      NativeToolbarMenuAction,
    } = require('../toolbar/StackToolbarMenu/native');

    const result = processHeaderItemsForPlatform(
      <NativeToolbarMenu source={{ uri: 'test-icon' }}>
        <NativeToolbarMenuAction onPress={() => {}}>Action</NativeToolbarMenuAction>
      </NativeToolbarMenu>,
      'right'
    )!;

    const HeaderRight = result.headerRight!;
    render(<HeaderRight canGoBack={false} />);

    expect(screen.getByTestId('DropdownMenu')).toBeDefined();
    expect(screen.getByTestId('IconButton')).toBeDefined();
  });

  it('renders button children with IconButton and Icon', () => {
    const { NativeToolbarButton } = require('../toolbar/StackToolbarButton/native');

    const result = processHeaderItemsForPlatform(
      <NativeToolbarButton source={{ uri: 'test-icon' }} onPress={() => {}} />,
      'left'
    )!;

    const HeaderLeft = result.headerLeft!;
    render(<HeaderLeft canGoBack={false} />);

    const AnimatedItemContainer = screen.getByTestId('AnimatedItemContainer');
    expect(AnimatedItemContainer).toBeDefined();
    expect(AnimatedItemContainer.props.visible).toBe(true);
    const IconButton = within(AnimatedItemContainer).getByTestId('IconButton');
    expect(IconButton).toBeDefined();
    const Icon = within(IconButton).getByTestId('Icon');
    expect(Icon).toBeDefined();
    expect(Icon.props.source).toEqual({ uri: 'test-icon' });
  });

  it('renders hidden items with AnimatedItemContainer visible={false}', () => {
    const { NativeToolbarButton } = require('../toolbar/StackToolbarButton/native');

    const result = processHeaderItemsForPlatform(
      <NativeToolbarButton source={{ uri: 'test-icon' }} onPress={() => {}} hidden />,
      'left'
    )!;

    const HeaderLeft = result.headerLeft!;
    render(<HeaderLeft canGoBack={false} />);

    expect(screen.getByTestId('AnimatedItemContainer').props.visible).toBe(false);
  });

  it('renders multiple children correctly inside wrapper', () => {
    const { NativeToolbarButton } = require('../toolbar/StackToolbarButton/native');

    const result = processHeaderItemsForPlatform(
      <>
        <NativeToolbarButton source={{ uri: 'icon-1' }} onPress={() => {}} />
        <NativeToolbarButton source={{ uri: 'icon-2' }} onPress={() => {}} />
      </>,
      'right'
    )!;

    const HeaderRight = result.headerRight!;
    render(<HeaderRight canGoBack={false} />);

    expect(screen.getAllByTestId('IconButton')).toHaveLength(2);
  });

  it('provides ToolbarColorContext with passed colors', () => {
    let capturedColors: { tintColor?: unknown; backgroundColor?: unknown } = {};
    const ColorCapture = () => {
      const colors = React.useContext(ToolbarColorContext);
      capturedColors = colors;
      return null;
    };

    const result = processHeaderItemsForPlatform(<ColorCapture />, 'left', {
      tintColor: 'red',
      backgroundColor: 'blue',
    })!;
    const HeaderLeft = result.headerLeft!;
    render(<HeaderLeft canGoBack={false} />);

    expect(capturedColors.tintColor).toBe('red');
    expect(capturedColors.backgroundColor).toBe('blue');
  });

  it('provides empty ToolbarColorContext when no colors passed', () => {
    let capturedColors: { tintColor?: unknown; backgroundColor?: unknown } = {
      tintColor: 'sentinel',
    };
    const ColorCapture = () => {
      const colors = React.useContext(ToolbarColorContext);
      capturedColors = colors;
      return null;
    };

    const result = processHeaderItemsForPlatform(<ColorCapture />, 'right')!;
    const HeaderRight = result.headerRight!;
    render(<HeaderRight canGoBack={false} />);

    expect(capturedColors.tintColor).toBeUndefined();
    expect(capturedColors.backgroundColor).toBeUndefined();
  });

  it('button uses context tintColor when no prop tintColor is set', () => {
    const { NativeToolbarButton } = require('../toolbar/StackToolbarButton/native');
    const { Icon } = jest.requireMock(
      '@expo/ui/jetpack-compose'
    ) as typeof import('@expo/ui/jetpack-compose');
    const MockedIcon = Icon as jest.MockedFunction<typeof Icon>;

    const result = processHeaderItemsForPlatform(
      <NativeToolbarButton source={{ uri: 'test-icon' }} onPress={() => {}} />,
      'left',
      { tintColor: 'custom-tint' }
    )!;

    const HeaderLeft = result.headerLeft!;
    render(<HeaderLeft canGoBack={false} />);

    expect(MockedIcon).toHaveBeenCalledWith(
      expect.objectContaining({ tintColor: 'custom-tint' }),
      undefined
    );
  });

  it('button prop tintColor takes precedence over context tintColor', () => {
    const { NativeToolbarButton } = require('../toolbar/StackToolbarButton/native');
    const { Icon } = jest.requireMock(
      '@expo/ui/jetpack-compose'
    ) as typeof import('@expo/ui/jetpack-compose');
    const MockedIcon = Icon as jest.MockedFunction<typeof Icon>;

    const result = processHeaderItemsForPlatform(
      <NativeToolbarButton
        source={{ uri: 'test-icon' }}
        onPress={() => {}}
        tintColor="prop-tint"
      />,
      'left',
      { tintColor: 'context-tint' }
    )!;

    const HeaderLeft = result.headerLeft!;
    render(<HeaderLeft canGoBack={false} />);

    expect(MockedIcon).toHaveBeenCalledWith(
      expect.objectContaining({ tintColor: 'prop-tint' }),
      undefined
    );
  });

  it('button falls back to default tintColor when no prop or context', () => {
    const { NativeToolbarButton } = require('../toolbar/StackToolbarButton/native');
    const { Icon } = jest.requireMock(
      '@expo/ui/jetpack-compose'
    ) as typeof import('@expo/ui/jetpack-compose');
    const MockedIcon = Icon as jest.MockedFunction<typeof Icon>;

    const result = processHeaderItemsForPlatform(
      <NativeToolbarButton source={{ uri: 'test-icon' }} onPress={() => {}} />,
      'left'
    )!;

    const HeaderLeft = result.headerLeft!;
    render(<HeaderLeft canGoBack={false} />);

    expect(MockedIcon).toHaveBeenCalledWith(
      expect.objectContaining({ tintColor: 'dynamic:onSurface' }),
      undefined
    );
  });

  it('menu uses context backgroundColor for dropdown', () => {
    const { NativeToolbarMenu } = require('../toolbar/StackToolbarMenu/native');
    const { DropdownMenu } = jest.requireMock(
      '@expo/ui/jetpack-compose'
    ) as typeof import('@expo/ui/jetpack-compose');
    const MockedDropdownMenu = DropdownMenu as jest.MockedFunction<typeof DropdownMenu>;

    const result = processHeaderItemsForPlatform(
      <NativeToolbarMenu source={{ uri: 'test-icon' }}>
        <></>
      </NativeToolbarMenu>,
      'right',
      { backgroundColor: 'custom-bg' }
    )!;

    const HeaderRight = result.headerRight!;
    render(<HeaderRight canGoBack={false} />);

    expect(MockedDropdownMenu).toHaveBeenCalledWith(
      expect.objectContaining({ color: 'custom-bg' }),
      undefined
    );
  });

  it('menu uses context tintColor for icon', () => {
    const { NativeToolbarMenu } = require('../toolbar/StackToolbarMenu/native');
    const { Icon } = jest.requireMock(
      '@expo/ui/jetpack-compose'
    ) as typeof import('@expo/ui/jetpack-compose');
    const MockedIcon = Icon as jest.MockedFunction<typeof Icon>;

    const result = processHeaderItemsForPlatform(
      <NativeToolbarMenu source={{ uri: 'test-icon' }}>
        <></>
      </NativeToolbarMenu>,
      'right',
      { tintColor: 'custom-tint' }
    )!;

    const HeaderRight = result.headerRight!;
    render(<HeaderRight canGoBack={false} />);

    expect(MockedIcon).toHaveBeenCalledWith(
      expect.objectContaining({ tintColor: 'custom-tint' }),
      undefined
    );
  });
});
