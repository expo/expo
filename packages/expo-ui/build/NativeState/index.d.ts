import { SharedObject } from 'expo';
export declare class NativeStateString extends SharedObject<{}> {
    constructor(initialValue?: string);
    value: string;
}
export declare class NativeStateDouble extends SharedObject<{}> {
    constructor(initialValue?: number);
    value: number;
}
export declare class NativeStateBool extends SharedObject<{}> {
    constructor(initialValue?: boolean);
    value: boolean;
}
export declare function useNativeStateString(initialValue?: string): NativeStateString;
export declare function useNativeStateDouble(initialValue?: number): NativeStateDouble;
export declare function useNativeStateBool(initialValue?: boolean): NativeStateBool;
//# sourceMappingURL=index.d.ts.map