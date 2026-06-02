/* eslint-disable @typescript-eslint/no-require-imports */
import { render, waitFor } from '@testing-library/react-native';
import { use } from 'react';
import { Text } from 'react-native';

import { ObserveReactNavigationIntegrationContext } from '../context';
import * as initModule from '../init';

jest.mock('expo-app-metrics', () => ({
  __esModule: true,
  default: {
    markInteractive: jest.fn(),
    getMainSession: jest.fn(async () => ({ id: 'session-1' })),
    addCustomMetricToSession: jest.fn(),
  },
}));

jest.mock('../init', () => ({
  __esModule: true,
  isInitialized: jest.fn(() => true),
  initReactNavigationIntegration: jest.fn(),
}));

jest.mock('../actionListener', () => {
  const cleanup = jest.fn();
  return {
    __esModule: true,
    attachActionListener: jest.fn(() => cleanup),
    __cleanup: cleanup,
  };
});

jest.mock('../handleStateChange', () => {
  const handler = jest.fn();
  return {
    __esModule: true,
    createStateChangeHandler: jest.fn(() => handler),
    __handler: handler,
  };
});

jest.mock('@react-navigation/native', () => ({
  __esModule: true,
  getPathFromState: jest.fn(() => '/from-linking'),
}));

// Import the component AFTER setting up all mocks so it picks them up.
const { ObserveNavigationProvider } =
  require('../ObserveNavigationProvider') as typeof import('../ObserveNavigationProvider');
const actionListenerModule = require('../actionListener') as {
  attachActionListener: jest.Mock;
  __cleanup: jest.Mock;
};
const handleStateChangeModule = require('../handleStateChange') as {
  createStateChangeHandler: jest.Mock;
  __handler: jest.Mock;
};
const appMetrics = require('expo-app-metrics').default as {
  addCustomMetricToSession: jest.Mock;
  getMainSession: jest.Mock;
};

const mockIsInitialized = initModule.isInitialized as jest.Mock;
const attachActionListenerMock = actionListenerModule.attachActionListener;
const attachActionListenerCleanup = actionListenerModule.__cleanup;
const createStateChangeHandlerMock = handleStateChangeModule.createStateChangeHandler;
const stateChangeHandler = handleStateChangeModule.__handler;

// A user-created navigation ref, as produced by `useNavigationContainerRef()`.
const stateUnsubscribe = jest.fn();
const fakeNavigationRef = {
  addListener: jest.fn((event: string) => (event === 'state' ? stateUnsubscribe : () => {})),
  getRootState: jest.fn(() => undefined as unknown),
  isReady: jest.fn(() => false),
};

function getStateListener(): (() => void) | undefined {
  const call = fakeNavigationRef.addListener.mock.calls.find(([event]) => event === 'state');
  return call?.[1];
}

