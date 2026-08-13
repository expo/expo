import * as Linking from 'expo-linking';

import { emitDomDismiss, emitDomDismissAll, emitDomGoBack } from '../../domComponents/emitDomEvent';
import {
  canDismiss,
  canGoBack,
  dismiss,
  dismissAll,
  dismissTo,
  goBack,
  linkTo,
  navigate,
  prefetch,
  push,
  reload,
  replace,
  setParams,
} from '../router';
import { routingQueue } from '../routingQueue';
import { store } from '../store';

jest.mock('../store', () => ({
  store: {
    assertIsReady: jest.fn(),
    navigationRef: {
      isReady: jest.fn(() => true),
      current: {
        canGoBack: jest.fn(),
        setParams: jest.fn(),
        goBack: jest.fn(),
        getRootState: jest.fn(),
        dispatch: jest.fn(),
      },
    },
    state: undefined as any,
    linking: { getStateFromPath: jest.fn(), config: {} },
    getRouteInfo: jest.fn(() => ({ pathname: '/', segments: [], params: {} })),
    redirects: [],
  },
}));

jest.mock('../routingQueue', () => ({
  routingQueue: {
    add: jest.fn(),
  },
}));

jest.mock('expo/dom', () => ({
  IS_DOM: false,
}));

jest.mock('expo-linking', () => ({
  openURL: jest.fn(),
}));

jest.mock('../../domComponents/emitDomEvent', () => ({
  emitDomDismiss: jest.fn(() => false),
  emitDomDismissAll: jest.fn(() => false),
  emitDomGoBack: jest.fn(() => false),
  emitDomLinkEvent: jest.fn(() => false),
  emitDomSetParams: jest.fn(() => false),
}));

jest.mock('../../link/href', () => ({
  resolveHref: jest.fn((href: any) => (typeof href === 'string' ? href : href.pathname || '/')),
}));

const mockAdd = routingQueue.add as jest.Mock;
const mockEmitDomDismiss = emitDomDismiss as jest.Mock;
const mockEmitDomDismissAll = emitDomDismissAll as jest.Mock;
const mockEmitDomGoBack = emitDomGoBack as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  (store as any).state = undefined;
});

describe('canDismiss', () => {
  it('returns false when state is undefined', () => {
    (store as any).state = undefined;
    expect(canDismiss()).toBe(false);
  });

  it('returns false for single-route stack', () => {
    (store as any).state = {
      type: 'stack',
      routes: [{ name: 'home' }],
      index: 0,
    };
    expect(canDismiss()).toBe(false);
  });

  it('returns true for stack with >1 routes', () => {
    (store as any).state = {
      type: 'stack',
      routes: [{ name: 'home' }, { name: 'detail' }],
      index: 1,
    };
    expect(canDismiss()).toBe(true);
  });

  it('traverses nested navigators (tab → stack with 2 routes → true)', () => {
    (store as any).state = {
      type: 'tab',
      routes: [
        {
          name: 'tab1',
          state: {
            type: 'stack',
            routes: [{ name: 'page1' }, { name: 'page2' }],
            index: 1,
          },
        },
      ],
      index: 0,
    };
    expect(canDismiss()).toBe(true);
  });

  it('returns false when index is undefined in state', () => {
    (store as any).state = {
      type: 'tab',
      routes: [{ name: 'tab1' }],
    };
    expect(canDismiss()).toBe(false);
  });

  it('returns false for non-stack navigator with single route', () => {
    (store as any).state = {
      type: 'tab',
      routes: [
        {
          name: 'tab1',
          state: {
            type: 'stack',
            routes: [{ name: 'only-page' }],
            index: 0,
          },
        },
      ],
      index: 0,
    };
    expect(canDismiss()).toBe(false);
  });

  it('traverses deeply nested navigators (tab → stack → tab → stack with 2 routes)', () => {
    (store as any).state = {
      type: 'tab',
      routes: [
        {
          name: 'tab1',
          state: {
            type: 'stack',
            routes: [
              {
                name: 'nested-tab',
                state: {
                  type: 'tab',
                  routes: [
                    {
                      name: 'inner-tab',
                      state: {
                        type: 'stack',
                        routes: [{ name: 'page1' }, { name: 'page2' }],
                        index: 1,
                      },
                    },
                  ],
                  index: 0,
                },
              },
            ],
            index: 0,
          },
        },
      ],
      index: 0,
    };
    expect(canDismiss()).toBe(true);
  });
});

describe('linkTo', () => {
  it('enqueues NAVIGATE_TO_HREF intent with href and options for normal paths', () => {
    linkTo('/home', { event: 'NAVIGATE' });

    expect(mockAdd).toHaveBeenCalledWith({
      type: 'NAVIGATE_TO_HREF',
      payload: {
        href: '/home',
        options: { event: 'NAVIGATE' },
      },
    });
  });

  it('opens external URLs via Linking.openURL', () => {
    linkTo('https://example.com');

    expect(Linking.openURL).toHaveBeenCalledWith('https://example.com');
    expect(mockAdd).not.toHaveBeenCalled();
  });

  it('prepends https: to //-prefixed external URLs on non-web platform', () => {
    linkTo('//example.com');

    expect(Linking.openURL).toHaveBeenCalledWith('https://example.com');
  });

  // https://linear.app/expo/issue/ENG-20200/investigate-why-navigationrefgoback-is-called-when-href-is-or
  it('queues GO_BACK for .. href', () => {
    linkTo('..');

    expect(mockAdd).toHaveBeenCalledWith({
      type: 'ACTION',
      payload: { action: { type: 'GO_BACK' } },
    });
    expect(store.navigationRef.current!.goBack).not.toHaveBeenCalled();
  });

  it('queues GO_BACK for ../ href', () => {
    linkTo('../');

    expect(mockAdd).toHaveBeenCalledWith({
      type: 'ACTION',
      payload: { action: { type: 'GO_BACK' } },
    });
    expect(store.navigationRef.current!.goBack).not.toHaveBeenCalled();
  });

  it('resolves object hrefs via resolveHref', () => {
    linkTo({ pathname: '/profile', params: { id: '1' } });

    expect(mockAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'NAVIGATE_TO_HREF',
        payload: expect.objectContaining({
          href: '/profile',
        }),
      })
    );
  });
});

