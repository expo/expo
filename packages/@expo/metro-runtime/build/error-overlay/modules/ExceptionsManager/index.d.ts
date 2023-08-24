/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
type ExtendedError = any;
declare class SyntheticError extends Error {
    name: string;
}
declare function parseException(e: ExtendedError, isFatal: boolean): {
    isComponentError: boolean;
    message: any;
    originalMessage: any;
    name: any;
    componentStack: any;
    stack: (import("stacktrace-parser").StackFrame & {
        collapse?: boolean | undefined;
    })[];
    id: number;
    isFatal: boolean;
    extraData: {
        jsEngine: any;
        rawStack: any;
    };
};
/**
 * Logs exceptions to the (native) console and displays them
 */
declare function handleException(e: any): void;
declare const ErrorUtils: {
    parseException: typeof parseException;
    handleException: typeof handleException;
    SyntheticError: typeof SyntheticError;
};
export default ErrorUtils;
//# sourceMappingURL=index.d.ts.map