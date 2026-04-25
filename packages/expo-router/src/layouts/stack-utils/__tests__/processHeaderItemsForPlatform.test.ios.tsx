import { Text } from 'react-native';

import { StackToolbarButton } from '../toolbar/StackToolbarButton';
import { StackToolbarMenu, StackToolbarMenuAction } from '../toolbar/StackToolbarMenu';
import { StackToolbarSpacer } from '../toolbar/StackToolbarSpacer';
import { processHeaderItemsForPlatform } from '../toolbar/processHeaderItemsForPlatform';

jest.mock('../../../toolbar/native', () => {
  const { View }: typeof import('react-native') = jest.requireActual('react-native');
  return {
    RouterToolbarHost: jest.fn(({ children }) => (
      <View testID="RouterToolbarHost">{children}</View>
    )),
    RouterToolbarItem: jest.fn((props) => <View testID="RouterToolbarItem" {...props} />),
  };
});

const headerItemProps = { canGoBack: false };

beforeEach(() => {
  jest.clearAllMocks();
});

describe('processHeaderItemsForPlatform (iOS)', () => {
  it('returns null for bottom placement', () => {
    const result = processHeaderItemsForPlatform(<></>, 'bottom');
    expect(result).toBeNull();
  });

  it('returns unstable_headerLeftItems for left placement', () => {
    const result = processHeaderItemsForPlatform(
      <StackToolbarButton icon="sidebar.left" />,
      'left'
    );
    expect(result).not.toBeNull();
    expect(result).toHaveProperty('headerShown', true);
    expect(result).toHaveProperty('unstable_headerLeftItems');
    expect(result?.unstable_headerLeftItems).toBeDefined();
    expect(result).not.toHaveProperty('unstable_headerRightItems');
    expect(result).not.toHaveProperty('headerLeft');
    expect(result).not.toHaveProperty('headerRight');
  });

  it('returns unstable_headerRightItems for right placement', () => {
    const result = processHeaderItemsForPlatform(
      <StackToolbarButton icon="ellipsis.circle" />,
      'right'
    );
    expect(result).not.toBeNull();
    expect(result).toHaveProperty('headerShown', true);
    expect(result).toHaveProperty('unstable_headerRightItems');
    expect(result?.unstable_headerRightItems).toBeDefined();
    expect(result).not.toHaveProperty('unstable_headerLeftItems');
    expect(result).not.toHaveProperty('headerLeft');
    expect(result).not.toHaveProperty('headerRight');
  });

  it('unstable_headerLeftItems() returns button items with correct structure', () => {
    const result = processHeaderItemsForPlatform(
      <StackToolbarButton icon="sidebar.left" />,
      'left'
    )!;

    const items = result.unstable_headerLeftItems!(headerItemProps);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      type: 'button',
      icon: { type: 'sfSymbol', name: 'sidebar.left' },
    });
  });

  it('unstable_headerRightItems() returns button items with correct structure', () => {
    const result = processHeaderItemsForPlatform(<StackToolbarButton icon="gear" />, 'right')!;

    const items = result.unstable_headerRightItems!(headerItemProps);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      type: 'button',
      icon: { type: 'sfSymbol', name: 'gear' },
    });
  });

  it('converts multiple children to multiple items', () => {
    const result = processHeaderItemsForPlatform(
      [
        <StackToolbarButton key="1" icon="star" />,
        <StackToolbarSpacer key="2" width={16} />,
        <StackToolbarButton key="3" icon="heart" />,
      ],
      'right'
    )!;

    const items = result.unstable_headerRightItems!(headerItemProps);
    expect(items).toHaveLength(3);
    expect(items[0]).toMatchObject({ type: 'button', icon: { type: 'sfSymbol', name: 'star' } });
    expect(items[1]).toMatchObject({ type: 'spacing' });
    expect(items[2]).toMatchObject({ type: 'button', icon: { type: 'sfSymbol', name: 'heart' } });
  });

  it('converts menu children to menu items', () => {
    const result = processHeaderItemsForPlatform(
      <StackToolbarMenu icon="ellipsis.circle">
        <StackToolbarMenuAction onPress={() => {}}>Action 1</StackToolbarMenuAction>
      </StackToolbarMenu>,
      'right'
    )!;

    const items = result.unstable_headerRightItems!(headerItemProps);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ type: 'menu' });
  });

  describe('invalid children warning', () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('warns about invalid children', () => {
      processHeaderItemsForPlatform(
        <>
          <Text>Invalid</Text>
          <StackToolbarButton icon="star" />
        </>,
        'left'
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Stack.Toolbar with placement="left" only accepts')
      );
    });

    it('does not warn when all children are valid', () => {
      processHeaderItemsForPlatform(
        [<StackToolbarButton key="1" icon="star" />, <StackToolbarSpacer key="2" />],
        'right'
      );

      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });
});
