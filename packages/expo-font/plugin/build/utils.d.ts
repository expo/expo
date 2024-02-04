export declare function toAndroidResourceString(string: string): string;
export declare function resolveFontPaths(fonts: string[], projectRoot: string): Promise<string[]>;
type GroupedObject<T> = {
    [key: string]: T[];
};
export declare function groupBy<T>(array: T[], key: keyof T): GroupedObject<T>;
export {};
