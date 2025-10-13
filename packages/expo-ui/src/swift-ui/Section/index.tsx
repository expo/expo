import { requireNativeView } from 'expo';

import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

export type SectionProps = {
  /**
   * On iOS, section titles are usually capitalized for consistency with platform conventions.
   */
  title?: string;
  /**
   * Sets the section footer text.
   * @description If section is expanded, the footer will not be shown.
   */
  footer?: string;
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

const SectionNativeHeaderView: React.ComponentType<object> = requireNativeView(
  'ExpoUI',
  'SectionHeader'
);

const SectionNativeFooterView: React.ComponentType<object> = requireNativeView(
  'ExpoUI',
  'SectionFooter'
);

const SectionNativeContentView: React.ComponentType<object> = requireNativeView(
  'ExpoUI',
  'SectionContent'
);

/**
 * The view displayed at the top of a section.
 *
 * @example
 * ```tsx
 * <Section.Header>Settings</Section.Header>
 * ```
 *
 * @platform ios
 */
export function Header(props: { children: React.ReactNode }) {
  return <SectionNativeHeaderView {...props} />;
}
/**
 * The view displayed at the bottom of a section.
 *
 * @example
 * ```tsx
 * <Section.Footer>Additional details</Section.Footer>
 * ```
 *
 * @platform ios
 */
export function Footer(props: { children: React.ReactNode }) {
  return <SectionNativeFooterView {...props} />;
}
/**
 * The main content area of the section.
 *
 * @example
 * ```tsx
 * <Section.Content>
 *   <Text>Option 1</Text>
 *   <Text>Option 2</Text>
 * </Section.Content>
 * ```
 *
 * @platform ios
 */
export function Content(props: { children: React.ReactNode }) {
  return <SectionNativeContentView {...props} />;
}

Section.Header = Header;
Section.Footer = Footer;
Section.Content = Content;

/**
 * Section component uses the native [Section](https://developer.apple.com/documentation/swiftui/section) component.
 * It has no intrinsic dimensions, so it needs explicit height or flex set to display content (like ScrollView).
 * @platform ios
 */
export function Section(props: SectionProps) {
  const { modifiers, ...restProps } = props;
  return (
    <SectionNativeView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...restProps}
    />
  );
}
