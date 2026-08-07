import { screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import {
  ScreenStack as _ScreenStack,
  ScreenStackItem as _ScreenStackItem,
} from 'react-native-screens';

import Stack from '../../../../layouts/StackClient';
import { renderRouter } from '../../../../testing-library';
import { usePreventRemove } from '../../../core/usePreventRemove';
import type { NativeStackNavigationOptions } from '../../types';

jest.mock('react-native-screens', () => {
  const actualScreens = jest.requireActual(
    'react-native-screens'
  ) as typeof import('react-native-screens');
  return {
    ...actualScreens,
    ScreenStack: jest.fn((props) => <actualScreens.ScreenStack {...props} />),
    ScreenStackItem: jest.fn((props) => <actualScreens.ScreenStackItem {...props} />),
  };
});

const ScreenStack = _ScreenStack as jest.MockedFunction<typeof _ScreenStack>;
const ScreenStackItem = _ScreenStackItem as jest.MockedFunction<typeof _ScreenStackItem>;

function renderStack(
  options?: NativeStackNavigationOptions,
  Screen = () => <Text testID="index">Index</Text>
) {
  renderRouter({
    _layout: () => (
      <Stack>
        <Stack.Screen name="index" options={options} />
      </Stack>
    ),
    index: Screen,
  });

  expect(screen.getByTestId('index')).toBeVisible();
  expect(ScreenStackItem).toHaveBeenCalled();
  return ScreenStackItem.mock.calls[ScreenStackItem.mock.calls.length - 1]![0];
}

describe('unstable_nativeProps', () => {
  beforeEach(() => {
    ScreenStack.mockClear();
    ScreenStackItem.mockClear();
  });

  it('forwards raw screen props to ScreenStackItem', () => {
    const props = renderStack({
      unstable_nativeProps: {
        gestureEnabled: false,
      },
    });

    expect(props.gestureEnabled).toBe(false);
  });

  it('forwards raw stack host props from Stack', () => {
    const onFinishTransitioning = jest.fn();
    const nativeContainerStyle = { backgroundColor: 'red' } as const;

    renderRouter({
      _layout: () => (
        <Stack
          unstable_nativeProps={{
            testID: 'native-stack',
            nativeContainerStyle,
            onFinishTransitioning,
          }}
        />
      ),
      index: () => <Text testID="index">Index</Text>,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(ScreenStack.mock.calls[0]![0]).toEqual(
      expect.objectContaining({
        testID: 'native-stack',
        nativeContainerStyle,
        onFinishTransitioning,
      })
    );
    expect(ScreenStackItem.mock.calls[0]![0].testID).toBeUndefined();
  });

  it('lets raw screen props override expo-router optional props', () => {
    const props = renderStack({
      animation: 'fade',
      unstable_nativeProps: {
        stackAnimation: 'none',
      },
    });

    expect(props.stackAnimation).toBe('none');
  });

  it('lets raw screen props override wired handlers', () => {
    const onDismissed = jest.fn();
    const props = renderStack({
      unstable_nativeProps: {
        onDismissed,
      } as unknown as NativeStackNavigationOptions['unstable_nativeProps'],
    });

    expect(props.onDismissed).toBe(onDismissed);
  });

  it('forwards raw header props to headerConfig', () => {
    const props = renderStack({
      unstable_nativeProps: {
        headerConfig: { disableTopInsetApplication: true },
      },
    });

    expect(props.headerConfig?.disableTopInsetApplication).toBe(true);
  });

  it('lets raw header props override expo-router optional props', () => {
    const props = renderStack({
      headerShadowVisible: true,
      unstable_nativeProps: {
        headerConfig: { hideShadow: true },
      },
    });

    expect(props.headerConfig?.hideShadow).toBe(true);
  });

  it('lets raw header props override composed children', () => {
    const rawChildren = <Text testID="raw-header-children">Raw</Text>;
    const props = renderStack({
      unstable_nativeProps: {
        headerConfig: { children: rawChildren },
      } as unknown as NativeStackNavigationOptions['unstable_nativeProps'],
    });

    expect(props.headerConfig?.children).toBe(rawChildren);
  });

  it('renders without unstable_nativeProps', () => {
    const props = renderStack();

    expect(props.headerConfig?.title).toBe('index');
  });
});

it('sets preventNativeDismiss from usePreventRemove', () => {
  ScreenStackItem.mockClear();
  const ProtectedScreen = () => {
    usePreventRemove(true, () => {});
    return <Text testID="index">Index</Text>;
  };

  const props = renderStack(undefined, ProtectedScreen);

  expect(props.preventNativeDismiss).toBe(true);
});
