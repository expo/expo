import { useEffect } from 'react';
import { Text } from 'react-native';

import Stack from '../layouts/Stack';
import { router } from '../imperative-api';
import { act, renderRouter } from '../testing-library';
import { useNavigation } from '../useNavigation';

const names = (state: { routes: { name: string }[] }) => state.routes.map((r) => r.name);

it('getState() in a state listener matches event.data.state', async () => {
  const fromGetState: string[][] = [];
  const fromEvent: string[][] = [];

  function Sheet() {
    const navigation = useNavigation();
    useEffect(
      () =>
        navigation.addListener('state', (event: any) => {
          fromGetState.push(names(navigation.getState()!));
          fromEvent.push(names(event.data.state));
        }),
      [navigation]
    );
    return <Text>Sheet</Text>;
  }

  await renderRouter(
    {
      _layout: () => <Stack />,
      index: () => <Text>Home</Text>,
      sheet: Sheet,
      detail: () => <Text>Detail</Text>,
    },
    { initialUrl: '/' }
  );
  await act(async () => router.push('/sheet'));
  await act(async () => router.navigate('/detail'));

  expect(fromEvent.at(-1)).toEqual(['index', 'sheet', 'detail']);
  expect(fromGetState.at(-1)).toEqual(['index', 'sheet', 'detail']);
});
