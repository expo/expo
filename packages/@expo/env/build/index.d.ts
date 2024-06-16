/// <reference types="node" />
/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { getFiles, isEnabled } from './env';
declare const get: (projectRoot: string, options?: {
    silent?: boolean | undefined;
    force?: boolean | undefined;
}) => {
    env: Record<string, string | undefined>;
    files: string[];
}, load: (projectRoot: string, options?: {
    silent?: boolean | undefined;
    force?: boolean | undefined;
}) => NodeJS.ProcessEnv;
export { getFiles, get, load, isEnabled };
