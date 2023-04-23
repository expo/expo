class NativeException extends Error {
    code;
    reason;
    cause;
    constructor(code, reason, cause) {
        super(getExceptionMessage(reason, cause));
        this.code = code;
        this.reason = reason;
        this.cause = cause ?? null;
        console.log(typeof this.stack);
        const stack = this.stack
            ?.replace(this.message, '')
            .split('\n')
            .splice(1)
            .filter((line) => {
            return !line.includes('at NativeException ');
        });
        console.log(stack);
        this.stack = `Error: ${this.message}\n${stack?.join('\n')}`;
    }
    get rootCause() {
        const { cause } = this;
        if (!cause) {
            return this;
        }
        if (cause instanceof NativeException) {
            return cause.rootCause;
        }
        return cause;
    }
}
function getExceptionMessage(reason, cause) {
    return cause ? `${reason}\n→ Caused by: ${cause.message}` : reason;
}
export default NativeException;
//# sourceMappingURL=NativeException.js.map