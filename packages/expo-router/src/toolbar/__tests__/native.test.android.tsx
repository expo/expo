import { render, screen } from '@testing-library/react-native';

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
  };
});

const { Host, IconButton, Icon } = jest.requireMock(
  '@expo/ui/jetpack-compose'
) as typeof import('@expo/ui/jetpack-compose');
const MockedHost = Host as jest.MockedFunction<typeof Host>;
const MockedIconButton = IconButton as jest.MockedFunction<typeof IconButton>;
const MockedIcon = Icon as jest.MockedFunction<typeof Icon>;

// eslint-disable-next-line import/first
import { RouterToolbarHost, RouterToolbarItem } from '../native';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('RouterToolbarHost', () => {
  it('renders Host and HorizontalFloatingToolbar', () => {
    render(<RouterToolbarHost>content</RouterToolbarHost>);

    expect(screen.getByTestId('Host')).toBeTruthy();
    expect(screen.getByTestId('HorizontalFloatingToolbar')).toBeTruthy();
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

    expect(getByTestId('HorizontalFloatingToolbar')).toBeTruthy();
    expect(getByTestId('IconButton')).toBeTruthy();
  });
});

describe('RouterToolbarItem', () => {
  it('renders IconButton with Icon for normal items with source', () => {
    const source = { uri: 'test-icon.png' };
    render(<RouterToolbarItem identifier="test" source={source} />);

    expect(screen.getByTestId('IconButton')).toBeTruthy();
    expect(screen.getByTestId('Icon')).toBeTruthy();
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

  it('returns null when hidden is true', () => {
    const source = { uri: 'test-icon.png' };
    const { toJSON } = render(<RouterToolbarItem identifier="test" source={source} hidden />);

    expect(toJSON()).toBeNull();
  });

  it('returns null with dev warning for spacer types', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const { toJSON } = render(<RouterToolbarItem identifier="test" type="fixedSpacer" />);

    expect(toJSON()).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Stack.Toolbar.Spacer is not supported on Android')
    );
    consoleSpy.mockRestore();
  });

  it('returns null with dev warning for fluidSpacer type', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const { toJSON } = render(<RouterToolbarItem identifier="test" type="fluidSpacer" />);

    expect(toJSON()).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Stack.Toolbar.Spacer is not supported on Android')
    );
    consoleSpy.mockRestore();
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

  it('returns null with dev warning for items with children', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { View }: typeof import('react-native') = jest.requireActual('react-native');

    const { toJSON } = render(
      <RouterToolbarItem identifier="test">
        <View />
      </RouterToolbarItem>
    );

    expect(toJSON()).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Stack.Toolbar.View is not supported on Android')
    );
    consoleSpy.mockRestore();
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

  it('renders normally when type is normal', () => {
    const source = { uri: 'test-icon.png' };
    render(<RouterToolbarItem identifier="test" type="normal" source={source} />);

    expect(screen.getByTestId('IconButton')).toBeTruthy();
  });
});
