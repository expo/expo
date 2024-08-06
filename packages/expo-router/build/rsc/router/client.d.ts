/**
 * Copyright © 2024 650 Industries.
 * Copyright © 2024 2023 Daishi Kato
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * https://github.com/dai-shi/waku/blob/3d1cc7d714b67b142c847e879c30f0724fc457a7/packages/waku/src/router/client.ts#L1
 */
import type { ReactNode } from 'react';
import type { RouteProps } from './common.js';
export declare function Router(): import("react").FunctionComponentElement<Omit<{
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
//# sourceMappingURL=client.d.ts.map