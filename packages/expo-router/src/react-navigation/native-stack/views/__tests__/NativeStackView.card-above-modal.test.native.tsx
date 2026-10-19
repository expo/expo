import { act, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { router } from '../../../../imperative-api';
import Stack from '../../../../layouts/StackClient';
import { renderRouter } from '../../../../testing-library';

let warn: jest.SpiedFunction<typeof console.warn>;

beforeEach(() => {
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  warn.mockRestore();
});

it('warns once when a route without presentation is pushed above a modal', async () => {
  await renderRouter({
    _layout: () => (
      <Stack>
        <Stack.Screen name="sheet" options={{ presentation: 'formSheet' }} />
      </Stack>
    ),
    index: () => <Text testID="index">Index</Text>,
    sheet: () => <Text testID="sheet">Sheet</Text>,
    details: () => <Text testID="details">Details</Text>,
  });

  await act(() => router.push('/sheet'));
  await act(() => router.push('/details'));

  expect(screen.getByTestId('details')).toBeVisible();
  expect(warn).toHaveBeenCalledWith(
    'Route "details" has no presentation option, so it is shown as a modal because a modal screen is below it. This may change in a future version. Set presentation from route params with options={({ route }) => ...}, or use separate card and formSheet screens that render the same component.'
  );
  expect(warn).toHaveBeenCalledTimes(1);

  await act(() => router.push('/details?id=2'));

  expect(warn).toHaveBeenCalledTimes(1);
});
