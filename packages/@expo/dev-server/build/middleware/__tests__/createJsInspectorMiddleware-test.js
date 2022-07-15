"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const url_1 = require("url");
const JsInspector = __importStar(require("../../JsInspector"));
const metroInspectorResponse_1 = require("../../__tests__/fixtures/metroInspectorResponse");
const createJsInspectorMiddleware_1 = __importDefault(require("../createJsInspectorMiddleware"));
jest.mock('../../JsInspector');
describe('createJsInspectorMiddleware', () => {
    it('should return specific app entity for GET request with given applicationId', async () => {
        const app = metroInspectorResponse_1.METRO_INSPECTOR_RESPONSE_FIXTURE[0];
        const req = createRequest(`http://localhost:8081/inspector?applicationId=${app.description}`);
        const res = createMockedResponse();
        const next = jest.fn();
        JsInspector.queryInspectorAppAsync.mockReturnValue(Promise.resolve(app));
        const middlewareAsync = (0, createJsInspectorMiddleware_1.default)();
        await middlewareAsync(req, res, next);
        expectMockedResponse(res, 200, JSON.stringify(app));
    });
    it('should handle ipv6 address', async () => {
        const app = metroInspectorResponse_1.METRO_INSPECTOR_RESPONSE_FIXTURE[0];
        const req = createRequest(`http://[::ffff:127.0.0.1]/inspector?applicationId=${app.description}`);
        const res = createMockedResponse();
        const next = jest.fn();
        JsInspector.queryInspectorAppAsync.mockReturnValue(Promise.resolve(app));
        const middlewareAsync = (0, createJsInspectorMiddleware_1.default)();
        await middlewareAsync(req, res, next);
        expectMockedResponse(res, 200, JSON.stringify(app));
    });
    it('should return 404 for GET request with nonexistent applicationId', async () => {
        const req = createRequest('http://localhost:8081/inspector?applicationId=nonExistentApp');
        const res = createMockedResponse();
        const next = jest.fn();
        JsInspector.queryInspectorAppAsync.mockReturnValue(Promise.resolve(null));
        const middlewareAsync = (0, createJsInspectorMiddleware_1.default)();
        await middlewareAsync(req, res, next);
        expectMockedResponse(res, 404);
    });
    it('should return 400 for GET request without parameters', async () => {
        const req = createRequest('http://localhost:8081/inspector');
        const res = createMockedResponse();
        const next = jest.fn();
        const middlewareAsync = (0, createJsInspectorMiddleware_1.default)();
        await middlewareAsync(req, res, next);
        expectMockedResponse(res, 400);
    });
    it('should open browser for PUT request with given applicationId', async () => {
        const app = metroInspectorResponse_1.METRO_INSPECTOR_RESPONSE_FIXTURE[0];
        const req = createRequest(`http://localhost:8081/inspector?applicationId=${app.description}`, 'PUT');
        const res = createMockedResponse();
        const next = jest.fn();
        JsInspector.queryInspectorAppAsync.mockReturnValue(Promise.resolve(app));
        const middlewareAsync = (0, createJsInspectorMiddleware_1.default)();
        await middlewareAsync(req, res, next);
        expectMockedResponse(res, 200);
        expect(JsInspector.openJsInspector).toHaveBeenCalledTimes(1);
    });
});
function createRequest(requestUrl, method) {
    const url = new url_1.URL(requestUrl);
    const req = {
        method: method || 'GET',
        headers: {
            host: url.host,
        },
        socket: {
            localAddress: url.hostname,
            localPort: Number(url.port || 80),
        },
        url: `${url.pathname}${url.search}`,
    };
    return req;
}
function createMockedResponse() {
    return {
        end: jest.fn(),
        writeHead: jest.fn().mockReturnThis(),
        write: jest.fn().mockReturnThis(),
    };
}
function expectMockedResponse(res, status, body) {
    if (status !== 200) {
        expect(res.writeHead.mock.calls[0][0]).toBe(status);
    }
    if (body) {
        expect(res.end.mock.calls[0][0]).toBe(body);
    }
}
//# sourceMappingURL=createJsInspectorMiddleware-test.js.map