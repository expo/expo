import type { State } from './fork/getPathFromState';
type SearchParams = Record<string, string | string[]>;
export type UrlObject = {
    unstable_globalHref: string;
    pathname: string;
    readonly params: SearchParams;
    segments: string[];
};
export declare function getRouteInfoFromState(getPathFromState: (state: State, asPath: boolean) => {
    path: string;
    params: any;
}, state: State, basePath?: string): UrlObject;
export declare function getNormalizedStatePath({ path: statePath, params, }: {
    path: string;
    params: any;
}, basePath?: string): Pick<UrlObject, 'segments' | 'params'>;
export {};
//# sourceMappingURL=LocationProvider.d.ts.map