import { act } from '@testing-library/react-native';
import { Text } from 'react-native';

import { router, useLocalSearchParams } from '../../exports';
import { renderRouter } from '../../testing-library';

const routes = {
  index: () => <Text testID="index" />,
  second: function Second() {
    const { value } = useLocalSearchParams<{ value?: string }>();
    return <Text testID="second">{value}</Text>;
  },
};

it('keeps the navigation container of the newer root when the older root unmounts', async () => {
  const error = jest.spyOn(console, 'error').mockImplementation(() => {});

  const olderRoot = await renderRouter(routes);
  const newerRoot = await renderRouter(routes);
  await olderRoot.unmount();
  await act(() => router.push('/second'));

  expect(router.canGoBack()).toBe(true);
  await act(() => router.setParams({ value: 'set' }));
  expect(newerRoot.getByTestId('second')).toHaveTextContent('set');

  await newerRoot.unmount();
  error.mockRestore();
});

it('uses the navigation container of the older root again when the newer root unmounts', async () => {
  const error = jest.spyOn(console, 'error').mockImplementation(() => {});

  const olderRoot = await renderRouter(routes);
  const newerRoot = await renderRouter(routes);
  await newerRoot.unmount();
  await act(() => router.push('/second'));

  expect(router.canGoBack()).toBe(true);
  await act(() => router.setParams({ value: 'set' }));
  expect(olderRoot.getByTestId('second')).toHaveTextContent('set');

  await olderRoot.unmount();
  error.mockRestore();
});
