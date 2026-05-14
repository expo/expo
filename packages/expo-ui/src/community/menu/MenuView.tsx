import { type Ref, useEffect, useImperativeHandle } from 'react';
import { View } from 'react-native';

import type { MenuComponentProps, MenuComponentRef } from './types';

let warned = false;

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
export function MenuView(props: MenuComponentProps & { ref?: Ref<MenuComponentRef> }) {
  useEffect(() => {
    if (!warned) {
      warned = true;
      console.warn(
        "[@expo/ui] MenuView is currently Android and iOS-only; the trigger will render but actions won't fire on this platform."
      );
    }
  }, []);
  useImperativeHandle(props.ref, () => ({ show: () => {} }), []);
  return (
    <View style={props.style} testID={props.testID}>
      {props.children}
    </View>
  );
}
