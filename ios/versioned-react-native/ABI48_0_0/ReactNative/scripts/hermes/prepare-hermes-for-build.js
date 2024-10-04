/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

/**
 * This script prepares Hermes to be built as part of the
 * iOS build pipeline on macOS.
 */
const {
  configureMakeForPrebuiltHermesC,
  copyBuildScripts,
  copyPodSpec,
  downloadHermesSourceTarball,
  expandHermesSourceTarball,
  shouldUsePrebuiltHermesC,
  shouldBuildHermesFromSource,
} = require('./hermes-utils');

async function main(isInCI) {
  if (!shouldBuildHermesFromSource(isInCI)) {
    copyPodSpec();
    return;
  }
  downloadHermesSourceTarball();
  expandHermesSourceTarball();
  copyPodSpec();
  copyBuildScripts();

  if (shouldUsePrebuiltHermesC('macos')) {
    console.log('[Hermes] Using pre-built HermesC');
    configureMakeForPrebuiltHermesC();
  }
}

const isInCI = process.env.REACT_NATIVE_CI === 'true';

main(isInCI).then(() => {
  process.exit(0);
});
