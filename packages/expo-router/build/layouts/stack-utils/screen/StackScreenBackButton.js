"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackScreenBackButton = StackScreenBackButton;
exports.appendStackScreenBackButtonPropsToOptions = appendStackScreenBackButtonPropsToOptions;
const react_1 = require("react");
const Screen_1 = require("../../../views/Screen");
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
 * @platform ios
 */
function StackScreenBackButton(props) {
    const updatedOptions = (0, react_1.useMemo)(() => appendStackScreenBackButtonPropsToOptions({}, props), [props]);
    return <Screen_1.Screen options={updatedOptions}/>;
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