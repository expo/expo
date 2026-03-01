"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackScreen = void 0;
exports.validateStackPresentation = validateStackPresentation;
exports.appendScreenStackPropsToOptions = appendScreenStackPropsToOptions;
const react_1 = require("react");
const StackHeaderComponent_1 = require("./StackHeaderComponent");
const screen_1 = require("./screen");
const toolbar_1 = require("./toolbar");
const children_1 = require("../../utils/children");
const Screen_1 = require("../../views/Screen");
/**
 * Component used to define a screen in a native stack navigator.
 *
 * Can be used in the `_layout.tsx` files, or directly in page components.
 *
 * When configuring header inside page components, prefer using `Stack.Toolbar`, `Stack.Header` and `Stack.Screen.*` components.
 *
 * @example
 * ```tsx app/_layout.tsx
 * import { Stack } from 'expo-router';
 *
 * export default function Layout() {
 *   return (
 *     <Stack>
 *       <Stack.Screen
 *         name="home"
 *         options={{ title: 'Home' }}
 *       />
 *    </Stack>
 *  );
 * }
 * ```
 *
 * @example
 * ```tsx app/home.tsx
 * import { Stack } from 'expo-router';
 *
 * export default function HomePage() {
 *   return (
 *     <>
 *       <Stack.Screen
 *         options={{ headerTransparent: true }}
 *       />
 *       <Stack.Screen.Title>Welcome Home</Stack.Screen.Title>
 *       // Page content
 *     </>
 *   );
 * }
 * ```
 */
exports.StackScreen = Object.assign(function StackScreen({ children, options, ...rest }) {
    // This component will only render when used inside a page.
    if (process.env.NODE_ENV !== 'production' && typeof options === 'function') {
        console.warn('Stack.Screen: Function-form options are not supported inside page components. Pass an options object directly.');
    }
    const ownOptions = (0, react_1.useMemo)(() => validateStackPresentation(typeof options === 'function' ? {} : (options ?? {})), [options]);
    return (<>
        <Screen_1.Screen {...rest} options={ownOptions}/>
        {children}
      </>);
}, {
    Title: screen_1.StackScreenTitle,
    BackButton: screen_1.StackScreenBackButton,
});
const VALID_PRESENTATIONS = [
    'card',
    'modal',
    'transparentModal',
    'containedModal',
    'containedTransparentModal',
    'fullScreenModal',
    'formSheet',
    'pageSheet',
];
function validateStackPresentation(options) {
    if (typeof options === 'function') {
        return (...args) => {
            const resolved = options(...args);
            validateStackPresentation(resolved);
            return resolved;
        };
    }
    const presentation = options.presentation;
    if (presentation &&
        !VALID_PRESENTATIONS.includes(presentation)) {
        throw new Error(`Invalid presentation value "${presentation}" passed to Stack.Screen. Valid values are: ${VALID_PRESENTATIONS.map((v) => `"${v}"`).join(', ')}.`);
    }
    return options;
}
function appendScreenStackPropsToOptions(options, props) {
    let updatedOptions = { ...options, ...props.options };
    validateStackPresentation(updatedOptions);
    function appendChildOptions(child, opts) {
        if ((0, children_1.isChildOfType)(child, StackHeaderComponent_1.StackHeaderComponent)) {
            return (0, StackHeaderComponent_1.appendStackHeaderPropsToOptions)(opts, child.props);
        }
        if ((0, children_1.isChildOfType)(child, screen_1.StackScreenTitle)) {
            return (0, screen_1.appendStackScreenTitlePropsToOptions)(opts, child.props);
        }
        if ((0, children_1.isChildOfType)(child, screen_1.StackScreenBackButton)) {
            return (0, screen_1.appendStackScreenBackButtonPropsToOptions)(opts, child.props);
        }
        if ((0, children_1.isChildOfType)(child, toolbar_1.StackToolbar)) {
            const placement = child.props.placement ?? 'bottom';
            if (placement === 'bottom') {
                throw new Error(`Stack.Toolbar with placement="bottom" cannot be used inside Stack.Screen.`);
            }
            return (0, toolbar_1.appendStackToolbarPropsToOptions)(opts, child.props);
        }
        const typeName = typeof child.type === 'function'
            ? child.type.name || 'Unknown'
            : String(child.type);
        console.warn(`Unknown child element passed to Stack.Screen: ${typeName}`);
        return opts;
    }
    react_1.Children.forEach(props.children, (child) => {
        if ((0, react_1.isValidElement)(child)) {
            updatedOptions = appendChildOptions(child, updatedOptions);
        }
    });
    return updatedOptions;
}
//# sourceMappingURL=StackScreen.js.map