import { act, screen } from '@testing-library/react-native';
import { Platform, Text } from 'react-native';

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

it('warns once for each route without presentation pushed above a modal', async () => {
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

  const message =
    'Route "details" has no presentation option, so it is shown as a modal because a modal screen is below it. This may change in a future version. Set presentation from route params with options={({ route }) => ...}, or use separate card and formSheet screens that render the same component.';
  expect(screen.getByTestId('details')).toBeVisible();
  expect(warn).toHaveBeenCalledWith(message);
  expect(warn).toHaveBeenCalledTimes(1);

  await act(() => router.push('/details?id=2'));

  expect(warn).toHaveBeenNthCalledWith(2, message);
  expect(warn).toHaveBeenCalledTimes(2);
});

(Platform.OS === 'ios' ? it : it.skip)(
  'warns when a card route is pushed above a modal',
  async () => {
    await renderRouter({
      _layout: () => (
        <Stack>
          <Stack.Screen name="sheet" options={{ presentation: 'formSheet' }} />
          <Stack.Screen name="details" options={{ presentation: 'card' }} />
        </Stack>
      ),
      index: () => <Text testID="index">Index</Text>,
      sheet: () => <Text testID="sheet">Sheet</Text>,
      details: () => <Text testID="details">Details</Text>,
    });

    await act(() => router.push('/sheet'));
    await act(() => router.push('/details'));

    expect(warn).toHaveBeenCalledWith(
      'Route "details" uses presentation "card" above a modal screen, so it is pushed behind the modal and is not visible until the modal closes. Use a modal presentation for this route, or close the modal before you navigate.'
    );
    expect(warn).toHaveBeenCalledTimes(1);
  }
);
