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
  static RECRAWL_WARNINGS: RecrawlWarning[] = [];
  static REGEXP: RegExp = /Recrawled this watch (\d+) times?, most recently because:\n([^:]+)/;

  root: string;
  count: number;

  constructor(root: string, count: number) {
    this.root = root;
    this.count = count;
  }

  static findByRoot(root: string): RecrawlWarning | undefined {
    for (let i = 0; i < this.RECRAWL_WARNINGS.length; i++) {
      const warning = this.RECRAWL_WARNINGS[i]!;
      if (warning.root === root) {
        return warning;
      }
    }

    return undefined;
  }

  static isRecrawlWarningDupe(warningMessage: unknown): boolean {
    if (typeof warningMessage !== 'string') {
      return false;
    }
    const match = warningMessage.match(this.REGEXP);
    if (!match) {
      return false;
    }
    const count = Number(match[1]);
    const root = match[2]!;

    const warning = this.findByRoot(root);

    if (warning) {
      // only keep the highest count, assume count to either stay the same or
      // increase.
      if (warning.count >= count) {
        return true;
      } else {
        // update the existing warning to the latest (highest) count
        warning.count = count;
        return false;
      }
    } else {
      this.RECRAWL_WARNINGS.push(new RecrawlWarning(root, count));
      return false;
    }
  }
}
