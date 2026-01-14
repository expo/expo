import { requireNativeView } from 'expo';

import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

export type SectionProps = {
  /**
   * The title of the section.
   */
  title?: string;
  /**
   * Sets a custom footer for the section.
   */
  footer?: React.ReactNode;
  /**
   * Sets a custom header for the section.
   */
  header?: React.ReactNode;
  /**
   * The content of the section.
   */
  children: React.ReactNode;
  /**
   * Controls whether the section is expanded or collapsed.
   * When provided, the section becomes collapsible.
   * > **Note**: Available only when the list style is set to `sidebar`.
   * @platform ios 17.0+
   * @platform tvos 17.0+
   */
  isExpanded?: boolean;
  /**
   * Callback triggered when the section's expanded state changes.
   * @platform ios 17.0+
   * @platform tvos 17.0+
   */
  onIsExpandedChange?: (isExpanded: boolean) => void;
} & CommonViewModifierProps;

type SectionNativeProps = Omit<SectionProps, 'onIsExpandedChange'> & {
  onIsExpandedChange?: (e: { nativeEvent: { isExpanded: boolean } }) => void;
};

const SectionNativeView: React.ComponentType<SectionNativeProps> = requireNativeView(
  'ExpoUI',
  'SectionView'
);

const SectionHeader: React.ComponentType<object> = requireNativeView('ExpoUI', 'SectionHeader');

const SectionFooter: React.ComponentType<object> = requireNativeView('ExpoUI', 'SectionFooter');

const SectionContent: React.ComponentType<object> = requireNativeView('ExpoUI', 'SectionContent');

/**
 * Section component uses the native [Section](https://developer.apple.com/documentation/swiftui/section) component.
 */
export function Section(props: SectionProps) {
  const { modifiers, header, footer, children, onIsExpandedChange, ...restProps } = props;
  return (
    <SectionNativeView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...(onIsExpandedChange && {
        onIsExpandedChange: (e: { nativeEvent: { isExpanded: boolean } }) =>
          onIsExpandedChange(e.nativeEvent.isExpanded),
      })}
      {...restProps}>
      {header && <SectionHeader>{header}</SectionHeader>}
      {footer && <SectionFooter>{footer}</SectionFooter>}
      <SectionContent>{children}</SectionContent>
    </SectionNativeView>
  );
}
