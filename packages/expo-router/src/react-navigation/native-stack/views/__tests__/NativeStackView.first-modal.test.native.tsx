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

it.each([
  'modal',
  'transparentModal',
  'containedModal',
  'containedTransparentModal',
  'fullScreenModal',
  'formSheet',
  'pageSheet',
] as const)('warns when the first screen requests %s presentation', async (presentation) => {
  const result = await renderRouter(
    {
      _layout: () => (
        <Stack>
          <Stack.Screen name={presentation} options={{ presentation }} />
        </Stack>
      ),
      [presentation]: () => <Text testID="first">First</Text>,
    },
    { initialUrl: `/${presentation}` }
  );

  expect(screen.getByTestId('first')).toBeVisible();
  expect(warn).toHaveBeenCalledWith(
    expect.stringContaining(`Route "${presentation}" uses presentation "${presentation}"`)
  );
  expect(warn).toHaveBeenCalledWith(expect.stringContaining('unstable_settings.anchor'));
  expect(warn).toHaveBeenCalledTimes(1);

  const firstKey = result.getRouterState()?.routes[0]?.state?.routes[0]?.key;
  expect(firstKey).toBeDefined();

  await act(() => router.replace(`/${presentation}?refresh=1`));

  expect(result.getRouterState()?.routes[0]?.state?.routes[0]?.key).not.toBe(firstKey);
  expect(warn).toHaveBeenCalledTimes(1);
});

it('does not warn when a modal follows a card screen', async () => {
  await renderRouter({
    _layout: () => (
      <Stack>
        <Stack.Screen name="second" options={{ presentation: 'modal' }} />
      </Stack>
    ),
    index: () => <Text testID="index">Index</Text>,
    second: () => <Text testID="second">Second</Text>,
  });

  await act(() => router.push('/second'));

  expect(screen.getByTestId('second')).toBeVisible();
  expect(warn).not.toHaveBeenCalled();
});

it('warns for first screens with the same name in different stacks', async () => {
  await renderRouter({
    _layout: () => (
      <Stack>
        <Stack.Screen name="index" options={{ presentation: 'modal' }} />
      </Stack>
    ),
    index: () => <Text testID="root-index">Root</Text>,
    'settings/_layout': () => (
      <Stack>
        <Stack.Screen name="index" options={{ presentation: 'modal' }} />
      </Stack>
    ),
    'settings/index': () => <Text testID="settings-index">Settings</Text>,
  });

  expect(screen.getByTestId('root-index')).toBeVisible();
  expect(warn).toHaveBeenCalledTimes(1);

  await act(() => router.push('/settings'));

  expect(screen.getByTestId('settings-index')).toBeVisible();
  expect(warn).toHaveBeenCalledTimes(2);
});
