import { act, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';

import { renderRouter, screen } from '../../../testing-library';
import { Button } from '../Button';

it('navigates to its href when pressed', () => {
  renderRouter({
    index: () => <Button href="/profile">Profile</Button>,
    profile: () => <Text testID="profile">Profile</Text>,
  });

  act(() => fireEvent.press(screen.getByText('Profile')));

  expect(screen.getByTestId('profile')).toBeVisible();
});

it('calls onPress without an href', () => {
  const onPress = jest.fn();
  renderRouter({ index: () => <Button onPress={onPress}>Action</Button> });

  fireEvent.press(screen.getByText('Action'));

  expect(onPress).toHaveBeenCalledTimes(1);
});

it('calls onPress before navigating to an href', () => {
  const onPress = jest.fn();
  renderRouter({
    index: () => (
      <Button href="/profile" onPress={onPress}>
        Profile
      </Button>
    ),
    profile: () => <Text testID="profile">Profile</Text>,
  });

  act(() => fireEvent.press(screen.getByText('Profile')));

  expect(onPress).toHaveBeenCalledTimes(1);
  expect(screen.getByTestId('profile')).toBeVisible();
});
