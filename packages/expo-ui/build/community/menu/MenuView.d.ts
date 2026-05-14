import { type Ref } from 'react';
import type { MenuComponentProps, MenuComponentRef } from './types';
/**
 * A drop-in replacement for `@react-native-menu/menu`'s `MenuView`. Wrap any trigger
 * view; long-pressing or tapping (per `shouldOpenOnLongPress`) shows a popup menu
 * built from the `actions` tree.
 *
 * - On Android, renders via Compose's `DropdownMenu` anchored to a `Pressable`.
 * - On iOS, renders via SwiftUI's `Menu` (tap) or `ContextMenu` (long-press).
 * - On web, the trigger renders the trigger but actions do not fire;
 *   a one-time `console.warn` is emitted.
 *
 * @platform android
 * @platform ios
 */
export declare function MenuView(props: MenuComponentProps & {
    ref?: Ref<MenuComponentRef>;
}): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=MenuView.d.ts.map