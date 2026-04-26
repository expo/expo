import { requireNativeView } from 'expo';
import { type ColorValue } from 'react-native';

import type { ModifierConfig, ViewEvent } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';

type SlotChildProps = {
  children: React.ReactNode;
};

type NativeSlotViewProps = {
  slotName: string;
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

/**
 * @hidden
 */
type NativeFloatingActionButtonProps = Omit<FloatingActionButtonProps, 'onClick'> &
  ViewEvent<'onButtonPressed', void> & {
    variant: string;
    expanded?: boolean;
  };

const FloatingActionButtonNativeView: React.ComponentType<NativeFloatingActionButtonProps> =
  requireNativeView('ExpoUI', 'FloatingActionButtonView');

const SlotNativeView: React.ComponentType<NativeSlotViewProps> = requireNativeView(
  'ExpoUI',
  'SlotView'
);

function FABIcon(props: SlotChildProps) {
  return <SlotNativeView slotName="icon">{props.children}</SlotNativeView>;
}

function FABText(props: SlotChildProps) {
  return <SlotNativeView slotName="text">{props.children}</SlotNativeView>;
}

function transformProps(
  props: FloatingActionButtonProps & { variant: string; expanded?: boolean }
): NativeFloatingActionButtonProps {
  const { children, onClick, modifiers, ...restProps } = props;

  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
    children,
    onButtonPressed: onClick,
  };
}

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
function SmallFloatingActionButtonComponent(props: SmallFloatingActionButtonProps) {
  return <FloatingActionButtonNativeView {...transformProps({ ...props, variant: 'small' })} />;
}
SmallFloatingActionButtonComponent.Icon = FABIcon;
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
function FloatingActionButtonComponent(props: FloatingActionButtonProps) {
  return <FloatingActionButtonNativeView {...transformProps({ ...props, variant: 'medium' })} />;
}
FloatingActionButtonComponent.Icon = FABIcon;
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
function LargeFloatingActionButtonComponent(props: LargeFloatingActionButtonProps) {
  return <FloatingActionButtonNativeView {...transformProps({ ...props, variant: 'large' })} />;
}
LargeFloatingActionButtonComponent.Icon = FABIcon;
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
function ExtendedFloatingActionButtonComponent(props: ExtendedFloatingActionButtonProps) {
  return <FloatingActionButtonNativeView {...transformProps({ ...props, variant: 'extended' })} />;
}
ExtendedFloatingActionButtonComponent.Icon = FABIcon;
ExtendedFloatingActionButtonComponent.Text = FABText;
export { ExtendedFloatingActionButtonComponent as ExtendedFloatingActionButton };
