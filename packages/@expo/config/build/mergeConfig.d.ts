type ArrayMerge = (target: any[], source: any[]) => any[];
export declare function mergeConfig<T>(target: Partial<T>, source: Partial<T>, arrayMerge?: ArrayMerge): T;
export {};
