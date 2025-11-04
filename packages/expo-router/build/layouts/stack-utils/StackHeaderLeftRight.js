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
exports.StackHeaderLeft = StackHeaderLeft;
exports.StackHeaderRight = StackHeaderRight;
exports.appendStackHeaderRightPropsToOptions = appendStackHeaderRightPropsToOptions;
exports.appendStackHeaderLeftPropsToOptions = appendStackHeaderLeftPropsToOptions;
const react_1 = __importStar(require("react"));
const StackHeaderButton_1 = require("./StackHeaderButton");
const StackHeaderItem_1 = require("./StackHeaderItem");
const StackHeaderMenu_1 = require("./StackHeaderMenu");
const StackHeaderSpacer_1 = require("./StackHeaderSpacer");
const children_1 = require("../../utils/children");
function StackHeaderLeft(props) {
    return null;
}
function StackHeaderRight(props) {
    return null;
}
function convertHeaderRightLeftChildrenToUnstableItems(children, side) {
    const allChildren = react_1.default.Children.toArray(children);
    const actions = allChildren.filter((child) => (0, children_1.isChildOfType)(child, StackHeaderButton_1.StackHeaderButton) ||
        (0, children_1.isChildOfType)(child, StackHeaderMenu_1.StackHeaderMenu) ||
        (0, children_1.isChildOfType)(child, StackHeaderSpacer_1.StackHeaderSpacer) ||
        (0, children_1.isChildOfType)(child, StackHeaderItem_1.StackHeaderItem));
    if (actions.length !== allChildren.length && process.env.NODE_ENV !== 'production') {
        const otherElements = allChildren
            .filter((child) => !actions.some((action) => action === child))
            .map((e) => {
            if ((0, react_1.isValidElement)(e)) {
                if (e.type === react_1.Fragment) {
                    return '<Fragment>';
                }
                else {
                    return e.type?.name ?? e.type;
                }
            }
            return String(e);
        });
        console.warn(`Stack.Header.${side} only accepts <Stack.Header.Button>, <Stack.Header.Menu>, <Menu>, and <Stack.Header.Item> as children. Found invalid children: ${otherElements.join(', ')}`);
    }
    return () => actions.map((action) => {
        if ((0, children_1.isChildOfType)(action, StackHeaderButton_1.StackHeaderButton)) {
            return (0, StackHeaderButton_1.convertStackHeaderButtonPropsToRNHeaderItem)(action.props);
        }
        else if ((0, children_1.isChildOfType)(action, StackHeaderMenu_1.StackHeaderMenu)) {
            return (0, StackHeaderMenu_1.convertStackHeaderMenuPropsToRNHeaderItem)(action.props);
        }
        else if ((0, children_1.isChildOfType)(action, StackHeaderSpacer_1.StackHeaderSpacer)) {
            return (0, StackHeaderSpacer_1.convertStackHeaderSpacerPropsToRNHeaderItem)(action.props);
        }
        return (0, StackHeaderItem_1.convertStackHeaderItemPropsToRNHeaderItem)(action.props);
    });
}
function appendStackHeaderRightPropsToOptions(options, props) {
    if (props.asChild) {
        return {
            ...options,
            headerRight: () => props.children,
        };
    }
    return {
        ...options,
        unstable_headerRightItems: convertHeaderRightLeftChildrenToUnstableItems(props.children, 'Right'),
    };
}
function appendStackHeaderLeftPropsToOptions(options, props) {
    if (props.asChild) {
        return {
            ...options,
            headerLeft: () => props.children,
        };
    }
    return {
        ...options,
        unstable_headerLeftItems: convertHeaderRightLeftChildrenToUnstableItems(props.children, 'Left'),
    };
}
//# sourceMappingURL=StackHeaderLeftRight.js.map