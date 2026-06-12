import type { FontSource, ServerFontResourceDescriptor } from './Font.types';
export { withServerContext } from './serverContext';
/**
 * @returns the server resources that should be statically extracted.
 * @private
 */
export declare function getServerResources(): string[];
export declare function getServerResourceDescriptors(): ServerFontResourceDescriptor[];
export declare function registerStaticFont(fontFamily: string, source?: FontSource | null): void;
//# sourceMappingURL=server.d.ts.map