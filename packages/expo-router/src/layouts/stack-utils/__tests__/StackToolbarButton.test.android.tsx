import { render } from '@testing-library/react-native';

import { NativeToolbarButton } from '../toolbar/StackToolbarButton/native';
import type { NativeToolbarButtonProps } from '../toolbar/StackToolbarButton/types';
import { ToolbarColorContext, type ToolbarColors } from '../toolbar/context';

jest.mock('@expo/ui/jetpack-compose', () => {
  const { Text, View }: typeof import('react-native') = jest.requireActual('react-native');
  return {
    IconButton: jest.fn((props) => <View testID="IconButton" {...props} />),
    Icon: jest.fn((props) => <View testID="Icon" {...props} />),
    Badge: jest.fn((props) => <View testID="Badge" {...props} />),
    Box: jest.fn((props) => <View testID="Box" {...props} />),
    Text: jest.fn((props) => <Text testID="ComposeText" {...props} />),
  };
});

jest.mock('@expo/ui/jetpack-compose/modifiers', () => ({
  alpha: jest.fn((value: number) => ({ type: 'alpha', alpha: value })),
}));

jest.mock('../../../color', () => ({
  Color: {
    android: {
      dynamic: {
        onSurface: 'dynamic:onSurface',
      },
    },
  },
}));

jest.mock('../../../toolbar/AnimatedItemContainer', () => {
  const { View }: typeof import('react-native') = jest.requireActual('react-native');
  return {
    AnimatedItemContainer: jest.fn((props) => <View testID="AnimatedItemContainer" {...props} />),
  };
});

const {
  IconButton,
  Icon,
  Badge,
  Box,
  Text: ComposeText,
} = jest.requireMock('@expo/ui/jetpack-compose') as typeof import('@expo/ui/jetpack-compose');
const MockedIconButton = IconButton as jest.MockedFunction<typeof IconButton>;
const MockedIcon = Icon as jest.MockedFunction<typeof Icon>;
const MockedBadge = Badge as jest.MockedFunction<typeof Badge>;
const MockedBox = Box as jest.MockedFunction<typeof Box>;
const MockedComposeText = ComposeText as jest.MockedFunction<typeof ComposeText>;

const { AnimatedItemContainer } = jest.requireMock(
  '../../../toolbar/AnimatedItemContainer'
) as typeof import('../../../toolbar/AnimatedItemContainer');
const MockedAnimatedItemContainer = AnimatedItemContainer as jest.MockedFunction<
  typeof AnimatedItemContainer
