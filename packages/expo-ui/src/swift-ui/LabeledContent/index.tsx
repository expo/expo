import { requireNativeView } from 'expo';

import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

export type LabeledContentProps = {
  /**
   * The label to be displayed in the labeled content.
   */
  label?: string;
  children: React.ReactNode;
} & CommonViewModifierProps;

const LabeledContentNativeView: React.ComponentType<LabeledContentProps> = requireNativeView(
  'ExpoUI',
  'LabeledContentView'
);

/**
 * LabeledContent component uses the native [LabeledContent](https://developer.apple.com/documentation/swiftui/labeledcontent) component.
 * A container for attaching a label to a value-bearing view.
 * Available from iOS 16.0.
 * @platform ios
 */
export function LabeledContent(props: LabeledContentProps) {
  const { modifiers, ...restProps } = props;
  return (
    <LabeledContentNativeView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...restProps}
    />
  );
}
