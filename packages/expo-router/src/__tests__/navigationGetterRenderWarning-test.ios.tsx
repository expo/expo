import { act } from '@testing-library/react-native';

import { router, useRouter } from '../exports';
import Stack from '../layouts/Stack';
import { renderRouter } from '../testing-library';
import { useNavigation } from '../useNavigation';

afterEach(() => {
  jest.restoreAllMocks();
});

test('warns once when router.canGoBack() is called during render', async () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

  await renderRouter(
    {
      _layout: () => <Stack />,
      'nested/_layout': () => <Stack />,
      'nested/index': function Index() {
        useRouter().canGoBack();
        return null;
      },
    },
    { initialUrl: '/nested' }
  );
  // Re-render the screen to check that the warning is not repeated.
  await act(() => router.setParams({ value: '1' }));

  // `router.canGoBack()` calls `navigation.isFocused()` and `navigation.canGoBack()` internally.
  expect(warn.mock.calls).toEqual([
    [
      'router.canGoBack() was called during render, which can return a stale value. Use the useCanGoBack() hook to read it during render, or call router.canGoBack() in an effect or event handler.',
    ],
  ]);
});

test('warns once when router.canDismiss() is called during render', async () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

  await renderRouter({
    _layout: () => <Stack />,
    index: function Index() {
      useRouter().canDismiss();
      return null;
    },
  });
  // Re-render the screen to check that the warning is not repeated.
  await act(() => router.setParams({ value: '1' }));

  expect(warn.mock.calls).toEqual([
    [
      'router.canDismiss() was called during render, which can return a stale value. Use the useCanDismiss() hook to read it during render, or call router.canDismiss() in an effect or event handler.',
    ],
  ]);
});

test('warns once when navigation.canGoBack() is called during render', async () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

  await renderRouter(
    {
      _layout: () => <Stack />,
      'nested/_layout': () => <Stack />,
      'nested/index': function Index() {
        useNavigation().canGoBack();
        return null;
      },
    },
    { initialUrl: '/nested' }
  );
  // Re-render the screen to check that the warning is not repeated.
  await act(() => router.setParams({ value: '1' }));

  // The nested navigator's `canGoBack()` calls the parent navigator's `canGoBack()` internally.
  expect(warn.mock.calls).toEqual([
    [
      'navigation.canGoBack() was called during render, which can return a stale value. Use the useCanGoBack() hook to read it for the focused screen during render, or call navigation.canGoBack() in an effect or event handler.',
    ],
  ]);
});

test('warns once when navigation.getState() is called during render', async () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

  await renderRouter({
    _layout: () => <Stack />,
    index: function Index() {
      useNavigation().getState();
      return null;
    },
  });
  // Re-render the screen to check that the warning is not repeated.
  await act(() => router.setParams({ value: '1' }));

  expect(warn.mock.calls).toEqual([
    [
      'navigation.getState() was called during render, which can return a stale value. Use the useNavigationState() hook to read it during render, or call navigation.getState() in an effect or event handler.',
    ],
  ]);
});
