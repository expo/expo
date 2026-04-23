import type { UrlObject } from '../LocationProvider';
import type { LinkToOptions } from '../global-state/routing';
import type { Href } from '../types';
/** Resolve an href object into a fully qualified, relative href. */
export declare const resolveHref: (href: Href) => string;
export declare function resolveHrefStringWithSegments(href: string, { segments, params }?: Partial<UrlObject>, { relativeToDirectory }?: LinkToOptions): string;
//# sourceMappingURL=href.d.ts.map