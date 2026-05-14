import type { ReactNode } from 'react';
import type { ColorValue, ImageSourcePropType, StyleProp, ViewStyle } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';

/**
 * Visual and behavioral attributes of a menu action.
 * Compatible with `@react-native-menu/menu`.
 */
export type MenuAttributes = {
  /**
   * Renders the action with a destructive style (red text/icon).
   */
  destructive?: boolean;
  /**
   * Disables the action so it can't be activated.
   */
  disabled?: boolean;
  /**
   * Hides the action from the menu.
   */
  hidden?: boolean;
};

/**
 * Selection state for a menu action.
 * `'on'` renders a checkmark; `'off'` doesn't.
 */
export type MenuState = 'on' | 'off';

/**
 * A single action inside a `MenuView`.
 * Compatible with `@react-native-menu/menu`.
 */
export type MenuAction = {
  /**
   * Identifier passed back via `onPressAction.nativeEvent.event` when this action is selected.
   * Defaults to `title` if omitted.
   */
  id?: string;
  /**
   * Action label shown in the menu.
   */
  title: string;
  /**
   * Text color of the action label.
   * @platform android
   */
  titleColor?: ColorValue;
  /**
   * Icon to render beside the action label.
   *
   * - When an `SFSymbol` name (e.g. `'trash'`), rendered on iOS only.
   *   Not rendered on Android — pass an `ImageSourcePropType` instead to show an
   *   icon there.
   * - When an `ImageSourcePropType` (e.g. `require('./trash.xml')` or
   *   `{ uri: '...' }`), rendered on Android via Compose `Icon`. Ignored on iOS;
   *   SwiftUI menus only accept SF Symbol names for built-in `Menu`/`Button`
   *   labels.
   */
  image?: SFSymbol | ImageSourcePropType;
  /**
   * Tint color applied to the action's icon.
   *
   * Visually applied on Android via the leading `Icon`'s tint. On iOS, the
   * value is accepted but **may not render**: SwiftUI's `Menu`/`ContextMenu`
   * draw their items via the system menu UI, which ignores per-item color
   * modifiers.
   */
  imageColor?: ColorValue;
  /**
   * Selection state. When `'on'`, the action renders a checkmark.
   */
  state?: MenuState;
  /**
   * Visual/behavioral flags.
   */
  attributes?: MenuAttributes;
  /**
   * Nested actions. Without `displayInline`, renders as a submenu;
   * with `displayInline: true`, renders as an inline section.
   */
  subactions?: MenuAction[];
  /**
   * When `true` and `subactions` is present, renders the children as an inline section
   * inside the parent menu (with this action's `title` as the section header on iOS).
   */
  displayInline?: boolean;
};

/**
 * Imperative handle exposed by `MenuView` via `ref`.
 * Compatible with `@react-native-menu/menu`'s `ref.show()` API.
 */
export type MenuComponentRef = {
  /**
   * Programmatically open the menu.
   *
   * On Android, opens the anchored `DropdownMenu` (equivalent to the user tapping
   * the trigger). On iOS this is a no-op — SwiftUI `Menu`/`ContextMenu` have no
   * programmatic open API; a one-time `console.warn` is emitted in development.
   * @platform android
   */
  show: () => void;
};

/**
 * Event payload delivered to `onPressAction` when an action is selected.
 * Compatible with `@react-native-menu/menu`.
 */
export type NativeActionEvent = {
  nativeEvent: {
    /** Identifier of the pressed action: `action.id ?? action.title`. */
    event: string;
  };
};

/**
 * Props for the `MenuView` component.
 * Drop-in compatible with `@react-native-menu/menu`.
 */
export type MenuComponentProps = {
  /**
   * Menu title shown at the top of the menu.
   * @platform ios
   */
  title?: string;
  /**
   * Callback invoked when a menu action is selected.
   */
  onPressAction?: (event: NativeActionEvent) => void;
  /**
   * Callback invoked when the menu opens.
   *
   * On Android, fires when the trigger's tap/long-press flips `expanded` to `true`.
   * On iOS, SwiftUI `Menu`/`ContextMenu` do not expose an open hook, so this is not
   * fired there.
   * @platform android
   */
  onOpenMenu?: () => void;
  /**
   * Callback invoked when the menu closes (either via dismissal or after an action
   * fires).
   *
   * On Android, fires from the controlled `DropdownMenu`'s dismiss path.
   * On iOS, SwiftUI `Menu`/`ContextMenu` do not expose a close hook in a way we can
   * forward, so this is not fired there.
   * @platform android
   */
  onCloseMenu?: () => void;
  /**
   * The actions to display in the menu.
   */
  actions: MenuAction[];
  /**
   * When `true`, the menu opens on long-press of the trigger instead of a single tap.
   * @default false
   */
  shouldOpenOnLongPress?: boolean;
  /**
   * Style applied to the trigger wrapper.
   */
  style?: StyleProp<ViewStyle>;
  /**
   * Test identifier passed through to the trigger view.
   */
  testID?: string;
  /**
   * Trigger view. Long-pressing or tapping (per `shouldOpenOnLongPress`) opens the menu.
   */
  children?: ReactNode;
};
