import type { RouteProps } from 'expo-router/internal/rsc';
import type { FunctionComponent, ReactNode } from 'react';
import { unstable_defineRouter } from './defineRouter';
import type { BuildConfig } from '../server';
export type CreatePageInput = {
    path: string;
    component: FunctionComponent<any>;
    render: 'static' | 'dynamic';
    staticPaths?: (string | string[])[];
    unstable_disableSSR?: boolean;
};
export type CreateLayoutInput = {
    path: string;
    component: FunctionComponent<Omit<RouteProps, 'searchParams'> & {
        children: ReactNode;
    }>;
    render: 'static' | 'dynamic';
};
export type CreatePagesApi = {
    createPage: (page: CreatePageInput) => void;
    createLayout: (layout: CreateLayoutInput) => void;
    unstable_setBuildData: (path: string, data: unknown) => void;
};
export type CreatePagesFn = (api: CreatePagesApi, opts: {
    unstable_buildConfig: BuildConfig | undefined;
}) => Promise<void>;
/**
 * Build an RSC router from a registration callback. Imitates `expo-server`'s
 * URL routing: each registered component carries a regex matcher, and the
 * resolver iterates the registry in specificity order, first match wins.
 * No exact-key lookup: this lets paths with `(group)` segments match runtime
 * IDs that don't include them.
 */
export declare function createPages(fn: CreatePagesFn): ReturnType<typeof unstable_defineRouter>;
//# sourceMappingURL=createPages.d.ts.map