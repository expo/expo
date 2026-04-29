/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

import { extract } from './dependencyExtractor';
import { unwrapESModuleDefault } from '../../lib/unwrapESModule';
import type {
  DependencyExtractor,
  MetadataWorker,
  V8Serializable,
  WorkerMessage,
} from '../../types';

export default class DependencyExtractorWorker implements MetadataWorker {
  readonly #dependencyExtractor: DependencyExtractor | undefined | null;

  constructor({ dependencyExtractor }: Readonly<{ dependencyExtractor: string | null }>) {
    if (dependencyExtractor != null) {
      this.#dependencyExtractor = unwrapESModuleDefault(require(dependencyExtractor));
    }
  }

  async processFile(
    data: WorkerMessage,
    utils: { readonly getContent: () => Promise<Buffer> }
  ): Promise<V8Serializable> {
    const content = (await utils.getContent()).toString();
    const { filePath } = data;

    const dependencies =
      this.#dependencyExtractor != null
        ? this.#dependencyExtractor.extract(content, filePath, extract)
        : extract(content);

    // Return as array (PerFileData type)
    return Array.from(dependencies);
  }
}
