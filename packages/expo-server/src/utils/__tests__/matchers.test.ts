import { Route } from '../../manifest';
import { getRedirectRewriteLocation, resolveLoaderContextKey } from '../matchers';

describe('static routes', () => {
  it('should handle static route with no parameters', () => {
    const url = new URL('https://example.com/about');
    const request = createMockRequest(url);
    const route = createMockRoute('/about', /^\/about(?:\/)?$/);

    const result = getRedirectRewriteLocation(url, request, route);

    expect(result.toString().toString()).toBe('https://example.com/about');
  });

  it('should handle nested static route', () => {
    const url = new URL('https://example.com/users/profile');
    const request = createMockRequest(url);
    const route = createMockRoute('/users/profile', /^\/users\/profile(?:\/)?$/);

    const result = getRedirectRewriteLocation(url, request, route);

    expect(result.toString()).toBe('https://example.com/users/profile');
  });
});

describe('dynamic routes', () => {
  it('should handle single dynamic parameter', () => {
    const url = new URL('https://example.com/users/123');
    const request = createMockRequest(url);
    const route = createMockRoute('/users/[id]', /^\/users\/(?<user_id>[^/]+?)(?:\/)?$/, {
      user_id: 'id',
    });

    const result = getRedirectRewriteLocation(url, request, route);

    expect(result.toString()).toBe('https://example.com/users/123');
  });

  it('should handle multiple dynamic parameters', () => {
    const url = new URL('https://example.com/users/123/posts/456');
    const request = createMockRequest(url);
    const route = createMockRoute(
      '/users/[userId]/posts/[postId]',
      /^\/users\/(?<user_id>[^/]+?)\/posts\/(?<post_id>[^/]+?)(?:\/)?$/,
      { user_id: 'userId', post_id: 'postId' }
    );

    const result = getRedirectRewriteLocation(url, request, route);

    expect(result.toString()).toBe('https://example.com/users/123/posts/456');
  });

  it('should handle catch all to dynamic parameter rewrite (take first segment)', () => {
    const url = new URL('https://example.com/files/folder/subfolder/file.txt');
    const request = createMockRequest(url);
    const route = createMockRoute('/dirs/[name]', /^\/files\/(?<file_path>.+?)(?:\/)?$/, {
      file_path: 'name',
    });

    const result = getRedirectRewriteLocation(url, request, route);

    expect(result.toString()).toBe('https://example.com/dirs/folder'); // Only first segment
  });

  it('should fallback to segment name when parameter is missing', () => {
    const url = new URL('https://example.com/users/');
    const request = createMockRequest(url);
    const route = createMockRoute('/users/[id]', /^\/users\/(?<user_id>[^/]+?)(?:\/)?$/, {
      user_id: 'id',
    });

    const result = getRedirectRewriteLocation(url, request, route);

    expect(result.toString()).toBe('https://example.com/users/[id]'); // Fallback to segment
  });

  it('should fallback to segment name when parameter is missing (multiple)', () => {
    const url = new URL('https://example.com/users/');
    const request = createMockRequest(url);
    const route = createMockRoute(
      '/users/[id]/profile',
      /^\/users\/(?<user_id>[^/]+?)\/profile(?:\/)?$/,
      {}
    );

    const result = getRedirectRewriteLocation(url, request, route);

    expect(result.toString()).toBe('https://example.com/users/[id]/profile'); // Fallback to segment
  });
});

