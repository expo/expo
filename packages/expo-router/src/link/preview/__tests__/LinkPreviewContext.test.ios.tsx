import { act, renderHook } from '@testing-library/react-native';

import { unstable_navigationEvents } from '../../../navigationEvents';
import type { StackNavigationState } from '../../../react-navigation';
import { LinkPreviewContextProvider, useLinkPreviewContext } from '../LinkPreviewContext';

const route = (key: string) => ({ key, name: key });
const state = (
  routes = [route('ordinary')],
  preloadedRoutes = [] as ReturnType<typeof route>[]
): StackNavigationState<Record<string, undefined>> => ({
  stale: false,
  type: 'stack',
  key: 'root',
  routeKeySeq: 0,
  routeNames: ['ordinary', 'preview'],
  index: 0,
  routes: routes.concat(preloadedRoutes),
});

it.each(['missing', 'preloaded'])(
  'clears animation suppression after a %s preview falls back to ordinary navigation',
  async (kind) => {
    const { result } = await renderHook(useLinkPreviewContext, {
      wrapper: LinkPreviewContextProvider,
    });
    await act(() => result.current.setOpenPreviewKey('preview'));
    await act(() =>
      unstable_navigationEvents.emit('actionDispatched', {
        actionType: 'NAVIGATE',
        payload: { __internal__PreviewKey: 'preview' },
        state: state(undefined, kind === 'preloaded' ? [route('preview')] : []),
      })
    );
    expect(result.current.openPreviewKey).toBeUndefined();
    expect(result.current.isStackAnimationDisabled).toBe(false);
  }
);

it('retains a promoted key in a nested owning stack until its transition ends', async () => {
  const { result } = await renderHook(useLinkPreviewContext, {
    wrapper: LinkPreviewContextProvider,
  });
  await act(() => result.current.setOpenPreviewKey('preview'));
  await act(() =>
    unstable_navigationEvents.emit('actionDispatched', {
      actionType: 'NAVIGATE',
      payload: { __internal__PreviewKey: 'preview' },
      state: {
        ...state(),
        routes: [{ ...route('parent'), state: state([route('preview')]) }],
      },
    })
  );
  expect(result.current.openPreviewKey).toBe('preview');
});

it('does not let an earlier navigation report clear a newer preview', async () => {
  const { result } = await renderHook(useLinkPreviewContext, {
    wrapper: LinkPreviewContextProvider,
  });
  await act(() => result.current.setOpenPreviewKey('new-preview'));
  await act(() =>
    unstable_navigationEvents.emit('actionDispatched', {
      actionType: 'NAVIGATE',
      payload: { __internal__PreviewKey: 'old-preview' },
      state: state(),
    })
  );
  expect(result.current.openPreviewKey).toBe('new-preview');
});
