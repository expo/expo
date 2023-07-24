import { isAbsoluteInitialRoute } from '../routing';

describe(isAbsoluteInitialRoute, () => {
  it(`returns true when a nested action is absolutely initial`, () => {
    expect(
      isAbsoluteInitialRoute({
        type: 'NAVIGATE',
        payload: {
          name: 'root',
          params: {
            initial: true,
            screen: '(app)',
            params: {
              initial: true,
              screen: 'index',
              path: '/root',
            },
          },
        },
      })
    ).toBe(true);
  });
  it(`returns true when a nested action is absolutely initial (shallow)`, () => {
    expect(
      isAbsoluteInitialRoute({
        type: 'NAVIGATE',
        payload: {
          name: 'root',
          params: undefined,
        },
      })
    ).toBe(true);
  });
  it(`returns false when a nested action is not absolutely initial`, () => {
    expect(
      isAbsoluteInitialRoute({
        type: 'NAVIGATE',
        payload: {
          name: 'root',
          params: {
            initial: true,
            screen: '(app)',
            params: {
              initial: false,
              screen: 'index',
              path: '/root',
            },
          },
        },
      })
    ).toBe(false);
  });
});
