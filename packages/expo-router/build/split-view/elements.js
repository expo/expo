"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SidebarHeader = exports.ChildrenSideBarContext = exports.ParentSideBarContext = void 0;
exports.NativeButton = NativeButton;
exports.SidebarTrigger = SidebarTrigger;
exports.SidebarHeaderComponent = SidebarHeaderComponent;
exports.SidebarHeaderTitle = SidebarHeaderTitle;
exports.SidebarHeaderRight = SidebarHeaderRight;
exports.SidebarHeaderLeft = SidebarHeaderLeft;
const react_1 = __importDefault(require("react"));
const react_native_1 = require("react-native");
exports.ParentSideBarContext = react_1.default.createContext(0);
exports.ChildrenSideBarContext = react_1.default.createContext({
    addChild: () => { },
    removeChild: () => { },
});
function NativeButton({ children, style }) {
    return <react_native_1.Text style={{ padding: 12, borderRadius: 8, fontSize: 32, ...style }}>{children}</react_native_1.Text>;
}
function SidebarTrigger({ children }) {
    return children ?? null;
}
function SidebarHeaderComponent({ children }) {
    return (<react_native_1.View style={{ flexDirection: 'row', width: '100%', gap: 8, position: 'absolute' }}>
      {children}
    </react_native_1.View>);
}
function SidebarHeaderTitle({ children }) {
    return <react_native_1.Text>{children}</react_native_1.Text>;
}
function SidebarHeaderRight({ children }) {
    return <react_native_1.View style={{ flex: 1, alignItems: 'flex-end' }}>{children}</react_native_1.View>;
}
function SidebarHeaderLeft({ children }) {
    return <react_native_1.View style={{ flex: 1, alignItems: 'flex-start' }}>{children}</react_native_1.View>;
}
exports.SidebarHeader = Object.assign(SidebarHeaderComponent, {
    Title: SidebarHeaderTitle,
    Right: SidebarHeaderRight,
    Left: SidebarHeaderLeft,
});
//# sourceMappingURL=elements.js.map