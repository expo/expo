import * as Linking from 'expo-linking';

import { emitDomDismiss, emitDomDismissAll, emitDomGoBack } from '../../domComponents/emitDomEvent';
import { navigationRef } from '../navigationRef';
import {
  canDismiss,
  canGoBack,
  createImperativeRouter,
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
  router,
  setParams,
} from '../router';

jest.mock('../navigationRef', () => ({
  navigationRef: {
    isReady: jest.fn(() => true),
    getRootState: jest.fn(),
    current: {
      canDismiss: jest.fn(),
      canGoBack: jest.fn(),
      setParams: jest.fn(),
      goBack: jest.fn(),
      getRootState: jest.fn(),
      dispatch: jest.fn(),
    },
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

const mockAdd = jest.fn();
const mockEmitDomDismiss = emitDomDismiss as jest.Mock;
const mockEmitDomDismissAll = emitDomDismissAll as jest.Mock;
const mockEmitDomGoBack = emitDomGoBack as jest.Mock;
beforeEach(() => {
  jest.clearAllMocks();
  (navigationRef.isReady as jest.Mock).mockReturnValue(true);
  (navigationRef.getRootState as jest.Mock).mockReturnValue(undefined);
});

it('throws before the module-level router is installed', () => {
  expect(() => navigate('/first')).toThrow('first render');

  Object.assign(router, createImperativeRouter(mockAdd));
});

describe('canDismiss', () => {
  it('returns false without reading the ref when navigation is not ready', () => {
    (navigationRef.isReady as jest.Mock).mockReturnValue(false);

    expect(canDismiss()).toBe(false);
    expect(navigationRef.current!.canDismiss).not.toHaveBeenCalled();
  });

  it.each([false, true])('forwards %s from the navigation container', (value) => {
    (navigationRef.current!.canDismiss as jest.Mock).mockReturnValue(value);

    expect(canDismiss()).toBe(value);
    expect(navigationRef.current!.canDismiss).toHaveBeenCalledTimes(1);
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
    expect(navigationRef.current!.goBack).not.toHaveBeenCalled();
  });

  it('queues GO_BACK for ../ href', () => {
    linkTo('../');

    expect(mockAdd).toHaveBeenCalledWith({
      type: 'ACTION',
      payload: { action: { type: 'GO_BACK' } },
    });
    expect(navigationRef.current!.goBack).not.toHaveBeenCalled();
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
    prefetch('/path', { withAnchor: true });

    expect(mockAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'NAVIGATE_TO_HREF',
        payload: expect.objectContaining({
          options: expect.objectContaining({ event: 'PRELOAD', withAnchor: true }),
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

    expect(navigationRef.isReady).not.toHaveBeenCalled();
    expect(mockAdd).toHaveBeenCalledWith({
      type: 'ACTION',
      payload: { action: { type: 'GO_BACK' } },
    });
  });

  it('reload throws not implemented', () => {
    expect(() => reload()).toThrow('not implemented');
  });

  it('canGoBack returns false when navigation not ready', () => {
    (navigationRef.isReady as jest.Mock).mockReturnValueOnce(false);

    expect(canGoBack()).toBe(false);
  });

  it('canGoBack delegates to navigationRef.current.canGoBack()', () => {
    (navigationRef.current!.canGoBack as jest.Mock).mockReturnValueOnce(true);

    expect(canGoBack()).toBe(true);
    expect(navigationRef.current!.canGoBack).toHaveBeenCalled();
  });

  it('setParams checks navigation readiness', () => {
    setParams({ name: 'test' });

    expect(navigationRef.isReady).toHaveBeenCalled();
    expect(navigationRef.current!.setParams).toHaveBeenCalledWith({ name: 'test' });
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
    expect(navigationRef.isReady).not.toHaveBeenCalled();
  });
});