describe('catch-all routes', () => {
  it('should handle catch-all parameter', () => {
    const url = new URL('https://example.com/docs/api/users/create');
    const request = createMockRequest(url);
    const route = createMockRoute('/docs/[...slug]', /^\/docs\/(?<catch_all>.+?)(?:\/)?$/, {
      catch_all: 'slug',
    });

    const result = getRedirectRewriteLocation(url, request, route);

    expect(result.toString()).toBe('https://example.com/docs/api/users/create'); // Full path preserved
  });

  it('should handle catch-all with missing parameter', () => {
    const url = new URL('https://example.com/docs/');
    const request = createMockRequest(url);
    const route = createMockRoute('/docs/[...slug]', /^\/docs\/(?<catch_all>.+?)(?:\/)?$/, {});

    const result = getRedirectRewriteLocation(url, request, route);

    expect(result.toString()).toBe('https://example.com/docs/[...slug]'); // Fallback to segment
  });

  it('should handle nested catch-all', () => {
    const url = new URL('https://example.com/api/v1/users/123/posts');
    const request = createMockRequest(url);
    const route = createMockRoute(
      '/api/[version]/[...rest]',
      /^\/api\/(?<version>[^/]+?)\/(?<rest_path>.+?)(?:\/)?$/,
      { version: 'version', rest_path: 'rest' }
    );

    const result = getRedirectRewriteLocation(url, request, route);

    expect(result.toString()).toBe('https://example.com/api/v1/users/123/posts');
  });
});

describe('mixed routes', () => {
  it('should handle mix of static, dynamic, and catch-all segments', () => {
    const url = new URL('https://example.com/users/123/files/docs/readme.md');
    const request = createMockRequest(url);
    const route = createMockRoute(
      '/users/[id]/files/[...path]',
      /^\/users\/(?<user_id>[^/]+?)\/files\/(?<file_path>.+?)(?:\/)?$/,
      { user_id: 'id', file_path: 'path' }
    );

    const result = getRedirectRewriteLocation(url, request, route);

    expect(result.toString()).toBe('https://example.com/users/123/files/docs/readme.md');
  });
});

describe('query parameters', () => {
  it('should preserve existing URL search parameters', () => {
    const url = new URL('https://example.com/users/123?tab=profile&sort=name');
    const request = createMockRequest(url);
    const route = createMockRoute('/users/[id]', /^\/users\/(?<user_id>[^/]+?)(?:\/)?$/, {
      user_id: 'id',
    });

    const result = getRedirectRewriteLocation(url, request, route);

    expect(result.toString()).toBe('https://example.com/users/123?tab=profile&sort=name');
  });

  it('should add leftover route parameters as query params', () => {
    const url = new URL('https://example.com/users/123');
    const request = createMockRequest(url);
    const route = createMockRoute(
      '/profile',
      /^\/users\/(?<user_id>[^/]+?)(?:\/)?$/,
      { user_id: 'userId' } // This param won't be used in the route
    );

    const result = getRedirectRewriteLocation(url, request, route);

    expect(result.toString()).toBe('https://example.com/profile?userId=123');
  });

  it('should combine leftover params with existing search params', () => {
    const url = new URL('https://example.com/users/123?tab=profile');
    const request = createMockRequest(url);
    const route = createMockRoute('/dashboard', /^\/users\/(?<user_id>[^/]+?)(?:\/)?$/, {
      user_id: 'userId',
    });

    const result = getRedirectRewriteLocation(url, request, route);

    expect(result.toString()).toBe('https://example.com/dashboard?userId=123&tab=profile');
  });

  it('should handle multiple leftover parameters', () => {
    const url = new URL('https://example.com/users/123/posts/456');
    const request = createMockRequest(url);
    const route = createMockRoute(
      '/home',
      /^\/users\/(?<user_id>[^/]+?)\/posts\/(?<post_id>[^/]+?)(?:\/)?$/,
      {
        user_id: 'userId',
        post_id: 'postId',
      }
    );

    const result = getRedirectRewriteLocation(url, request, route);

    expect(result.toString()).toBe('https://example.com/home?userId=123&postId=456');
  });

  it('should handle no leftover params and no search params', () => {
    const url = new URL('https://example.com/users/123');
    const request = createMockRequest(url);
    const route = createMockRoute('/users/[id]', /^\/users\/(?<user_id>[^/]+?)(?:\/)?$/, {
      user_id: 'id',
    });

    const result = getRedirectRewriteLocation(url, request, route);

    expect(result.toString()).toBe('https://example.com/users/123');
  });
});

