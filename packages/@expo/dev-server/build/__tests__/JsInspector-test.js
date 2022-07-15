"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = __importDefault(require("node-fetch"));
const open_1 = __importDefault(require("open"));
const JsInspector_1 = require("../JsInspector");
const metroInspectorResponse_1 = require("../__tests__/fixtures/metroInspectorResponse");
jest.mock('fs-extra');
jest.mock('node-fetch');
jest.mock('open');
jest.mock('rimraf');
jest.mock('temp-dir', () => '/tmp');
const { Response } = jest.requireActual('node-fetch');
describe(JsInspector_1.openJsInspector, () => {
    it('should open browser for PUT request with given app', async () => {
        const mockOpen = open_1.default.openApp;
        mockOpen.mockImplementation(() => {
            const result = { exitCode: 0 };
            return Promise.resolve(result);
        });
        const app = metroInspectorResponse_1.METRO_INSPECTOR_RESPONSE_FIXTURE[0];
        (0, JsInspector_1.openJsInspector)(app);
    });
});
describe(JsInspector_1.queryAllInspectorAppsAsync, () => {
    it('should return all available app entities', async () => {
        const entities = metroInspectorResponse_1.METRO_INSPECTOR_RESPONSE_FIXTURE.filter(app => app.title === 'React Native Experimental (Improved Chrome Reloads)');
        const mockFetch = node_fetch_1.default;
        mockFetch.mockReturnValue(Promise.resolve(new Response(JSON.stringify(metroInspectorResponse_1.METRO_INSPECTOR_RESPONSE_FIXTURE))));
        const result = await (0, JsInspector_1.queryAllInspectorAppsAsync)('http://localhost:8081');
        expect(result.length).toBe(entities.length);
        for (let i = 0; i < result.length; ++i) {
            expect(result[i].webSocketDebuggerUrl).toBe(entities[i].webSocketDebuggerUrl);
            expect(result[i].description).not.toBe("don't use");
        }
    });
});
describe(JsInspector_1.queryInspectorAppAsync, () => {
    it('should return specific app entity for given appId', async () => {
        const appId = 'io.expo.test.devclient';
        const mockFetch = node_fetch_1.default;
        mockFetch.mockReturnValue(Promise.resolve(new Response(JSON.stringify(metroInspectorResponse_1.METRO_INSPECTOR_RESPONSE_FIXTURE))));
        const result = await (0, JsInspector_1.queryInspectorAppAsync)('http://localhost:8081', appId);
        expect(result === null || result === void 0 ? void 0 : result.description).toBe(appId);
    });
});
//# sourceMappingURL=JsInspector-test.js.map