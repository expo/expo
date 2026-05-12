import type { FontSource, ServerFontResourceDescriptor } from './Font.types';
/**
 * @returns the server resources that should be statically extracted.
 * @private
 */
export declare function getServerResources(): string[];
export declare function getServerResourceDescriptors(): ServerFontResourceDescriptor[];
/**
 * @returns clear the server resources from the global scope.
 * @private
 */
export declare function resetServerContext(): void;
export declare function registerStaticFont(fontFamily: string, source?: FontSource | null): void;
//# sourceMappingURL=server.d.ts.map