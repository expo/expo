import { fireEvent, screen } from '@testing-library/react-native';
import { Pressable, View } from 'react-native';

import { useRouter } from '../../hooks';
import Stack from '../../layouts/Stack';
import { Link } from '../../link/Link';
import { renderRouter } from '../../testing-library';

describe('Unmatched', () => {
  it('can create a link to the unmatched route', async () => {
    await expect(
      renderRouter({
        _layout: () => <Stack />,
        index: () => (
          <View>
            <Link href="/404" testID="unmatched-link" />
          </View>
        ),
      })
    ).resolves.not.toThrow();
    expect(screen.getByTestId('unmatched-link')).toBeVisible();
  });

  it('can create a prefetch link to the unmatched route', async () => {
    await expect(
      renderRouter({
        _layout: () => <Stack />,
        index: () => (
          <View>
            <Link href="/404" testID="unmatched-link" prefetch />
          </View>
        ),
      })
    ).resolves.not.toThrow();
    expect(screen.getByTestId('unmatched-link')).toBeVisible();
  });

  it('can run router prefetch to the unmatched route', async () => {
    await renderRouter({
      _layout: () => <Stack />,
      index: function Index() {
        const router = useRouter();
        return (
          <View>
            <Pressable testID="router-prefetch" onPress={() => router.prefetch('/404')} />
          </View>
        );
      },
    });
    await expect(fireEvent.press(screen.getByTestId('router-prefetch'))).resolves.not.toThrow();
  });
});
