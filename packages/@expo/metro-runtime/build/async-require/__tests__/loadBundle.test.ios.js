"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const HMRClient_1 = __importDefault(require("../../HMRClient"));
const LoadingView_1 = __importDefault(require("../../LoadingView"));
const fetchThenEval_1 = require("../fetchThenEval");
const loadBundle_1 = require("../loadBundle");
jest.mock("../../getDevServer", () => jest.fn(() => ({
    bundleLoadedFromServer: true,
    fullBundleUrl: "http://localhost:19000?platform=android&modulesOnly=true&runModule=false&runtimeBytecodeVersion=null",
    url: "http://localhost:19000/",
})));
jest.mock("../fetchThenEval", () => ({
    fetchThenEvalAsync: jest.fn(async () => { }),
}));
jest.mock("../../HMRClient", () => ({
    __esModule: true,
    default: { registerBundle: jest.fn() },
}));
jest.mock("../../LoadingView", () => ({
    showMessage: jest.fn(),
    hide: jest.fn(),
}));
const originalEnv = process.env.NODE_ENV;
afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    if (typeof location !== "undefined") {
        delete global.location;
    }
});
it("loads a bundle", async () => {
    process.env.NODE_ENV = "development";
    await (0, loadBundle_1.loadBundleAsync)("Second.bundle?platform=ios&modulesOnly=true&runModule=false&runtimeBytecodeVersion=");
    expect(LoadingView_1.default.showMessage).toBeCalledWith("Downloading...", "load");
    expect(LoadingView_1.default.hide).toBeCalledWith();
    const url = "http://localhost:19000/Second.bundle?platform=ios&modulesOnly=true&runModule=false&runtimeBytecodeVersion=";
    expect(HMRClient_1.default.registerBundle).toBeCalledWith(url);
    expect(fetchThenEval_1.fetchThenEvalAsync).toBeCalledWith(url);
});
it("asserts in production when attempting to load a bundle and the user-defined origin is missing.", async () => {
    process.env.NODE_ENV = "production";
    await expect((0, loadBundle_1.loadBundleAsync)("Second.bundle?platform=ios&modulesOnly=true&runModule=false&runtimeBytecodeVersion=")).rejects.toThrow();
    expect(LoadingView_1.default.showMessage).not.toBeCalled();
    expect(LoadingView_1.default.hide).not.toBeCalled();
    expect(HMRClient_1.default.registerBundle).not.toBeCalled();
    expect(fetchThenEval_1.fetchThenEvalAsync).not.toBeCalled();
});
it("loads a bundle in production with user-defined location.origin", async () => {
    process.env.NODE_ENV = "production";
    global.location = {
        origin: "https://example.com",
    };
    await (0, loadBundle_1.loadBundleAsync)("/_expo/js/index.bundle");
    expect(LoadingView_1.default.showMessage).not.toBeCalled();
    expect(LoadingView_1.default.hide).not.toBeCalled();
    const url = "https://example.com/_expo/js/index.bundle";
    expect(HMRClient_1.default.registerBundle).not.toBeCalled();
    expect(fetchThenEval_1.fetchThenEvalAsync).toBeCalledWith(url);
});
//# sourceMappingURL=loadBundle.test.ios.js.map