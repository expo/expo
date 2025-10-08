"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const LogBoxLog_1 = require("./Data/LogBoxLog");
const logbox_dom_polyfill_1 = __importDefault(require("./logbox-dom-polyfill"));
exports.default = () => {
    const { logs, selectedLogIndex } = useLogsFromExpoStaticError();
    return react_1.default.createElement(logbox_dom_polyfill_1.default, { logs: logs, selectedIndex: selectedLogIndex, platform: "web" });
};
function useLogsFromExpoStaticError() {
    if (process.env.EXPO_OS === 'web' && typeof window !== 'undefined') {
        // Logbox data that is pre-fetched on the dev server and rendered here.
        const expoCliStaticErrorElement = document.getElementById('_expo-static-error');
        if (expoCliStaticErrorElement?.textContent) {
            const raw = JSON.parse(expoCliStaticErrorElement.textContent);
            return {
                ...raw,
                logs: raw.logs.map((raw) => new LogBoxLog_1.LogBoxLog(raw)),
            };
        }
    }
    throw new Error('`useLogsFromExpoStaticError` must be used within a document with `_expo-static-error` element.');
}
