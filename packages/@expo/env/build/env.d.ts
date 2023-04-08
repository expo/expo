/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
/// <reference types="node" />
export declare function createControlledEnvironment(): {
    load: (projectRoot: string, { force }?: {
        force?: boolean | undefined;
    }) => NodeJS.ProcessEnv;
    get: (projectRoot: string, { force }?: {
        force?: boolean | undefined;
    }) => Record<string, string | undefined>;
    _getForce: (projectRoot: string) => Record<string, string | undefined>;
};
export declare function getFiles(mode: string | undefined): string[];
