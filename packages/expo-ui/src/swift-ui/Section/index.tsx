import { requireNativeView } from 'expo';

import { isMissingHost, markChildrenAsNestedInSwiftUI, MissingHostErrorView } from '../Host';
import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

export type SectionProps = {
  /**
   * On iOS, section titles are usually capitalized for consistency with platform conventions.
   */
  title?: string;
  children: React.ReactNode;
} & CommonViewModifierProps;

const SectionNativeView: React.ComponentType<SectionProps> = requireNativeView(
  'ExpoUI',
  'SectionView'
);

/**
 * Section component uses the native [Section](https://developer.apple.com/documentation/swiftui/section) component.
 * It has no intrinsic dimensions, so it needs explicit height or flex set to display content (like ScrollView).
 * @platform ios
 */
export function Section(props: SectionProps) {
  const { modifiers, children, ...restProps } = props;
  if (isMissingHost(props)) {
    return <MissingHostErrorView componentName="Section" />;
  }
  return (
    <SectionNativeView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      children={markChildrenAsNestedInSwiftUI(children)}
      {...restProps}
    />
  );
}
