import { act } from '@testing-library/react-native';
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

it('warns when a card route is pushed above a modal', async () => {
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
});
