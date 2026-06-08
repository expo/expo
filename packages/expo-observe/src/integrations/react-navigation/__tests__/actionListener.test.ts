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
  cleanup = attachActionListener(ref, storage);
});

afterEach(() => {
  cleanup?.();
});

describe('attachActionListener', () => {
  it('pushes a pending action for a non-noop NAVIGATE', () => {
    ref.fire(action('NAVIGATE'));
    expect(storage.pendingActions).toHaveLength(1);
    expect(storage.pendingActions[0].actionType).toBe('NAVIGATE');
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
});
