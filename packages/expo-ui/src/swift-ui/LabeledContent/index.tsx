import { requireNativeView } from 'expo';

import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

export type LabeledContentProps = {
  /**
   * The label to be displayed in the labeled content.
   */
  label?: string;
  children: React.ReactNode;

  /**
   * Sets a custom view for the label.
   */
  labelView?: React.ReactNode;
} & CommonViewModifierProps;

const LabeledContentNativeView: React.ComponentType<LabeledContentProps> = requireNativeView(
  'ExpoUI',
  'LabeledContentView'
);

const LabeledContentLabel: React.ComponentType<object> = requireNativeView(
  'ExpoUI',
  'LabeledContentLabel'
);

const LabeledContentContent: React.ComponentType<object> = requireNativeView(
  'ExpoUI',
  'LabeledContentContent'
);

/**
 * LabeledContent component uses the native [LabeledContent](https://developer.apple.com/documentation/swiftui/labeledcontent) component.
 * A container for attaching a label to a value-bearing view.
 * @platform ios 16.0+
 * @platform tvos 16.0+
 */
export function LabeledContent(props: LabeledContentProps) {
  const { modifiers, labelView, children, ...restProps } = props;
  return (
    <LabeledContentNativeView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...restProps}>
      {labelView && <LabeledContentLabel>{labelView}</LabeledContentLabel>}
      <LabeledContentContent>{children}</LabeledContentContent>
    </LabeledContentNativeView>
  );
}
