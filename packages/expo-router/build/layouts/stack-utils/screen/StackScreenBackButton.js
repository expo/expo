"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackScreenBackButton = StackScreenBackButton;
exports.appendStackScreenBackButtonPropsToOptions = appendStackScreenBackButtonPropsToOptions;
const react_1 = require("react");
const composition_options_1 = require("../../../fork/native-stack/composition-options");
/**
 * Component to configure the back button.
 *
 * Can be used inside Stack.Screen in a layout or directly inside a screen component.
 *
 * @example
 * ```tsx
 * import { Stack } from 'expo-router';
 *
 * export default function Layout() {
 *   return (
 *     <Stack>
 *       <Stack.Screen name="detail">
 *         <Stack.Screen.BackButton displayMode="minimal">Back</Stack.Screen.BackButton>
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
 *       <Stack.Screen.BackButton hidden />
 *       <ScreenContent />
 *     </>
 *   );
 * }
 * ```
 *
 * > **Note:** If multiple instances of this component are rendered for the same screen,
 * the last one rendered in the component tree takes precedence.
 */
function StackScreenBackButton({ children, style, withMenu, displayMode, hidden, src, }) {
    const options = (0, react_1.useMemo)(() => appendStackScreenBackButtonPropsToOptions({}, 
    // satisfies ensures every prop is listed here
    { children, style, withMenu, displayMode, hidden, src }), [children, style, withMenu, displayMode, hidden, src]);
    (0, composition_options_1.useCompositionOption)(options);
    return null;
}
function appendStackScreenBackButtonPropsToOptions(options, props) {
    return {
        ...options,
        headerBackTitle: props.children,
        headerBackTitleStyle: props.style,
        headerBackImageSource: props.src,
        headerBackButtonDisplayMode: props.displayMode,
        headerBackButtonMenuEnabled: props.withMenu,
        headerBackVisible: !props.hidden,
    };
}
//# sourceMappingURL=StackScreenBackButton.js.map