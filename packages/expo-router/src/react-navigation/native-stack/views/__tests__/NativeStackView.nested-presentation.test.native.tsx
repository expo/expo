import { act, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ScreenStack as _ScreenStack } from 'react-native-screens';

import { router } from '../../../../imperative-api';
import Stack from '../../../../layouts/StackClient';
import { renderRouter } from '../../../../testing-library';
import type { NativeStackNavigationConfig, NativeStackNavigationOptions } from '../../types';

jest.mock('react-native-screens', () => {
  const actualScreens = jest.requireActual(
    'react-native-screens'
  ) as typeof import('react-native-screens');
  return {
    ...actualScreens,
    ScreenStack: jest.fn((props) => <actualScreens.ScreenStack {...props} />),
  };
});

const ScreenStack = _ScreenStack as jest.MockedFunction<typeof _ScreenStack>;

/** Stacks are tagged with a `testID` so they can be told apart in the render calls. */
function nativeContainerStyleOf(testID: string) {
  const call = ScreenStack.mock.calls.findLast((call) => call[0].testID === testID);
  expect(call).toBeDefined();
  return call![0].nativeContainerStyle;
}

/** Renders a root stack with a `sheet` screen using `presentation`, containing a nested stack. */
function renderNestedStack(
  presentation: NativeStackNavigationOptions['presentation'],
  nestedNativeProps?: NativeStackNavigationConfig['unstable_nativeProps']
) {
  renderRouter({
    _layout: () => (
      <Stack unstable_nativeProps={{ testID: 'root' }}>
        <Stack.Screen name="sheet" options={{ presentation }} />
      </Stack>
    ),
    index: () => <Text testID="index">Index</Text>,
    'sheet/_layout': () => (
      <Stack unstable_nativeProps={{ testID: 'nested', ...nestedNativeProps }} />
    ),
    'sheet/index': () => <Text testID="sheet">Sheet</Text>,
  });

  expect(screen.getByTestId('index')).toBeVisible();

  // Index 0 is always forced to `card`, so the sheet has to be pushed.
  act(() => router.push('/sheet'));

  expect(screen.getByTestId('sheet')).toBeVisible();
}

describe('nested stack inside a transparent presentation', () => {
  beforeEach(() => {
    ScreenStack.mockClear();
  });

  it.each(['formSheet', 'transparentModal', 'containedTransparentModal'] as const)(
    'does not set a native container background inside %s',
    (presentation) => {
      renderNestedStack(presentation);

      expect(nativeContainerStyleOf('root')).toEqual({
        backgroundColor: expect.any(String),
      });
      expect(nativeContainerStyleOf('nested')).toBeUndefined();
    }
  );

  it.each(['modal', 'pageSheet', 'card'] as const)(
    'keeps the native container background inside %s',
    (presentation) => {
      renderNestedStack(presentation);

      expect(nativeContainerStyleOf('nested')).toEqual(nativeContainerStyleOf('root'));
      expect(nativeContainerStyleOf('nested')).toEqual({
        backgroundColor: expect.any(String),
      });
    }
  );

  it('resets the default background for a stack nested deeper under a card screen', () => {
    renderRouter({
      _layout: () => (
        <Stack unstable_nativeProps={{ testID: 'root' }}>
          <Stack.Screen name="sheet" options={{ presentation: 'formSheet' }} />
        </Stack>
      ),
      index: () => <Text testID="index">Index</Text>,
      'sheet/_layout': () => <Stack unstable_nativeProps={{ testID: 'nested' }} />,
      'sheet/index': () => <Text testID="sheet">Sheet</Text>,
      'sheet/card/_layout': () => <Stack unstable_nativeProps={{ testID: 'deep' }} />,
      'sheet/card/index': () => <Text testID="card">Card</Text>,
    });

    act(() => router.push('/sheet'));
    act(() => router.push('/sheet/card'));

    expect(screen.getByTestId('card')).toBeVisible();

    // The sheet's own stack stays transparent, the one nested under its card screen does not.
    expect(nativeContainerStyleOf('nested')).toBeUndefined();
    expect(nativeContainerStyleOf('deep')).toEqual({
      backgroundColor: expect.any(String),
    });
  });

  it('lets unstable_nativeProps override the skipped background', () => {
    renderNestedStack('formSheet', {
      nativeContainerStyle: { backgroundColor: 'red' },
    });

    expect(nativeContainerStyleOf('nested')).toEqual({
      backgroundColor: 'red',
    });
  });
});
