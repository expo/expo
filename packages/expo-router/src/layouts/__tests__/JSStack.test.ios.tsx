import { fireEvent, screen } from '@testing-library/react-native';
import { Button, Text } from 'react-native';

import { router } from '../../exports';
import { renderRouter } from '../../testing-library';
import { Stack } from '../JSStack';

it('renders the public JS stack entry and navigates between screens', () => {
  renderRouter({
    _layout: () => (
      <Stack>
        <Stack.Screen name="index" options={{ title: 'Home' }} />
        <Stack.Screen name="details" options={{ title: 'Details' }} />
      </Stack>
    ),
    index: () => <Button testID="go-details" title="Details" onPress={() => router.push('/details')} />,
    details: () => <Text testID="details">Details</Text>,
  });

  fireEvent.press(screen.getByTestId('go-details'));

  expect(screen.getByTestId('details')).toBeVisible();
});
