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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.useActions = exports.withActions = exports.ActionsContext = void 0;
const react_1 = __importStar(require("react"));
const ActionsContextProvider = (0, react_1.createContext)({
    onMinimize: undefined,
    onReload: undefined,
    onCopyText: undefined,
});
const ActionsContext = ({ children, onMinimize, onReload, onCopyText, }) => {
    return (react_1.default.createElement(ActionsContextProvider, { value: { onMinimize, onReload, onCopyText } }, children));
};
exports.ActionsContext = ActionsContext;
const withActions = (Component, actions) => {
    return (props) => (react_1.default.createElement(exports.ActionsContext, { ...actions },
        react_1.default.createElement(Component, { ...props })));
};
exports.withActions = withActions;
const useActions = () => {
    const context = (0, react_1.use)(ActionsContextProvider);
    if (context === undefined) {
        throw new Error('useActions must be used within an ActionsProvider');
    }
    return context;
};
exports.useActions = useActions;
//# sourceMappingURL=ContextActions.js.map