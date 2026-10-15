import { act } from '@testing-library/react-native';
import { Text } from 'react-native';

import { router } from '../exports';
import Stack from '../layouts/Stack';
import { renderRouter } from '../testing-library';
import { getSafeAreaViewEdges, HORIZONTAL_EDGES } from './getSafeAreaViewEdges';

it('does not wrap a screen', async () => {
  await renderRouter({
    _layout: () => <Stack />,
    index: () => <Text testID="index" />,
  });

  expect(getSafeAreaViewEdges('index')).toEqual([]);
});

it('wraps screens of a navigator that sets the prop to false, until a nested navigator sets it to true', async () => {
  await renderRouter({
    _layout: () => <Stack />,
    index: () => <Text testID="index" />,
    'enabled/_layout': () => <Stack disableAutomaticHorizontalSafeAreaInsets={false} />,
    'enabled/index': () => <Text testID="enabled" />,
    'enabled/disabled/_layout': () => <Stack disableAutomaticHorizontalSafeAreaInsets />,
    'enabled/disabled/index': () => <Text testID="disabled" />,
  });

  await act(() => router.push('/enabled'));
  await act(() => router.push('/enabled/disabled'));

  expect(getSafeAreaViewEdges('index')).toEqual([]);
  expect(getSafeAreaViewEdges('enabled')).toEqual([HORIZONTAL_EDGES]);
  expect(getSafeAreaViewEdges('disabled')).toEqual([]);
});

it('applies all insets once when there is no root layout', async () => {
  await renderRouter({
    index: () => <Text testID="index" />,
  });

  // The default navigator has no `SafeAreaView` on Android.
  expect(getSafeAreaViewEdges('index')).toEqual(
    process.env.EXPO_OS === 'android'
      ? []
      : [{ top: 'additive', right: 'additive', bottom: 'additive', left: 'additive' }]
  );
});