function ContextProbe({ onRead }: { onRead: (value: unknown) => void }) {
  const value = use(ObserveReactNavigationIntegrationContext);
  onRead(value);
  return <Text>probe</Text>;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockIsInitialized.mockReturnValue(true);
  fakeNavigationRef.isReady.mockReturnValue(false);
  fakeNavigationRef.getRootState.mockReturnValue(undefined);
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('ObserveNavigationProvider', () => {
  it('renders its children', () => {
    const { getByText } = render(
      <ObserveNavigationProvider navigationRef={fakeNavigationRef as never}>
        <Text>child</Text>
      </ObserveNavigationProvider>
    );
    expect(getByText('child')).toBeTruthy();
  });

  it('exposes a non-null context when isInitialized() is true', () => {
    const reads: unknown[] = [];
    render(
      <ObserveNavigationProvider navigationRef={fakeNavigationRef as never}>
        <ContextProbe onRead={(v) => reads.push(v)} />
      </ObserveNavigationProvider>
    );
    expect(reads[0]).toBeTruthy();
    expect(
      (reads[0] as { storage: { interactiveScreensIds: Set<string> } }).storage
        .interactiveScreensIds
    ).toBeInstanceOf(Set);
  });

  it('exposes a null context and skips attachActionListener when not initialized', () => {
    mockIsInitialized.mockReturnValue(false);
    const reads: unknown[] = [];
    render(
      <ObserveNavigationProvider navigationRef={fakeNavigationRef as never}>
        <ContextProbe onRead={(v) => reads.push(v)} />
      </ObserveNavigationProvider>
    );
    expect(reads[0]).toBeNull();
    expect(attachActionListenerMock).not.toHaveBeenCalled();
  });

  it('attaches the action listener with the passed navigationRef and runs cleanup on unmount', () => {
    const { unmount } = render(
      <ObserveNavigationProvider navigationRef={fakeNavigationRef as never}>
        <Text>child</Text>
      </ObserveNavigationProvider>
    );
    expect(attachActionListenerMock).toHaveBeenCalledTimes(1);
    expect(attachActionListenerMock.mock.calls[0][0]).toBe(fakeNavigationRef);

    expect(attachActionListenerCleanup).not.toHaveBeenCalled();
    unmount();
    expect(attachActionListenerCleanup).toHaveBeenCalledTimes(1);
  });

  it("subscribes to the 'state' event and forwards the hydrated root state to the handler", () => {
    const rootState = { index: 0, routes: [{ key: 'a', name: 'A' }] };
    fakeNavigationRef.getRootState.mockReturnValue(rootState);

    render(
      <ObserveNavigationProvider navigationRef={fakeNavigationRef as never}>
        <Text>child</Text>
      </ObserveNavigationProvider>
    );

    const stateListener = getStateListener();
    expect(typeof stateListener).toBe('function');

    // Not ready at mount, so the handler hasn't run from the initial catch-up.
    expect(stateChangeHandler).not.toHaveBeenCalled();

    stateListener!();
    expect(stateChangeHandler).toHaveBeenCalledWith(rootState);
  });

  it('records the initial state exactly once when the container is already ready', () => {
    const initialState = { index: 0, routes: [{ key: 'a', name: 'A' }] };
    fakeNavigationRef.isReady.mockReturnValue(true);
    fakeNavigationRef.getRootState.mockReturnValue(initialState);

    render(
      <ObserveNavigationProvider navigationRef={fakeNavigationRef as never}>
        <Text>child</Text>
      </ObserveNavigationProvider>
    );

    // Initial catch-up records once. The 'state' listener does NOT also fire on
    // mount in this test, so there must be no double-record.
    expect(stateChangeHandler).toHaveBeenCalledTimes(1);
    expect(stateChangeHandler).toHaveBeenCalledWith(initialState);
  });

  it('records the initial root state once when both the isReady() catch-up and the state listener fire for it', async () => {
    // The tests above mock the handler, so each verifies a record *path* in
    // isolation. This one swaps in the REAL handler for a single mount so it
    // exercises the integration-level dedupe (the focused-key guard) that the
    // catch-up and the 'state' listener jointly rely on when both fire for the
    // same initial state — rather than trusting the two unit-level paths to
    // compose. `mockImplementationOnce` auto-reverts to the shared jest.fn()
    // after the provider's single createStateChangeHandler() call, so the other
    // tests are unaffected.
    const { createStateChangeHandler: realCreateStateChangeHandler } = jest.requireActual(
      '../handleStateChange'
    ) as typeof import('../handleStateChange');
    createStateChangeHandlerMock.mockImplementationOnce(realCreateStateChangeHandler);

    const initialState = { index: 0, routes: [{ key: 'a', name: 'A' }] };
    fakeNavigationRef.isReady.mockReturnValue(true);
    fakeNavigationRef.getRootState.mockReturnValue(initialState);

    render(
      <ObserveNavigationProvider navigationRef={fakeNavigationRef as never}>
        <Text>child</Text>
      </ObserveNavigationProvider>
    );

    // The isReady() catch-up already ran the real handler during the mount
    // effect (it set previousFocusedKey synchronously, before its first await).
    // Now fire the 'state' listener with the SAME root state — the exact
    // double-handle the dedupe must absorb.
    const stateListener = getStateListener();
    expect(typeof stateListener).toBe('function');
    stateListener!();

    await waitFor(() => expect(appMetrics.addCustomMetricToSession).toHaveBeenCalledTimes(1));
    expect(appMetrics.addCustomMetricToSession).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'navigation',
        name: 'cold_ttr',
        routeName: 'A',
        params: expect.objectContaining({ isAppLaunch: true }),
      })
    );
  });

  it('does not record an initial state when the container is not ready yet', () => {
    fakeNavigationRef.isReady.mockReturnValue(false);
    fakeNavigationRef.getRootState.mockReturnValue({ index: 0, routes: [] });

    render(
      <ObserveNavigationProvider navigationRef={fakeNavigationRef as never}>
        <Text>child</Text>
      </ObserveNavigationProvider>
    );

    expect(stateChangeHandler).not.toHaveBeenCalled();
  });

  it('builds a linking-aware getPathname and passes it to createStateChangeHandler', () => {
    const linking = { prefixes: [], config: { screens: { Home: 'home' } } };
    render(
      <ObserveNavigationProvider
        navigationRef={fakeNavigationRef as never}
        linking={linking as never}>
        <Text>child</Text>
      </ObserveNavigationProvider>
    );

    const [, getPathname] = createStateChangeHandlerMock.mock.calls[0];
    expect(getPathname({ index: 0, routes: [] }, { name: 'Home' })).toBe('/from-linking');
    expect(require('@react-navigation/native').getPathFromState).toHaveBeenCalled();
  });

  it("detaches both the action listener and the 'state' listener on unmount", () => {
    const { unmount } = render(
      <ObserveNavigationProvider navigationRef={fakeNavigationRef as never}>
        <Text>child</Text>
      </ObserveNavigationProvider>
    );
    expect(attachActionListenerCleanup).not.toHaveBeenCalled();
    expect(stateUnsubscribe).not.toHaveBeenCalled();

    unmount();
    expect(attachActionListenerCleanup).toHaveBeenCalledTimes(1);
    expect(stateUnsubscribe).toHaveBeenCalledTimes(1);
  });

  it('uses the same createStateChangeHandler for the entire mount lifetime', () => {
    const { rerender } = render(
      <ObserveNavigationProvider navigationRef={fakeNavigationRef as never}>
        <Text>child</Text>
      </ObserveNavigationProvider>
    );
    rerender(
      <ObserveNavigationProvider navigationRef={fakeNavigationRef as never}>
        <Text>child</Text>
      </ObserveNavigationProvider>
    );
    expect(createStateChangeHandlerMock).toHaveBeenCalledTimes(1);
  });

  it('throws when isInitialized() flips during the provider lifetime', () => {
    mockIsInitialized.mockReturnValue(false);
    jest.spyOn(console, 'error').mockImplementation(() => {});

    const { rerender } = render(
      <ObserveNavigationProvider navigationRef={fakeNavigationRef as never}>
        <Text>child</Text>
      </ObserveNavigationProvider>
    );

    mockIsInitialized.mockReturnValue(true);
    expect(() =>
      rerender(
        <ObserveNavigationProvider navigationRef={fakeNavigationRef as never}>
          <Text>child</Text>
        </ObserveNavigationProvider>
      )
    ).toThrow(
      "[expo-observe] React Navigation integration was toggled after ObserveNavigationProvider mounted. Call `Observe.configure({ integrations: { 'react-navigation': true } })` before rendering ObserveNavigationProvider."
    );
  });
});
