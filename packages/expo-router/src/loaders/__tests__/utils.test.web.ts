import { getLoaderModulePath, getRoutePathFromLoaderPath, fetchLoaderModule } from '../utils';

describe(getLoaderModulePath, () => {
  it.each([
    { routePath: '/', loaderModulePath: '/_expo/loaders/index.js' },
    { routePath: '/about', loaderModulePath: '/_expo/loaders/about.js' },
    { routePath: '/posts', loaderModulePath: '/_expo/loaders/posts.js' },
    { routePath: '/posts/1', loaderModulePath: '/_expo/loaders/posts/1.js' },
    { routePath: '/blog/posts/123', loaderModulePath: '/_expo/loaders/blog/posts/123.js' },
    { routePath: '/', loaderModulePath: '/_expo/loaders/index.js' },
    { routePath: '/posts/[id]', loaderModulePath: '/_expo/loaders/posts/[id].js' },
    { routePath: '/[user]/posts/[id]', loaderModulePath: '/_expo/loaders/[user]/posts/[id].js' },
    { routePath: '/docs/[...slug]', loaderModulePath: '/_expo/loaders/docs/[...slug].js' },
    { routePath: '/about/', loaderModulePath: '/_expo/loaders/about.js' },
    { routePath: '/posts/1/', loaderModulePath: '/_expo/loaders/posts/1.js' },
    { routePath: '/posts?page=2', loaderModulePath: '/_expo/loaders/posts.js' },
    { routePath: '/posts/1?edit=true', loaderModulePath: '/_expo/loaders/posts/1.js' },
    { routePath: '/posts#section', loaderModulePath: '/_expo/loaders/posts.js' },
    { routePath: '/posts/1#comments', loaderModulePath: '/_expo/loaders/posts/1.js' },
    { routePath: '/(tabs)/home', loaderModulePath: '/_expo/loaders/(tabs)/home.js' },
    { routePath: '/(auth)/login', loaderModulePath: '/_expo/loaders/(auth)/login.js' },
    { routePath: '/posts/hello-world', loaderModulePath: '/_expo/loaders/posts/hello-world.js' },
    { routePath: '/posts/2024-01-01', loaderModulePath: '/_expo/loaders/posts/2024-01-01.js' },
    { routePath: '/tags/react.js', loaderModulePath: '/_expo/loaders/tags/react.js.js' },
  ])(
    'uses $routePath to retrieve loader from $loaderModulePath',
    ({ routePath, loaderModulePath }) => {
      expect(getLoaderModulePath(routePath)).toBe(loaderModulePath);
    }
  );
});

describe(getRoutePathFromLoaderPath, () => {
  it.each([
    { loaderModulePath: '/_expo/loaders/index.js', routePath: '/' },
    { loaderModulePath: '/_expo/loaders/about.js', routePath: '/about' },
    { loaderModulePath: '/_expo/loaders/posts.js', routePath: '/posts' },
    { loaderModulePath: '/_expo/loaders/posts/1.js', routePath: '/posts/1' },
    { loaderModulePath: '/_expo/loaders/blog/posts/123.js', routePath: '/blog/posts/123' },
    { loaderModulePath: '/_expo/loaders/posts/[id].js', routePath: '/posts/[id]' },
    { loaderModulePath: '/_expo/loaders/[user]/posts/[id].js', routePath: '/[user]/posts/[id]' },
    { loaderModulePath: '/_expo/loaders/docs/[...slug].js', routePath: '/docs/[...slug]' },
    { loaderModulePath: '/_expo/loaders/(tabs)/home.js', routePath: '/(tabs)/home' },
    { loaderModulePath: '/_expo/loaders/(auth)/login.js', routePath: '/(auth)/login' },
    { loaderModulePath: '/_expo/loaders/.js', routePath: '/' },
    { loaderModulePath: '/_expo/loaders//', routePath: '//' },
  ])('converts $loaderModulePath to $routePath', ({ loaderModulePath, routePath }) => {
    expect(getRoutePathFromLoaderPath(loaderModulePath)).toBe(routePath);
  });

  it.each(['/', '/about', '/posts/1', '/blog/posts/[id]', '/(tabs)/home', '/docs/[...slug]'])(
    'is inverse operation of getLoaderModulePath with %s',
    (path) => {
      const loaderPath = getLoaderModulePath(path);
      const routePath = getRoutePathFromLoaderPath(loaderPath);
      expect(routePath).toBe(path);
    }
  );
});

describe(fetchLoaderModule, () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('fetches root path loader', async () => {
    const mockData = { home: true };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => `export default ${JSON.stringify(mockData)}`,
    });

    const result = await fetchLoaderModule('/');

    expect(global.fetch).toHaveBeenCalledWith('/_expo/loaders/index.js');
    expect(result).toEqual(mockData);
  });

  it('fetches and parses loader module successfully', async () => {
    const mockData = { foo: 'bar', count: 42 };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => `export default ${JSON.stringify(mockData)}`,
    });

    const result = await fetchLoaderModule('/posts/1');

    expect(global.fetch).toHaveBeenCalledWith('/_expo/loaders/posts/1.js');
    expect(result).toEqual(mockData);
  });

  it('throws error for non-ok response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
    });

    await expect(fetchLoaderModule('/missing')).rejects.toThrow('Failed to fetch loader data: 404');
  });

  it('throws error for invalid module format', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => 'invalid javascript',
    });

    await expect(fetchLoaderModule('/posts/1')).rejects.toThrow('Invalid loader module format');
  });

  it('throws error for malformed JSON in module', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => 'export default {invalid json}',
    });

    await expect(fetchLoaderModule('/posts/1')).rejects.toThrow();
  });
});
