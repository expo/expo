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
exports.StackHeaderRight = exports.StackHeaderLeft = void 0;
exports.appendStackHeaderRightPropsToOptions = appendStackHeaderRightPropsToOptions;
exports.appendStackHeaderLeftPropsToOptions = appendStackHeaderLeftPropsToOptions;
const react_1 = __importStar(require("react"));
const react_2 = require("react");
const StackHeaderButton_1 = require("./StackHeaderButton");
const StackHeaderMenu_1 = require("./StackHeaderMenu");
const StackHeaderSpacer_1 = require("./StackHeaderSpacer");
const StackHeaderView_1 = require("./StackHeaderView");
const children_1 = require("../../utils/children");
const Screen_1 = require("../../views/Screen");
/**
 * The component used to configure the left area of the stack header.
 *
 * When used inside a screen, it allows you to customize the left side of the header dynamically.
 *
 * @example
 * ```tsx
 * import { Stack } from 'expo-router';
 *
 * export default function Page() {
 *   return (
 *     <>
 *       <Stack.Header.Left>
 *         <Stack.Header.Button onPress={() => alert('Left button pressed!')} />
 *       </Stack.Header.Left>
 *       <ScreenContent />
 *     </>
 *   );
 * }
 * ```
 *
 * When used inside the layout, it needs to be wrapped in `Stack.Header` to take effect.
 *
 * @example
 * ```tsx
 * import { Stack } from 'expo-router';
 *
 * export default function Layout() {
 *   return (
 *     <Stack>
 *       <Stack.Screen name="index">
 *         <Stack.Header>
 *           <Stack.Header.Left>
 *             <Stack.Header.Button onPress={() => alert('Left button pressed!')} />
 *           </Stack.Header.Left>
 *         </Stack.Header>
 *       </Stack.Screen>
 *     </Stack>
 *   );
 * }
 * ```
 */
const StackHeaderLeft = (props) => {
    // This component will only render when used inside a page
    // but only if it is not wrapped in Stack.Screen.Header
    const updatedOptions = (0, react_2.useMemo)(() => appendStackHeaderLeftPropsToOptions({}, props), [props]);
    return <Screen_1.Screen options={updatedOptions}/>;
};
exports.StackHeaderLeft = StackHeaderLeft;
/**
 * The component used to configure the right area of the stack header.
 *
 * When used inside a screen, it allows you to customize the right side of the header dynamically.
 *
 * @example
 * ```tsx
 * import { Stack } from 'expo-router';
 *
 * export default function Page() {
 *   return (
 *     <>
 *       <Stack.Header.Right>
 *         <Stack.Header.Button onPress={() => alert('Right button pressed!')} />
 *       </Stack.Header.Right>
 *       <ScreenContent />
 *     </>
 *   );
 * }
 * ```
 *
 * When used inside the layout, it needs to be wrapped in `Stack.Header` to take effect.
 *
 * @example
 * ```tsx
 * import { Stack } from 'expo-router';
 *
 * export default function Layout() {
 *   return (
 *     <Stack>
 *       <Stack.Screen name="index">
 *         <Stack.Header>
 *           <Stack.Header.Right>
 *             <Stack.Header.Button onPress={() => alert('Right button pressed!')} />
 *           </Stack.Header.Right>
 *         </Stack.Header>
 *       </Stack.Screen>
 *     </Stack>
 *   );
 * }
 * ```
 */
const StackHeaderRight = (props) => {
    // This component will only render when used inside a page
    // but only if it is not wrapped in Stack.Screen.Header
    const updatedOptions = (0, react_2.useMemo)(() => appendStackHeaderRightPropsToOptions({}, props), [props]);
    return <Screen_1.Screen options={updatedOptions}/>;
};
exports.StackHeaderRight = StackHeaderRight;
function convertHeaderRightLeftChildrenToUnstableItems(children, side) {
    const allChildren = react_1.default.Children.toArray(children);
    const actions = allChildren.filter((child) => (0, children_1.isChildOfType)(child, StackHeaderButton_1.StackHeaderButton) ||
        (0, children_1.isChildOfType)(child, StackHeaderMenu_1.StackHeaderMenu) ||
        (0, children_1.isChildOfType)(child, StackHeaderSpacer_1.StackHeaderSpacer) ||
        (0, children_1.isChildOfType)(child, StackHeaderView_1.StackHeaderView));
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
    return () => actions
        .map((action) => {
        if ((0, children_1.isChildOfType)(action, StackHeaderButton_1.StackHeaderButton)) {
            return (0, StackHeaderButton_1.convertStackHeaderButtonPropsToRNHeaderItem)(action.props);
        }
        else if ((0, children_1.isChildOfType)(action, StackHeaderMenu_1.StackHeaderMenu)) {
            return (0, StackHeaderMenu_1.convertStackHeaderMenuPropsToRNHeaderItem)(action.props);
        }
        else if ((0, children_1.isChildOfType)(action, StackHeaderSpacer_1.StackHeaderSpacer)) {
            return (0, StackHeaderSpacer_1.convertStackHeaderSpacerPropsToRNHeaderItem)(action.props);
        }
        return (0, StackHeaderView_1.convertStackHeaderViewPropsToRNHeaderItem)(action.props);
    })
        .filter((item) => !!item);
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