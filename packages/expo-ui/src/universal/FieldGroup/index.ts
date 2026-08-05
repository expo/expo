import { FieldGroup as FieldGroupBase } from './FieldGroup';
import { FieldSection } from './FieldSection';
import { Header, Footer } from './FieldSectionSlots';
import type { FieldSectionFooterProps, FieldSectionHeaderProps, FieldSectionProps } from './types';

const FieldGroup = FieldGroupBase as typeof FieldGroupBase & {
  Section: React.FC<FieldSectionProps>;
  SectionHeader: React.FC<FieldSectionHeaderProps>;
  SectionFooter: React.FC<FieldSectionFooterProps>;
};
FieldGroup.Section = FieldSection;
FieldGroup.SectionHeader = Header;
FieldGroup.SectionFooter = Footer;

export { FieldGroup };
export * from './types';
