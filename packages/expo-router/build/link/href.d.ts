import { LinkToOptions } from '../global-state/routing';
import { UrlObject } from '../routeInfo';
import { Href } from '../types';
/** Resolve an href object into a fully qualified, relative href. */
export declare const resolveHref: (href: Href) => string;
export declare function resolveHrefStringWithSegments(href: string, { segments, params }?: Partial<UrlObject>, { relativeToDirectory }?: LinkToOptions): string;
//# sourceMappingURL=href.d.ts.map