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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SplitViewContext = exports.SplitView = void 0;
const react_1 = __importStar(require("react"));
// import { createNativeStackNavigator } from '../fork/native-stack/createNativeStackNavigator';
const StackClient_1 = __importDefault(require("../layouts/StackClient"));
const withLayoutContext_1 = require("../layouts/withLayoutContext");
exports.SplitView = (0, withLayoutContext_1.withLayoutContext)(SplitViewNavigator, undefined);
function SplitViewNavigator({ columnMetrics, disableSidebar, disableGestures, preferredDisplayMode, preferredSplitBehavior, showSecondaryToggleButton, ...stackProps }) {
    const { setOptions, options } = (0, react_1.use)(exports.SplitViewContext);
    (0, react_1.useEffect)(() => {
        if (columnMetrics !== options.columnMetrics ||
            disableSidebar !== options.disableSidebar ||
            disableGestures !== options.disableGestures ||
            preferredDisplayMode !== options.preferredDisplayMode ||
            preferredSplitBehavior !== options.preferredSplitBehavior ||
            showSecondaryToggleButton !== options.showSecondaryToggleButton) {
            setOptions({
                columnMetrics,
                disableSidebar,
                disableGestures,
                preferredDisplayMode,
                preferredSplitBehavior,
                showSecondaryToggleButton,
            });
        }
    }, [
        columnMetrics,
        disableSidebar,
        disableGestures,
        preferredDisplayMode,
        preferredSplitBehavior,
        showSecondaryToggleButton,
    ]);
    return <StackClient_1.default {...stackProps}/>;
}
exports.SplitViewContext = react_1.default.createContext({
    options: {},
    setOptions: () => { },
});
//# sourceMappingURL=split-view.js.map