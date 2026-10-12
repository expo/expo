/** @jest-environment jsdom */
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-screens/experimental';

import { Stack } from '../layouts/Stack';
import { renderRouter } from '../testing-library';

jest.mock('react-native-screens/experimental', () => ({
  ...jest.requireActual('react-native-screens/experimental'),
  SafeAreaView: jest.fn(() => null),
}));

test('native safe area settings do not wrap web route content', async () => {
  const Page = jest.fn(() => <View testID="content" />);
  const result = await renderRouter({
    _layout: () => (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" safeAreaEdges={{ horizontal: true, vertical: true }} />
      </Stack>
    ),
    index: Page,
  });
  try {
    expect(Page).toHaveBeenCalled();
    expect(SafeAreaView).not.toHaveBeenCalled();
  } finally {
    result.unmount();
    jest.useRealTimers();
  }
});
