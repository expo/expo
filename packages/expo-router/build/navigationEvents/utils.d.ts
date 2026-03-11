import { type State } from '../fork/getPathFromState';
export declare function generateStringUrlForState(state: State | undefined): string | undefined;
export declare function getPathAndParamsFromStringUrl(urlString: string): {
    pathname: string;
    params: {
        [k: string]: string;
    };
};
//# sourceMappingURL=utils.d.ts.map