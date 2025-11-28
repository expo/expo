import { ContactField, PartialContactDetails } from './ContactProps.type';
export declare namespace Email {
    type Existing = {
        id: string;
        label?: string;
        address?: string;
    };
    type New = {
        label?: string;
        address?: string;
    };
}
export declare namespace Phone {
    type Existing = {
        id: string;
        label?: string;
        number?: string;
    };
    type New = {
        label?: string;
        number?: string;
    };
}
export declare namespace Date {
    type Existing = {
        id: string;
        label?: string;
        date?: ContactDate;
    };
    type New = {
        label?: string;
        date?: ContactDate;
    };
}
export declare namespace ExtraName {
    type Existing = {
        id: string;
        label?: string;
        name?: string;
    };
    type New = {
        label?: string;
        name?: string;
    };
}
export declare namespace PostalAddress {
    type Existing = {
        id: string;
        label?: string;
        street?: string;
        city?: string;
        region?: string;
        postcode?: string;
        country?: string;
    };
    type New = {
        label?: string;
        street?: string;
        city?: string;
        region?: string;
        postcode?: string;
        country?: string;
    };
}
export declare namespace Relationship {
    type Existing = {
        id: string;
        label?: string;
        name?: string;
    };
    type New = {
        label?: string;
        name?: string;
    };
}
export declare namespace UrlAddress {
    type Existing = {
        id: string;
        label?: string;
        url?: string;
    };
    type New = {
        label?: string;
        url?: string;
    };
}
export type ContactDate = {
    year?: string;
    month: string;
    day: string;
};
export type ContactPatch = {
    givenName?: string | null;
    middleName?: string | null;
    familyName?: string | null;
    prefix?: string | null;
    suffix?: string | null;
    phoneticGivenName?: string | null;
    phoneticMiddleName?: string | null;
    phoneticFamilyName?: string | null;
    company?: string | null;
    department?: string | null;
    jobTitle?: string | null;
    phoneticOrganizationName?: string | null;
    note?: string | null;
    emails?: (Email.Existing | Email.New)[] | null;
    phones?: (Phone.Existing | Phone.New)[] | null;
    dates?: (Date.Existing | Date.New)[] | null;
    extraNames?: (ExtraName.Existing | ExtraName.New)[] | null;
    postalAddresses?: (PostalAddress.Existing | PostalAddress.New)[] | null;
    relationships?: (Relationship.Existing | Relationship.New)[] | null;
    urlAddresses?: (UrlAddress.Existing | UrlAddress.New)[] | null;
};
export declare class Contact {
    id: string;
    delete(): Promise<void>;
    patch(contact: ContactPatch): Promise<void>;
    getDetails(fields?: ContactField[]): Promise<PartialContactDetails<ContactField[]>>;
    addEmail(email: Email.New): Promise<string>;
    getEmails(): Promise<Email.Existing[]>;
    deleteEmail(email: Email.Existing | string): Promise<void>;
    updateEmail(updatedEmail: Email.Existing): Promise<void>;
    addPhone(phone: Phone.New): Promise<string>;
    getPhones(): Promise<Phone.Existing[]>;
    deletePhone(phone: Phone.Existing): Promise<void>;
    updatePhone(updatedPhone: Phone.Existing): Promise<void>;
    addDate(date: Date.New): Promise<string>;
    getDates(): Promise<Date.Existing[]>;
    deleteDate(date: Date.Existing | string): Promise<void>;
    updateDate(updatedDate: Date.Existing): Promise<void>;
    addExtraName(extraName: ExtraName.New): Promise<string>;
    getExtraNames(): Promise<ExtraName.Existing[]>;
    deleteExtraName(extraName: ExtraName.Existing | string): Promise<void>;
    updateExtraName(updatedExtraName: ExtraName.Existing): Promise<void>;
    addPostalAddress(postalAddress: PostalAddress.New): Promise<string>;
    getPostalAddresses(): Promise<PostalAddress.Existing[]>;
    deletePostalAddress(postalAddress: PostalAddress.Existing | string): Promise<void>;
    updatePostalAddress(updatedPostalAddress: PostalAddress.Existing): Promise<void>;
    addRelationship(relationship: Relationship.New): Promise<string>;
    getRelationships(): Promise<Relationship.Existing[]>;
    deleteRelationship(relationship: Relationship.Existing | string): Promise<void>;
    updateRelationship(updatedRelationship: Relationship.Existing): Promise<void>;
    addUrlAddress(urlAddress: UrlAddress.New): Promise<string>;
    getUrlAddresses(): Promise<UrlAddress.Existing[]>;
    deleteUrlAddress(urlAddress: UrlAddress.Existing | string): Promise<void>;
    updateUrlAddress(updatedUrlAddress: UrlAddress.Existing): Promise<void>;
    editWithForm(): Promise<boolean>;
    share(subject: string): Promise<boolean>;
    getGivenName(): Promise<string | null>;
    setGivenName(givenName: string | null): Promise<boolean>;
    getFamilyName(): Promise<string | null>;
    setFamilyName(familyName: string | null): Promise<boolean>;
    getMiddleName(): Promise<string | null>;
    setMiddleName(middleName: string | null): Promise<boolean>;
    getPrefix(): Promise<string | null>;
    setPrefix(prefix: string | null): Promise<boolean>;
    getSuffix(): Promise<string | null>;
    setSuffix(suffix: string | null): Promise<boolean>;
    getDisplayName(): Promise<string | null>;
    setDisplayName(displayName: string | null): Promise<boolean>;
    getPhoneticGivenName(): Promise<string | null>;
    setPhoneticGivenName(phoneticGivenName: string | null): Promise<boolean>;
    getPhoneticMiddleName(): Promise<string | null>;
    setPhoneticMiddleName(phoneticMiddleName: string | null): Promise<boolean>;
    getPhoneticFamilyName(): Promise<string | null>;
    setPhoneticFamilyName(phoneticFamilyName: string | null): Promise<boolean>;
    getCompany(): Promise<string | null>;
    setCompany(company: string | null): Promise<boolean>;
    getDepartment(): Promise<string | null>;
    setDepartment(department: string | null): Promise<boolean>;
    getJobTitle(): Promise<string | null>;
    setJobTitle(jobTitle: string | null): Promise<boolean>;
    getPhoneticOrganizationName(): Promise<string | null>;
    setPhoneticOrganizationName(phoneticName: string | null): Promise<boolean>;
    setPhoneticOrganizationName(phoneticName: string | null): Promise<boolean>;
    getNote(): Promise<string | null>;
    setNote(note: string | null): Promise<boolean>;
}
//# sourceMappingURL=Contact.type.d.ts.map