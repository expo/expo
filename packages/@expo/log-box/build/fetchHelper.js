function defaultFetchTextAsync(input, init) {
    return fetch(input, init).then((res) => res.text());
}
let fetchTextAsyncFn = defaultFetchTextAsync;
export function setFetchText(fn) {
    fetchTextAsyncFn = fn;
}
export function fetchTextAsync(input, init) {
    return fetchTextAsyncFn(input, init);
}
//# sourceMappingURL=fetchHelper.js.map