import { Stack } from '../../../layouts/JSStack';
import { Tabs } from '../../../layouts/Tabs';
import { renderRouter } from '../../../testing-library';
import { useHeaderHeight } from '../Header/useHeaderHeight';

test('JS Stack headerStatusBarHeight sets the header offset', async () => {
  let headerHeight: number | undefined;

  await renderRouter({
    _layout: () => <Stack screenOptions={{ headerStatusBarHeight: 40 }} />,
    index: function Index() {
      headerHeight = useHeaderHeight();
      return null;
    },
  });

  expect(headerHeight).toBe(40 + 44);
});

test('JS Tabs headerStatusBarHeight sets the header offset', async () => {
  let headerHeight: number | undefined;

  await renderRouter({
    _layout: () => (
      <Tabs screenOptions={{ headerStatusBarHeight: 40 }}>
        <Tabs.Screen name="index" />
      </Tabs>
    ),
    index: function Index() {
      headerHeight = useHeaderHeight();
      return null;
    },
  });

  expect(headerHeight).toBe(40 + 44);
});
