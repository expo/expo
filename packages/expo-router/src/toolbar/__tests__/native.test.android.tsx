import { width } from '@expo/ui/jetpack-compose/modifiers';
import { render, screen } from '@testing-library/react-native';

import { RouterToolbarHost, RouterToolbarItem } from '../native';

jest.mock('react-native-safe-area-context', () => ({
  ...jest.requireActual('react-native-safe-area-context'),
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock('@expo/ui/jetpack-compose', () => {
  const { View }: typeof import('react-native') = jest.requireActual('react-native');
  return {
    Host: jest.fn(({ children, ...props }) => (
      <View testID="Host" {...props}>
        {children}
      </View>
    )),
    HorizontalFloatingToolbar: jest.fn(({ children, ...props }) => (
      <View testID="HorizontalFloatingToolbar" {...props}>
        {children}
      </View>
    )),
    IconButton: jest.fn(({ children, ...props }) => (
      <View testID="IconButton" {...props}>
        {children}
      </View>
    )),
    Icon: jest.fn((props) => <View testID="Icon" {...props} />),
    AnimatedVisibility: jest.fn(({ children, ...props }) => (
      <View testID="AnimatedVisibility" {...props}>
        {children}
      </View>
    )),
    Box: jest.fn(({ children, ...props }) => (
      <View testID="Box" {...props}>
        {children}
      </View>
    )),
    EnterTransition: {
      scaleIn: () => ({ plus: () => ({}) }),
      expandIn: () => ({}),
    },
    ExitTransition: {
      scaleOut: () => ({ plus: () => ({}) }),
      shrinkOut: () => ({}),
    },
    RNHostView: jest.fn(({ children, ...props }) => (
      <View testID="RNHostView" {...props}>
        {children}
      </View>
    )),
  };
});

const { Host, IconButton, Icon, AnimatedVisibility, RNHostView, Box } = jest.requireMock(
  '@expo/ui/jetpack-compose'
) as typeof import('@expo/ui/jetpack-compose');
const MockedHost = Host as jest.MockedFunction<typeof Host>;
const MockedIconButton = IconButton as jest.MockedFunction<typeof IconButton>;
const MockedIcon = Icon as jest.MockedFunction<typeof Icon>;
const MockedAnimatedVisibility = AnimatedVisibility as jest.MockedFunction<
  typeof AnimatedVisibility
>;
const MockedRNHostView = RNHostView as jest.MockedFunction<typeof RNHostView>;
const MockedBox = Box as jest.MockedFunction<typeof Box>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('RouterToolbarHost', () => {
  it('renders Host and HorizontalFloatingToolbar', () => {
    render(<RouterToolbarHost>content</RouterToolbarHost>);

    expect(screen.getByTestId('Host')).toBeVisible();
    expect(screen.getByTestId('HorizontalFloatingToolbar')).toBeVisible();
    expect(MockedHost).toHaveBeenCalledWith(
      expect.objectContaining({ matchContents: true }),
      undefined
    );
  });

  it('renders children inside HorizontalFloatingToolbar', () => {
    const { getByTestId } = render(
      <RouterToolbarHost>
        <RouterToolbarItem identifier="test" source={{ uri: 'test.png' }} />
      </RouterToolbarHost>
    );

    expect(getByTestId('HorizontalFloatingToolbar')).toBeVisible();
    expect(getByTestId('IconButton')).toBeVisible();
  });
});

describe('RouterToolbarItem', () => {
  it('renders IconButton with Icon for normal items with source', () => {
    const source = { uri: 'test-icon.png' };
    render(<RouterToolbarItem identifier="test" source={source} />);

    expect(screen.getByTestId('IconButton')).toBeVisible();
    expect(screen.getByTestId('Icon')).toBeVisible();
    expect(MockedIcon).toHaveBeenCalledWith(expect.objectContaining({ source }), undefined);
  });

  it('passes tintColor to Icon', () => {
    const source = { uri: 'test-icon.png' };
    render(<RouterToolbarItem identifier="test" source={source} tintColor="red" />);

    expect(MockedIcon).toHaveBeenCalledWith(
      expect.objectContaining({
        source,
        tintColor: 'red',
      }),
      undefined
    );
  });

  it('passes onSelected as onPress to IconButton', () => {
    const onSelected = jest.fn();
    const source = { uri: 'test-icon.png' };
    render(<RouterToolbarItem identifier="test" source={source} onSelected={onSelected} />);

    expect(MockedIconButton).toHaveBeenCalledWith(
      expect.objectContaining({
        onPress: onSelected,
      }),
      undefined
    );
  });

  it('passes disabled to IconButton', () => {
    const source = { uri: 'test-icon.png' };
    render(<RouterToolbarItem identifier="test" source={source} disabled />);

    expect(MockedIconButton).toHaveBeenCalledWith(
      expect.objectContaining({
        disabled: true,
      }),
      undefined
    );
  });

  it('hides button via AnimatedVisibility when hidden is true', () => {
    const source = { uri: 'test-icon.png' };
    render(<RouterToolbarItem identifier="test" source={source} hidden />);

    expect(MockedAnimatedVisibility).toHaveBeenCalledWith(
      expect.objectContaining({ visible: false }),
      undefined
    );
  });

  it('returns null for fixedSpacer without width', () => {
    const { toJSON } = render(<RouterToolbarItem identifier="test" type="fixedSpacer" />);

    expect(toJSON()).toBeNull();
  });

  it('renders Box with width modifier for fixedSpacer with width', () => {
    render(<RouterToolbarItem identifier="test" type="fixedSpacer" width={32} />);

    expect(screen.getByTestId('Box')).toBeVisible();
    expect(MockedBox).toHaveBeenCalledWith(
      expect.objectContaining({
        modifiers: [width(32)],
      }),
      undefined
    );
  });

  it('returns null for fluidSpacer type', () => {
    const { toJSON } = render(<RouterToolbarItem identifier="test" type="fluidSpacer" />);

    expect(toJSON()).toBeNull();
  });

  it('returns null with dev warning for searchBar type', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const { toJSON } = render(<RouterToolbarItem identifier="test" type="searchBar" />);

    expect(toJSON()).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Stack.Toolbar.SearchBarSlot is not supported on Android')
    );
    consoleSpy.mockRestore();
  });

  it('renders children inside RNHostView', () => {
    const { View, Text }: typeof import('react-native') = jest.requireActual('react-native');

    render(
      <RouterToolbarItem identifier="test">
        <View>
          <Text>Custom Content</Text>
        </View>
      </RouterToolbarItem>
    );

    expect(screen.getByTestId('RNHostView')).toBeVisible();
    expect(MockedRNHostView).toHaveBeenCalledWith(
      expect.objectContaining({ matchContents: true }),
      undefined
    );
    expect(screen.getByText('Custom Content')).toBeVisible();
  });

  it('when both children and source are provided, the custom view takes priority', () => {
    const { View, Text }: typeof import('react-native') = jest.requireActual('react-native');
    const source = { uri: 'test-icon.png' };

    render(
      <RouterToolbarItem identifier="test" source={source}>
        <View>
          <Text>Custom Content</Text>
        </View>
      </RouterToolbarItem>
    );

    // Custom view
    expect(screen.getByTestId('RNHostView')).toBeVisible();
    // Button
    expect(screen.queryByTestId('IconButton')).toBeNull();
  });

  it('wraps custom view in AnimatedVisibility', () => {
    const { View, Text }: typeof import('react-native') = jest.requireActual('react-native');

    render(
      <RouterToolbarItem identifier="test">
        <View>
          <Text>Custom Content</Text>
        </View>
      </RouterToolbarItem>
    );

    expect(MockedAnimatedVisibility).toHaveBeenCalledWith(
      expect.objectContaining({ visible: true }),
      undefined
    );
    expect(screen.getByTestId('AnimatedVisibility')).toBeVisible();
  });

  it('hides custom views via AnimatedVisibility when hidden is true', () => {
    const { View, Text }: typeof import('react-native') = jest.requireActual('react-native');

    render(
      <RouterToolbarItem identifier="test" hidden>
        <View>
          <Text>Custom Content</Text>
        </View>
      </RouterToolbarItem>
    );

    expect(MockedAnimatedVisibility).toHaveBeenCalledWith(
      expect.objectContaining({ visible: false }),
      undefined
    );
  });

  it('returns null with dev warning when no source is provided', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const { toJSON } = render(<RouterToolbarItem identifier="test" systemImageName="star.fill" />);

    expect(toJSON()).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('requires an ImageSourcePropType')
    );
    consoleSpy.mockRestore();
  });

  it('returns null without warning when mdIconName is set but source is missing (loading state)', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const { toJSON } = render(<RouterToolbarItem identifier="test" mdIconName="search" />);

    expect(toJSON()).toBeNull();
    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('renders button when type is normal', () => {
    const source = { uri: 'test-icon.png' };
    render(<RouterToolbarItem identifier="test" type="normal" source={source} />);

    expect(screen.getByTestId('IconButton')).toBeVisible();
  });
});
