/**
 * @hidden
 */
export type ViewEvent<Name extends string, Data> = Record<Name, Data extends object ? ((event: {
    nativeEvent: Data;
}) => void) | undefined : (() => void) | undefined>;
//# sourceMappingURL=types.d.ts.map