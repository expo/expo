import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { renderRouter, screen } from '../../testing-library';
import Stack from '../Stack';

afterEach(() => {
  jest.restoreAllMocks();
});

it('does not report an unhandled action when the stack unmounts during startup with a guarded screen', async () => {
  const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  const consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});

  await renderRouter({
    _layout: function Layout() {
      const [isHydrating, setIsHydrating] = useState(false);

      useEffect(() => {
        setIsHydrating(true);
      }, []);

      if (isHydrating) {
        return <View testID="loading" />;
      }

      return (
        <Stack>
          <Stack.Screen name="index" />
          <Stack.Protected guard={false}>
            <Stack.Screen name="private" />
          </Stack.Protected>
        </Stack>
      );
    },
    index: () => <Text testID="index">index</Text>,
    private: () => <Text testID="private">private</Text>,
  });

  expect(screen.getByTestId('loading')).toBeVisible();
  expect(consoleError).not.toHaveBeenCalled();
  expect(consoleWarn).not.toHaveBeenCalled();
});
