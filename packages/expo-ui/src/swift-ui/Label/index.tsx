import { requireNativeView } from 'expo';
import { type SFSymbol } from 'sf-symbols-typescript';

import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

export type LabelProps = {
  /**
   * The title text to be displayed in the label.
   */
  title?: string;

  /**
   * The name of the SFSymbol to be displayed in the label.
   */
  systemImage?: SFSymbol;

  /**
   * The color of the label icon.
   */
  color?: string;
} & CommonViewModifierProps;

const LabelNativeView: React.ComponentType<LabelProps> = requireNativeView('ExpoUI', 'LabelView');

/**
 * Renders a native label view, which could be used in a list or section.
 *
 * @param {LabelProps} props - The properties passed to the Label component.
 * @returns {JSX.Element} The rendered native Label component.
 * @platform ios
 */
export function Label(props: LabelProps) {
  const { modifiers, ...restProps } = props;
  return (
    <LabelNativeView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...restProps}
    />
  );
}
