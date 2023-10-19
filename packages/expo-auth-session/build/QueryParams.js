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
    const params = Object.fromEntries(
    // @ts-ignore: [Symbol.iterator] is indeed, available on every platform.
    parsedSearch);
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
//# sourceMappingURL=QueryParams.js.map