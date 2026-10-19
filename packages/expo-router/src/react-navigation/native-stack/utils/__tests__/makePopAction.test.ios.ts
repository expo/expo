import { makePopAction } from '../makePopAction';

describe('makePopAction', () => {
  it('dispatches a POP action with count, source, and target', () => {
    const dispatch = jest.fn();

    makePopAction(dispatch, 'stack-key')(2, 'route-key');

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
});
