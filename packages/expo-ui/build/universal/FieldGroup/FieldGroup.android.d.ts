import type { FieldGroupProps } from './types';
/**
 * A scrollable container for grouped settings-style rows. On Android this
 * wraps a Jetpack Compose `LazyColumn` that mirrors the Material 3 settings
 * layout and adapts to the enclosing `<Host>`'s theme. Pass
 * `style={{ backgroundColor }}` to override the default background.
 */
export declare function FieldGroup({ children, style, onAppear, onDisappear, disabled, hidden, testID, modifiers: extraModifiers, }: FieldGroupProps): import("react/jsx-runtime").JSX.Element | null;
//# sourceMappingURL=FieldGroup.android.d.ts.map