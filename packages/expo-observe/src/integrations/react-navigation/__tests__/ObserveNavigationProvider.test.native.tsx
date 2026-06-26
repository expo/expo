/* eslint-disable @typescript-eslint/no-require-imports */
import { render } from '@testing-library/react-native';
import { use } from 'react';
import { Text } from 'react-native';

import {
  ObserveReactNavigationIntegrationContext,
  type ReactNavigationIntegrationContextValue,
} from '../context';
import * as initModule from '../init';

jest.mock('expo-app-metrics', () => {
  const mainSession = {
    id: 'session-1',
    type: 'main',
    startDate: '2026-01-01T00:00:00.000Z',
    addMetric: jest.fn(),
  };
  return {
    __esModule: true,
    default: {
      markInteractive: jest.fn(),
      getMainSession: jest.fn(() => mainSession),
    },
  };
});

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

// Mutable mock so individual tests can simulate @react-navigation/native being
// missing. The component reads the export at use time (CJS interop), so the
// getter is consulted on every render.
jest.mock('../reactNavigation', () => {
  const state = { optionalReactNavigation: {} as unknown };
  return {
    __esModule: true,
    get optionalReactNavigation() {
      return state.optionalReactNavigation;
    },
    get isReactNavigationInstalled() {
      return !!state.optionalReactNavigation;
    },
    __setOptionalReactNavigation: (value: unknown) => {
      state.optionalReactNavigation = value;
    },
  };
});

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
const reactNavigationModule = require('../reactNavigation') as {
  __setOptionalReactNavigation: (value: unknown) => void;
};
const mockAddMetric = (
  require('expo-app-metrics').default as {
    getMainSession: () => { addMetric: jest.Mock };
  }
).getMainSession().addMetric;

const mockIsInitialized = initModule.isInitialized as jest.Mock;
const attachActionListenerMock = actionListenerModule.attachActionListener;
const attachActionListenerCleanup = actionListenerModule.__cleanup;
const createStateChangeHandlerMock = handleStateChangeModule.createStateChangeHandler;
const stateChangeHandler = handleStateChangeModule.__handler;

// A user-created ref, as returned by `useNavigationContainerRef()` /
// `createNavigationContainerRef()`.
const stateListenerCleanup = jest.fn();
const fakeNavigationRef = {
  addListener: jest.fn((event: string, _cb: (e?: unknown) => void) =>
    event === 'state' ? stateListenerCleanup : () => {}
  ),
  getRootState: jest.fn((): unknown => undefined),
  isReady: jest.fn(() => false),
};

type NavigationRefProp = Parameters<typeof ObserveNavigationProvider>[0]['navigationRef'];

function getStateListener(): ((e?: unknown) => void) | undefined {
  const call = fakeNavigationRef.addListener.mock.calls.find(([event]) => event === 'state');
  return call?.[1] as ((e?: unknown) => void) | undefined;
}

function ContextProbe({
  onRead,
}: {
  onRead: (value: ReactNavigationIntegrationContextValue | null) => void;
}) {
  const value = use(ObserveReactNavigationIntegrationContext);
  onRead(value);
  return <Text>probe</Text>;
}

function flushAsync() {
  return new Promise((resolve) => setImmediate(resolve));
}

