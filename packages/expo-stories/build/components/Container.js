"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Container = void 0;
var styleguide_native_1 = require("@expo/styleguide-native");
var React = __importStar(require("react"));
var react_native_1 = require("react-native");
function Container(_a) {
    var children = _a.children, labelTop = _a.labelTop, style = _a.style, rest = __rest(_a, ["children", "labelTop", "style"]);
    var _b = React.useState(false), isOpen = _b[0], setIsOpen = _b[1];
    if (!labelTop) {
        return (React.createElement(react_native_1.View, __assign({ style: [styles.container, style] }, rest),
            React.createElement(react_native_1.View, { style: styles.storyComponentContainer }, children)));
    }
    return (React.createElement(React.Fragment, null,
        React.createElement(react_native_1.View, __assign({ style: [styles.container, isOpen && styles.openContainer, style] }, rest),
            React.createElement(react_native_1.TouchableOpacity, { style: styles.descriptionContainer, onPress: function () { return setIsOpen(!isOpen); } },
                React.createElement(react_native_1.Text, { style: styles.description }, labelTop),
                React.createElement(react_native_1.View, { style: [styles.chevonContainer, isOpen ? styles.chevronOpen : styles.chevronClosed] },
                    React.createElement(styleguide_native_1.ChevronDownIcon, { size: styleguide_native_1.iconSize.large, color: styleguide_native_1.lightTheme.icon.default }))),
            isOpen && React.createElement(react_native_1.View, { style: styles.storyComponentContainer }, children))));
}
exports.Container = Container;
var styles = react_native_1.StyleSheet.create({
    container: {},
    openContainer: {
        marginBottom: styleguide_native_1.spacing[4],
        borderBottomWidth: react_native_1.StyleSheet.hairlineWidth,
        borderBottomColor: styleguide_native_1.lightTheme.border.default,
    },
    descriptionContainer: {
        paddingHorizontal: styleguide_native_1.spacing[4],
        paddingVertical: styleguide_native_1.spacing[4],
        paddingRight: 32,
        minHeight: 56,
        justifyContent: 'center',
        borderBottomWidth: react_native_1.StyleSheet.hairlineWidth,
        borderColor: styleguide_native_1.lightTheme.border.default,
    },
    description: {
        fontSize: 18,
        fontWeight: '500',
        color: styleguide_native_1.lightTheme.text.default,
    },
    chevonContainer: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: 48,
        justifyContent: 'center',
        alignItems: 'center',
    },
    chevronOpen: {
        transform: [
            {
                rotate: '0deg',
            },
        ],
    },
    chevronClosed: {
        transform: [
            {
                rotate: '-90deg',
            },
        ],
    },
    storyComponentContainer: {
        padding: styleguide_native_1.spacing[4],
    },
});
//# sourceMappingURL=Container.js.map