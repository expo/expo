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
exports.ListRow = void 0;
var styleguide_native_1 = require("@expo/styleguide-native");
var React = __importStar(require("react"));
var react_native_1 = require("react-native");
function ListRow(_a) {
    var onPress = _a.onPress, _b = _a.variant, variant = _b === void 0 ? 'ghost' : _b, label = _a.label, labelProps = _a.labelProps, style = _a.style, multiSelectActive = _a.multiSelectActive, isSelected = _a.isSelected, rest = __rest(_a, ["onPress", "variant", "label", "labelProps", "style", "multiSelectActive", "isSelected"]);
    var backgroundColor = styleguide_native_1.lightTheme.button[variant].background;
    var foregroundColor = styleguide_native_1.lightTheme.button[variant].foreground;
    return (React.createElement(react_native_1.TouchableOpacity, __assign({ style: [
            styles.listRowContainer,
            { backgroundColor: backgroundColor },
            multiSelectActive && styles.multiSelectActive,
            style,
        ], onPress: onPress }, rest),
        Boolean(label) && (React.createElement(react_native_1.Text, __assign({ style: [styles.rowText, { color: foregroundColor }] }, labelProps), label)),
        multiSelectActive ? (isSelected ? (React.createElement(styleguide_native_1.CheckIcon, { size: styleguide_native_1.iconSize.large, color: foregroundColor })) : (React.createElement(react_native_1.View, { style: styles.selectableCircle }))) : (React.createElement(styleguide_native_1.ChevronDownIcon, { size: styleguide_native_1.iconSize.large, color: foregroundColor, style: styles.rotateContainer }))));
}
exports.ListRow = ListRow;
var styles = react_native_1.StyleSheet.create({
    listRowContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: styleguide_native_1.spacing[6],
        paddingHorizontal: styleguide_native_1.spacing[4],
        borderColor: styleguide_native_1.lightTheme.border.default,
        borderBottomWidth: react_native_1.StyleSheet.hairlineWidth,
    },
    multiSelectActive: {},
    selectableCircle: {
        width: styleguide_native_1.iconSize.regular,
        height: styleguide_native_1.iconSize.regular,
        borderRadius: styleguide_native_1.iconSize.regular / 2,
        borderWidth: 2,
        borderColor: styleguide_native_1.lightTheme.border.default,
        marginRight: styleguide_native_1.spacing[1],
    },
    rotateContainer: {
        transform: [
            {
                rotate: '-90deg',
            },
        ],
    },
    rowText: {
        fontSize: 20,
        fontWeight: '600',
    },
});
//# sourceMappingURL=ListRow.js.map