beforeEach(() => {
  jest.clearAllMocks();
  mockIsInitialized.mockReturnValue(true);
  reactNavigationModule.__setOptionalReactNavigation({});
  fakeNavigationRef.isReady.mockReturnValue(false);
  fakeNavigationRef.getRootState.mockReturnValue(undefined);
  // mockReset (not just clear) so the real-implementation swap done by the
  // exactly-once test below can never leak into other tests.
  createStateChangeHandlerMock.mockReset().mockReturnValue(stateChangeHandler);
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
      (reads[0] as ReactNavigationIntegrationContextValue).storage.interactiveScreensIds
    ).toBeInstanceOf(Set);
  });

  it('exposes a null context and attaches no listeners when not initialized', () => {
    mockIsInitialized.mockReturnValue(false);
    const reads: unknown[] = [];
    render(
      <ObserveNavigationProvider navigationRef={fakeNavigationRef as never}>
        <ContextProbe onRead={(v) => reads.push(v)} />
      </ObserveNavigationProvider>
    );
    expect(reads[0]).toBeNull();
    expect(attachActionListenerMock).not.toHaveBeenCalled();
    expect(fakeNavigationRef.addListener).not.toHaveBeenCalled();
  });

  it('attaches the action listener with the provided ref and detaches both listeners on unmount', () => {
    const { unmount } = render(
      <ObserveNavigationProvider navigationRef={fakeNavigationRef as never}>
        <Text>child</Text>
      </ObserveNavigationProvider>
    );
    expect(attachActionListenerMock).toHaveBeenCalledTimes(1);
    expect(attachActionListenerMock.mock.calls[0][0]).toBe(fakeNavigationRef);
    expect(getStateListener()).toBeDefined();

    expect(attachActionListenerCleanup).not.toHaveBeenCalled();
    expect(stateListenerCleanup).not.toHaveBeenCalled();
    unmount();
    expect(attachActionListenerCleanup).toHaveBeenCalledTimes(1);
    expect(stateListenerCleanup).toHaveBeenCalledTimes(1);
  });

  it('drives the state handler from the `state` ref event, reading getRootState() over the event payload', () => {
    render(
      <ObserveNavigationProvider navigationRef={fakeNavigationRef as never}>
        <Text>child</Text>
      </ObserveNavigationProvider>
    );
    const stateListener = getStateListener();
    expect(stateListener).toBeDefined();
    expect(stateChangeHandler).not.toHaveBeenCalled();

    // The `state` event payload can be partial on the initial commit, so the
    // listener must read the hydrated state from getRootState() instead.
    const rootState = { index: 0, routes: [{ key: 'a', name: 'A' }] };
    const staleEventState = { index: 0, routes: [] };
    fakeNavigationRef.getRootState.mockReturnValue(rootState);
    stateListener!({ data: { state: staleEventState } });

    expect(stateChangeHandler).toHaveBeenCalledTimes(1);
    expect(stateChangeHandler).toHaveBeenCalledWith(rootState);
  });

  it('forwards each subsequent state change to the handler', () => {
    render(
      <ObserveNavigationProvider navigationRef={fakeNavigationRef as never}>
        <Text>child</Text>
      </ObserveNavigationProvider>
    );
    const stateListener = getStateListener()!;

    const first = { index: 0, routes: [{ key: 'a', name: 'A' }] };
    const second = {
      index: 1,
      routes: [
        { key: 'a', name: 'A' },
        { key: 'b', name: 'B' },
      ],
    };
    fakeNavigationRef.getRootState.mockReturnValueOnce(first).mockReturnValueOnce(second);
    stateListener();
    stateListener();

    expect(stateChangeHandler).toHaveBeenNthCalledWith(1, first);
    expect(stateChangeHandler).toHaveBeenNthCalledWith(2, second);
  });

  it('catches up on the initial state when the container is already ready at mount', () => {
    // By the time the provider effect runs, the container (a child) has
    // already emitted its initial `state` event, so the listener missed it.
    const initialState = { index: 0, routes: [{ key: 'a', name: 'A' }] };
    fakeNavigationRef.isReady.mockReturnValue(true);
    fakeNavigationRef.getRootState.mockReturnValue(initialState);

    render(
      <ObserveNavigationProvider navigationRef={fakeNavigationRef as never}>
        <Text>child</Text>
      </ObserveNavigationProvider>
    );

    expect(stateChangeHandler).toHaveBeenCalledTimes(1);
    expect(stateChangeHandler).toHaveBeenCalledWith(initialState);
  });

  it('skips the catch-up when the container is not ready yet and relies on the state listener', () => {
    fakeNavigationRef.isReady.mockReturnValue(false);
    render(
      <ObserveNavigationProvider navigationRef={fakeNavigationRef as never}>
        <Text>child</Text>
      </ObserveNavigationProvider>
    );
    expect(stateChangeHandler).not.toHaveBeenCalled();

    const initialState = { index: 0, routes: [{ key: 'a', name: 'A' }] };
    fakeNavigationRef.getRootState.mockReturnValue(initialState);
    getStateListener()!();
    expect(stateChangeHandler).toHaveBeenCalledWith(initialState);
  });

  it('does not invoke the handler from the catch-up when there is no root state', () => {
    fakeNavigationRef.isReady.mockReturnValue(true);
    fakeNavigationRef.getRootState.mockReturnValue(undefined);
    render(
      <ObserveNavigationProvider navigationRef={fakeNavigationRef as never}>
        <Text>child</Text>
      </ObserveNavigationProvider>
    );
    expect(stateChangeHandler).not.toHaveBeenCalled();
  });

  it('records the initial screen exactly once when both the catch-up and the state listener fire for the same state', async () => {
    // Integration-level dedupe contract: use the REAL handleStateChange (only
    // expo-app-metrics stays mocked) so this asserts the net effect — a single
    // cold_ttr — rather than trusting unit tests to compose.
    const actualHandleStateChange = jest.requireActual(
      '../handleStateChange'
    ) as typeof import('../handleStateChange');
    createStateChangeHandlerMock.mockImplementation(
      actualHandleStateChange.createStateChangeHandler
    );

    const initialState = {
      type: 'stack',
      index: 0,
      routes: [{ key: 'home', name: 'Home' }],
      routeNames: [],
      stale: false,
      key: 'root',
    };
    fakeNavigationRef.isReady.mockReturnValue(true);
    fakeNavigationRef.getRootState.mockReturnValue(initialState);

    render(
      <ObserveNavigationProvider navigationRef={fakeNavigationRef as never}>
        <Text>child</Text>
      </ObserveNavigationProvider>
    );
    // The same initial state also arrives through the `state` listener.
    getStateListener()!();
    await flushAsync();

    const coldTtrCalls = mockAddMetric.mock.calls.filter((c) => c[0].name === 'cold_ttr');
    expect(coldTtrCalls).toHaveLength(1);
    expect(coldTtrCalls[0][0].routeName).toBe('/Home');
    expect(mockAddMetric).toHaveBeenCalledTimes(1);
  });

  it('moves all listeners to a new ref when navigationRef identity changes between renders', () => {
    const { rerender } = render(
      <ObserveNavigationProvider navigationRef={fakeNavigationRef as never}>
        <Text>child</Text>
      </ObserveNavigationProvider>
    );
    expect(attachActionListenerMock).toHaveBeenLastCalledWith(fakeNavigationRef, expect.anything());

    const secondStateListenerCleanup = jest.fn();
    const secondNavigationRef = {
      addListener: jest.fn((event: string) =>
        event === 'state' ? secondStateListenerCleanup : () => {}
      ),
      getRootState: jest.fn((): unknown => undefined),
      isReady: jest.fn(() => true),
    };
    const initialState = { index: 0, routes: [{ key: 'a', name: 'A' }] };
    secondNavigationRef.getRootState.mockReturnValue(initialState);

    rerender(
      <ObserveNavigationProvider navigationRef={secondNavigationRef as never}>
        <Text>child</Text>
      </ObserveNavigationProvider>
    );

    // The old ref's listeners are detached, the new ref gets fresh ones, and
    // the catch-up runs against the new ref's state.
    expect(attachActionListenerCleanup).toHaveBeenCalledTimes(1);
    expect(stateListenerCleanup).toHaveBeenCalledTimes(1);
    expect(attachActionListenerMock).toHaveBeenLastCalledWith(
      secondNavigationRef,
      expect.anything()
    );
    expect(secondNavigationRef.addListener.mock.calls.some(([event]) => event === 'state')).toBe(
      true
    );
    expect(stateChangeHandler).toHaveBeenCalledWith(initialState);
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

  it('throws when @react-navigation/native is not installed', () => {
    reactNavigationModule.__setOptionalReactNavigation(undefined);
    jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() =>
      render(
        <ObserveNavigationProvider navigationRef={fakeNavigationRef as never}>
          <Text>child</Text>
        </ObserveNavigationProvider>
      )
    ).toThrow(
      "[expo-observe] ObserveNavigationProvider requires @react-navigation/native, but the package couldn't be resolved. Install @react-navigation/native, or remove the React Navigation integration if it's not needed."
    );
  });

  it.each([
    ['null', null],
    ['a plain object', {}],
    ['a React ref object', { current: null }],
    ['a ref without isReady', { addListener: () => {}, getRootState: () => undefined }],
  ])('throws when given an invalid navigationRef (%s)', (_label, badRef) => {
    jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() =>
      render(
        <ObserveNavigationProvider navigationRef={badRef as never as NavigationRefProp}>
          <Text>child</Text>
        </ObserveNavigationProvider>
      )
    ).toThrow(
      '[expo-observe] ObserveNavigationProvider received a `navigationRef` that is not a navigation container ref, so it cannot listen to navigation events. Create the ref with `useNavigationContainerRef()` (or `createNavigationContainerRef()`) and pass the same ref to both your navigation container and ObserveNavigationProvider.'
    );
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