>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('NativeToolbarButton', () => {
  const defaultProps: NativeToolbarButtonProps = {
    source: { uri: 'test-icon' },
  };

  describe('tint color logic', () => {
    it('sets tint to null when imageRenderingMode is original', async () => {
      await render(<NativeToolbarButton {...defaultProps} imageRenderingMode="original" />);

      expect(MockedIcon.mock.calls[0]![0]).toMatchObject({
        tint: null,
      });
    });

    it('sets tint to null when imageRenderingMode is original even with tintColor prop', async () => {
      await render(
        <NativeToolbarButton {...defaultProps} imageRenderingMode="original" tintColor="red" />
      );

      expect(MockedIcon.mock.calls[0]![0]).toMatchObject({
        tint: null,
      });
    });

    it('uses provided tintColor when imageRenderingMode is template', async () => {
      await render(
        <NativeToolbarButton {...defaultProps} imageRenderingMode="template" tintColor="red" />
      );

      expect(MockedIcon.mock.calls[0]![0]).toMatchObject({
        tint: 'red',
      });
    });

    it('falls back to dynamic onSurface when imageRenderingMode is template and no tintColor', async () => {
      await render(<NativeToolbarButton {...defaultProps} imageRenderingMode="template" />);

      expect(MockedIcon.mock.calls[0]![0]).toMatchObject({
        tint: 'dynamic:onSurface',
      });
    });

    it('uses provided tintColor when imageRenderingMode is undefined', async () => {
      await render(<NativeToolbarButton {...defaultProps} tintColor="red" />);

      expect(MockedIcon.mock.calls[0]![0]).toMatchObject({
        tint: 'red',
      });
    });

    it('falls back to dynamic onSurface when both imageRenderingMode and tintColor are undefined', async () => {
      await render(<NativeToolbarButton {...defaultProps} />);

      expect(MockedIcon.mock.calls[0]![0]).toMatchObject({
        tint: 'dynamic:onSurface',
      });
    });
  });

  describe('toolbar color context', () => {
    function renderWithColors(props: NativeToolbarButtonProps, colors: ToolbarColors) {
      return render(
        <ToolbarColorContext.Provider value={colors}>
          <NativeToolbarButton {...props} />
        </ToolbarColorContext.Provider>
      );
    }

    it('uses context tintColor when no prop tintColor', async () => {
      await renderWithColors(defaultProps, { tintColor: 'context-tint' });

      expect(MockedIcon.mock.calls[0]![0]).toMatchObject({
        tint: 'context-tint',
      });
    });

    it('prop tintColor takes precedence over context tintColor', async () => {
      await renderWithColors(
        { ...defaultProps, tintColor: 'prop-tint' },
        { tintColor: 'context-tint' }
      );

      expect(MockedIcon.mock.calls[0]![0]).toMatchObject({
        tint: 'prop-tint',
      });
    });

    it('falls back to default when no prop or context tintColor', async () => {
      await renderWithColors(defaultProps, {});

      expect(MockedIcon.mock.calls[0]![0]).toMatchObject({
        tint: 'dynamic:onSurface',
      });
    });

    it('context tintColor ignored when imageRenderingMode is original', async () => {
      await renderWithColors(
        { ...defaultProps, imageRenderingMode: 'original' },
        { tintColor: 'context-tint' }
      );

      expect(MockedIcon.mock.calls[0]![0]).toMatchObject({
        tint: null,
      });
    });
  });

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

      const { toJSON } = await render(<NativeToolbarButton />);

      expect(toJSON()).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Stack.Toolbar.Button on Android requires an ImageSourcePropType')
      );
    });

    it('returns null without warning in production', async () => {
      process.env.NODE_ENV = 'production';

      const { toJSON } = await render(<NativeToolbarButton />);

      expect(toJSON()).toBeNull();
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('prop forwarding', () => {
    it.each([false, true, undefined])(
      'passes hidden %s as visible={!hidden} to AnimatedItemContainer',
      async (hidden) => {
        await render(<NativeToolbarButton {...defaultProps} hidden={hidden} />);

        expect(MockedAnimatedItemContainer.mock.calls[0]![0]).toMatchObject({
          visible: !hidden,
        });
      }
    );

    it.each([false, true, undefined])(
      'passes disabled %s as enabled={!disabled} to IconButton',
      async (disabled) => {
        await render(<NativeToolbarButton {...defaultProps} disabled={disabled} />);

        expect(MockedIconButton.mock.calls[0]![0]).toMatchObject({
          enabled: !disabled,
        });
      }
    );

    it('passes onPress as onClick to IconButton', async () => {
      const onPress = jest.fn();
      await render(<NativeToolbarButton {...defaultProps} onPress={onPress} />);

      expect(MockedIconButton.mock.calls[0]![0]).toMatchObject({
        onClick: onPress,
      });
    });

    it('passes source and size=24 to Icon', async () => {
      const source = { uri: 'my-icon' };
      await render(<NativeToolbarButton {...defaultProps} source={source} />);

      expect(MockedIcon.mock.calls[0]![0]).toMatchObject({
        source,
        size: 24,
      });
    });

    it('passes accessibilityLabel to Icon as contentDescription', async () => {
      await render(<NativeToolbarButton {...defaultProps} accessibilityLabel="Open settings" />);

      expect(MockedIcon.mock.calls[0]![0]).toMatchObject({
        contentDescription: 'Open settings',
      });
    });

    it('passes accessibilityLabel even when imageRenderingMode is original', async () => {
      await render(
        <NativeToolbarButton
          {...defaultProps}
          imageRenderingMode="original"
          accessibilityLabel="Open settings"
        />
      );

      expect(MockedIcon.mock.calls[0]![0]).toMatchObject({
        contentDescription: 'Open settings',
      });
    });

    it('omits contentDescription when accessibilityLabel is not provided', async () => {
      await render(<NativeToolbarButton {...defaultProps} />);

      expect(MockedIcon.mock.calls[0]![0]).toMatchObject({
        contentDescription: undefined,
      });
    });
  });

  describe('badge rendering', () => {
    it('renders Box with Badge and text when badge has a value', async () => {
      await render(<NativeToolbarButton {...defaultProps} badge={{ value: '3' }} />);

      expect(MockedBox).toHaveBeenCalled();
      expect(MockedBox.mock.calls[0]![0]).toMatchObject({
        contentAlignment: 'topEnd',
      });
      expect(MockedBadge).toHaveBeenCalled();
      expect(MockedComposeText).toHaveBeenCalled();
      expect(MockedComposeText.mock.calls[0]![0]).toMatchObject({
        children: '3',
      });
    });

    it('renders Badge without children when badge value is empty string (dot indicator)', async () => {
      await render(<NativeToolbarButton {...defaultProps} badge={{ value: '' }} />);

      expect(MockedBox).toHaveBeenCalled();
      expect(MockedBadge).toHaveBeenCalled();
      expect(MockedComposeText).not.toHaveBeenCalled();
    });

    it('passes containerColor from badge.style.backgroundColor', async () => {
      await render(
        <NativeToolbarButton
          {...defaultProps}
          badge={{ value: '5', style: { backgroundColor: 'red' } }}
        />
      );

      expect(MockedBadge.mock.calls[0]![0]).toMatchObject({
        containerColor: 'red',
      });
    });

    it('passes contentColor from badge.style.color', async () => {
      await render(
        <NativeToolbarButton {...defaultProps} badge={{ value: '5', style: { color: 'white' } }} />
      );

      expect(MockedBadge.mock.calls[0]![0]).toMatchObject({
        contentColor: 'white',
      });
    });

    it('does not render Box when badge prop is undefined', async () => {
      await render(<NativeToolbarButton {...defaultProps} />);

      expect(MockedBox).not.toHaveBeenCalled();
    });

    it('converts numeric badge value to string', async () => {
      await render(<NativeToolbarButton {...defaultProps} badge={{ value: 42 }} />);

      expect(MockedComposeText.mock.calls[0]![0]).toMatchObject({
        children: '42',
      });
    });

    it('AnimatedItemContainer visible works with badge present', async () => {
      await render(<NativeToolbarButton {...defaultProps} badge={{ value: '1' }} hidden />);

      expect(MockedAnimatedItemContainer.mock.calls[0]![0]).toMatchObject({
        visible: false,
      });
    });

    it('does not render badge text when value is null', async () => {
      await render(
        <NativeToolbarButton {...defaultProps} badge={{ value: null as unknown as string }} />
      );

      expect(MockedBox).toHaveBeenCalled();
      expect(MockedBadge).toHaveBeenCalled();
      expect(MockedComposeText).not.toHaveBeenCalled();
    });

    it('renders badge text "0" when value is 0', async () => {
      await render(<NativeToolbarButton {...defaultProps} badge={{ value: 0 }} />);

      expect(MockedComposeText).toHaveBeenCalled();
      expect(MockedComposeText.mock.calls[0]![0]).toMatchObject({
        children: '0',
      });
    });

    it('passes fontSize from badge.style to ComposeText', async () => {
      await render(
        <NativeToolbarButton {...defaultProps} badge={{ value: '1', style: { fontSize: 10 } }} />
      );

      expect(MockedComposeText.mock.calls[0]![0]).toMatchObject({
        style: expect.objectContaining({ fontSize: 10 }),
      });
    });

    it('passes fontFamily from badge.style to ComposeText', async () => {
      await render(
        <NativeToolbarButton
          {...defaultProps}
          badge={{ value: '1', style: { fontFamily: 'monospace' } }}
        />
      );

      expect(MockedComposeText.mock.calls[0]![0]).toMatchObject({
        style: expect.objectContaining({ fontFamily: 'monospace' }),
      });
    });

    it('passes supported fontWeight from badge.style to ComposeText', async () => {
      await render(
        <NativeToolbarButton
          {...defaultProps}
          badge={{ value: '1', style: { fontWeight: '700' } }}
        />
      );

      expect(MockedComposeText.mock.calls[0]![0]).toMatchObject({
        style: expect.objectContaining({ fontWeight: '700' }),
      });
    });

    it('warns and omits unsupported fontWeight values', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      await render(
        <NativeToolbarButton
          {...defaultProps}
          badge={{ value: '1', style: { fontWeight: 'semibold' } }}
        />
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unsupported fontWeight "semibold"')
      );
      expect(MockedComposeText.mock.calls[0]![0]).toMatchObject({
        style: expect.objectContaining({ fontWeight: undefined }),
      });
      consoleSpy.mockRestore();
    });

    it('applies alpha modifier to Badge when disabled with badge', async () => {
      await render(<NativeToolbarButton {...defaultProps} badge={{ value: '3' }} disabled />);

      expect(MockedBadge.mock.calls[0]![0]).toMatchObject({
        modifiers: [{ type: 'alpha', alpha: 0.38 }],
      });
    });

    it('does not apply alpha modifier to Badge when enabled with badge', async () => {
      await render(<NativeToolbarButton {...defaultProps} badge={{ value: '3' }} />);

      expect(MockedBadge.mock.calls[0]![0].modifiers).toBeUndefined();
    });
  });

  describe('accessibility with badge', () => {
    it('appends badge value to contentDescription', async () => {
      await render(
        <NativeToolbarButton
          {...defaultProps}
          accessibilityLabel="Notifications"
          badge={{ value: '3' }}
        />
      );

      expect(MockedIcon.mock.calls[0]![0]).toMatchObject({
        contentDescription: 'Notifications, 3',
      });
    });

    it('does not append badge value when badge has no value', async () => {
      await render(
        <NativeToolbarButton
          {...defaultProps}
          accessibilityLabel="Notifications"
          badge={{ value: '' }}
        />
      );

      expect(MockedIcon.mock.calls[0]![0]).toMatchObject({
        contentDescription: 'Notifications',
      });
    });

    it('does not set contentDescription when no accessibilityLabel', async () => {
      await render(<NativeToolbarButton {...defaultProps} badge={{ value: '3' }} />);

      expect(MockedIcon.mock.calls[0]![0].contentDescription).toBeUndefined();
    });
  });
});
