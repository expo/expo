import {
  render,
  screen,
  userEvent,
  waitFor,
} from '@testing-library/react-native';
import { Text, Pressable } from 'react-native';

import type { ErrorBoundaryProps } from '../../exports';
import { ErrorBoundary } from '../ErrorBoundary';
import { renderRouter } from '../../testing-library';

let consoleError: jest.SpiedFunction<typeof console.error>;

beforeEach(() => {
  consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  consoleError.mockRestore();
});

it('renders the route ErrorBoundary with error and retry props', async () => {
  let shouldThrow = true;
  const errors: string[] = [];

  renderRouter({
    index: {
      default() {
        if (shouldThrow) {
          throw new Error('route failed');
        }
        return <Text testID="route">Recovered route</Text>;
      },
      ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
        errors.push(error.message);
        return (
          <>
            <Text testID="boundary">{error.message}</Text>
            <Pressable
              testID="retry"
              onPress={() => {
                shouldThrow = false;
                retry();
              }}
            />
          </>
        );
      },
    },
  });

  expect(screen.getByTestId('boundary')).toHaveTextContent('route failed');
  expect(screen.queryByTestId('route')).toBeNull();
  expect(errors[0]).toBe('route failed');
  consoleError.mockClear();

  await userEvent.press(screen.getByTestId('retry'));

  await waitFor(() =>
    expect(screen.getByTestId('route')).toHaveTextContent('Recovered route')
  );
  expect(screen.queryByTestId('boundary')).toBeNull();
  expect(consoleError).not.toHaveBeenCalled();
});

it('renders the public ErrorBoundary retry action', async () => {
  const retry = jest.fn();

  render(<ErrorBoundary error={new Error('public failure')} retry={retry} />);

  expect(screen.getByTestId('router_error_message')).toHaveTextContent(
    'Error: public failure'
  );

  await userEvent.press(screen.getByTestId('router_error_retry'));

  expect(retry).toHaveBeenCalledTimes(1);
  expect(consoleError).not.toHaveBeenCalled();
});
