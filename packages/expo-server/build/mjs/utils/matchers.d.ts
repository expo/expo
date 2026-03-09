import type { Route } from '../manifest';
export declare function isResponse(input: unknown): input is Response;
export declare function parseParams(request: Request, route: Route): Record<string, string>;
/**
 * Resolves a route's context key into a concrete path by substituting dynamic segments
 * with actual param values.
 *
 * @example
 * ```tsx
 * resolveLoaderContextKey('/users/[id]`, { id: '123' }) // /users/123
 * ```
 *
 * @see import('expo-router/src/utils/matchers').getSingularId
 */
export declare function resolveLoaderContextKey(contextKey: string, params: Record<string, string | string[]>): string;
export declare function getRedirectRewriteLocation(url: URL, request: Request, route: Route): URL;
/** Match `[page]` -> `page`
 * @privateRemarks Ported from `expo-router/src/matchers.tsx`
 */
export declare function matchDynamicName(name: string): string | undefined;
/** Match `[...page]` -> `page`
 * @privateRemarks Ported from `expo-router/src/matchers.tsx`
 */
export declare function matchDeepDynamicRouteName(name: string): string | undefined;
