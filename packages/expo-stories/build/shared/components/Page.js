"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Section = exports.ScrollPage = exports.Page = void 0;
var html_elements_1 = require("@expo/html-elements");
var React = __importStar(require("react"));
var react_native_1 = require("react-native");
function Page(_a) {
    var children = _a.children;
    return React.createElement(react_native_1.View, { style: { paddingHorizontal: 12, paddingBottom: 12 } }, children);
}
exports.Page = Page;
function ScrollPage(_a) {
    var children = _a.children;
    return (React.createElement(react_native_1.ScrollView, { style: { flex: 1, paddingHorizontal: 12, paddingBottom: 12 } }, children));
}
exports.ScrollPage = ScrollPage;
function Section(_a) {
    var title = _a.title, children = _a.children, row = _a.row;
    return (React.createElement(react_native_1.View, { style: {
            borderBottomColor: 'rgba(0,0,0,0.1)',
            borderBottomWidth: react_native_1.StyleSheet.hairlineWidth,
            paddingBottom: 8,
        } },
        React.createElement(html_elements_1.H4, { style: { marginTop: 8 } }, title),
        React.createElement(react_native_1.View, { style: { flexDirection: row ? 'row' : 'column' } }, children)));
}
exports.Section = Section;
//# sourceMappingURL=Page.js.map