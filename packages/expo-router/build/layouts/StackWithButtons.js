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
exports.StackWithButtons = exports.StackHeader = void 0;
const react_1 = __importStar(require("react"));
const react_native_screens_1 = require("react-native-screens");
const elements_1 = require("../link/elements");
const elements_2 = require("../native-tabs/common/elements");
function StackHeaderComponent(props) {
    return null;
}
function StackHeaderLeft(props) {
    return null;
}
function StackHeaderRight(props) {
    return null;
}
function StackHeaderButton(props) {
    return null;
}
function StackHeaderTitle(props) {
    return null;
}
exports.StackHeader = Object.assign(StackHeaderComponent, {
    Left: StackHeaderLeft,
    Right: StackHeaderRight,
    Button: StackHeaderButton,
    BackButton: StackHeaderButton,
    Title: StackHeaderTitle,
});
function StackWithButtonsComponent(props) {
    const content = react_1.default.Children.toArray(props.children).filter((c) => !react_1.default.isValidElement(c) || c.type !== exports.StackHeader);
    const header = getFirstChildOfType(props.children, StackHeaderComponent);
    const headerLeft = getFirstChildOfType(header?.props.children, StackHeaderLeft);
    const headerRight = getFirstChildOfType(header?.props.children, StackHeaderRight);
    const leftHeaderButtons = getAllChildrenOfType(headerLeft?.props.children, StackHeaderButton);
    const rightHeaderButtons = getAllChildrenOfType(headerRight?.props.children, StackHeaderButton);
    const leftMenus = getAllChildrenOfType(headerLeft?.props.children, elements_1.LinkMenu);
    const headerLeftBarButtonItems = [
        ...leftHeaderButtons
            .map((button) => button.props)
            .filter((props) => props.style?.display !== 'none')
            .map(convertHeaderButtonToBarButtonItem),
        ...leftMenus.map((menu, index) => ({
            index: leftHeaderButtons.length + index,
            label: menu.props.title,
            menu: {
                label: menu.props.title,
                items: getAllChildrenOfType(menu.props.children, elements_1.LinkMenuAction).map((action) => ({
                    type: 'action',
                    label: action.props.title,
                    onPress: () => action.props.onPress?.(),
                    attributes: action.props.destructive ? 'destructive' : undefined,
                    state: action.props.isOn ? 'on' : 'off',
                })),
            },
        })),
    ];
    const headerRightBarButtonItems = rightHeaderButtons
        .map((button) => button.props)
        .filter((props) => props.style?.display !== 'none')
        .map(convertHeaderButtonToBarButtonItem);
    const backButton = getFirstChildOfType(headerLeft?.props.children, StackHeaderButton);
    const headerTitle = getFirstChildOfType(header?.props.children, StackHeaderTitle);
    const backButtonTitle = react_1.Children.toArray(backButton?.props.children)
        .filter((c) => !(0, react_1.isValidElement)(c))
        .join('');
    const headerConfig = {
        headerLeftBarButtonItems,
        headerRightBarButtonItems,
        backTitle: backButtonTitle,
        backTitleFontFamily: backButton?.props.style?.fontFamily,
        backTitleFontSize: backButton?.props.style?.fontSize,
        backTitleVisible: backButton?.props.style?.display !== 'none',
        hideBackButton: backButton?.props.style?.display === 'none',
        backgroundColor: headerTitle?.props.style?.backgroundColor,
        title: headerTitle?.props.children,
        titleColor: headerTitle?.props.style?.color,
        titleFontFamily: headerTitle?.props.style?.fontFamily,
        titleFontSize: headerTitle?.props.style?.fontSize,
        hideShadow: headerTitle?.props.style?.shadowColor === 'transparent',
        largeTitle: headerTitle?.props.large,
        largeTitleFontFamily: headerTitle?.props.largeStyle?.fontFamily,
        largeTitleFontSize: headerTitle?.props.largeStyle?.fontSize,
        largeTitleColor: headerTitle?.props.largeStyle?.color,
        largeTitleHideShadow: headerTitle?.props.largeStyle?.shadowColor === 'transparent',
        largeTitleBackgroundColor: headerTitle?.props.largeStyle?.backgroundColor,
    };
    return (<react_native_screens_1.ScreenStack style={{ flex: 1 }}>
      <react_native_screens_1.ScreenStackItem screenId="1234" headerConfig={headerConfig}>
        {content}
      </react_native_screens_1.ScreenStackItem>
    </react_native_screens_1.ScreenStack>);
}
function convertHeaderButtonToBarButtonItem(buttonProps, index) {
    const label = getFirstChildOfType(buttonProps.children, elements_2.Label);
    const title = label?.props.children ??
        react_1.Children.toArray(buttonProps.children)
            .filter((c) => !(0, react_1.isValidElement)(c))
            .join('');
    const badge = getFirstChildOfType(buttonProps.children, elements_2.Badge);
    return {
        index,
        label: title,
        onPress: () => buttonProps.onPress?.(),
        labelStyle: {
            fontFamily: buttonProps.style?.fontFamily,
            fontSize: buttonProps.style?.fontSize,
            color: buttonProps.style?.color,
        },
        badge: badge?.props.children
            ? {
                value: badge.props.children,
            }
            : undefined,
    };
}
exports.StackWithButtons = Object.assign(StackWithButtonsComponent, {
    Header: exports.StackHeader,
});
function getFirstChildOfType(children, type) {
    return react_1.default.Children.toArray(children).find((child) => (0, react_1.isValidElement)(child) && child.type === type);
}
function getAllChildrenOfType(children, type) {
    return react_1.default.Children.toArray(children).filter((child) => (0, react_1.isValidElement)(child) && child.type === type);
}
//# sourceMappingURL=StackWithButtons.js.map