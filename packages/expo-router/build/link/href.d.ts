import { UrlObject } from '../LocationProvider';
import { Href } from '../types';
/** Resolve an href object into a fully qualified, relative href. */
export declare const resolveHref: (href: Href<any>) => string;
export declare function resolveHrefStringWithSegments(href: string, { segments, params }?: Partial<UrlObject>, relativeToDirectory?: boolean): string;
//# sourceMappingURL=href.d.ts.map