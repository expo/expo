interface ExceptionData {
    message: string;
    originalMessage: string | undefined | null;
    name: string | undefined | null;
    componentStack: string | undefined | null;
    stack: StackFrame[];
    id: number;
    isFatal: boolean;
    extraData?: object;
}
interface ExtendedExceptionData extends ExceptionData {
    isComponentError: boolean;
}
interface Message {
    readonly content: string;
    readonly substitutions: readonly {
        readonly length: number;
        readonly offset: number;
    }[];
}
interface CodeFrame {
    readonly content: string;
    readonly location: {
        row: number;
        column: number;
    } | undefined | null;
    readonly fileName: string;
    readonly collapse?: boolean;
}
interface StackFrame {
    column: number | undefined | null;
    file: string | undefined | null;
    lineNumber: number | undefined | null;
    methodName: string;
    collapse?: boolean;
}
type Category = string;
type LogLevel = 'warn' | 'error' | 'fatal' | 'syntax';
type Stack = StackFrame[];
interface LogBoxLogData {
    readonly level: LogLevel;
    readonly type?: string | undefined | null;
    readonly message: Message;
    readonly stack: Stack;
    readonly category: string;
    readonly componentStack: Stack;
    readonly codeFrame?: CodeFrame | undefined | null;
    readonly isComponentError: boolean;
    readonly extraData?: unknown;
    readonly onNotificationPress?: (() => void) | undefined | null;
}
export { parseInterpolation } from './parseLogBoxLog';
export declare function withoutANSIColorStyles<T>(text: T): T;
export declare function parseLogBoxException(error: ExtendedExceptionData): LogBoxLogData;
export declare function parseLogBoxLog(args: any[]): {
    componentStack: Stack;
    componentStackType: string;
    category: Category;
    message: Message;
};
export declare function parseComponentStack(message: string): {
    type: 'stack';
    stack: readonly CodeFrame[];
};
export declare function hasComponentStack(args: any[]): boolean;
//# sourceMappingURL=parseLogBoxLogNative.d.ts.map