import { act, render } from '@testing-library/react-native';

import ExpoNavigationBar from '../ExpoNavigationBar';
import { NavigationBar } from '../NavigationBar';

async function flushUpdates() {
  await act(() => new Promise((resolve) => setImmediate(resolve)));
}

beforeEach(() => {
  jest.clearAllMocks();
});

it(`restores the default style when the last NavigationBar unmounts`, async () => {
  const { unmount } = await render(<NavigationBar style="dark" />);

  await flushUpdates();

  expect(ExpoNavigationBar.setStyle).toHaveBeenLastCalledWith('dark');
  await unmount();

  await flushUpdates();

  expect(ExpoNavigationBar.setStyle).toHaveBeenLastCalledWith('light');
});

it(`restores the bar visibility when a hidden NavigationBar unmounts`, async () => {
  const { rerender, unmount } = await render(
    <>
      <NavigationBar style="dark" />
      <NavigationBar hidden />
    </>
  );

  await flushUpdates();

  expect(ExpoNavigationBar.setHidden).toHaveBeenLastCalledWith(true);
  await rerender(<NavigationBar style="dark" />);

  await flushUpdates();

  expect(ExpoNavigationBar.setHidden).toHaveBeenLastCalledWith(false);
  await unmount();

  await flushUpdates();
});
