import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import type { SearchBarProps } from 'react-native-screens';
export interface StackSearchBarProps extends SearchBarProps {
}
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
export declare function StackSearchBar({ ref, autoCapitalize, autoFocus, barTintColor, tintColor, cancelButtonText, disableBackButtonOverride, hideNavigationBar, hideWhenScrolling, inputType, obscureBackground, onBlur, onCancelButtonPress, onChangeText, onClose, onFocus, onOpen, onSearchButtonPress, placeholder, placement, allowToolbarIntegration, textColor, hintTextColor, headerIconColor, shouldShowHintSearchIcon, }: StackSearchBarProps): null;
export declare function appendStackSearchBarPropsToOptions(options: NativeStackNavigationOptions, props: StackSearchBarProps): NativeStackNavigationOptions;
//# sourceMappingURL=StackSearchBar.d.ts.map