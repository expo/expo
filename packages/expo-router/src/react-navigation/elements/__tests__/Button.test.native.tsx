import { fireEvent, render } from '@testing-library/react-native';
import type { ComponentProps } from 'react';
import { PlatformColor, StyleSheet } from 'react-native';

import { RoutingQueueProvider } from '../../../global-state/routingQueueContext';
import { router } from '../../../imperative-api';
import { DefaultTheme, ThemeProvider } from '../../native';
import { Button } from '../Button';
import { PlatformPressable } from '../PlatformPressable';

jest.mock('../../../imperative-api', () => {
  const actual = jest.requireActual(
    '../../../imperative-api'
  ) as typeof import('../../../imperative-api');
  return {
    ...actual,
    router: {
      ...actual.router,
      navigate: jest.fn(),
    },
  };
});

jest.mock('../PlatformPressable', () => {
  const actual = jest.requireActual<typeof import('../PlatformPressable')>('../PlatformPressable');
  return {
    ...actual,
    PlatformPressable: jest.fn(actual.PlatformPressable),
  };
});

const mockedNavigate = router.navigate as jest.MockedFunction<typeof router.navigate>;
const mockedPlatformPressable = jest.mocked(PlatformPressable);

function renderButton(props: ComponentProps<typeof Button>, primary = DefaultTheme.colors.primary) {
  return render(
    <RoutingQueueProvider>
      <ThemeProvider value={{ ...DefaultTheme, colors: { ...DefaultTheme.colors, primary } }}>
        <Button {...props} />
      </ThemeProvider>
    </RoutingQueueProvider>
  );
}

beforeEach(() => {
  mockedNavigate.mockReset();
  mockedPlatformPressable.mockClear();
});

it('does not navigate when the press is prevented', () => {
  const { getByTestId } = renderButton({
    children: 'Profile',
    href: '/profile',
    testID: 'button',
  });

  fireEvent.press(getByTestId('button'), { defaultPrevented: true });

  expect(mockedNavigate).not.toHaveBeenCalled();
});

it('navigates on press', () => {
  const { getByTestId } = renderButton({
    children: 'Profile',
    href: '/profile',
    testID: 'button',
  });

  fireEvent.press(getByTestId('button'));

  expect(mockedNavigate).toHaveBeenCalledWith('/profile');
});

it.each([
  ['tinted', '#0a141e', 'rgba(10, 20, 30, 0.15)', '#0a141e', 'tinted'],
  ['dark filled', '#0a141e', '#0a141e', 'white', 'filled'],
  ['light filled', '#f0f0f0', '#f0f0f0', 'rgba(70, 70, 70, 1)', 'filled'],
] as const)(
  'styles a %s button',
  (_name, color, expectedBackgroundColor, expectedTextColor, variant) => {
    const { getByTestId, getByText } = renderButton({
      children: 'Action',
      color,
      testID: 'button',
      variant,
    });

    expect(StyleSheet.flatten(getByTestId('button').props.style)).toMatchObject({
      backgroundColor: expectedBackgroundColor,
    });
    expect(StyleSheet.flatten(getByText('Action').props.style)).toMatchObject({
      color: expectedTextColor,
    });
  }
);

it('multiplies the input alpha for tinted backgrounds and ripples', () => {
  const { getByTestId, getByText } = renderButton({
    children: 'Action',
    color: 'rgba(10, 20, 30, 0.5)',
    testID: 'button',
  });

  expect(StyleSheet.flatten(getByTestId('button').props.style)).toMatchObject({
    backgroundColor: `rgba(10, 20, 30, ${(128 / 255) * 0.15})`,
  });
  expect(StyleSheet.flatten(getByText('Action').props.style)).toMatchObject({
    color: 'rgba(10, 20, 30, 0.5)',
  });
  expect(mockedPlatformPressable.mock.calls[0]?.[0].android_ripple).toEqual({
    color: `rgba(10, 20, 30, ${(128 / 255) * 0.15})`,
    radius: 40,
  });
});

it.each(['tinted', 'filled'] as const)(
  'keeps dynamic theme colors for %s buttons when they cannot be transformed',
  (variant) => {
    const primary = PlatformColor('systemPink');
    const { getByTestId, getByText } = renderButton(
      { children: 'Action', testID: 'button', variant },
      primary
    );

    expect(StyleSheet.flatten(getByTestId('button').props.style)).toMatchObject({
      backgroundColor: primary,
    });
    expect(StyleSheet.flatten(getByText('Action').props.style)).toMatchObject({
      color: primary,
    });
    expect(mockedPlatformPressable.mock.calls[0]?.[0].android_ripple).toMatchObject({
      color: primary,
    });
  }
);
