/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { buildAsyncRequire } from './buildAsyncRequire';

// @ts-ignore
global[`${global.__METRO_GLOBAL_PREFIX__ ?? ''}__loadBundleAsync`] = buildAsyncRequire();
