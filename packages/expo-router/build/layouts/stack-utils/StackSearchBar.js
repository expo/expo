"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackSearchBar = StackSearchBar;
exports.appendStackSearchBarPropsToOptions = appendStackSearchBarPropsToOptions;
const react_1 = require("react");
const composition_options_1 = require("../../fork/native-stack/composition-options");
/**
 * A search bar component that integrates with the native stack header.
 *
 * > **Note:** Using `Stack.SearchBar` will automatically make the header visible
 * (`headerShown: true`), as the search bar is rendered as part of the native header.
 *
 * To display the search bar in the bottom toolbar on iOS 26+, use
 * `Stack.Toolbar.SearchBarSlot` inside `Stack.Toolbar`.
 *
 * @example
 * ```tsx
 * import { Stack } from 'expo-router';
 *
 * export default function Page() {
 *   return (
 *     <>
 *       <Stack.SearchBar
 *         placeholder="Search..."
 *         onChangeText={(text) => console.log(text)}
 *       />
 *      <ScreenContent />
 *     </>
 *   );
 * }
 * ```
 */
function StackSearchBar({ ref, autoCapitalize, autoFocus, barTintColor, tintColor, cancelButtonText, disableBackButtonOverride, hideNavigationBar, hideWhenScrolling, inputType, obscureBackground, onBlur, onCancelButtonPress, onChangeText, onClose, onFocus, onOpen, onSearchButtonPress, placeholder, placement, allowToolbarIntegration, textColor, hintTextColor, headerIconColor, shouldShowHintSearchIcon, }) {
    const options = (0, react_1.useMemo)(() => appendStackSearchBarPropsToOptions({}, 
    // satisfies ensures every prop is listed here
    {
        ref,
        autoCapitalize,
        autoFocus,
        barTintColor,
        tintColor,
        cancelButtonText,
        disableBackButtonOverride,
        hideNavigationBar,
        hideWhenScrolling,
        inputType,
        obscureBackground,
        onBlur,
        onCancelButtonPress,
        onChangeText,
        onClose,
        onFocus,
        onOpen,
        onSearchButtonPress,
        placeholder,
        placement,
        allowToolbarIntegration,
        textColor,
        hintTextColor,
        headerIconColor,
        shouldShowHintSearchIcon,
    }), [
        ref,
        autoCapitalize,
        autoFocus,
        barTintColor,
        tintColor,
        cancelButtonText,
        disableBackButtonOverride,
        hideNavigationBar,
        hideWhenScrolling,
        inputType,
        obscureBackground,
        onBlur,
        onCancelButtonPress,
        onChangeText,
        onClose,
        onFocus,
        onOpen,
        onSearchButtonPress,
        placeholder,
        placement,
        allowToolbarIntegration,
        textColor,
        hintTextColor,
        headerIconColor,
        shouldShowHintSearchIcon,
    ]);
    (0, composition_options_1.useCompositionOption)(options);
    return null;
}
function appendStackSearchBarPropsToOptions(options, props) {
    return {
        ...options,
        headerShown: true,
        headerSearchBarOptions: {
            ...props,
        },
    };
}
//# sourceMappingURL=StackSearchBar.js.map