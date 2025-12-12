import {
  ToolbarHost,
  ToolbarMenu,
  ToolbarMenuAction,
  ToolbarButton,
  ToolbarSpacer,
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
 *        <Toolbar.Button sf="magnifyingglass" />
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
  View: ToolbarView,
});

export { ToolbarMenu, ToolbarMenuAction, ToolbarButton, ToolbarSpacer, ToolbarView, ToolbarHost };

export type {
  ToolbarProps,
  ToolbarMenuProps,
  ToolbarMenuActionProps,
  ToolbarButtonProps,
  ToolbarSpacerProps,
  ToolbarViewProps as ToolbarCustomViewProps,
} from './elements';
