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
exports.SplitView = void 0;
const expo_constants_1 = __importDefault(require("expo-constants"));
const react_1 = __importStar(require("react"));
const react_native_screens_1 = require("react-native-screens");
const elements_1 = require("./elements");
const withLayoutContext_1 = require("../layouts/withLayoutContext");
const Navigator_1 = require("../views/Navigator");
const IsWithinSplitViewContext = (0, react_1.createContext)(false);
function SplitViewNavigator({ children, ...splitViewHostProps }) {
    if ((0, react_1.use)(IsWithinSplitViewContext)) {
        throw new Error('There can only be one SplitView in the navigation hierarchy.');
    }
    // TODO: Add better way of detecting if SplitView is rendered inside Native navigator.
    if ((0, react_1.use)(withLayoutContext_1.IsWithinLayoutContext)) {
        throw new Error('SplitView cannot be used inside another navigator, except for Slot.');
    }
    if (!expo_constants_1.default.expoConfig?.extra?.router?.unstable_splitView) {
        throw new Error('SplitView is not enabled. Make sure to enable it in your expo-router configuration with "unstable_splitView": true. After enabling, make sure to prebuild your app.');
    }
    if (process.env.EXPO_OS !== 'ios') {
        console.warn('SplitView is only supported on iOS. The SplitView will behave like a Slot navigator on other platforms.');
        return <Navigator_1.Slot />;
    }
    const WrappedSlot = () => (<withLayoutContext_1.IsWithinLayoutContext value>
      <Navigator_1.Slot />
    </withLayoutContext_1.IsWithinLayoutContext>);
    const allChildrenArray = react_1.default.Children.toArray(children);
    const columnChildren = allChildrenArray.filter((child) => (0, react_1.isValidElement)(child) && child.type === elements_1.SplitViewColumn);
    const inspectorChildren = allChildrenArray.filter((child) => (0, react_1.isValidElement)(child) && child.type === elements_1.SplitViewInspector);
    const numberOfSidebars = columnChildren.length;
    const numberOfInspectors = inspectorChildren.length;
    if (allChildrenArray.length !== columnChildren.length + inspectorChildren.length) {
        console.warn('Only SplitView.Column and SplitView.Inspector components are allowed as direct children of SplitView.');
    }
    if (numberOfSidebars > 2) {
        throw new Error('There can only be two SplitView.Column in the SplitView.');
    }
    if (numberOfSidebars + numberOfInspectors === 0) {
        console.warn('No SplitView.Column and SplitView.Inspector found in SplitView.');
        return <Navigator_1.Slot />;
    }
    // The key is needed, because number of columns cannot be changed dynamically
    return (<react_native_screens_1.SplitViewHost key={numberOfSidebars + numberOfInspectors} {...splitViewHostProps}>
      {columnChildren}
      <react_native_screens_1.SplitViewScreen.Column>
        <WrappedSlot />
      </react_native_screens_1.SplitViewScreen.Column>
      {inspectorChildren}
    </react_native_screens_1.SplitViewHost>);
}
exports.SplitView = Object.assign(SplitViewNavigator, {
    Column: elements_1.SplitViewColumn,
    Inspector: elements_1.SplitViewInspector,
});
//# sourceMappingURL=split-view.js.map