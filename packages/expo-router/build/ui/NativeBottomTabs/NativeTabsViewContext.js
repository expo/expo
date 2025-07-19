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
exports.useBottomTabAccessory = exports.BottomTabAccessoryProvider = void 0;
const react_1 = __importStar(require("react"));
const BottomTabAccessoryContext = (0, react_1.createContext)(undefined);
const BottomTabAccessoryProvider = ({ children }) => {
    const [bottomTabAccessory, setState] = (0, react_1.useState)({});
    const setBottomTabAccessory = (tabKey, node) => {
        setState((prev) => ({ ...prev, [tabKey]: node }));
    };
    const removeBottomTabAccessory = (tabKey) => {
        setState((prev) => {
            const updated = { ...prev };
            delete updated[tabKey];
            return updated;
        });
    };
    return (<BottomTabAccessoryContext.Provider value={{ bottomTabAccessory, setBottomTabAccessory, removeBottomTabAccessory }}>
      {children}
    </BottomTabAccessoryContext.Provider>);
};
exports.BottomTabAccessoryProvider = BottomTabAccessoryProvider;
const useBottomTabAccessory = () => {
    const context = (0, react_1.useContext)(BottomTabAccessoryContext);
    if (!context) {
        throw new Error('useBottomTabAccessory must be used within a BottomTabAccessoryProvider');
    }
    return context;
};
exports.useBottomTabAccessory = useBottomTabAccessory;
//# sourceMappingURL=NativeTabsViewContext.js.map