"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-env jest browser */
const fetchAsync_1 = require("../fetchAsync");
const originalFetch = global.fetch;
beforeAll(() => {
    // eslint-disable-next-line
    global.fetch = jest.fn(() => 
    // eslint-disable-next-line
    Promise.resolve({ body: "", text: jest.fn(() => "mock"), headers: {} }));
});
afterAll(() => {
    global.fetch = originalFetch;
});
it(`fetches`, async () => {
    await expect((0, fetchAsync_1.fetchAsync)("https://example.com")).resolves.toBeDefined();
    expect(global.fetch).toBeCalledWith("https://example.com", {
        headers: { "expo-platform": "web" },
        method: "GET",
    });
});
//# sourceMappingURL=fetchAsync.test.web.js.map