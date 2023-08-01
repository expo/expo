export type Href = string | HrefObject;
export interface HrefObject {
    /** Path representing the selected route `/[id]`. */
    pathname?: string;
    /** Query parameters for the path. */
    params?: Record<string, any>;
}
/** Resolve an href object into a fully qualified, relative href. */
export declare const resolveHref: (href: Href) => string;
//# sourceMappingURL=href.d.ts.map