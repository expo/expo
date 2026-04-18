'use client';
import { NativeToolbarView } from './native';
import { useToolbarPlacement } from '../context';
/**
 * A wrapper to render custom content in the toolbar.
 *
 * Use inside `Stack.Toolbar` to render a custom React element.
 *
 * @example
 * ```tsx
 * import { Stack } from 'expo-router';
 * import { Text } from 'react-native';
 *
 * function CustomElement() {
 *   return <Text>Custom Element</Text>;
 * }
 *
 * export default function Page() {
 *   return (
 *     <>
 *       <Stack.Toolbar>
 *         <Stack.Toolbar.View>
 *           <CustomElement />
 *         </Stack.Toolbar.View>
 *       </Stack.Toolbar>
 *       <ScreenContent />
 *     </>
 *   );
 * }
 * ```
 *
 * @platform android
 * @platform ios
 */
export const StackToolbarView = (props) => {
    const placement = useToolbarPlacement();
    if ((process.env.EXPO_OS === 'ios' && placement !== 'bottom') || placement == null) {
        throw new Error('Stack.Toolbar.View must be used inside a Stack.Toolbar');
    }
    return <NativeToolbarView {...props}>{props.children}</NativeToolbarView>;
};
export function convertStackToolbarViewPropsToRNHeaderItem(props) {
    if (props.hidden) {
        return undefined;
    }
    const { children, hidesSharedBackground } = props;
    if (!children) {
        console.warn('Stack.Toolbar.View requires a child element to render custom content in the toolbar.');
    }
    const element = children ? children : <></>;
    return {
        type: 'custom',
        element,
        hidesSharedBackground,
    };
}
//# sourceMappingURL=index.js.map