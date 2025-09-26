export declare function memoize<const Fn extends (input: string, ...args: any[]) => Promise<any>>(fn: Fn): (input: string, ...args: any[]) => Promise<any>;