describe('router action functions', () => {
  it('navigate enqueues NAVIGATE_TO_HREF intent with NAVIGATE event', () => {
    navigate('/path');

    expect(mockAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'NAVIGATE_TO_HREF',
        payload: expect.objectContaining({
          options: expect.objectContaining({ event: 'NAVIGATE' }),
        }),
      })
    );
  });

  it('push enqueues NAVIGATE_TO_HREF intent with PUSH event', () => {
    push('/path');

    expect(mockAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'NAVIGATE_TO_HREF',
        payload: expect.objectContaining({
          options: expect.objectContaining({ event: 'PUSH' }),
        }),
      })
    );
  });

  it('replace enqueues NAVIGATE_TO_HREF intent with REPLACE event', () => {
    replace('/path');

    expect(mockAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'NAVIGATE_TO_HREF',
        payload: expect.objectContaining({
          options: expect.objectContaining({ event: 'REPLACE' }),
        }),
      })
    );
  });

  it('prefetch enqueues NAVIGATE_TO_HREF intent with PRELOAD event', () => {
    prefetch('/path');

    expect(mockAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'NAVIGATE_TO_HREF',
        payload: expect.objectContaining({
          options: expect.objectContaining({ event: 'PRELOAD' }),
        }),
      })
    );
  });

  it('dismissTo enqueues NAVIGATE_TO_HREF intent with POP_TO event', () => {
    dismissTo('/path');

    expect(mockAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'NAVIGATE_TO_HREF',
        payload: expect.objectContaining({
          options: expect.objectContaining({ event: 'POP_TO' }),
        }),
      })
    );
  });

  it('dismiss(2) enqueues a POP action with count 2', () => {
    dismiss(2);

    expect(mockAdd).toHaveBeenCalledWith({
      type: 'ACTION',
      payload: { action: { type: 'POP', payload: { count: 2 } } },
    });
  });

  it('dismiss() defaults count to 1', () => {
    dismiss();

    expect(mockAdd).toHaveBeenCalledWith({
      type: 'ACTION',
      payload: { action: { type: 'POP', payload: { count: 1 } } },
    });
  });

  it('dismissAll enqueues a POP_TO_TOP action', () => {
    dismissAll();

    expect(mockAdd).toHaveBeenCalledWith({
      type: 'ACTION',
      payload: { action: { type: 'POP_TO_TOP' } },
    });
  });

  it('goBack enqueues GO_BACK without requiring the container to be ready', () => {
    goBack();

    expect(store.assertIsReady).not.toHaveBeenCalled();
    expect(mockAdd).toHaveBeenCalledWith({
      type: 'ACTION',
      payload: { action: { type: 'GO_BACK' } },
    });
  });

  it('reload throws not implemented', () => {
    expect(() => reload()).toThrow('not implemented');
  });

  it('canGoBack returns false when navigation not ready', () => {
    (store.navigationRef.isReady as jest.Mock).mockReturnValueOnce(false);

    expect(canGoBack()).toBe(false);
  });

  it('canGoBack delegates to navigationRef.current.canGoBack()', () => {
    (store.navigationRef.current!.canGoBack as jest.Mock).mockReturnValueOnce(true);

    expect(canGoBack()).toBe(true);
    expect(store.navigationRef.current!.canGoBack).toHaveBeenCalled();
  });

  it('setParams calls store.assertIsReady', () => {
    setParams({ name: 'test' });

    expect(store.assertIsReady).toHaveBeenCalled();
    expect(store.navigationRef.current!.setParams).toHaveBeenCalledWith({ name: 'test' });
  });
});

describe('DOM short-circuit paths', () => {
  it('dismiss short-circuits when emitDomDismiss returns true', () => {
    mockEmitDomDismiss.mockReturnValueOnce(true);

    dismiss(1);

    expect(mockEmitDomDismiss).toHaveBeenCalledWith(1);
    expect(mockAdd).not.toHaveBeenCalled();
  });

  it('dismissAll short-circuits when emitDomDismissAll returns true', () => {
    mockEmitDomDismissAll.mockReturnValueOnce(true);

    dismissAll();

    expect(mockEmitDomDismissAll).toHaveBeenCalled();
    expect(mockAdd).not.toHaveBeenCalled();
  });

  it('goBack short-circuits when emitDomGoBack returns true', () => {
    mockEmitDomGoBack.mockReturnValueOnce(true);

    goBack();

    expect(mockEmitDomGoBack).toHaveBeenCalled();
    expect(mockAdd).not.toHaveBeenCalled();
    expect(store.assertIsReady).not.toHaveBeenCalled();
  });
});
