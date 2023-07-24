"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const buildUrlForBundle_1 = require("../buildUrlForBundle");
it(`returns an expected URL`, () => {
    expect((0, buildUrlForBundle_1.buildUrlForBundle)("foobar")).toEqual("/foobar");
});
it(`returns an expected URL with non standard root`, () => {
    expect((0, buildUrlForBundle_1.buildUrlForBundle)("/more/than/one")).toEqual("/more/than/one");
});
//# sourceMappingURL=buildUrlForBundle.test.web.js.map