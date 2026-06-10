/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { ExtendedExceptionData } from '../LogBox';
/**
 * Logs exceptions to the (native) console and displays them
 */
export declare function parseUnexpectedThrownValue(error: Error | string): ExtendedExceptionData;
