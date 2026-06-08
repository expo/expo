"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useEnvironmentVariablesPolyfill = useEnvironmentVariablesPolyfill;
function useEnvironmentVariablesPolyfill({ devServerUrl }) {
    globalThis.process = globalThis.process || {};
    globalThis.process.env.EXPO_DEV_SERVER_ORIGIN ??= devServerUrl;
}
//# sourceMappingURL=environmentHelper.js.map