/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Originally vendored from
 * https://github.com/amasad/sane/blob/64ff3a870c42e84f744086884bf55a4f9c22d376/src/utils/recrawl-warning-dedupe.js
 */
export default class RecrawlWarning {
    static RECRAWL_WARNINGS: RecrawlWarning[];
    static REGEXP: RegExp;
    root: string;
    count: number;
    constructor(root: string, count: number);
    static findByRoot(root: string): RecrawlWarning | undefined;
    static isRecrawlWarningDupe(warningMessage: unknown): boolean;
}
