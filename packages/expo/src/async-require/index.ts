/**
 * Copyright © 2024 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { buildAsyncRequire } from './buildAsyncRequire';

// @ts-ignore: ignore the global which may not always be defined in jest environments.
global[`${global.__METRO_GLOBAL_PREFIX__ ?? ''}__loadBundleAsync`] = buildAsyncRequire();
