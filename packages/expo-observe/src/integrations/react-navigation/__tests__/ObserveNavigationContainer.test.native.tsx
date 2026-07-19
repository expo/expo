/* eslint-disable @typescript-eslint/no-require-imports */
import { render } from '@testing-library/react-native';
import { createRef, use } from 'react';
import { Text } from 'react-native';

import {
  ObserveReactNavigationIntegrationContext,
  type ReactNavigationIntegrationContextValue,
} from '../context';
import * as initModule from '../init';

jest.mock('expo-app-metrics', () => ({
  __esModule: true,
  default: {
    markInteractive: jest.fn(),
    getMainSession: jest.fn(() => ({
      id: 'session-1',
      type: 'main',
      startDate: '2026-01-01T00:00:00.000Z',
      addMetric: jest.fn(),
    })),
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

jest.mock('@react-navigation/native', () => {
  const mockNavigationContainerFn = jest.fn(
    ({ children }: { children: React.ReactNode }) => children
  );
  const mockNavRef = {
    addListener: jest.fn(() => () => {}),
    getRootState: jest.fn(() => undefined),
    isReady: jest.fn(() => false),
  };
  return {
    __esModule: true,
    NavigationContainer: (props: { children: React.ReactNode }) => mockNavigationContainerFn(props),
    useNavigationContainerRef: jest.fn(() => mockNavRef),
    __navigationContainerFn: mockNavigationContainerFn,
    __navigationRef: mockNavRef,
  };
});

// Import the component AFTER setting up all mocks so it picks them up.
const { ObserveNavigationContainer } =
  require('../ObserveNavigationContainer') as typeof import('../ObserveNavigationContainer');
const actionListenerModule = require('../actionListener') as {
  attachActionListener: jest.Mock;
  __cleanup: jest.Mock;
};
const handleStateChangeModule = require('../handleStateChange') as {
  createStateChangeHandler: jest.Mock;
  __handler: jest.Mock;
};
const reactNavigationMock = require('@react-navigation/native') as {
  __navigationContainerFn: jest.Mock;
  __navigationRef: { addListener: jest.Mock; getRootState: jest.Mock; isReady: jest.Mock };
};

const mockIsInitialized = initModule.isInitialized as jest.Mock;
const mockNavigationContainer = reactNavigationMock.__navigationContainerFn;
const fakeNavigationRef = reactNavigationMock.__navigationRef;
const attachActionListenerMock = actionListenerModule.attachActionListener;
const attachActionListenerCleanup = actionListenerModule.__cleanup;
const createStateChangeHandlerMock = handleStateChangeModule.createStateChangeHandler;
const stateChangeHandler = handleStateChangeModule.__handler;

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

describe('ObserveNavigationContainer', () => {
  it('renders NavigationContainer with the same children', () => {
    const { getByText } = render(
      <ObserveNavigationContainer>
        <Text>child</Text>
      </ObserveNavigationContainer>
    );
    expect(getByText('child')).toBeTruthy();
    expect(mockNavigationContainer).toHaveBeenCalled();
  });

  it('exposes a non-null context when isInitialized() is true', () => {
    const reads: unknown[] = [];
    render(
      <ObserveNavigationContainer>
        <ContextProbe onRead={(v) => reads.push(v)} />
      </ObserveNavigationContainer>
    );
    expect(reads[0]).toBeTruthy();
    expect(
      (reads[0] as ReactNavigationIntegrationContextValue).storage.interactiveScreensIds
    ).toBeInstanceOf(Set);
  });

  it('exposes a null context and skips attachActionListener when not initialized', () => {
    mockIsInitialized.mockReturnValue(false);
    const reads: unknown[] = [];
    render(
      <ObserveNavigationContainer>
        <ContextProbe onRead={(v) => reads.push(v)} />
      </ObserveNavigationContainer>
    );
    expect(reads[0]).toBeNull();
    expect(attachActionListenerMock).not.toHaveBeenCalled();
  });

  it('attaches the action listener with the internal navigationRef and runs cleanup on unmount', () => {
    const { unmount } = render(
      <ObserveNavigationContainer>
        <Text>child</Text>
      </ObserveNavigationContainer>
    );
    expect(attachActionListenerMock).toHaveBeenCalledTimes(1);
    expect(attachActionListenerMock.mock.calls[0][0]).toBe(fakeNavigationRef);

    expect(attachActionListenerCleanup).not.toHaveBeenCalled();
    unmount();
    expect(attachActionListenerCleanup).toHaveBeenCalledTimes(1);
  });

  it('forwards a user-supplied ref to the internal navigationRef', () => {
    const ref = createRef<unknown>();
    render(
      <ObserveNavigationContainer ref={ref as never}>
        <Text>child</Text>
      </ObserveNavigationContainer>
    );
    expect(ref.current).toBe(fakeNavigationRef);
  });

  it('forwards user onStateChange and onReady to NavigationContainer unchanged', () => {
    // Instrumentation rides the ref's `state` listener (via
    // ObserveNavigationProvider), so the container must not wrap the user's
    // callbacks — wrapping would double-drive the metrics handler.
    const userOnStateChange = jest.fn();
    const userOnReady = jest.fn();
    render(
      <ObserveNavigationContainer onStateChange={userOnStateChange} onReady={userOnReady}>
        <Text>child</Text>
      </ObserveNavigationContainer>
    );
    const props =
      mockNavigationContainer.mock.calls[mockNavigationContainer.mock.calls.length - 1][0];
    expect(props.onStateChange).toBe(userOnStateChange);
    expect(props.onReady).toBe(userOnReady);
  });

  it('does not inject its own onStateChange or onReady when the user omits them', () => {
    render(
      <ObserveNavigationContainer>
        <Text>child</Text>
      </ObserveNavigationContainer>
    );
    const props =
      mockNavigationContainer.mock.calls[mockNavigationContainer.mock.calls.length - 1][0];
    expect(props.onStateChange).toBeUndefined();
    expect(props.onReady).toBeUndefined();
  });

  it('drives the state handler from the `state` ref event', () => {
    render(
      <ObserveNavigationContainer>
        <Text>child</Text>
      </ObserveNavigationContainer>
    );
    const stateCall = fakeNavigationRef.addListener.mock.calls.find(([event]) => event === 'state');
    expect(stateCall).toBeDefined();

    const rootState = { index: 0, routes: [{ key: 'a', name: 'A' }] };
    fakeNavigationRef.getRootState.mockReturnValueOnce(rootState);
    stateCall![1]();
    expect(stateChangeHandler).toHaveBeenCalledWith(rootState);
  });

  it('passes other NavigationContainer props through (e.g. theme)', () => {
    const theme = { dark: true, colors: {} } as unknown as never;
    render(
      <ObserveNavigationContainer theme={theme}>
        <Text>child</Text>
      </ObserveNavigationContainer>
    );
    const props =
      mockNavigationContainer.mock.calls[mockNavigationContainer.mock.calls.length - 1][0];
    expect(props.theme).toBe(theme);
  });

  it('uses the same createStateChangeHandler for the entire mount lifetime', () => {
    const { rerender } = render(
      <ObserveNavigationContainer>
        <Text>child</Text>
      </ObserveNavigationContainer>
    );
    rerender(
      <ObserveNavigationContainer>
        <Text>child</Text>
      </ObserveNavigationContainer>
    );
    expect(createStateChangeHandlerMock).toHaveBeenCalledTimes(1);
  });

  it('throws when isInitialized() flips during the container lifetime', () => {
    mockIsInitialized.mockReturnValue(false);
    jest.spyOn(console, 'error').mockImplementation(() => {});

    const { rerender } = render(
      <ObserveNavigationContainer>
        <Text>child</Text>
      </ObserveNavigationContainer>
    );

    mockIsInitialized.mockReturnValue(true);
    expect(() =>
      rerender(
        <ObserveNavigationContainer>
          <Text>child</Text>
        </ObserveNavigationContainer>
      )
    ).toThrow(
      "[expo-observe] React Navigation integration was toggled after ObserveNavigationContainer mounted. Call `Observe.configure({ integrations: { 'react-navigation': true } })` before rendering ObserveNavigationContainer."
    );
  });
});
