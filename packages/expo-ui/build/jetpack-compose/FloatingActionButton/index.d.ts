import { type ColorValue } from 'react-native';
import type { ModifierConfig } from '../../types';
type SlotChildProps = {
    children: React.ReactNode;
};
/**
 * Props shared by all `FloatingActionButton` variants.
 */
export type FloatingActionButtonProps = {
    /**
     * Slot-based children (use `.Icon` sub-component).
     */
    children: React.ReactNode;
    /**
     * The background color of the button container.
     * Defaults to `FloatingActionButtonDefaults.containerColor` (primary container).
     */
    containerColor?: ColorValue;
    /**
     * Callback invoked when the button is clicked.
     */
    onClick?: () => void;
    /**
     * Modifiers for the component.
     */
    modifiers?: ModifierConfig[];
};
/**
 * Props for the `SmallFloatingActionButton` component.
 * Same as {@link FloatingActionButtonProps}.
 */
export type SmallFloatingActionButtonProps = FloatingActionButtonProps;
/**
 * Props for the `LargeFloatingActionButton` component.
 * Same as {@link FloatingActionButtonProps}.
 */
export type LargeFloatingActionButtonProps = FloatingActionButtonProps;
/**
 * Props for the `ExtendedFloatingActionButton` component.
 */
export type ExtendedFloatingActionButtonProps = FloatingActionButtonProps & {
    /**
     * Slot-based children (use `.Icon` and `.Text` sub-components).
     */
    children: React.ReactNode;
    /**
     * Controls whether the label is shown (expanded) or hidden (collapsed).
     * @default true
     */
    expanded?: boolean;
};
declare function FABIcon(props: SlotChildProps): import("react/jsx-runtime").JSX.Element;
declare function FABText(props: SlotChildProps): import("react/jsx-runtime").JSX.Element;
/**
 * Renders a Material Design 3 small `FloatingActionButton`.
 *
 * Wraps [`SmallFloatingActionButton`](https://developer.android.com/reference/kotlin/androidx/compose/material3/package-summary#SmallFloatingActionButton(kotlin.Function0,androidx.compose.ui.Modifier,androidx.compose.ui.graphics.Shape,androidx.compose.ui.graphics.Color,androidx.compose.ui.graphics.Color,androidx.compose.material3.FloatingActionButtonElevation,androidx.compose.foundation.interaction.MutableInteractionSource,kotlin.Function0)).
 *
 * @example
 * ```tsx
 * import { SmallFloatingActionButton, Host, Icon } from '@expo/ui/jetpack-compose';
 *
 * <Host matchContents>
 *   <SmallFloatingActionButton onClick={() => console.log('pressed')}>
 *     <SmallFloatingActionButton.Icon>
 *       <Icon source={require('./assets/add.xml')} />
 *     </SmallFloatingActionButton.Icon>
 *   </SmallFloatingActionButton>
 * </Host>
 * ```
 */
declare function SmallFloatingActionButtonComponent(props: SmallFloatingActionButtonProps): import("react/jsx-runtime").JSX.Element;
declare namespace SmallFloatingActionButtonComponent {
    var Icon: typeof FABIcon;
}
export { SmallFloatingActionButtonComponent as SmallFloatingActionButton };
/**
 * Renders a Material Design 3 standard `FloatingActionButton`.
 *
 * Wraps [`FloatingActionButton`](https://developer.android.com/reference/kotlin/androidx/compose/material3/package-summary#FloatingActionButton(kotlin.Function0,androidx.compose.ui.Modifier,androidx.compose.ui.graphics.Shape,androidx.compose.ui.graphics.Color,androidx.compose.ui.graphics.Color,androidx.compose.material3.FloatingActionButtonElevation,androidx.compose.foundation.interaction.MutableInteractionSource,kotlin.Function0)).
 *
 * @example
 * ```tsx
 * import { FloatingActionButton, Host, Icon } from '@expo/ui/jetpack-compose';
 *
 * <Host matchContents>
 *   <FloatingActionButton onClick={() => console.log('pressed')}>
 *     <FloatingActionButton.Icon>
 *       <Icon source={require('./assets/add.xml')} />
 *     </FloatingActionButton.Icon>
 *   </FloatingActionButton>
 * </Host>
 * ```
 */
declare function FloatingActionButtonComponent(props: FloatingActionButtonProps): import("react/jsx-runtime").JSX.Element;
declare namespace FloatingActionButtonComponent {
    var Icon: typeof FABIcon;
}
export { FloatingActionButtonComponent as FloatingActionButton };
/**
 * Renders a Material Design 3 large `FloatingActionButton`.
 *
 * Wraps [`LargeFloatingActionButton`](https://developer.android.com/reference/kotlin/androidx/compose/material3/package-summary#LargeFloatingActionButton(kotlin.Function0,androidx.compose.ui.Modifier,androidx.compose.ui.graphics.Shape,androidx.compose.ui.graphics.Color,androidx.compose.ui.graphics.Color,androidx.compose.material3.FloatingActionButtonElevation,androidx.compose.foundation.interaction.MutableInteractionSource,kotlin.Function0)).
 *
 * @example
 * ```tsx
 * import { LargeFloatingActionButton, Host, Icon } from '@expo/ui/jetpack-compose';
 *
 * <Host matchContents>
 *   <LargeFloatingActionButton onClick={() => console.log('pressed')}>
 *     <LargeFloatingActionButton.Icon>
 *       <Icon source={require('./assets/add.xml')} />
 *     </LargeFloatingActionButton.Icon>
 *   </LargeFloatingActionButton>
 * </Host>
 * ```
 */
declare function LargeFloatingActionButtonComponent(props: LargeFloatingActionButtonProps): import("react/jsx-runtime").JSX.Element;
declare namespace LargeFloatingActionButtonComponent {
    var Icon: typeof FABIcon;
}
export { LargeFloatingActionButtonComponent as LargeFloatingActionButton };
/**
 * Renders a Material Design 3 `ExtendedFloatingActionButton` with animated label expansion.
 *
 * Wraps [`ExtendedFloatingActionButton`](https://developer.android.com/reference/kotlin/androidx/compose/material3/package-summary#ExtendedFloatingActionButton(kotlin.Function0,androidx.compose.ui.Modifier,androidx.compose.ui.graphics.Shape,androidx.compose.ui.graphics.Color,androidx.compose.ui.graphics.Color,androidx.compose.material3.FloatingActionButtonElevation,androidx.compose.foundation.interaction.MutableInteractionSource,kotlin.Function1)).
 *
 * @example
 * ```tsx
 * import { ExtendedFloatingActionButton, Host, Icon, Text } from '@expo/ui/jetpack-compose';
 *
 * <Host matchContents>
 *   <ExtendedFloatingActionButton expanded={true} onClick={() => console.log('pressed')}>
 *     <ExtendedFloatingActionButton.Icon>
 *       <Icon source={require('./assets/edit.xml')} />
 *     </ExtendedFloatingActionButton.Icon>
 *     <ExtendedFloatingActionButton.Text>
 *       <Text>Edit</Text>
 *     </ExtendedFloatingActionButton.Text>
 *   </ExtendedFloatingActionButton>
 * </Host>
 * ```
 */
declare function ExtendedFloatingActionButtonComponent(props: ExtendedFloatingActionButtonProps): import("react/jsx-runtime").JSX.Element;
declare namespace ExtendedFloatingActionButtonComponent {
    var Icon: typeof FABIcon;
    var Text: typeof FABText;
}
export { ExtendedFloatingActionButtonComponent as ExtendedFloatingActionButton };
//# sourceMappingURL=index.d.ts.map