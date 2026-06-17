import { renderHook } from '@testing-library/react-native';

import { usePopAction } from '../usePopAction';

describe('usePopAction', () => {
  it('dispatches a POP action with count, source, and target', () => {
    const dispatch = jest.fn();

    const { result } = renderHook(() => usePopAction({ dispatch }, 'stack-key'));
    result.current(2, 'route-key');

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'POP',
        payload: { count: 2 },
        source: 'route-key',
        target: 'stack-key',
      })
    );
  });

  it('keeps a stable identity across re-renders with the same inputs', () => {
    const navigation = { dispatch: jest.fn() };

    const { result, rerender } = renderHook(
      ({ stateKey }: { stateKey: string }) => usePopAction(navigation, stateKey),
      { initialProps: { stateKey: 'stack-key' } }
    );
    const firstPop = result.current;

    rerender({ stateKey: 'stack-key' });
    expect(result.current).toBe(firstPop);
  });

  it('targets the new navigator key after it changes', () => {
    const dispatch = jest.fn();

    const { result, rerender } = renderHook(
      ({ stateKey }: { stateKey: string }) => usePopAction({ dispatch }, stateKey),
      { initialProps: { stateKey: 'stack-key' } }
    );

    rerender({ stateKey: 'other-stack-key' });
    result.current(1, 'route-key');

    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ target: 'other-stack-key' }));
  });
});
