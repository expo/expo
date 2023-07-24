"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const HMRClient_1 = __importDefault(require("../../HMRClient"));
const LoadingView_1 = __importDefault(require("../../LoadingView"));
const fetchThenEval_1 = require("../fetchThenEval");
const loadBundle_1 = require("../loadBundle");
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
});
it("loads a bundle", async () => {
    process.env.NODE_ENV = "development";
    await (0, loadBundle_1.loadBundleAsync)("/Second.bundle?modulesOnly=true");
    expect(LoadingView_1.default.showMessage).toBeCalledWith("Downloading...", "load");
    expect(LoadingView_1.default.hide).toBeCalledWith();
    const url = `/Second.bundle?modulesOnly=true`;
    expect(HMRClient_1.default.registerBundle).toBeCalledWith(url);
    expect(fetchThenEval_1.fetchThenEvalAsync).toBeCalledWith(url);
});
it("loads a bundle in production", async () => {
    process.env.NODE_ENV = "production";
    await (0, loadBundle_1.loadBundleAsync)("/Second.bundle?modulesOnly=true");
    expect(LoadingView_1.default.showMessage).not.toBeCalled();
    expect(LoadingView_1.default.hide).not.toBeCalled();
    const url = `/Second.bundle?modulesOnly=true`;
    expect(HMRClient_1.default.registerBundle).not.toBeCalled();
    expect(fetchThenEval_1.fetchThenEvalAsync).toBeCalledWith(url);
});
//# sourceMappingURL=loadBundle.test.web.js.map