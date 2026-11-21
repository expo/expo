import { act } from '@testing-library/react-native';
import { memo } from 'react';
import { Text } from 'react-native';

import Stack from '../../../../layouts/StackClient';
import Tabs from '../../../../layouts/TabsClient';
import { renderRouter } from '../../../../testing-library';
import { useNavigation, useRoute } from '../../../core';

it('does not re-render a memoized component that reads its route when another tab in a stack is selected', async () => {
  const renders = jest.fn();
  let navigateInTabs: ((name: string) => void) | undefined;
  const FirstContent = memo(function FirstContent() {
    useRoute();
    const navigation = useNavigation();
    // The route names are this test's own, which the untyped navigator cannot know.
    navigateInTabs = (name) => navigation.navigate(name as never);
    renders('first');
    return <Text>First</Text>;
  });
  const SecondContent = memo(function SecondContent() {
    useRoute();
    renders('second');
    return <Text>Second</Text>;
  });

  await renderRouter(
    {
      '(app)/_layout': () => <Stack screenOptions={{ headerShown: false }} />,
      '(app)/(tabs)/_layout': () => (
        <Tabs tabBar={() => null}>
          <Tabs.Screen name="first" />
          <Tabs.Screen name="second" />
        </Tabs>
      ),
      '(app)/(tabs)/first': () => <FirstContent />,
      '(app)/(tabs)/second': () => <SecondContent />,
    },
    { initialUrl: '/first' }
  );
  // Both tabs have rendered once, so every render after this is a re-render.
  await act(() => navigateInTabs!('second'));
  renders.mockClear();

  await act(() => navigateInTabs!('first'));
  await act(() => navigateInTabs!('second'));

  expect(renders).not.toHaveBeenCalled();
});
