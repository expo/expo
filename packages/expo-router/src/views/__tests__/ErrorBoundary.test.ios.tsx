import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Text, Pressable } from 'react-native';

import type { ErrorBoundaryProps } from '../../exports';
import { ErrorBoundary } from '../ErrorBoundary';
import { renderRouter } from '../../testing-library';

it('renders the route ErrorBoundary with error and retry props', async () => {
  const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
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
  expect(errors).toContain('route failed');

  fireEvent.press(screen.getByTestId('retry'));

  await waitFor(() => expect(screen.getByTestId('route')).toHaveTextContent('Recovered route'));

  consoleError.mockRestore();
});

it('renders the public ErrorBoundary retry action', () => {
  const retry = jest.fn();

  render(<ErrorBoundary error={new Error('public failure')} retry={retry} />);

  expect(screen.getByTestId('router_error_message')).toHaveTextContent('Error: public failure');

  fireEvent.press(screen.getByTestId('router_error_retry'));

  expect(retry).toHaveBeenCalledTimes(1);
});
