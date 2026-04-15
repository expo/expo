import { FieldGroup as FieldGroupBase } from './FieldGroup';
import { FieldSection } from './FieldSection';
import { Header, Footer } from './FieldSectionSlots';

const FieldGroup = FieldGroupBase as typeof FieldGroupBase & {
  Section: typeof FieldSection;
  SectionHeader: typeof Header;
  SectionFooter: typeof Footer;
};
FieldGroup.Section = FieldSection;
FieldGroup.SectionHeader = Header;
FieldGroup.SectionFooter = Footer;

export { FieldGroup };
export * from './types';
