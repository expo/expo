import { fireEvent, render } from '@testing-library/react-native';
import type { ComponentProps } from 'react';

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
    <ThemeProvider value={DefaultTheme}>
      <Button {...props} />
    </ThemeProvider>
  );
}

beforeEach(() => {
  mockedNavigate.mockReset();
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
