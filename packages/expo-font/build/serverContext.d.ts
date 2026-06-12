import type { ServerFontResourceDescriptor } from './Font.types';
type ServerFontEntry = {
    name: string;
    css: string;
    resourceId: string;
};
export declare function withServerContext<T>(callback: () => T): T;
export declare function addServerFont(_entry: ServerFontEntry): void;
export declare function getServerResourceDescriptors(): ServerFontResourceDescriptor[];
export declare function getLoadedServerFonts(): string[];
export declare function isServerFontLoaded(_name: string): boolean;
export {};
//# sourceMappingURL=serverContext.d.ts.map