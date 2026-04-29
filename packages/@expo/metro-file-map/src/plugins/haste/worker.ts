/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import path from 'path';

import { unwrapESModuleDefault } from '../../lib/unwrapESModule';
import type { MetadataWorker, V8Serializable, WorkerMessage } from '../../types';
import excludedExtensions from '../../workerExclusionList';

const PACKAGE_JSON: string = path.sep + 'package.json';

export default class Worker implements MetadataWorker {
  #hasteImpl: { readonly getHasteName: (filePath: string) => string | null | undefined } | null =
    null;

  constructor({ hasteImplModulePath }: Readonly<{ hasteImplModulePath: string | null }>) {
    if (hasteImplModulePath != null) {
      this.#hasteImpl = unwrapESModuleDefault(require(hasteImplModulePath));
    }
  }

  async processFile(
    data: WorkerMessage,
    utils: { readonly getContent: () => Promise<Buffer> }
  ): Promise<V8Serializable> {
    let hasteName: string | null = null;
    const { filePath } = data;
    if (filePath.endsWith(PACKAGE_JSON)) {
      // Process a package.json that is returned as a PACKAGE type with its name.
      try {
        const fileData = JSON.parse((await utils.getContent()).toString());
        if (fileData.name) {
          hasteName = fileData.name;
        }
      } catch (err: any) {
        throw new Error(`Cannot parse ${filePath} as JSON: ${err.message}`);
      }
    } else if (!excludedExtensions.has(filePath.substr(filePath.lastIndexOf('.')))) {
      if (!this.#hasteImpl) {
        throw new Error('computeHaste is true but hasteImplModulePath not set');
      }
      // Process a random file that is returned as a MODULE.
      hasteName = this.#hasteImpl.getHasteName(filePath) || null;
    }
    return hasteName;
  }
}
