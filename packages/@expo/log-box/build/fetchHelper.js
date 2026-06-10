"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setFetchText = setFetchText;
exports.fetchTextAsync = fetchTextAsync;
function defaultFetchTextAsync(input, init) {
    return fetch(input, init).then((res) => res.text());
}
let fetchTextAsyncFn = defaultFetchTextAsync;
function setFetchText(fn) {
    fetchTextAsyncFn = fn;
}
function fetchTextAsync(input, init) {
    return fetchTextAsyncFn(input, init);
}
//# sourceMappingURL=fetchHelper.js.map