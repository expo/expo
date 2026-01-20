"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackToolbarButton = void 0;
exports.convertStackToolbarButtonPropsToRNHeaderItem = convertStackToolbarButtonPropsToRNHeaderItem;
const expo_image_1 = require("expo-image");
const bottom_toolbar_native_elements_1 = require("./bottom-toolbar-native-elements");
const context_1 = require("./context");
const shared_1 = require("../shared");
/**
 * A button used inside `Stack.Toolbar`.
 *
 * @example
 * ```tsx
 * import { Stack } from 'expo-router';
 *
 * export default function Layout() {
 *   return (
 *     <Stack>
 *       <Stack.Screen name="index">
 *         <Stack.Toolbar placement="left">
 *           <Stack.Toolbar.Button icon="arrow.left.circle" onPress={() => alert('Left pressed')} />
 *         </Stack.Toolbar>
 *       </Stack.Screen>
 *     </Stack>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * import { Stack } from 'expo-router';
 *
 * export default function Page() {
 *   return (
 *     <>
 *       <Stack.Toolbar placement="left">
 *         <Stack.Toolbar.Button icon="arrow.left.circle" onPress={() => alert('Left pressed')} />
 *       </Stack.Toolbar>
 *       <ScreenContent />
 *     </>
 *   );
 * }
 * ```
 *
 * @platform ios
 */
const StackToolbarButton = (props) => {
    const placement = (0, context_1.useToolbarPlacement)();
    const sharedProps = (0, shared_1.convertStackHeaderSharedPropsToRNSharedHeaderItem)(props);
    // Add 'sf:' prefix for SF Symbols
    const processedIcon = sharedProps.icon?.type === 'sfSymbol'
        ? `sf:${sharedProps.icon.name}`
        : sharedProps.icon?.source;
    const loadedImage = (0, expo_image_1.useImage)((0, shared_1.getImageSourceFromIcon)(processedIcon), {
        maxWidth: 24,
        maxHeight: 24,
    });
    if (placement === 'bottom') {
        return (<bottom_toolbar_native_elements_1.NativeToolbarButton {...sharedProps} icon={undefined} image={loadedImage ?? props.image} imageRenderingMode={props.iconRenderingMode}/>);
    }
    return null;
};
exports.StackToolbarButton = StackToolbarButton;
function convertStackToolbarButtonPropsToRNHeaderItem(props) {
    if (props.hidden) {
        return undefined;
    }
    return {
        ...(0, shared_1.convertStackHeaderSharedPropsToRNSharedHeaderItem)(props),
        type: 'button',
        onPress: props.onPress ?? (() => { }),
        selected: !!props.selected,
    };
}
//# sourceMappingURL=StackToolbarButton.js.map