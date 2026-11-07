/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {
  DependencyExtractor,
  MetadataWorker,
  V8Serializable,
  WorkerMessage,
} from '../../types';
import * as defaultDependencyExtractor from './dependencyExtractor';

export default class DependencyExtractorWorker implements MetadataWorker {
  readonly #dependencyExtractor: DependencyExtractor['extract'] | undefined | null;

  constructor({
    dependencyExtractor,
  }: Readonly<{ dependencyExtractor: string | undefined | null }>) {
    if (dependencyExtractor != null) {
      const mod = require(dependencyExtractor);
      let extract = mod?.extract; // CJS export or ESM named export
      if (extract == null && mod?.__esModule === true) {
        extract = mod.default?.extract;
      }
      this.#dependencyExtractor = extract;
    }
  }

  processFile(data: WorkerMessage, utils: Readonly<{ getContent: () => Buffer }>): V8Serializable {
    const content = utils.getContent().toString();
    const { filePath } = data;

    const dependencies =
      this.#dependencyExtractor != null
        ? this.#dependencyExtractor(content, filePath, defaultDependencyExtractor.extract)
        : defaultDependencyExtractor.extract(content);

    // Return as array (PerFileData type)
    return Array.from(dependencies);
  }
}
