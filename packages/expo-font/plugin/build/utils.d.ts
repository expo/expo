import type { FontFiles } from './withFontsAndroid';
export declare function resolveFontPaths(fonts: string[], projectRoot: string): Promise<string[]>;
export declare function resolveXmlFontPaths(fonts: FontFiles[], projectRoot: string): Promise<{
    font: string;
    fontStyle: "normal" | "italic";
    fontWeight: `${number}`;
}[]>;
export declare function normalizeFilename(filename: string): string;
export declare function generateFontFamilyXml(files: FontFiles[]): string;
