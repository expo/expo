import { act, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { router } from '../../../../imperative-api';
import Stack from '../../../../layouts/StackClient';
import { renderRouter } from '../../../../testing-library';

let warn: jest.SpiedFunction<typeof console.warn>;

const getWarning = (route: string, presentation: string) =>
  `Route "${route}" uses presentation "${presentation}" but is the first screen in its native stack, so it is rendered as a card. Add unstable_settings.anchor to the stack layout to place a non-modal screen before this route.`;

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
  const route = 'warning-modal';
  await renderRouter(
    {
      [`${presentation}/_layout`]: () => (
        <Stack>
          <Stack.Screen name={route} options={{ presentation }} />
        </Stack>
      ),
      [`${presentation}/${route}`]: () => <Text testID="first">First</Text>,
    },
    { initialUrl: `/${presentation}/${route}` }
  );

  expect(screen.getByTestId('first')).toBeVisible();
  expect(warn).toHaveBeenCalledWith(getWarning(route, presentation));
  expect(warn).toHaveBeenCalledTimes(1);
});

it('warns when the index route requests modal presentation', async () => {
  await renderRouter({
    _layout: () => (
      <Stack>
        <Stack.Screen name="index" options={{ presentation: 'modal' }} />
      </Stack>
    ),
    index: () => <Text testID="index">Index</Text>,
  });

  expect(screen.getByTestId('index')).toBeVisible();
  expect(warn).toHaveBeenCalledWith(getWarning('index', 'modal'));
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
  await renderRouter(
    {
      'account/_layout': () => (
        <Stack>
          <Stack.Screen name="index" options={{ presentation: 'modal' }} />
        </Stack>
      ),
      'account/index': () => <Text testID="account-index">Account</Text>,
      'settings/_layout': () => (
        <Stack>
          <Stack.Screen name="index" options={{ presentation: 'modal' }} />
        </Stack>
      ),
      'settings/index': () => <Text testID="settings-index">Settings</Text>,
    },
    { initialUrl: '/account' }
  );

  expect(screen.getByTestId('account-index')).toBeVisible();
  expect(warn).toHaveBeenCalledWith(getWarning('index', 'modal'));
  expect(warn).toHaveBeenCalledTimes(1);

  await act(() => router.push('/settings'));

  expect(screen.getByTestId('settings-index')).toBeVisible();
  expect(warn).toHaveBeenCalledWith(getWarning('index', 'modal'));
  expect(warn).toHaveBeenCalledTimes(2);
});

it('warns when pushing the first modal screen in a nested stack', async () => {
  await renderRouter({
    _layout: () => <Stack />,
    index: () => <Text testID="index">Index</Text>,
    'profile/_layout': () => (
      <Stack>
        <Stack.Screen name="index" options={{ presentation: 'modal' }} />
      </Stack>
    ),
    'profile/index': () => <Text testID="profile-index">Profile</Text>,
  });

  expect(warn).not.toHaveBeenCalled();

  await act(() => router.push('/profile'));

  expect(screen.getByTestId('profile-index')).toBeVisible();
  expect(warn).toHaveBeenCalledWith(getWarning('index', 'modal'));
  expect(warn).toHaveBeenCalledTimes(1);
});

it('does not warn again after pushing a screen and going back', async () => {
  await renderRouter(
    {
      _layout: () => (
        <Stack>
          <Stack.Screen name="warning-modal" options={{ presentation: 'modal' }} />
          <Stack.Screen name="second" options={{ presentation: 'card' }} />
        </Stack>
      ),
      'warning-modal': () => <Text testID="warning-modal">Modal</Text>,
      second: () => <Text testID="second">Second</Text>,
    },
    { initialUrl: '/warning-modal' }
  );

  expect(warn).toHaveBeenCalledWith(getWarning('warning-modal', 'modal'));
  expect(warn).toHaveBeenCalledTimes(1);

  await act(() => router.push('/second'));
  await act(() => router.back());

  expect(screen.getByTestId('warning-modal')).toBeVisible();
  expect(warn).toHaveBeenCalledTimes(1);
});
