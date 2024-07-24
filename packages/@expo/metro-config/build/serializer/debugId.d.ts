/**
 * Copyright © 2023 650 Industries.
 * Copyright (c) 2022, Sentry.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
/**
 * Deterministically hashes a string and turns the hash into a uuid.
 * https://github.com/getsentry/sentry-javascript-bundler-plugins/blob/58271f1af2ade6b3e64d393d70376ae53bc5bd2f/packages/bundler-plugin-core/src/utils.ts#L174
 */
export declare function stringToUUID(str: string): string;
