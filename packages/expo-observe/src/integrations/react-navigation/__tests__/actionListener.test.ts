import { attachActionListener } from '../actionListener';
import {
  createReactNavigationIntegrationStorage,
  type ReactNavigationIntegrationStorage,
} from '../storage';

type ActionEvent = {
  data: { action: { type: string; payload?: object }; noop: boolean };
};

interface FakeNavigationRef {
  addListener(event: '__unsafe_action__', cb: (e: ActionEvent) => void): () => void;
  fire(e: ActionEvent): void;
}

function createFakeNavigationRef(): FakeNavigationRef {
  const listeners = new Set<(e: ActionEvent) => void>();
  return {
    addListener(_event, cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    fire(e) {
      listeners.forEach((cb) => cb(e));
    },
  };
}

function action(type: string, opts?: { noop?: boolean }): ActionEvent {
  return {
    data: { action: { type, payload: undefined }, noop: opts?.noop ?? false },
  };
}

let storage: ReactNavigationIntegrationStorage;
let ref: FakeNavigationRef;
let cleanup: () => void;

beforeEach(() => {
  storage = createReactNavigationIntegrationStorage();
  ref = createFakeNavigationRef();
  cleanup = attachActionListener(ref, storage, undefined);
});

afterEach(() => {
  cleanup?.();
  jest.restoreAllMocks();
});

describe('attachActionListener', () => {
  it('pushes a pending action for a non-noop NAVIGATE', () => {
    ref.fire(action('NAVIGATE'));
    expect(storage.pendingActions).toHaveLength(1);
    expect(storage.pendingActions[0]!.actionType).toBe('NAVIGATE');
  });

  it('drops noop actions', () => {
    ref.fire(action('NAVIGATE', { noop: true }));
    expect(storage.pendingActions).toHaveLength(0);
  });

  it('drops PRELOAD actions', () => {
    ref.fire(action('PRELOAD'));
    expect(storage.pendingActions).toHaveLength(0);
  });

  it('cleanup unsubscribes the listener', () => {
    cleanup();
    ref.fire(action('NAVIGATE'));
    expect(storage.pendingActions).toHaveLength(0);
    cleanup = () => {};
  });

  it('starts a tbt window at the dispatch time of each navigation after app launch', () => {
    const blockingTime = { start: jest.fn(), setMetric: jest.fn(), dispose: jest.fn() };
    cleanup();
    cleanup = attachActionListener(ref, storage, blockingTime);
    const now = jest.spyOn(performance, 'now');

    now.mockReturnValue(1000);
    ref.fire(action('NAVIGATE'));
    storage.hasRecordedInitialTtr = true;
    ref.fire(action('PRELOAD'));
    ref.fire(action('NAVIGATE', { noop: true }));
    now.mockReturnValue(1200);
    ref.fire(action('NAVIGATE'));
    now.mockReturnValue(1300);
    ref.fire(action('SET_PARAMS'));

    expect(blockingTime.start.mock.calls).toEqual([[1200], [1300]]);
  });
});
