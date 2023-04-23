declare class NativeException extends Error {
    code: string;
    reason: string;
    cause: NativeException | null;
    constructor(code: string, reason: string, cause?: NativeException | null);
    get rootCause(): NativeException;
}
export default NativeException;
//# sourceMappingURL=NativeException.d.ts.map