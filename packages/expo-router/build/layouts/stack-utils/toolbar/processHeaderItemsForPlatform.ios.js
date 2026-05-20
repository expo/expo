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
exports.processHeaderItemsForPlatform = processHeaderItemsForPlatform;
const react_1 = __importStar(require("react"));
const StackToolbarButton_1 = require("./StackToolbarButton");
const StackToolbarMenu_1 = require("./StackToolbarMenu");
const StackToolbarSpacer_1 = require("./StackToolbarSpacer");
const StackToolbarView_1 = require("./StackToolbarView");
const children_1 = require("../../../utils/children");
function convertToolbarChildrenToUnstableItems(children, side) {
    const allChildren = react_1.default.Children.toArray(children);
    const actions = allChildren.filter((child) => (0, children_1.isChildOfType)(child, StackToolbarButton_1.StackToolbarButton) ||
        (0, children_1.isChildOfType)(child, StackToolbarMenu_1.StackToolbarMenu) ||
        (0, children_1.isChildOfType)(child, StackToolbarSpacer_1.StackToolbarSpacer) ||
        (0, children_1.isChildOfType)(child, StackToolbarView_1.StackToolbarView));
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
        console.warn(`Stack.Toolbar with placement="${side}" only accepts <Stack.Toolbar.Button>, <Stack.Toolbar.Menu>, <Stack.Toolbar.View>, and <Stack.Toolbar.Spacer> as children. Found invalid children: ${otherElements.join(', ')}`);
    }
    return () => actions
        .map((action) => {
        if ((0, children_1.isChildOfType)(action, StackToolbarButton_1.StackToolbarButton)) {
            return (0, StackToolbarButton_1.convertStackToolbarButtonPropsToRNHeaderItem)(action.props);
        }
        else if ((0, children_1.isChildOfType)(action, StackToolbarMenu_1.StackToolbarMenu)) {
            return (0, StackToolbarMenu_1.convertStackToolbarMenuPropsToRNHeaderItem)(action.props);
        }
        else if ((0, children_1.isChildOfType)(action, StackToolbarSpacer_1.StackToolbarSpacer)) {
            return (0, StackToolbarSpacer_1.convertStackToolbarSpacerPropsToRNHeaderItem)(action.props);
        }
        return (0, StackToolbarView_1.convertStackToolbarViewPropsToRNHeaderItem)(action.props);
    })
        .filter((item) => !!item);
}
/**
 * On iOS, left/right toolbar items are converted to `unstable_headerLeftItems`/`unstable_headerRightItems`
 * which react-native-screens processes natively.
 */
function processHeaderItemsForPlatform(children, placement, _colors) {
    if (placement !== 'left' && placement !== 'right') {
        return null;
    }
    if (placement === 'left') {
        return {
            headerShown: true,
            unstable_headerLeftItems: convertToolbarChildrenToUnstableItems(children, 'left'),
        };
    }
    return {
        headerShown: true,
        unstable_headerRightItems: convertToolbarChildrenToUnstableItems(children, 'right'),
    };
}
//# sourceMappingURL=processHeaderItemsForPlatform.ios.js.map