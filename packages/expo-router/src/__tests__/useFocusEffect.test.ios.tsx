import { useCallback } from 'react';
import { Text } from 'react-native';

import { router } from '../imperative-api';
import Stack from '../layouts/StackClient';
import { act, renderRouter } from '../testing-library';
import { useFocusEffect } from '../useFocusEffect';

it('can use imperative API inside a useFocusEffect', async () => {
  await renderRouter({
    index: function Index() {
      useFocusEffect(() => {
        router.push('/second');
      });

      return null;
    },
    second: () => <Text>Second</Text>,
  });
});

it('is called once on focus', async () => {
  const onFocus = jest.fn();
  await renderRouter({
    _layout: () => <Stack />,
    index: function Index() {
      const f = useCallback(() => {
        onFocus();
      }, []);
      useFocusEffect(f);

      return <Text>Index</Text>;
    },
    second: () => <Text>Second</Text>,
  });

  expect(onFocus).toHaveBeenCalledTimes(1);
  onFocus.mockClear();

  await act(() => {
    router.push('/second');
  });

  expect(onFocus).not.toHaveBeenCalled();

  await act(() => {
    router.back();
  });

  expect(onFocus).toHaveBeenCalledTimes(1);
});
