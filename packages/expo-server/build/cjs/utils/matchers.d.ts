import type { Route } from '../manifest';
export declare function isResponse(input: unknown): input is Response;
export declare function parseParams(request: Request, route: Route): Record<string, string>;
export declare function getRedirectRewriteLocation(url: URL, request: Request, route: Route): URL;
/** Match `[page]` -> `page`
 * @privateRemarks Ported from `expo-router/src/matchers.tsx`
 */
export declare function matchDynamicName(name: string): string | undefined;
/** Match `[...page]` -> `page`
 * @privateRemarks Ported from `expo-router/src/matchers.tsx`
 */
export declare function matchDeepDynamicRouteName(name: string): string | undefined;
