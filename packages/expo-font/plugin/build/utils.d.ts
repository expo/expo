import { Font } from "./withFonts";
export declare function resolveFontPaths(fonts: string[], projectRoot: string): Promise<string[]>;
export declare function getFontPaths(fonts: Font[]): string[];
type GroupedObject<T> = {
    [key: string]: T[];
};
export declare function groupBy<T>(array: T[], key: keyof T): GroupedObject<T>;
export {};
