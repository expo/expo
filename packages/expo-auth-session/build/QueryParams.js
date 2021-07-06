import invariant from 'invariant';
import qs from 'qs';
export function buildQueryString(input) {
    return qs.stringify(input);
}
export function getQueryParams(url) {
    const parts = url.split('#');
    const hash = parts[1];
    const partsWithoutHash = parts[0].split('?');
    const queryString = partsWithoutHash[partsWithoutHash.length - 1];
    // Get query string (?hello=world)
    const parsedSearch = qs.parse(queryString, { parseArrays: false });
    // Pull errorCode off of params
    const errorCode = (parsedSearch.errorCode ?? null);
    invariant(typeof errorCode === 'string' || errorCode === null, `The "errorCode" parameter must be a string if specified`);
    delete parsedSearch.errorCode;
    // Get hash (#abc=example)
    let parsedHash = {};
    if (parts[1]) {
        parsedHash = qs.parse(hash);
    }
    // Merge search and hash
    const params = {
        ...parsedSearch,
        ...parsedHash,
    };
    return {
        errorCode,
        params,
    };
}
//# sourceMappingURL=QueryParams.js.map