import { act } from '@testing-library/react-native';
import { useEffect } from 'react';

import { router } from '../../../exports';
import { Stack } from '../../../layouts/Stack';
import { renderRouter } from '../../../testing-library';
import { useNavigation } from '../../../useNavigation';

const WARNING = expect.stringContaining('navigation.isFocused() was called while rendering');

afterEach(() => {
  jest.restoreAllMocks();
});

// The warning is shown once per process, so this test must run before the one that warns.
test('does not warn when navigation.isFocused() is called in an effect', async () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

  await renderRouter({
    _layout: () => <Stack />,
    index: function Index() {
      const navigation = useNavigation();
      useEffect(() => {
        navigation.isFocused();
      }, [navigation]);
      return null;
    },
  });

  expect(warn).not.toHaveBeenCalledWith(WARNING);
});

test('warns once when navigation.isFocused() is called during render', async () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

  await renderRouter({
    _layout: () => <Stack />,
    index: function Index() {
      useNavigation().isFocused();
      return null;
    },
  });
  // Re-render the screen to check that the warning is not repeated.
  await act(() => router.setParams({ value: '1' }));

  expect(warn.mock.calls.filter(([message]) => /navigation\.isFocused\(\)/.test(message))).toEqual([
    [expect.stringContaining("while rendering the screen 'index'")],
  ]);
});
