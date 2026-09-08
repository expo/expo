import { render, screen, userEvent } from '@testing-library/react-native';
import { Text, Pressable } from 'react-native';

import { ErrorBoundary, type ErrorBoundaryProps } from '../../exports';
import { renderRouter } from '../../testing-library';

afterEach(() => {
  jest.restoreAllMocks();
});

it('recovers a failed route when its ErrorBoundary retries', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  let shouldThrow = true;

  renderRouter({
    index: {
      default() {
        if (shouldThrow) {
          throw new Error('route failed');
        }
        return <Text testID="route">Recovered route</Text>;
      },
      ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
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

  await userEvent.press(screen.getByTestId('retry'));

  expect(screen.getByTestId('route')).toHaveTextContent('Recovered route');
  expect(screen.queryByTestId('boundary')).toBeNull();
});

it('renders the error and calls retry when pressed', async () => {
  const retry = jest.fn(async () => {});

  render(<ErrorBoundary error={new Error('public failure')} retry={retry} />);

  expect(screen.getByTestId('router_error_message')).toHaveTextContent('Error: public failure');

  await userEvent.press(screen.getByTestId('router_error_retry'));

  expect(retry).toHaveBeenCalledTimes(1);
});
