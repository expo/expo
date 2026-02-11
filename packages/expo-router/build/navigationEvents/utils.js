"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateStringUrlForState = generateStringUrlForState;
exports.getPathAndParamsFromStringUrl = getPathAndParamsFromStringUrl;
const getPathFromState_1 = require("../fork/getPathFromState");
const url_1 = require("../utils/url");
function generateStringUrlForState(state) {
    if (!state) {
        return undefined;
    }
    const { path: rawPath, params: nonPathParams } = (0, getPathFromState_1.getPathDataFromState)(state);
    const url = (0, url_1.parseUrlUsingCustomBase)(rawPath);
    for (const [key, value] of Object.entries(nonPathParams)) {
        url.searchParams.append(key, value);
    }
    return `${decodeURIComponent(url.pathname)}${url.search}`;
}
function getPathAndParamsFromStringUrl(urlString) {
    const url = (0, url_1.parseUrlUsingCustomBase)(urlString);
    return {
        pathname: url.pathname,
        params: Object.fromEntries(url.searchParams.entries()),
    };
}
//# sourceMappingURL=utils.js.map