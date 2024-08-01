/**
 * Copyright © 2024 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

declare let __METRO_GLOBAL_PREFIX__: string;

globalThis.__webpack_chunk_load__ = global[`${__METRO_GLOBAL_PREFIX__}__loadBundleAsync`];
globalThis.__webpack_require__ = global[`${__METRO_GLOBAL_PREFIX__}__r`];
