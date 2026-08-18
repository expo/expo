import { requireNativeView } from 'expo';
import type { ColorValue } from 'react-native';
import { type SFSymbol } from 'sf-symbols-typescript';

import { Slot } from '../SlotView';
import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

export interface LabelProps extends CommonViewModifierProps {
  /**
   * The title text to be displayed in the label.
   */
  title?: string;

  /**
   * The name of the SFSymbol to be displayed in the label.
   */
  systemImage?: SFSymbol;

  /**
   * Custom icon view to be displayed in the label.
   * When provided, this takes precedence over `systemImage`.
   */
  icon?: React.ReactNode;

  /**
   * Custom title view. Accepts any React node (for example, a `VStack` with title and subtitle).
   * When provided, this takes precedence over `title`.
   */
  children?: React.ReactNode;

  /**
   * The color of the label icon.
   * @deprecated Use `foregroundStyle` modifier instead.
   */
  color?: ColorValue;
}

const LabelNativeView: React.ComponentType<LabelProps & { children?: React.ReactNode }> =
  requireNativeView('ExpoUI', 'LabelView');

/**
 * Renders a native label view, which could be used in a list or section.
 *
 * @param {LabelProps} props - The properties passed to the Label component.
 * @returns {JSX.Element} The rendered native Label component.
 */
export function Label(props: LabelProps) {
  const { modifiers, icon, children, ...restProps } = props;
  return (
    <LabelNativeView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...restProps}>
      {children && <Slot name="title">{children}</Slot>}
      {icon && <Slot name="icon">{icon}</Slot>}
    </LabelNativeView>
  );
}
