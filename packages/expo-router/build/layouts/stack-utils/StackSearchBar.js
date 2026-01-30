"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackSearchBar = StackSearchBar;
exports.appendStackSearchBarPropsToOptions = appendStackSearchBarPropsToOptions;
const react_1 = require("react");
const Screen_1 = require("../../views/Screen");
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
function StackSearchBar(props) {
    const updatedOptions = (0, react_1.useMemo)(() => appendStackSearchBarPropsToOptions({}, props), [props]);
    return <Screen_1.Screen options={updatedOptions}/>;
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