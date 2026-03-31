import { render } from '@testing-library/react-native';

import { NativeToolbarButton } from '../toolbar/StackToolbarButton/native';
import type { NativeToolbarButtonProps } from '../toolbar/StackToolbarButton/types';
import { ToolbarColorContext, type ToolbarColors } from '../toolbar/context';

jest.mock('@expo/ui/jetpack-compose', () => {
  const { View }: typeof import('react-native') = jest.requireActual('react-native');
  return {
    IconButton: jest.fn((props) => <View testID="IconButton" {...props} />),
    Icon: jest.fn((props) => <View testID="Icon" {...props} />),
  };
});

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

const { IconButton, Icon } = jest.requireMock(
  '@expo/ui/jetpack-compose'
) as typeof import('@expo/ui/jetpack-compose');
const MockedIconButton = IconButton as jest.MockedFunction<typeof IconButton>;
const MockedIcon = Icon as jest.MockedFunction<typeof Icon>;

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
    it('sets tintColor to undefined when imageRenderingMode is original', () => {
      render(<NativeToolbarButton {...defaultProps} imageRenderingMode="original" />);

      expect(MockedIcon.mock.calls[0][0]).toMatchObject({
        tintColor: undefined,
      });
    });

    it('sets tintColor to undefined when imageRenderingMode is original even with tintColor prop', () => {
      render(
        <NativeToolbarButton {...defaultProps} imageRenderingMode="original" tintColor="red" />
      );

      expect(MockedIcon.mock.calls[0][0]).toMatchObject({
        tintColor: undefined,
      });
    });

    it('uses provided tintColor when imageRenderingMode is template', () => {
      render(
        <NativeToolbarButton {...defaultProps} imageRenderingMode="template" tintColor="red" />
      );

      expect(MockedIcon.mock.calls[0][0]).toMatchObject({
        tintColor: 'red',
      });
    });

    it('falls back to dynamic onSurface when imageRenderingMode is template and no tintColor', () => {
      render(<NativeToolbarButton {...defaultProps} imageRenderingMode="template" />);

      expect(MockedIcon.mock.calls[0][0]).toMatchObject({
        tintColor: 'dynamic:onSurface',
      });
    });

    it('uses provided tintColor when imageRenderingMode is undefined', () => {
      render(<NativeToolbarButton {...defaultProps} tintColor="red" />);

      expect(MockedIcon.mock.calls[0][0]).toMatchObject({
        tintColor: 'red',
      });
    });

    it('falls back to dynamic onSurface when both imageRenderingMode and tintColor are undefined', () => {
      render(<NativeToolbarButton {...defaultProps} />);

      expect(MockedIcon.mock.calls[0][0]).toMatchObject({
        tintColor: 'dynamic:onSurface',
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

    it('uses context tintColor when no prop tintColor', () => {
      renderWithColors(defaultProps, { tintColor: 'context-tint' });

      expect(MockedIcon.mock.calls[0][0]).toMatchObject({
        tintColor: 'context-tint',
      });
    });

    it('prop tintColor takes precedence over context tintColor', () => {
      renderWithColors({ ...defaultProps, tintColor: 'prop-tint' }, { tintColor: 'context-tint' });

      expect(MockedIcon.mock.calls[0][0]).toMatchObject({
        tintColor: 'prop-tint',
      });
    });

    it('falls back to default when no prop or context tintColor', () => {
      renderWithColors(defaultProps, {});

      expect(MockedIcon.mock.calls[0][0]).toMatchObject({
        tintColor: 'dynamic:onSurface',
      });
    });

    it('context tintColor ignored when imageRenderingMode is original', () => {
      renderWithColors(
        { ...defaultProps, imageRenderingMode: 'original' },
        { tintColor: 'context-tint' }
      );

      expect(MockedIcon.mock.calls[0][0]).toMatchObject({
        tintColor: undefined,
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

    it('returns null and warns when source is missing in development', () => {
      process.env.NODE_ENV = 'development';

      const { toJSON } = render(<NativeToolbarButton />);

      expect(toJSON()).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Stack.Toolbar.Button on Android requires an ImageSourcePropType')
      );
    });

    it('returns null without warning in production', () => {
      process.env.NODE_ENV = 'production';

      const { toJSON } = render(<NativeToolbarButton />);

      expect(toJSON()).toBeNull();
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('prop forwarding', () => {
    it.each([false, true, undefined])(
      'passes hidden %s as visible={!hidden} to AnimatedItemContainer',
      (hidden) => {
        render(<NativeToolbarButton {...defaultProps} hidden={hidden} />);

        expect(MockedAnimatedItemContainer.mock.calls[0][0]).toMatchObject({
          visible: !hidden,
        });
      }
    );

    it.each([false, true, undefined])(
      'passes disabled %s as enabled={!disabled} to IconButton',
      (disabled) => {
        render(<NativeToolbarButton {...defaultProps} disabled={disabled} />);

        expect(MockedIconButton.mock.calls[0][0]).toMatchObject({
          enabled: !disabled,
        });
      }
    );

    it('passes onPress as onClick to IconButton', () => {
      const onPress = jest.fn();
      render(<NativeToolbarButton {...defaultProps} onPress={onPress} />);

      expect(MockedIconButton.mock.calls[0][0]).toMatchObject({
        onClick: onPress,
      });
    });

    it('passes source and size=24 to Icon', () => {
      const source = { uri: 'my-icon' };
      render(<NativeToolbarButton {...defaultProps} source={source} />);

      expect(MockedIcon.mock.calls[0][0]).toMatchObject({
        source,
        size: 24,
      });
    });
  });
});
