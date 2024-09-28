/**
 * Copyright © 2024 650 Industries.
 * Copyright © 2024 2023 Daishi Kato
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { FunctionComponent, ReactNode } from 'react';
import type { RouteProps, ShouldSkip } from './common';
import type { PathSpec } from '../path';
import { defineEntries } from '../server';
import type { BuildConfig } from '../server';
type RoutePropsForLayout = Omit<RouteProps, 'searchParams'> & {
    children: ReactNode;
};
type ShouldSkipValue = ShouldSkip[number][1];
export declare function unstable_defineRouter(getPathConfig: () => Promise<Iterable<{
    pattern: string;
    path: PathSpec;
    isStatic?: boolean;
    noSsr?: boolean;
    data?: unknown;
}>>, getComponent: (componentId: string, // "**/layout" or "**/page"
options: {
    unstable_setShouldSkip: (val?: ShouldSkipValue) => void;
    unstable_buildConfig: BuildConfig | undefined;
}) => Promise<FunctionComponent<RouteProps> | FunctionComponent<RoutePropsForLayout> | null>): ReturnType<typeof defineEntries>;
export declare function unstable_redirect(pathname: string, searchParams?: URLSearchParams, skip?: string[]): void;
export {};
//# sourceMappingURL=defineRouter.d.ts.map