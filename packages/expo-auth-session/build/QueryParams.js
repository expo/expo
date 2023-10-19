import invariant from 'invariant';
export function getQueryParams(url) {
    const parts = url.split('#');
    const hash = parts[1];
    const partsWithoutHash = parts[0].split('?');
    const queryString = partsWithoutHash[partsWithoutHash.length - 1];
    // Get query string (?hello=world)
    const parsedSearch = new URLSearchParams(queryString);
    // Pull errorCode off of params
    const errorCode = (parsedSearch.get('errorCode') ?? null);
    invariant(typeof errorCode === 'string' || errorCode === null, `The "errorCode" parameter must be a string if specified`);
    parsedSearch.delete('errorCode');
    // Merge search and hash
    const params = toObj(parsedSearch);
    // Get hash (#abc=example)
    if (parts[1]) {
        new URLSearchParams(hash).forEach((value, key) => {
            params[key] = value;
        });
    }
    return {
        errorCode,
        params,
    };
}
function toObj(searchParams) {
    const obj = {};
    searchParams.forEach((value, key) => {
        obj[key] = value;
    });
    return obj;
}
//# sourceMappingURL=QueryParams.js.map