"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asMock = void 0;
const buildAsyncRequire_1 = require("../buildAsyncRequire");
const loadBundle_1 = require("../loadBundle");
const asMock = (fn) => fn;
exports.asMock = asMock;
jest.mock("../loadBundle", () => ({
    loadBundleAsync: jest.fn(async () => { }),
}));
const originalEnv = process.env.NODE_ENV;
beforeEach(() => {
    process.env.NODE_ENV = "development";
});
afterAll(() => {
    process.env.NODE_ENV = originalEnv;
});
it(`builds required object`, async () => {
    const asyncRequire = (0, buildAsyncRequire_1.buildAsyncRequire)();
    expect(asyncRequire).toBeInstanceOf(Function);
});
it(`loads the module with \`loadBundleAsync\` if the module has not been loaded already`, async () => {
    const asyncRequire = (0, buildAsyncRequire_1.buildAsyncRequire)();
    const myModule = asyncRequire("/bacon.bundle?platform=ios");
    expect(myModule).toEqual(expect.any(Promise));
    // Did attempt to fetch the bundle
    expect(loadBundle_1.loadBundleAsync).toBeCalledWith("/bacon.bundle?platform=ios");
});
//# sourceMappingURL=buildAsyncRequire.test.js.map