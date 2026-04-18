'use client';
import { Children, isValidElement, useMemo } from 'react';
import { StackHeaderComponent, appendStackHeaderPropsToOptions } from './StackHeaderComponent';
import { StackScreenTitle, appendStackScreenTitlePropsToOptions, StackScreenBackButton, appendStackScreenBackButtonPropsToOptions, } from './screen';
import { StackToolbar, appendStackToolbarPropsToOptions } from './toolbar';
import { isChildOfType } from '../../utils/children';
import { Screen } from '../../views/Screen';
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
export const StackScreen = Object.assign(function StackScreen({ children, options, ...rest }) {
    // This component will only render when used inside a page.
    if (process.env.NODE_ENV !== 'production' && typeof options === 'function') {
        console.warn('Stack.Screen: Function-form options are not supported inside page components. Pass an options object directly.');
    }
    const ownOptions = useMemo(() => validateStackPresentation(typeof options === 'function' ? {} : (options ?? {})), [options]);
    return (<>
        <Screen {...rest} options={ownOptions}/>
        {children}
      </>);
}, {
    Title: StackScreenTitle,
    BackButton: StackScreenBackButton,
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
export function validateStackPresentation(options) {
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
export function appendScreenStackPropsToOptions(options, props) {
    let updatedOptions = { ...options, ...props.options };
    validateStackPresentation(updatedOptions);
    function appendChildOptions(child, opts) {
        if (isChildOfType(child, StackHeaderComponent)) {
            return appendStackHeaderPropsToOptions(opts, child.props);
        }
        if (isChildOfType(child, StackScreenTitle)) {
            return appendStackScreenTitlePropsToOptions(opts, child.props);
        }
        if (isChildOfType(child, StackScreenBackButton)) {
            return appendStackScreenBackButtonPropsToOptions(opts, child.props);
        }
        if (isChildOfType(child, StackToolbar)) {
            const placement = child.props.placement ?? 'bottom';
            if (placement === 'bottom') {
                throw new Error(`Stack.Toolbar with placement="bottom" cannot be used inside Stack.Screen.`);
            }
            return appendStackToolbarPropsToOptions(opts, child.props);
        }
        const typeName = typeof child.type === 'function'
            ? child.type.name || 'Unknown'
            : String(child.type);
        console.warn(`Unknown child element passed to Stack.Screen: ${typeName}`);
        return opts;
    }
    Children.forEach(props.children, (child) => {
        if (isValidElement(child)) {
            updatedOptions = appendChildOptions(child, updatedOptions);
        }
    });
    return updatedOptions;
}
//# sourceMappingURL=StackScreen.js.map