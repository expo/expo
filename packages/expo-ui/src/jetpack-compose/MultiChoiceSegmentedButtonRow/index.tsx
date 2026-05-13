import { requireNativeView } from 'expo';

import { type ModifierConfig } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';

export type MultiChoiceSegmentedButtonRowProps = {
  /**
   * SegmentedButton children.
   */
  children: React.ReactNode;
  /**
   * Modifiers for the component.
   */
  modifiers?: ModifierConfig[];
};

const MultiChoiceSegmentedButtonRowNativeView: React.ComponentType<MultiChoiceSegmentedButtonRowProps> =
  requireNativeView('ExpoUI', 'MultiChoiceSegmentedButtonRowView');

/**
 * A row container for multi-choice `SegmentedButton` children.
 * Maps to Material 3 `MultiChoiceSegmentedButtonRow`.
 */
export function MultiChoiceSegmentedButtonRow(props: MultiChoiceSegmentedButtonRowProps) {
  const { children, modifiers, ...restProps } = props;
  return (
    <MultiChoiceSegmentedButtonRowNativeView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...restProps}>
      {children}
    </MultiChoiceSegmentedButtonRowNativeView>
  );
}
