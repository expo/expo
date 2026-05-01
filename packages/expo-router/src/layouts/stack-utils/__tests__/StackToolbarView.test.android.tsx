import { render, screen, within } from '@testing-library/react-native';
import { Text } from 'react-native';

import { StackToolbarView } from '../toolbar/StackToolbarView';
import { NativeToolbarView } from '../toolbar/StackToolbarView/native';
import { ToolbarPlacementContext } from '../toolbar/context';

jest.mock('@expo/ui/jetpack-compose', () => {
  const { View }: typeof import('react-native') = jest.requireActual('react-native');
  return {
    Box: jest.fn((props) => <View testID="Box" {...props} />),
    RNHostView: jest.fn((props) => <View testID="RNHostView" {...props} />),
  };
});

jest.mock('../../../toolbar/AnimatedItemContainer', () => {
  const { View }: typeof import('react-native') = jest.requireActual('react-native');
  return {
    AnimatedItemContainer: jest.fn((props) => <View testID="AnimatedItemContainer" {...props} />),
  };
});

const { Box, RNHostView } = jest.requireMock(
  '@expo/ui/jetpack-compose'
) as typeof import('@expo/ui/jetpack-compose');
const MockedBox = Box as jest.MockedFunction<typeof Box>;
const MockedRNHostView = RNHostView as jest.MockedFunction<typeof RNHostView>;

const { AnimatedItemContainer } = jest.requireMock(
  '../../../toolbar/AnimatedItemContainer'
) as typeof import('../../../toolbar/AnimatedItemContainer');
const MockedAnimatedItemContainer = AnimatedItemContainer as jest.MockedFunction<
  typeof AnimatedItemContainer
>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('StackToolbarView component', () => {
  let consoleErrorSpy: jest.SpyInstance<void, Parameters<typeof console.error>>;
  let consoleWarnSpy: jest.SpyInstance<void, Parameters<typeof console.warn>>;
  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  it('renders Box and RNHostView in bottom placement', () => {
    render(
      <ToolbarPlacementContext.Provider value="bottom">
        <StackToolbarView>
          <Text>Custom Content</Text>
        </StackToolbarView>
      </ToolbarPlacementContext.Provider>
    );

    expect(screen.getByTestId('Box')).toBeVisible();
    expect(screen.getByTestId('RNHostView')).toBeVisible();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('throws error when used outside a toolbar (no placement context)', () => {
    expect(() => {
      render(
        <ToolbarPlacementContext.Provider value={null as any}>
          <StackToolbarView>
            <Text>Custom Content</Text>
          </StackToolbarView>
        </ToolbarPlacementContext.Provider>
      );
    }).toThrow('Stack.Toolbar.View must be used inside a Stack.Toolbar');

    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('passes children through to RNHostView', () => {
    render(
      <ToolbarPlacementContext.Provider value="bottom">
        <StackToolbarView>
          <Text testID="custom-content">Custom Content</Text>
        </StackToolbarView>
      </ToolbarPlacementContext.Provider>
    );

    const hostView = screen.getByTestId('RNHostView');
    expect(within(hostView).getByTestId('custom-content')).toBeVisible();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it.each([true, false, undefined])('passes hidden=%s as visible={!hidden}', (hidden) => {
    render(
      <ToolbarPlacementContext.Provider value="bottom">
        <StackToolbarView hidden={hidden}>
          <Text>Content</Text>
        </StackToolbarView>
      </ToolbarPlacementContext.Provider>
    );

    expect(MockedAnimatedItemContainer.mock.calls[0]![0]).toMatchObject({
      visible: !hidden,
    });
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });
});

describe('NativeToolbarView', () => {
  let consoleErrorSpy: jest.SpyInstance<void, Parameters<typeof console.error>>;
  let consoleWarnSpy: jest.SpyInstance<void, Parameters<typeof console.warn>>;
  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  it('renders Box with contentAlignment="center"', () => {
    render(
      <NativeToolbarView>
        <Text>Content</Text>
      </NativeToolbarView>
    );

    expect(MockedBox.mock.calls[0]![0]).toMatchObject({
      contentAlignment: 'center',
    });
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('wraps children in AnimatedItemContainer with visible={!hidden}', () => {
    render(
      <NativeToolbarView hidden>
        <Text>Content</Text>
      </NativeToolbarView>
    );

    expect(MockedAnimatedItemContainer.mock.calls[0]![0]).toMatchObject({
      visible: false,
    });
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('wraps children in RNHostView with matchContents', () => {
    render(
      <NativeToolbarView>
        <Text testID="child">Content</Text>
      </NativeToolbarView>
    );

    expect(MockedRNHostView.mock.calls[0]![0]).toMatchObject({
      matchContents: true,
    });
    const hostView = screen.getByTestId('RNHostView');
    expect(within(hostView).getByTestId('child')).toBeVisible();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });
});
