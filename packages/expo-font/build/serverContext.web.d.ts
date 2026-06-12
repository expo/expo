import type { ServerFontResourceDescriptor } from './Font.types';
type ServerFontEntry = {
    name: string;
    css: string;
    resourceId: string;
};
export declare function withServerContext<T>(callback: () => T): T;
export declare function addServerFont(entry: ServerFontEntry): void;
export declare function getServerResourceDescriptors(): ServerFontResourceDescriptor[];
export declare function getLoadedServerFonts(): string[];
export declare function isServerFontLoaded(name: string): boolean;
export {};
//# sourceMappingURL=serverContext.web.d.ts.map