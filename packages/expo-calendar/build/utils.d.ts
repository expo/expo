export declare function stringifyIfDate<T extends Date>(date: Date | T): string | T;
type StringifyDates<T extends Record<string, any>> = {
    [K in keyof T]: T[K] extends Date ? string : T[K];
};
export declare function stringifyDateValues<T extends Record<string, any>>(obj: T): StringifyDates<T>;
/**
 * Extracts keys from a details object where the value is null.
 * Used for identifying which fields should be explicitly set to null in native updates.
 */
export declare function getNullableDetailsFields<T extends Record<string, any>>(details: Partial<T>): (keyof T)[];
export {};
//# sourceMappingURL=utils.d.ts.map