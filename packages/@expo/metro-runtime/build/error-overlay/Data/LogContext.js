"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogContext = void 0;
exports.useLogs = useLogs;
exports.useSelectedLog = useSelectedLog;
const react_1 = __importDefault(require("react"));
const LogBoxLog_1 = require("./LogBoxLog");
// Context provider for Array<LogBoxLog>
exports.LogContext = react_1.default.createContext(null);
function useLogs() {
    const logs = react_1.default.useContext(exports.LogContext);
    if (!logs) {
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
        throw new Error('useLogs must be used within a LogProvider');
    }
    return logs;
}
function useSelectedLog() {
    const { selectedLogIndex, logs } = useLogs();
    return logs[selectedLogIndex];
}
//# sourceMappingURL=LogContext.js.map