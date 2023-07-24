"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.asMock = void 0;
const getDevServer_1 = __importDefault(require("../../getDevServer"));
const buildUrlForBundle_1 = require("../buildUrlForBundle");
const asMock = (fn) => fn;
exports.asMock = asMock;
jest.mock("../../getDevServer", () => {
    return jest.fn();
});
it(`returns an expected URL`, () => {
    (0, exports.asMock)(getDevServer_1.default).mockReturnValueOnce({
        bundleLoadedFromServer: true,
        fullBundleUrl: "http://localhost:19000?platform=android&modulesOnly=true&runModule=false&runtimeBytecodeVersion=null",
        url: "http://localhost:19000",
    });
    expect((0, buildUrlForBundle_1.buildUrlForBundle)("/foobar")).toEqual("http://localhost:19000/foobar");
});
//# sourceMappingURL=buildUrlForBundle.test.native.js.map