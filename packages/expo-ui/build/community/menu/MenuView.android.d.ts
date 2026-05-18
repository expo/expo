import * as React from 'react';
import type { MenuComponentProps, MenuComponentRef } from './types';
/**
 * A drop-in replacement for `@react-native-menu/menu` on Android.
 * Wraps the trigger in a `Pressable` (whose `onPress`/`onLongPress` opens the menu) and
 * renders the actions tree as a controlled Material `DropdownMenu`.
 *
 * Note: when `action.image` is a string, it is treated as an iOS SF Symbol and ignored
 * on Android — pass an `ImageSourcePropType` (e.g. `require('./icon.xml')`) to render
 * a leading icon. `MenuView.title` is also unused on Android since Material
 * `DropdownMenu` has no title slot.
 */
export declare function MenuView(props: MenuComponentProps & {
    ref?: React.Ref<MenuComponentRef>;
}): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=MenuView.android.d.ts.map