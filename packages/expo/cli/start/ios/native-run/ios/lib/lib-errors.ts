/**
 * Copyright (c) 2021 Expo, Inc.
 * Copyright (c) 2018 Drifty Co.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Type union of error codes we get back from the protocol.
 */
export type IOSLibErrorCode = 'DeviceLocked';

export class IOSLibError extends Error implements NodeJS.ErrnoException {
  constructor(message: string, readonly code: IOSLibErrorCode) {
    super(message);
  }
}
