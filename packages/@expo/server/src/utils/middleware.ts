import type { MiddlewareModule, MiddlewarePattern } from '../types';
import { matchDynamicName, matchDeepDynamicRouteName } from '../utils';

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
    const methods = matcher.methods.map((method) => method.toUpperCase());
    if (methods.length === 0 || !methods.includes(request.method)) {
      return false;
    }
  }

  // Check path patterns, if specified
  if (matcher.patterns) {
    const patterns = Array.isArray(matcher.patterns) ? matcher.patterns : [matcher.patterns];
    if (patterns.length === 0) {
      return false;
    }
    return patterns.some((pattern) => matchesPattern(pathname, pattern));
  }

  // If neither methods nor patterns are specified, run middleware on all requests
  return true;
}

/**
 * Tests if a pathname matches a given pattern. The matching order is as follows:
 *
 * - Exact string
 * - Named parameters (supports `[param]` and `[...param]`)
 * - Regular expression
 */
function matchesPattern(pathname: string, pattern: MiddlewarePattern): boolean {
  if (typeof pattern === 'string') {
    if (pattern === pathname) {
      return true;
    }

    if (hasNamedParameters(pattern)) {
      return namedParamToRegex(pattern).test(pathname);
    }
  }

  if (pattern instanceof RegExp) {
    return pattern.test(pathname);
  }

  return false;
}

/**
 * Check if a pattern contains named parameters like `[postId]` or `[...slug]`
 */
function hasNamedParameters(pattern: string): boolean {
  return pattern.split('/').some((segment) => {
    return matchDynamicName(segment) || matchDeepDynamicRouteName(segment);
  });
}

/**
 * Convert a pattern with named parameters to regex
 */
function namedParamToRegex(pattern: string): RegExp {
  const normalizedPattern = pattern.replace(/\/$/, '') || '/';
  const segments = normalizedPattern.split('/');
  const regexSegments = segments.map((segment) => {
    if (!segment) return '';

    if (matchDeepDynamicRouteName(segment)) {
      return '.+';
    }

    if (matchDynamicName(segment)) {
      return '[^/]+';
    }

    return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  });

  return new RegExp(`^${regexSegments.join('/')}(?:/)?$`);
}
