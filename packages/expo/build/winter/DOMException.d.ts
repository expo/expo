/**
 * Copyright © 2026 650 Industries.
 * Copyright © Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Forked from React Native's DOMException implementation
 * https://github.com/facebook/react-native/blob/f5bd86c31105bb6a994acb03c8149bd7ee03dac6/packages/react-native/src/private/webapis/errors/DOMException.js
 */
export declare class DOMException extends Error {
    #private;
    constructor(message?: string, name?: string);
    get name(): string;
    get code(): number;
}
//# sourceMappingURL=DOMException.d.ts.map