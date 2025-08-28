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

// NOTE(@hassankhan): Duplicated from expo-router to avoid declaring a dependency
/** Match `[page]` -> `page` or `[...group]` -> `...group` */
const dynamicNameRe = /^\[([^[\]]+?)\]$/;

// NOTE(@hassankhan): Duplicated from expo-router to avoid declaring a dependency
interface DynamicNameMatch {
  name: string;
  deep: boolean;
}

// NOTE(@hassankhan): Duplicated from expo-router to avoid declaring a dependency
/** Match `[page]` -> `page` */
function matchDynamicName(name: string): DynamicNameMatch | undefined {
  const paramName = name.match(dynamicNameRe)?.[1];
  if (paramName == null) {
    return undefined;
  } else if (paramName.startsWith('...')) {
    return { name: paramName.slice(3), deep: true };
  } else {
    return { name: paramName, deep: false };
  }
}

/**
 * Check if a pattern contains named parameters (e.g., [postId], [...slug])
 */
function hasNamedParameters(pattern: string): boolean {
  return pattern.split('/').some((segment) => dynamicNameRe.test(segment));
}

/**
 * Convert a pattern with named parameters to regex
 */
function namedParamToRegex(pattern: string): RegExp {
  const normalizedPattern = pattern.replace(/\/$/, '') || '/';
  const segments = normalizedPattern.split('/');
  const regexSegments = segments.map((segment) => {
    if (!segment) return '';

    const dynamicMatch = matchDynamicName(segment);
    if (dynamicMatch) {
      return dynamicMatch.deep ? '.+' : '[^/]+';
    }

    return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  });

  return new RegExp(`^${regexSegments.join('/')}(?:/)?$`);
}
