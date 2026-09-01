import { act } from '@testing-library/react-native';

import { router } from '../../imperative-api';
import Stack from '../../layouts/Stack';
import Tabs from '../../layouts/Tabs';
import { renderRouter } from '../../testing-library';

describe('canDismiss route structures', () => {
  it('tracks history in a root stack', () => {
    renderRouter({ index: () => null, detail: () => null });

    expect(router.canDismiss()).toBe(false);
    act(() => router.push('/detail'));
    expect(router.canDismiss()).toBe(true);
  });

  it('detects an anchored initial stack', () => {
    renderRouter(
      {
        _layout: {
          unstable_settings: { initialRouteName: 'index' },
          default: () => <Stack />,
        },
        index: () => null,
        detail: () => null,
      },
      { initialUrl: '/detail' }
    );

    expect(router.canDismiss()).toBe(true);
  });

  it('does not treat tab history as dismissable', () => {
    renderRouter(
      {
        _layout: () => (
          <Tabs>
            <Tabs.Screen name="one" />
            <Tabs.Screen name="two" />
          </Tabs>
        ),
        one: () => null,
        two: () => null,
      },
      { initialUrl: '/one' }
    );

    expect(router.canDismiss()).toBe(false);
    act(() => router.push('/two'));
    expect(router.canDismiss()).toBe(false);
  });

  it('tracks a focused stack nested inside tabs', () => {
    renderRouter(
      {
        _layout: () => (
          <Tabs>
            <Tabs.Screen name="one" />
            <Tabs.Screen name="two" />
          </Tabs>
        ),
        'one/_layout': () => <Stack />,
        'one/index': () => null,
        'one/detail': () => null,
        two: () => null,
      },
      { initialUrl: '/one' }
    );

    expect(router.canDismiss()).toBe(false);
    act(() => router.push('/one/detail'));
    expect(router.canDismiss()).toBe(true);
  });

  it('ignores history in an unfocused nested stack', () => {
    renderRouter(
      {
        _layout: () => (
          <Tabs>
            <Tabs.Screen name="one" />
            <Tabs.Screen name="two" />
          </Tabs>
        ),
        'one/_layout': () => <Stack />,
        'one/index': () => null,
        'one/detail': () => null,
        two: () => null,
      },
      { initialUrl: '/one' }
    );

    act(() => router.push('/one/detail'));
    expect(router.canDismiss()).toBe(true);

    act(() => router.push('/two'));
    expect(router.canDismiss()).toBe(false);
  });

  it('does not treat a prefetched stack route as dismissable', () => {
    renderRouter({ index: () => null, detail: () => null });

    act(() => router.prefetch('/detail'));

    expect(router.canDismiss()).toBe(false);
  });
});
