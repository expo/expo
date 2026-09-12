/** @jest-environment jsdom */
import { fireEvent, render } from '@testing-library/react';
import type { ComponentProps } from 'react';

import { RoutingQueueProvider } from '../../../global-state/routingQueueContext';
import { router } from '../../../imperative-api';
import { DefaultTheme, ThemeProvider } from '../../native';
import { Button } from '../Button';

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

const mockedNavigate = router.navigate as jest.MockedFunction<typeof router.navigate>;

function renderButton(props: ComponentProps<typeof Button>) {
  return render(
    <RoutingQueueProvider>
      <ThemeProvider value={DefaultTheme}>
        <Button {...props} />
      </ThemeProvider>
    </RoutingQueueProvider>
  );
}

beforeEach(() => {
  mockedNavigate.mockReset();
});

it('renders an anchor with a resolved href', () => {
  const { getByTestId } = renderButton({
    children: 'Profile',
    href: '/(group)/profile',
    testID: 'button',
  });

  const button = getByTestId('button');
  expect(button.tagName).toBe('A');
  expect(button.getAttribute('href')).toBe('/profile');
});

it('navigates on an unmodified left click', () => {
  const { getByTestId } = renderButton({
    children: 'Profile',
    href: '/profile',
    testID: 'button',
  });

  fireEvent.click(getByTestId('button'), { button: 0 });

  expect(mockedNavigate).toHaveBeenCalledWith('/profile');
});

it('navigates when onPress prevents the default', () => {
  const { getByTestId } = renderButton({
    children: 'Profile',
    href: '/profile',
    onPress: (event) => event.preventDefault(),
    testID: 'button',
  });

  fireEvent.click(getByTestId('button'), { button: 0 });

  expect(mockedNavigate).toHaveBeenCalledWith('/profile');
});

it('renders and navigates to an external href', () => {
  const { getByTestId } = renderButton({
    children: 'Expo',
    href: 'https://expo.dev',
    testID: 'button',
  });
  const button = getByTestId('button');

  expect(button.getAttribute('href')).toBe('https://expo.dev');

  fireEvent.click(button, { button: 0 });

  expect(mockedNavigate).toHaveBeenCalledWith('https://expo.dev');
});

it.each([
  ['metaKey', { metaKey: true }],
  ['altKey', { altKey: true }],
  ['ctrlKey', { ctrlKey: true }],
  ['shiftKey', { shiftKey: true }],
  ['middle click', { button: 1 }],
])('does not intercept %s clicks', (_name, eventInit) => {
  const { getByTestId } = renderButton({
    children: 'Profile',
    href: '/profile',
    testID: 'button',
  });
  const event = new MouseEvent('click', {
    bubbles: true,
    cancelable: true,
    ...eventInit,
  });

  fireEvent(getByTestId('button'), event);

  expect(mockedNavigate).not.toHaveBeenCalled();
  expect(event.defaultPrevented).toBe(false);
});

it('calls onPress before navigating', () => {
  const calls: string[] = [];
  mockedNavigate.mockImplementation(() => calls.push('navigate'));
  const { getByTestId } = renderButton({
    children: 'Profile',
    href: '/profile',
    onPress: () => calls.push('onPress'),
    testID: 'button',
  });

  fireEvent.click(getByTestId('button'), { button: 0 });

  expect(calls).toEqual(['onPress', 'navigate']);
});
