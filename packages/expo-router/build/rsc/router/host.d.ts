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
type Elements = Promise<Record<string, ReactNode>>;
type SetElements = (updater: Elements | ((prev: Elements) => Elements)) => void;
type CacheEntry = [
    input: string,
    searchParamsString: string,
    setElements: SetElements,
    elements: Elements
];
declare const fetchCache: [CacheEntry?];
export declare const fetchRSC: (input: string, searchParamsString: string, setElements: SetElements, cache?: [(CacheEntry | undefined)?], unstable_onFetchData?: ((data: unknown) => void) | undefined, fetchOptions?: {
    remote: boolean;
}) => Elements;
export declare const prefetchRSC: (input: string, searchParamsString: string) => void;
export declare const Root: ({ initialInput, initialSearchParamsString, cache, unstable_onFetchData, children, }: {
    initialInput?: string | undefined;
    initialSearchParamsString?: string | undefined;
    cache?: [(CacheEntry | undefined)?] | undefined;
    unstable_onFetchData?: ((data: unknown) => void) | undefined;
    children: ReactNode;
}) => import("react").FunctionComponentElement<import("react").ProviderProps<(input: string, searchParams?: URLSearchParams) => void>>;
export declare const useRefetch: () => any;
export declare const Slot: ({ id, children, fallback, }: {
    id: string;
    children?: ReactNode;
    fallback?: ReactNode;
}) => string | number | true | import("react").ReactElement<any, string | import("react").JSXElementConstructor<any>> | import("react").ReactFragment | import("react").FunctionComponentElement<import("react").ProviderProps<ReactNode>>;
export declare const Children: () => any;
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