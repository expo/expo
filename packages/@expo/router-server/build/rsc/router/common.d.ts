/**
 * Copyright © 2024 650 Industries.
 * Copyright © 2024 2023 Daishi Kato
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
export type RouteProps = {
    path: string;
    query: string;
    hash: string;
};
export declare function getComponentIds(path: string): readonly string[];
export declare function getInputString(path: string): string;
export declare function parseInputString(input: string): string;
export declare const PARAM_KEY_SKIP = "expo_router_skip";
export declare const SHOULD_SKIP_ID = "/SHOULD_SKIP";
export declare const LOCATION_ID = "/LOCATION";
export type ShouldSkip = (readonly [
    componentId: string,
    components: readonly [
        path?: boolean,
        keys?: string[]
    ]
])[];
//# sourceMappingURL=common.d.ts.map