import { requireNativeView } from 'expo';

import { type ModifierConfig } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';

export type SingleChoiceSegmentedButtonRowProps = {
  /**
   * SegmentedButton children.
   */
  children: React.ReactNode;
  /**
   * Modifiers for the component.
   */
  modifiers?: ModifierConfig[];
};

const SingleChoiceSegmentedButtonRowNativeView: React.ComponentType<SingleChoiceSegmentedButtonRowProps> =
  requireNativeView('ExpoUI', 'SingleChoiceSegmentedButtonRowView');

/**
 * A row container for single-choice `SegmentedButton` children.
 * Maps to Material 3 `SingleChoiceSegmentedButtonRow`.
 */
export function SingleChoiceSegmentedButtonRow(props: SingleChoiceSegmentedButtonRowProps) {
  const { children, modifiers, ...restProps } = props;
  return (
    <SingleChoiceSegmentedButtonRowNativeView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...restProps}>
      {children}
    </SingleChoiceSegmentedButtonRowNativeView>
  );
}
