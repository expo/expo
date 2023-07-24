"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useRejectionHandler = void 0;
const react_1 = __importDefault(require("react"));
const ExceptionsManager_1 = __importDefault(require("./modules/ExceptionsManager"));
function useStackTraceLimit(limit) {
    const current = react_1.default.useRef(0);
    react_1.default.useEffect(() => {
        try {
            const currentLimit = Error.stackTraceLimit;
            Error.stackTraceLimit = limit;
            current.current = currentLimit;
        }
        catch { }
        return () => {
            try {
                Error.stackTraceLimit = current.current;
            }
            catch { }
        };
    }, [limit]);
}
function useRejectionHandler() {
    const hasError = react_1.default.useRef(false);
    useStackTraceLimit(35);
    react_1.default.useEffect(() => {
        function onUnhandledError(ev) {
            hasError.current = true;
            const error = ev === null || ev === void 0 ? void 0 : ev.error;
            if (!error ||
                !(error instanceof Error) ||
                typeof error.stack !== "string") {
                return;
            }
            ExceptionsManager_1.default.handleException(error);
        }
        function onUnhandledRejection(ev) {
            hasError.current = true;
            const reason = ev === null || ev === void 0 ? void 0 : ev.reason;
            if (!reason ||
                !(reason instanceof Error) ||
                typeof reason.stack !== "string") {
                return;
            }
            ExceptionsManager_1.default.handleException(reason);
        }
        window.addEventListener("unhandledrejection", onUnhandledRejection);
        window.addEventListener("error", onUnhandledError);
        return () => {
            window.removeEventListener("error", onUnhandledError);
            window.removeEventListener("unhandledrejection", onUnhandledRejection);
        };
    }, []);
    return hasError;
}
exports.useRejectionHandler = useRejectionHandler;
//# sourceMappingURL=useRejectionHandler.js.map