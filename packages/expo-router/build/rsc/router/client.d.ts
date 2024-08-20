/**
 * Copyright © 2024 650 Industries.
 * Copyright © 2024 2023 Daishi Kato
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * https://github.com/dai-shi/waku/blob/3d1cc7d714b67b142c847e879c30f0724fc457a7/packages/waku/src/router/client.ts#L1
 */
import type { ReactNode, AnchorHTMLAttributes, ReactElement } from 'react';
import type { RouteProps } from './common.js';
type ShouldSkip = (readonly [
    componentId: string,
    readonly [
        path?: boolean,
        keys?: string[]
    ]
])[];
type RouterData = [
    shouldSkip?: ShouldSkip,
    locationListners?: Set<(path: string, query: string) => void>
];
export declare function Router({ routerData }: {
    routerData?: RouterData | undefined;
}): import("react").FunctionComponentElement<Omit<{
    initialInput?: string | undefined;
    initialSearchParamsString?: string | undefined;
    cache?: [([input: string, searchParamsString: string, setElements: (updater: Promise<Record<string, ReactNode>> | ((prev: Promise<Record<string, ReactNode>>) => Promise<Record<string, ReactNode>>)) => void, elements: Promise<Record<string, ReactNode>>] | undefined)?] | undefined;
    unstable_onFetchData?: ((data: unknown) => void) | undefined;
    children: ReactNode;
}, "children">>;
/**
 * ServerRouter for SSR
 * This is not a public API.
 */
export declare function ServerRouter({ children, route }: {
    children: ReactNode;
    route: RouteProps;
}): import("react").FunctionComponentElement<{
    children?: ReactNode;
}>;
export type LinkProps = {
    href: string;
    pending?: ReactNode;
    notPending?: ReactNode;
    children: ReactNode;
    unstable_prefetchOnEnter?: boolean;
    unstable_prefetchOnView?: boolean;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>;
export declare function Link({ href: to, children, pending, notPending, unstable_prefetchOnEnter, unstable_prefetchOnView, ...props }: LinkProps): ReactElement;
export {};
//# sourceMappingURL=client.d.ts.map