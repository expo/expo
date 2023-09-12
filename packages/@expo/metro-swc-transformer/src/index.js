/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const { existsSync } = require('fs');
const { join } = require('path');

if (existsSync(join(__dirname, 'metro-swc-transformer-addon.node'))) {
  throw new Error('Node.js addon for metro-swc-transformer not found');
}

// export {default} from './metro-swc-transformer-addon';

module.exports = require('../metro-swc-transformer-addon.node');
