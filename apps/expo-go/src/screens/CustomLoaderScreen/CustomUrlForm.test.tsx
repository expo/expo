import { render, fireEvent } from '@testing-library/react-native';
import React from 'react';

import CustomUrlForm from '../../components/CustomUrlForm';

it('shows error for invalid URL', () => {
  const { getByPlaceholderText, getByText } = render(<CustomUrlForm />);
  fireEvent.changeText(getByPlaceholderText('Enter Expo URL'), 'invalid-url');
  fireEvent.press(getByText('Load Bundle'));
  expect(getByText(/Invalid Expo URL/i)).toBeTruthy();
});
