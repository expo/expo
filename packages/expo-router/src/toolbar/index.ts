import {
  ToolbarHost,
  ToolbarMenu,
  ToolbarMenuAction,
  ToolbarButton,
  ToolbarSpacer,
  ToolbarSearchBarPlacement,
  ToolbarView,
} from './elements';

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
export const Toolbar = Object.assign(ToolbarHost, {
  Menu: ToolbarMenu,
  MenuAction: ToolbarMenuAction,
  Button: ToolbarButton,
  Spacer: ToolbarSpacer,
  SearchBarPlacement: ToolbarSearchBarPlacement,
  View: ToolbarView,
});

export {
  ToolbarMenu,
  ToolbarMenuAction,
  ToolbarButton,
  ToolbarSpacer,
  ToolbarSearchBarPlacement,
  ToolbarView,
};

export type {
  ToolbarProps,
  ToolbarMenuProps,
  ToolbarMenuActionProps,
  ToolbarButtonProps,
  ToolbarSpacerProps,
  ToolbarSearchBarPlacementProps,
  ToolbarViewProps as ToolbarCustomViewProps,
} from './elements';
