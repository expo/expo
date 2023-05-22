/// <reference types="node" />
/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { getFiles } from './env';
declare const get: (projectRoot: string, { force }?: {
    force?: boolean | undefined;
}) => Record<string, string | undefined>, load: (projectRoot: string, { force }?: {
    force?: boolean | undefined;
}) => NodeJS.ProcessEnv;
export { getFiles, get, load };
