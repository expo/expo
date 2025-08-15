import type { SharedObject } from 'expo';
/**
 * @hidden
 */
export type ViewEvent<Name extends string, Data> = Record<Name, Data extends object ? ((event: {
    nativeEvent: Data;
}) => void) | undefined : (() => void) | undefined>;
export declare class ExpoModifier extends SharedObject {
}
//# sourceMappingURL=types.d.ts.map