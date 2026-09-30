/* eslint-disable @typescript-eslint/no-require-imports */
import { render } from '@testing-library/react-native';
import { StrictMode, use } from 'react';
import { Text } from 'react-native';

import {
  ObserveRouterIntegrationContext,
  ObserveRouterIntegrationProvider,
} from '../ObserveRouterIntegrationProvider';
import * as initModule from '../init';
import { optionalRouter } from '../router';

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

jest.mock('../init', () => {
  const initListenersCleanup = jest.fn();
  return {
    __esModule: true,
    isInitialized: jest.fn(() => true),
    initListeners: jest.fn(() => initListenersCleanup),
    initRouterIntegration: jest.fn(),
    __initListenersCleanup: initListenersCleanup,
  };
});

jest.mock('../router', () => ({
  optionalRouter: { unstable_navigationEvents: { addListener: jest.fn(), emit: jest.fn() } },
  isRouterInstalled: true,
}));

const navigationEvents = optionalRouter!.unstable_navigationEvents as NonNullable<
  typeof optionalRouter
>['unstable_navigationEvents'] & {
  version?: number;
};

function observeWarnings() {
  return (console.warn as jest.Mock).mock.calls.filter(
    ([message]) => typeof message === 'string' && message.startsWith('[expo-observe]')
  );
}

const mockIsInitialized = initModule.isInitialized as jest.Mock;
const mockInitListeners = initModule.initListeners as jest.Mock;
const mockInitListenersCleanup = (initModule as unknown as { __initListenersCleanup: jest.Mock })
  .__initListenersCleanup;

function StorageProbe({ onRead }: { onRead: (storage: unknown) => void }) {
  const storage = use(ObserveRouterIntegrationContext);
  onRead(storage);
  return <Text>probe</Text>;
}

beforeEach(() => {
  mockIsInitialized.mockReturnValue(true);
  mockIsInitialized.mockClear();
  mockInitListeners.mockClear();
  mockInitListenersCleanup.mockClear();
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  delete navigationEvents.version;
  jest.restoreAllMocks();
});

describe('ObserveRouterIntegrationProvider', () => {
  it('attaches listeners when router event version is missing', () => {
    (console.warn as jest.Mock).mockClear();
    render(
      <ObserveRouterIntegrationProvider>
        <Text>child</Text>
      </ObserveRouterIntegrationProvider>
    );
    expect(mockInitListeners).toHaveBeenCalledTimes(1);
    expect(mockInitListeners.mock.calls[0][1]).toBe(navigationEvents);
    expect(observeWarnings()).toHaveLength(0);
  });

  it('attaches listeners when router event version is supported', () => {
    navigationEvents.version = 1;
    (console.warn as jest.Mock).mockClear();
    render(
      <ObserveRouterIntegrationProvider>
        <Text>child</Text>
      </ObserveRouterIntegrationProvider>
    );
    expect(mockInitListeners).toHaveBeenCalledTimes(1);
    expect(mockInitListeners.mock.calls[0][1]).toBe(navigationEvents);
    expect(observeWarnings()).toHaveLength(0);
  });

  it('warns once and skips listeners for a newer router event version under StrictMode and remount', () => {
    expect(__DEV__).toBe(true);
    navigationEvents.version = 2;
    (console.warn as jest.Mock).mockClear();
    const first = render(
      <StrictMode>
        <ObserveRouterIntegrationProvider>
          <Text>child</Text>
        </ObserveRouterIntegrationProvider>
      </StrictMode>
    );
    first.unmount();
    render(
      <ObserveRouterIntegrationProvider>
        <Text>child</Text>
      </ObserveRouterIntegrationProvider>
    );
    expect(mockInitListeners).not.toHaveBeenCalled();
    expect(observeWarnings()).toHaveLength(1);
    expect(observeWarnings()[0][0]).toContain('2');
    expect(observeWarnings()[0][0]).toContain('1');
  });
  it('exposes a non-null storage on first render when isInitialized() is true at mount', () => {
    const reads: unknown[] = [];
    render(
      <ObserveRouterIntegrationProvider>
        <StorageProbe onRead={(s) => reads.push(s)} />
      </ObserveRouterIntegrationProvider>
    );
    expect(reads[0]).toBeTruthy();
    expect(
      (reads[0] as { interactiveScreensIds: Set<string> }).interactiveScreensIds
    ).toBeInstanceOf(Set);
  });

  it('keeps storage null and does not attach listeners when isInitialized() is false at mount', () => {
    mockIsInitialized.mockReturnValue(false);
    const reads: unknown[] = [];
    render(
      <ObserveRouterIntegrationProvider>
        <StorageProbe onRead={(s) => reads.push(s)} />
      </ObserveRouterIntegrationProvider>
    );
    expect(reads[0]).toBeNull();
    expect(mockInitListeners).not.toHaveBeenCalled();
  });

  it('calls initListeners with storage in useEffect and runs cleanup on unmount', () => {
    const { unmount } = render(
      <ObserveRouterIntegrationProvider>
        <Text>child</Text>
      </ObserveRouterIntegrationProvider>
    );
    expect(mockInitListeners).toHaveBeenCalledTimes(1);
    const [storageArg] = mockInitListeners.mock.calls[0];
    expect(
      (storageArg as { interactiveScreensIds: Set<string> }).interactiveScreensIds
    ).toBeInstanceOf(Set);

    expect(mockInitListenersCleanup).not.toHaveBeenCalled();
    unmount();
    expect(mockInitListenersCleanup).toHaveBeenCalledTimes(1);
  });

  it('throws when isInitialized() flips during the provider lifetime', () => {
    mockIsInitialized.mockReturnValue(false);
    jest.spyOn(console, 'error').mockImplementation(() => {});

    const { rerender } = render(
      <ObserveRouterIntegrationProvider>
        <Text>child</Text>
      </ObserveRouterIntegrationProvider>
    );

    mockIsInitialized.mockReturnValue(true);
    expect(() =>
      rerender(
        <ObserveRouterIntegrationProvider>
          <Text>child</Text>
        </ObserveRouterIntegrationProvider>
      )
    ).toThrow(
      '[expo-observe] Router integration was enabled after application mounted. Call Observe.configure() before mounting AppMetricsRoot.'
    );
  });

  it('renders children when storage is null (router not installed scenario)', () => {
    mockIsInitialized.mockReturnValue(false);
    const { getByText } = render(
      <ObserveRouterIntegrationProvider>
        <Text>visible</Text>
      </ObserveRouterIntegrationProvider>
    );
    expect(getByText('visible')).toBeTruthy();
  });
});
