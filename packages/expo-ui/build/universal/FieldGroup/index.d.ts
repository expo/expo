import { FieldGroup as FieldGroupBase } from './FieldGroup';
import { FieldSection } from './FieldSection';
import { Header, Footer } from './FieldSectionSlots';
declare const FieldGroup: typeof FieldGroupBase & {
    Section: typeof FieldSection;
    SectionHeader: typeof Header;
    SectionFooter: typeof Footer;
};
export { FieldGroup };
export * from './types';
//# sourceMappingURL=index.d.ts.map