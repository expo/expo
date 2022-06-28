export declare function sortObject<T extends Record<string, any> = Record<string, any>>(obj: T, compareFn?: (a: string, b: string) => number): T;
export declare function sortObjWithOrder<T extends Record<string, any> = Record<string, any>>(obj: T, order: string[]): T;
export declare function sortWithOrder(obj: string[], order: string[]): string[];
export declare const reverseSortString: (a: string, b: string) => 1 | 0 | -1;
