import { ContactDetails } from './Contact.types';
export declare enum ContactField {
    IS_FAVOURITE = "isFavourite",
    FULL_NAME = "fullName",
    GIVEN_NAME = "givenName",
    MIDDLE_NAME = "middleName",
    FAMILY_NAME = "familyName",
    MAIDEN_NAME = "maidenName",
    NICKNAME = "nickname",
    PREFIX = "prefix",
    SUFFIX = "suffix",
    PHONETIC_GIVEN_NAME = "phoneticGivenName",
    PHONETIC_MIDDLE_NAME = "phoneticMiddleName",
    PHONETIC_FAMILY_NAME = "phoneticFamilyName",
    COMPANY = "company",
    DEPARTMENT = "department",
    JOB_TITLE = "jobTitle",
    NOTE = "note",
    IMAGE = "image",
    BIRTHDAY = "birthday",
    NON_GREGORIAN_BIRTHDAY = "nonGregorianBirthday",
    EMAILS = "emails",
    PHONES = "phones",
    ADDRESSES = "addresses",
    EXTRA_NAMES = "extraNames",
    DATES = "dates",
    RELATIONS = "relations",
    URL_ADDRESSES = "urlAddresses",
    SOCIAL_PROFILES = "socialProfiles",
    IM_ADDRESSES = "imAddresses"
}
export declare enum ContactsSortOrder {
    UserDefault = "userDefault",
    GivenName = "givenName",
    FamilyName = "familyName",
    None = "none"
}
export type ContactQueryOptions = {
    limit?: number;
    offset?: number;
    sortOrder?: ContactsSortOrder;
    name?: string;
    rawContacts?: boolean;
};
export type FormOptions = {
    displayedPropertyKeys?: ContactField[];
    message?: string;
    alternateName?: string;
    allowsEditing?: boolean;
    allowsActions?: boolean;
    shouldShowLinkedContacts?: boolean;
    isNew?: boolean;
    cancelButtonTitle?: string;
    preventAnimation?: boolean;
    groupId?: string;
};
export type ContactFieldKey = {
    [ContactField.IS_FAVOURITE]: 'isFavourite';
    [ContactField.FULL_NAME]: 'fullName';
    [ContactField.GIVEN_NAME]: 'givenName';
    [ContactField.MIDDLE_NAME]: 'middleName';
    [ContactField.FAMILY_NAME]: 'familyName';
    [ContactField.MAIDEN_NAME]: 'maidenName';
    [ContactField.NICKNAME]: 'nickname';
    [ContactField.PREFIX]: 'prefix';
    [ContactField.SUFFIX]: 'suffix';
    [ContactField.PHONETIC_GIVEN_NAME]: 'phoneticGivenName';
    [ContactField.PHONETIC_MIDDLE_NAME]: 'phoneticMiddleName';
    [ContactField.PHONETIC_FAMILY_NAME]: 'phoneticFamilyName';
    [ContactField.COMPANY]: 'company';
    [ContactField.DEPARTMENT]: 'department';
    [ContactField.JOB_TITLE]: 'jobTitle';
    [ContactField.NOTE]: 'note';
    [ContactField.IMAGE]: 'image';
    [ContactField.BIRTHDAY]: 'birthday';
    [ContactField.NON_GREGORIAN_BIRTHDAY]: 'nonGregorianBirthday';
    [ContactField.EMAILS]: 'emails';
    [ContactField.PHONES]: 'phones';
    [ContactField.ADDRESSES]: 'addresses';
    [ContactField.DATES]: 'dates';
    [ContactField.EXTRA_NAMES]: 'extraNames';
    [ContactField.RELATIONS]: 'relations';
    [ContactField.URL_ADDRESSES]: 'urlAddresses';
    [ContactField.SOCIAL_PROFILES]: 'socialProfiles';
    [ContactField.IM_ADDRESSES]: 'imAddresses';
};
export type PartialContactDetails<T extends readonly ContactField[]> = {
    id: string;
} & {
    [K in T[number]]: ContactDetails[K];
};
//# sourceMappingURL=Contact.props.d.ts.map