describe('edge cases', () => {
  it('should handle root path', () => {
    const url = new URL('https://example.com/');
    const request = createMockRequest(url);
    const route = createMockRoute('/', /^\/$/);

    const result = getRedirectRewriteLocation(url, request, route);

    expect(result.toString()).toBe('https://example.com/');
  });

  it('should handle complex path with special characters', () => {
    const url = new URL('https://example.com/files/my%20file.txt');
    const request = createMockRequest(url);
    const route = createMockRoute('/files/[name]', /^\/files\/(?<file_name>[^/]+?)(?:\/)?$/, {
      file_name: 'name',
    });

    const result = getRedirectRewriteLocation(url, request, route);

    expect(result.toString()).toBe('https://example.com/files/my%20file.txt');
  });
});

// NOTE: These test cases are adapted from expo-router/src/__tests__/getId.test.ios.tsx
describe(resolveLoaderContextKey, () => {
  it(`returns the context string when the route is not dynamic and there are no search params`, () => {
    expect(resolveLoaderContextKey('foo', {})).toBe('/foo');
  });

  it(`ignores search params`, () => {
    expect(resolveLoaderContextKey('foo', { foo: 'bar' })).toBe('/foo');
  });

  it(`picks dynamic params`, () => {
    expect(resolveLoaderContextKey('[foo]', { foo: 'bar' })).toBe('/bar');
  });

  it(`picks catch-all dynamic name`, () => {
    expect(resolveLoaderContextKey('[...bacon]', {})).toBe('/[...bacon]');

    // Matching param (ideal case)
    expect(resolveLoaderContextKey('[...bacon]', { bacon: ['bacon', 'other'] })).toBe(
      '/bacon/other'
    );

    // With search parameters
    expect(resolveLoaderContextKey('[...bacon]', { bar: 'foo' })).toBe('/[...bacon]');

    // Deep dynamic route
    expect(resolveLoaderContextKey('[...bacon]', { bacon: ['foo', 'bar'] })).toBe('/foo/bar');
    expect(resolveLoaderContextKey('[...bacon]', { bacon: ['foo'] })).toBe('/foo');

    // Should never happen, but just in case.
    expect(resolveLoaderContextKey('[...bacon]', { bacon: [] })).toBe('/');
  });

  it(`returns a function that picks the dynamic name from params`, () => {
    expect(resolveLoaderContextKey('[user]', {})).toBe('/[user]');

    // Matching param (ideal case)
    expect(resolveLoaderContextKey('[user]', { user: 'bacon' })).toBe('/bacon');
    // With search parameters
    expect(resolveLoaderContextKey('[user]', { bar: 'foo' })).toBe('/[user]');
    // No params
    expect(resolveLoaderContextKey('[user]', {})).toBe('/[user]');

    // Should never happen, but just in case.
    expect(resolveLoaderContextKey('[user]', { user: '' })).toBe('/');
  });

  it(`picks multiple dynamic names from params`, () => {
    expect(resolveLoaderContextKey('[user]/[bar]', {})).toBe('/[user]/[bar]');

    expect(resolveLoaderContextKey('[user]/[bar]', { user: 'bacon', bar: 'hey' })).toBe(
      '/bacon/hey'
    );
    // Fills partial params
    expect(resolveLoaderContextKey('[user]/[bar]', { user: 'bacon' })).toBe('/bacon/[bar]');
    // With search parameters
    expect(resolveLoaderContextKey('[user]/[bar]', { baz: 'foo' })).toBe('/[user]/[bar]');
    // No params
    expect(resolveLoaderContextKey('[user]/[bar]', {})).toBe('/[user]/[bar]');

    // Should never happen, but just in case.
    expect(resolveLoaderContextKey('[user]/[bar]', { user: '' })).toBe('//[bar]');
  });
});

const createMockRequest = (url: string | URL, method = 'GET') => new Request(url, { method });

const createMockRoute = (
  page: string,
  namedRegex: RegExp,
  routeKeys: Record<string, string> = {}
) =>
  ({
    page,
    namedRegex,
    routeKeys,
  }) as Route;
