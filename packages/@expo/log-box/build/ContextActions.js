"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useActions = exports.withActions = exports.ActionsProvider = void 0;
const react_1 = __importDefault(require("react"));
const react_2 = require("react");
const ActionsContext = (0, react_2.createContext)({
    onMinimize: () => { },
});
const ActionsProvider = ({ children, onMinimize }) => {
    return (react_1.default.createElement(ActionsContext.Provider, { value: { onMinimize } }, children));
};
exports.ActionsProvider = ActionsProvider;
const withActions = (Component, actions) => {
    return (props) => (react_1.default.createElement(exports.ActionsProvider, { ...actions },
        react_1.default.createElement(Component, { ...props })));
};
exports.withActions = withActions;
const useActions = () => {
    const context = (0, react_2.useContext)(ActionsContext);
    if (context === undefined) {
        // return { onMinimize: undefined };
        throw new Error('useActions must be used within an ActionsProvider');
    }
    return context;
};
exports.useActions = useActions;
