/**
 * Copyright © 2026 650 Industries.
 * Copyright © Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Fork of React Native's DOMException implementation
 * https://github.com/facebook/react-native/blob/2fb7a63570429a85cd869b29e4a470b963234147/packages/react-native/src/private/webapis/errors/DOMException.js
 */
export declare class DOMException extends Error {
    #private;
    constructor(message?: string, name?: string);
    get name(): string;
    get code(): number;
}
//# sourceMappingURL=DOMException.d.ts.map