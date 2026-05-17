import { storeRef } from '../store';
import { clearAndroidStateOnBackgroundUnmount } from '../useStore';

describe('Android router state reuse', () => {
  beforeEach(() => {
    storeRef.current = {} as typeof storeRef.current;
  });

  it('clears preserved navigation state when the root unmounts after the app backgrounds', () => {
    const state = { index: 0, routes: [{ name: 'explore' }] } as any;
    const routeInfo = { pathname: '/explore' } as any;

    storeRef.current = {
      ...storeRef.current,
      state,
      routeInfo,
    };

    clearAndroidStateOnBackgroundUnmount('background');

    expect(storeRef.current.state).toBeUndefined();
    expect(storeRef.current.routeInfo).toBeUndefined();
  });

  it('keeps preserved navigation state for foreground activity recreation', () => {
    const state = { index: 0, routes: [{ name: 'explore' }] } as any;
    const routeInfo = { pathname: '/explore' } as any;

    storeRef.current = {
      ...storeRef.current,
      state,
      routeInfo,
    };

    clearAndroidStateOnBackgroundUnmount('active');

    expect(storeRef.current.state).toBe(state);
    expect(storeRef.current.routeInfo).toBe(routeInfo);
  });
});
