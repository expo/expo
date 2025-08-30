import type { MiddlewareModule, MiddlewarePattern } from '../types';

/**
 * Determines whether middleware should run for a given request based on matcher configuration.
 */
export function shouldRunMiddleware(request: Request, middleware: MiddlewareModule): boolean {
  const matcher = middleware.unstable_settings?.matcher;

  // No matcher means middleware runs on all requests
  if (!matcher) {
    return true;
  }

  const url = new URL(request.url);
  const pathname = url.pathname;

  // Check HTTP methods, if specified
  if (matcher.methods) {
    if (matcher.methods.length === 0 || !matcher.methods.includes(request.method)) {
      return false;
    }
  }

  // Check path patterns, if specified
  if (matcher.patterns) {
    if (matcher.patterns.length === 0) {
      return false;
    }
    const patterns = Array.isArray(matcher.patterns) ? matcher.patterns : [matcher.patterns];
    return patterns.some((pattern) => matchesPattern(pathname, pattern));
  }

  // If neither methods nor patterns are specified, run middleware on all requests
  return true;
}

/**
 * Converts a simple glob pattern to a regular expression. Supports `*` (match any characters
 * except `/`) and `**` (match any characters including `/`).
 */
function globToRegex(pattern: string): RegExp {
  // Escape special regex characters except `*` and `**`
  let regexPattern = pattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    // Replace `**` with a placeholder to avoid conflicts with single `*`
    .replace(/\*\*/g, '___DOUBLE_STAR___')
    // Replace single `*` with regex to match any characters except `/`
    .replace(/\*/g, '[^/]*')
    // Replace `**` placeholder with regex to match any characters including `/`
    .replace(/___DOUBLE_STAR___/g, '.*');

  // If the pattern ends with `/*`, it should also match the path without the trailing `/*`
  // For example, `/api/*` should match both `/api` and `/api/something`
  if (pattern.endsWith('/*')) {
    const basePath = regexPattern.slice(0, -6); // Remove `[^/]*$`
    regexPattern = `${basePath}(?:/[^/]*)?`;
  }

  return new RegExp(`^${regexPattern}$`);
}

/**
 * Tests if a pathname matches a given pattern. The matching order is as follows:
 *
 * - Exact string
 * - Glob pattern (supports `*` and `**`)
 * - Regular expression
 */
function matchesPattern(pathname: string, pattern: MiddlewarePattern): boolean {
  if (typeof pattern === 'string') {
    if (pattern === pathname) {
      return true;
    }

    if (pattern.includes('*')) {
      return globToRegex(pattern).test(pathname);
    }
  }

  if (pattern instanceof RegExp) {
    return pattern.test(pathname);
  }

  return false;
}
