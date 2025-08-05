export declare function stringifyIfDate<T extends Date>(date: Date | T): string | T;
type StringifyDates<T extends Record<string, any>> = {
    [K in keyof T]: T[K] extends Date ? string : T[K];
};
export declare function stringifyDateValues<T extends Record<string, any>>(obj: T): StringifyDates<T>;
export {};
//# sourceMappingURL=utils.d.ts.map