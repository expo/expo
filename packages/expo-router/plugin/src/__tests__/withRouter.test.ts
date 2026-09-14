import withRouter from '../withRouter';

describe('apiRoutes', () => {
  it.each(['static', 'server'] as const)('accepts API routes with %s output', (output) => {
    const config = withRouter({ name: 'test', slug: 'test', web: { output } }, { apiRoutes: true });
    expect(config.extra?.router.apiRoutes).toBe(true);
  });

  it.each(['single', undefined] as const)('rejects the setting with %s output', (output) => {
    expect(() =>
      withRouter({ name: 'test', slug: 'test', web: { output } }, { apiRoutes: true })
    ).toThrow('The `apiRoutes` option requires `web.output` to be set to `static` or `server`.');
  });

  it('preserves an explicit false value', () => {
    const config = withRouter(
      { name: 'test', slug: 'test', web: { output: 'server' } },
      { apiRoutes: false }
    );
    expect(config.extra?.router.apiRoutes).toBe(false);
  });
});
