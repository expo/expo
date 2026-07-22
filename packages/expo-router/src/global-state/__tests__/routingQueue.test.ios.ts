import { dispatchAction, flushPreReadyActions } from '../routingQueue';
import { store } from '../store';

// Post the Step-5 flip the routing queue is a dumb pre-ready buffer: `dispatchAction` dispatches a
// raw intent straight through `store.navigationRef.dispatch` when the container is ready, else it
// buffers it; `flushPreReadyActions` drains the buffer once ready. `ROUTER_LINK` is dispatched raw
// (resolved inside the reducer), so this layer no longer calls `getNavigateAction`.
jest.mock('../store', () => ({
  store: {
    navigationRef: {
      isReady: jest.fn(() => true),
      dispatch: jest.fn(),
    },
  },
}));

const mockStore = store as unknown as {
  navigationRef: { isReady: jest.Mock; dispatch: jest.Mock };
};

beforeEach(() => {
  jest.clearAllMocks();
  mockStore.navigationRef.isReady.mockReturnValue(true);
  // Drain any buffered actions left over from a prior test's pre-ready path.
  mockStore.navigationRef.isReady.mockReturnValue(true);
  flushPreReadyActions();
  mockStore.navigationRef.dispatch.mockClear();
});

describe('routing queue (pre-ready buffer)', () => {
  it('dispatchAction dispatches the raw intent directly when ready', () => {
    dispatchAction({ type: 'GO_BACK' });

    expect(mockStore.navigationRef.dispatch).toHaveBeenCalledTimes(1);
    expect(mockStore.navigationRef.dispatch).toHaveBeenCalledWith({ type: 'GO_BACK' });
  });

  it('dispatchAction dispatches a raw ROUTER_LINK intent unresolved (the reducer resolves it)', () => {
    const link = {
      type: 'ROUTER_LINK' as const,
      payload: { href: '/home', options: { event: 'NAVIGATE' } },
    };

    dispatchAction(link);

    // No resolution here — the raw intent is handed to the container's dispatch verbatim.
    expect(mockStore.navigationRef.dispatch).toHaveBeenCalledTimes(1);
    expect(mockStore.navigationRef.dispatch).toHaveBeenCalledWith(link);
  });

  it('dispatchAction buffers (does not dispatch) when not ready', () => {
    mockStore.navigationRef.isReady.mockReturnValue(false);

    dispatchAction({ type: 'GO_BACK' });

    expect(mockStore.navigationRef.dispatch).not.toHaveBeenCalled();
  });

  it('flushPreReadyActions drains buffered actions in order once ready', () => {
    mockStore.navigationRef.isReady.mockReturnValue(false);
    dispatchAction({ type: 'GO_BACK' });
    dispatchAction({ type: 'POP_TO_TOP' });
    expect(mockStore.navigationRef.dispatch).not.toHaveBeenCalled();

    mockStore.navigationRef.isReady.mockReturnValue(true);
    flushPreReadyActions();

    expect(mockStore.navigationRef.dispatch).toHaveBeenCalledTimes(2);
    expect(mockStore.navigationRef.dispatch).toHaveBeenNthCalledWith(1, { type: 'GO_BACK' });
    expect(mockStore.navigationRef.dispatch).toHaveBeenNthCalledWith(2, { type: 'POP_TO_TOP' });
  });

  it('flushPreReadyActions is a no-op when still not ready (buffer retained)', () => {
    mockStore.navigationRef.isReady.mockReturnValue(false);
    dispatchAction({ type: 'GO_BACK' });

    flushPreReadyActions();
    expect(mockStore.navigationRef.dispatch).not.toHaveBeenCalled();

    // Still buffered: becomes dispatchable once ready.
    mockStore.navigationRef.isReady.mockReturnValue(true);
    flushPreReadyActions();
    expect(mockStore.navigationRef.dispatch).toHaveBeenCalledWith({ type: 'GO_BACK' });
  });

  it('flushPreReadyActions is a no-op when the buffer is empty', () => {
    flushPreReadyActions();
    expect(mockStore.navigationRef.dispatch).not.toHaveBeenCalled();
  });
});
