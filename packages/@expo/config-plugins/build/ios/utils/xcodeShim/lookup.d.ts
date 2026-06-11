/**
 * Copyright © 2023-present 650 Industries, Inc. (aka Expo)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { AbstractObject, XcodeProject as BaconsXcodeProject } from '@bacons/xcode';
/**
 * Safely look up a project object by UUID.
 *
 * `@bacons/xcode`'s `getObject` throws if the UUID is not registered, whereas
 * the legacy library's equivalents (e.g. `getPBXGroupByKey`) returned `null`
 * for missing keys and most plugin code assumes the latter. This helper
 * returns `undefined` instead of throwing.
 */
export declare function safeGetObject(project: BaconsXcodeProject, uuid: string): AbstractObject<any> | undefined;
