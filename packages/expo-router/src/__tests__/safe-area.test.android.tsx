// Both native platforms share the leaf padding contract; Android also retains its bottom tab wrapper.
import './safe-area.test.ios';
import { ScrollView, View } from 'react-native';

import { router } from '../imperative-api';
import { Stack } from '../layouts/Stack';
import { NativeTabs } from '../native-tabs';
import { act, renderRouter, screen } from '../testing-library';

test.each([undefined, false, true])(
  'preserves the Android bottom tab wrapper with disableAutomaticContentInsets=%s',
  (disable) => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index" disableAutomaticContentInsets={disable} />
        </NativeTabs>
      ),
      index: () => <View />,
    });
    if (disable) {
      expect(screen.queryByTestId('tabs-bottom-safe-area')).toBeNull();
    } else {
      expect(screen.getByTestId('tabs-bottom-safe-area').props.edges).toEqual({ bottom: true });
    }
    expect(screen.getByTestId('leaf-safe-area').props.edges).toEqual({
      left: !disable,
      right: !disable,
      top: false,
      bottom: false,
    });
  }
);

test('Android form sheets retain the automatic leaf wrapper', () => {
  renderRouter({
    _layout: () => (
      <Stack>
        <Stack.Screen name="sheet" options={{ presentation: 'formSheet' }} />
      </Stack>
    ),
    index: () => <View />,
    sheet: () => <ScrollView testID="sheet" />,
  });
  act(() => router.push('/sheet'));
  expect(screen.getByTestId('sheet')).toBeVisible();
  expect(screen.getAllByTestId('leaf-safe-area', { includeHiddenElements: true })).toHaveLength(2);
});
