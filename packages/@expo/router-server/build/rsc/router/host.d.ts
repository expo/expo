/**
 * Copyright © 2024 650 Industries.
 * Copyright © 2024 2023 Daishi Kato
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * https://github.com/dai-shi/waku/blob/32d52242c1450b5f5965860e671ff73c42da8bd0/packages/waku/src/client.ts#L1
 */
import type { ReactNode } from 'react';
type OnFetchData = (data: unknown) => void;
type SetElements = (updater: Elements | ((prev: Elements) => Elements)) => void;
declare const ENTRY = "e";
declare const SET_ELEMENTS = "s";
declare const ON_FETCH_DATA = "o";
type FetchCache = {
    [ENTRY]?: [input: string, params: unknown, elements: Elements];
    [SET_ELEMENTS]?: SetElements;
    [ON_FETCH_DATA]?: OnFetchData | undefined;
};
type Elements = Promise<Record<string, ReactNode>> & {
    prev?: Record<string, ReactNode> | undefined;
};
/**
 * callServer callback
 * This is not a public API.
 */
export declare const callServerRSC: (actionId: string, args?: unknown[], fetchCache?: FetchCache) => Promise<import("react").ReactElement<unknown, string | import("react").JSXElementConstructor<any>> | Iterable<ReactNode> | (string | number | bigint | boolean | import("react").ReactPortal | import("react").ReactElement<unknown, string | import("react").JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined)>;
export declare const fetchRSC: (input: string, params?: unknown, fetchCache?: FetchCache) => Elements;
export declare const prefetchRSC: (input: string, params?: unknown) => void;
export declare const Root: ({ initialInput, initialParams, fetchCache, unstable_onFetchData, children, }: {
    initialInput?: string;
    initialParams?: unknown;
    fetchCache?: FetchCache;
    unstable_onFetchData?: (data: unknown) => void;
    children: ReactNode;
}) => import("react").FunctionComponentElement<import("react").ProviderProps<(input: string, searchParams?: URLSearchParams | string) => void>>;
export declare const useRefetch: () => (input: string, searchParams?: URLSearchParams | string) => void;
export declare const Slot: ({ id, children, fallback, }: {
    id: string;
    children?: ReactNode;
    fallback?: ReactNode;
}) => string | number | bigint | true | import("react").ReactElement<unknown, string | import("react").JSXElementConstructor<any>> | Iterable<ReactNode> | Promise<string | number | bigint | boolean | import("react").ReactPortal | import("react").ReactElement<unknown, string | import("react").JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | import("react").FunctionComponentElement<import("react").ProviderProps<ReactNode>>;
export declare const Children: () => ReactNode;
/**
 * ServerRoot for SSR
 * This is not a public API.
 */
export declare const ServerRoot: ({ elements, children }: {
    elements: Elements;
    children: ReactNode;
}) => import("react").FunctionComponentElement<import("react").ProviderProps<Elements | null>>;
export {};
//# sourceMappingURL=host.d.ts.map