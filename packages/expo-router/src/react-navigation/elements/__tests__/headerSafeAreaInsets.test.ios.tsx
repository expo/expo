import { Stack } from '../../../layouts/JSStack';
import { Tabs } from '../../../layouts/Tabs';
import { renderRouter } from '../../../testing-library';
import { useHeaderHeight } from '../Header/useHeaderHeight';

test('JS Stack safeAreaInsets.top sets the header offset', async () => {
  let headerHeight: number | undefined;

  await renderRouter({
    _layout: () => <Stack safeAreaInsets={{ top: 100 }} />,
    index: function Index() {
      headerHeight = useHeaderHeight();
      return null;
    },
  });

  expect(headerHeight).toBeGreaterThanOrEqual(100);
});

test('JS Tabs safeAreaInsets.top sets the header offset', async () => {
  let headerHeight: number | undefined;

  await renderRouter({
    _layout: () => (
      <Tabs safeAreaInsets={{ top: 100 }}>
        <Tabs.Screen name="index" />
      </Tabs>
    ),
    index: function Index() {
      headerHeight = useHeaderHeight();
      return null;
    },
  });

  expect(headerHeight).toBeGreaterThanOrEqual(100);
});
