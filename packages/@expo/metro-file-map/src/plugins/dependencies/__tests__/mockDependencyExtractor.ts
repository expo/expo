/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const blockCommentRe = /\/\*[^]*?\*\//g;
const lineCommentRe = /\/\/.*/g;
const LOAD_MODULE_RE = /(?:^|[^.]\s*)(\bloadModule\s*?\(\s*?)([`'"])([^`'"]+)(\2\s*?\))/g;

export function extract(
  code: string,
  filePath: string,
  defaultDependencyExtractor: (code: string) => Set<string>
): Set<string> {
  const dependencies = defaultDependencyExtractor(code);

  const addDependency = (match: string, pre: string, quot: string, dep: string) => {
    dependencies.add(dep);
    return match;
  };

  code
    .replace(blockCommentRe, '')
    .replace(lineCommentRe, '')
    .replace(LOAD_MODULE_RE, addDependency);

  return dependencies;
}

let cacheKey: string | undefined;

export function getCacheKey(): string | undefined {
  return cacheKey;
}

export function setCacheKey(key: string): void {
  cacheKey = key;
}
