import { StackFrame } from 'stacktrace-parser';
declare function parseErrorStack(stack?: string): (StackFrame & {
    collapse?: boolean;
})[];
export default parseErrorStack;
//# sourceMappingURL=index.d.ts.map