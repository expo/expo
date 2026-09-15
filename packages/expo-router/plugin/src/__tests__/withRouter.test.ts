import withRouter from '../withRouter';

describe('unstable_useServerMiddleware', () => {
  let warn: jest.SpyInstance;

  beforeEach(() => {
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warn.mockRestore();
  });

  it.each([undefined, false, true])('accepts the deprecated option %p', (enabled) => {
    expect(() =>
      withRouter(
        { name: 'test', slug: 'test' },
        enabled === undefined ? {} : { unstable_useServerMiddleware: enabled }
      )
    ).not.toThrow();

    if (enabled) {
      expect(warn).toHaveBeenCalledWith(
        'As of SDK 58, unstable_useServerMiddleware is no longer required and will be removed in future releases'
      );
    } else {
      expect(warn).not.toHaveBeenCalled();
    }
  });
});
