import { requireNativeView } from 'expo';

import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

export type SectionProps = {
  /**
   * On iOS, section titles are usually capitalized for consistency with platform conventions.
   */
  title?: string;
  /**
   * Sets a custom footer for the section.
   * @description If section is expanded, the footer will not be shown.
   */
  footer?: React.ReactNode;
  /**
   * Sets a custom header for the section.
   * @description This will replace the default section header with your own content.
   */
  header?: React.ReactNode;
  children: React.ReactNode;
  /**
   * Enables or disables collapsible behavior for the section.
   * @default false
   * @availability Available only when the list style is set to `sidebar`.
   */
  collapsible?: boolean;
} & CommonViewModifierProps;

const SectionNativeView: React.ComponentType<SectionProps> = requireNativeView(
  'ExpoUI',
  'SectionView'
);

const SectionHeader: React.ComponentType<object> = requireNativeView('ExpoUI', 'SectionHeader');

const SectionFooter: React.ComponentType<object> = requireNativeView('ExpoUI', 'SectionFooter');

const SectionContent: React.ComponentType<object> = requireNativeView('ExpoUI', 'SectionContent');

/**
 * Section component uses the native [Section](https://developer.apple.com/documentation/swiftui/section) component.
 * It has no intrinsic dimensions, so it needs explicit height or flex set to display content (like ScrollView).
 * @platform ios
 */
export function Section(props: SectionProps) {
  const { modifiers, header, footer, children, ...restProps } = props;
  return (
    <SectionNativeView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...restProps}>
      {header && <SectionHeader>{header}</SectionHeader>}
      {footer && <SectionFooter>{footer}</SectionFooter>}
      <SectionContent>{children}</SectionContent>
    </SectionNativeView>
  );
}
