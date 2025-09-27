/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
/**
 * Logs exceptions to the (native) console and displays them
 */
export declare function parseUnexpectedThrownValue(error: any): {
    isComponentError: boolean;
    message: string;
    originalMessage: string | null;
    name: string | null;
    componentStack: string | null;
    stack: import("./devServerEndpoints").MetroStackFrame[];
    id: number;
    isFatal: boolean;
    extraData: {
        jsEngine: string | undefined;
        rawStack: string | undefined;
    };
};
//# sourceMappingURL=parseUnexpectedThrownValue.d.ts.map