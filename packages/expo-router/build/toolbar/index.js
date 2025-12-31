"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolbarView = exports.ToolbarSearchBarPlacement = exports.ToolbarSpacer = exports.ToolbarButton = exports.ToolbarMenuAction = exports.ToolbarMenu = exports.Toolbar = void 0;
const elements_1 = require("./elements");
Object.defineProperty(exports, "ToolbarMenu", { enumerable: true, get: function () { return elements_1.ToolbarMenu; } });
Object.defineProperty(exports, "ToolbarMenuAction", { enumerable: true, get: function () { return elements_1.ToolbarMenuAction; } });
Object.defineProperty(exports, "ToolbarButton", { enumerable: true, get: function () { return elements_1.ToolbarButton; } });
Object.defineProperty(exports, "ToolbarSpacer", { enumerable: true, get: function () { return elements_1.ToolbarSpacer; } });
Object.defineProperty(exports, "ToolbarSearchBarPlacement", { enumerable: true, get: function () { return elements_1.ToolbarSearchBarPlacement; } });
Object.defineProperty(exports, "ToolbarView", { enumerable: true, get: function () { return elements_1.ToolbarView; } });
/**
 * A component that provides a [bottom toolbar](https://developer.apple.com/design/human-interface-guidelines/toolbars).
 *
 * @example
 * ```tsx
 * import { Toolbar } from "expo-router";
 *
 * export default function MyScreen() {
 *   return (
 *     <>
 *       <YourScreenContent />
 *       <Toolbar>
 *         <Toolbar.Spacer />
 *         <Toolbar.Button icon="magnifyingglass" tintColor={Color.ios.placeholderText} />
 *         <Toolbar.View>
 *           <TextInput style={{ width: 200 }} placeholder="Search" />
 *         </Toolbar.View>
 *         <Toolbar.Menu icon="ellipsis">
 *           <Toolbar.MenuAction icon="mail" title="Send email" onPress={() => {}} />
 *           <Toolbar.MenuAction icon="trash" title="Delete" destructive onPress={() => {}} />
 *         </Toolbar.Menu>
 *         <Toolbar.Spacer />
 *       </Toolbar>
 *     </>
 *   );
 * }
 * ```
 *
 * @platform ios
 */
exports.Toolbar = Object.assign(elements_1.ToolbarHost, {
    Menu: elements_1.ToolbarMenu,
    MenuAction: elements_1.ToolbarMenuAction,
    Button: elements_1.ToolbarButton,
    Spacer: elements_1.ToolbarSpacer,
    SearchBarPlacement: elements_1.ToolbarSearchBarPlacement,
    View: elements_1.ToolbarView,
});
//# sourceMappingURL=index.js.map