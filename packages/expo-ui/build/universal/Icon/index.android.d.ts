import type { ImageSourcePropType } from 'react-native';
import type { IconProps, IconSelectSpec } from './types';
/**
 * Universal `Icon` component. On Android, renders a Jetpack Compose `Icon`
 * from an XML vector drawable asset (typically from `@expo/material-symbols`).
 *
 * When `onPress` is provided, the icon is wrapped in a `Box` so the
 * `clickable` modifier (and the other universal layout / behavior modifiers)
 * attach to a container that reliably forwards pointer events. Material 3
 * `Icon` adds its own semantics with `Role.Image`, which can mask a
 * `clickable` applied directly to it. With no `onPress`, the bare Compose
 * `Icon` is rendered for a leaner native tree.
 */
export declare function Icon({ name, size, color, accessibilityLabel, style, onPress, onAppear, onDisappear, disabled, hidden, testID, modifiers: extraModifiers, }: IconProps): import("react/jsx-runtime").JSX.Element | null;
export declare namespace Icon {
    var select: (spec: IconSelectSpec) => ImageSourcePropType;
}
export * from './types';
//# sourceMappingURL=index.android.d.ts.map