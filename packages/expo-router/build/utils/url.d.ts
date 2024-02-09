/**
 * Does the input string start with a valid URL scheme.
 * NOTE: Additional strictness added to ensure URLs sent in query parameters for in-app navigation are not matched.
 */
export declare function hasUrlProtocolPrefix(href: string): boolean;
export declare function isWellKnownUri(href: string): boolean;
export declare function shouldLinkExternally(href: string): boolean;
//# sourceMappingURL=url.d.ts.map