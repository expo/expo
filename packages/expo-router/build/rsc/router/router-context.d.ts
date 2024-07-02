/**
 * Copyright © 2024 650 Industries.
 * Copyright © 2024 2023 Daishi Kato
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
/// <reference types="react" />
import type { RouteProps } from './common';
export declare const parseRoute: (url: URL) => RouteProps;
export type ChangeRoute = (route: RouteProps, options?: {
    checkCache?: boolean;
    skipRefetch?: boolean;
}) => void;
export type PrefetchRoute = (route: RouteProps) => void;
export declare const RouterContext: import("react").Context<{
    route: RouteProps;
    changeRoute: ChangeRoute;
    prefetchRoute: PrefetchRoute;
} | null>;
//# sourceMappingURL=router-context.d.ts.map