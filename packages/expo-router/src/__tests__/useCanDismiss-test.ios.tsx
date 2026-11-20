import { act } from '@testing-library/react-native';
import { Text } from 'react-native';

import { useCanDismiss } from '../exports';
import { router } from '../imperative-api';
import Stack from '../layouts/Stack';
import { renderRouter } from '../testing-library';

it('can dismiss on the first render of a screen pushed into a stack', async () => {
  const values: boolean[] = [];
  function Second() {
    values.push(useCanDismiss());
    return <Text>Second</Text>;
  }

  await renderRouter({
    _layout: () => <Stack />,
    index: () => <Text>Index</Text>,
    second: Second,
  });
  await act(() => router.push('/second'));

  expect(values).toEqual([true]);
});

it('cannot dismiss the stack root', async () => {
  const values: boolean[] = [];
  function Index() {
    values.push(useCanDismiss());
    return <Text>Index</Text>;
  }

  await renderRouter({
    _layout: () => <Stack />,
    index: Index,
  });

  expect(values).toEqual([false]);
});

it('matches router.canDismiss() in an anchored stack opened at a deep link', async () => {
  const values: boolean[] = [];
  function B() {
    values.push(useCanDismiss());
    return <Text>B</Text>;
  }

  await renderRouter(
    {
      _layout: {
        unstable_settings: { anchor: 'a' },
        default: () => <Stack />,
      },
      a: () => <Text>A</Text>,
      b: B,
    },
    { initialUrl: '/b' }
  );

  expect(values).toEqual([true]);
  expect(router.canDismiss()).toBe(true);
});
