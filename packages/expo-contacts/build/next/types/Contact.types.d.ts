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
export declare namespace Address {
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
export declare namespace Relation {
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
export declare namespace ImAddress {
    type Existing = {
        id: string;
        label?: string;
        username?: string;
        service?: string;
    };
    type New = {
        label?: string;
        username?: string;
        service?: string;
    };
}
export declare namespace SocialProfile {
    type Existing = {
        id: string;
        label?: string;
        username?: string;
        service?: string;
        url?: string;
        userId?: string;
    };
    type New = {
        label?: string;
        username?: string;
        service?: string;
        url?: string;
        userId?: string;
    };
}
export type ContactDate = {
    year?: string;
    month: string;
    day: string;
};
export declare enum NonGregorianCalendar {
    buddhist = "buddhist",
    chinese = "chinese",
    coptic = "coptic",
    ethiopicAmeteMihret = "ethiopicAmeteMihret",
    ethiopicAmeteAlem = "ethiopicAmeteAlem",
    hebrew = "hebrew",
    indian = "indian",
    islamic = "islamic",
    islamicCivil = "islamicCivil",
    japanese = "japanese",
    persian = "persian",
    republicOfChina = "republicOfChina"
}
export type NonGregorianBirthday = {
    year?: string;
    month: string;
    day: string;
    calendar: NonGregorianCalendar;
};
export type ContactPatch = {
    isFavourite?: boolean | null;
    givenName?: string | null;
    middleName?: string | null;
    familyName?: string | null;
    nickname?: string | null;
    maidenName?: string | null;
    prefix?: string | null;
    suffix?: string | null;
    phoneticGivenName?: string | null;
    phoneticMiddleName?: string | null;
    phoneticFamilyName?: string | null;
    company?: string | null;
    department?: string | null;
    jobTitle?: string | null;
    phoneticCompanyName?: string | null;
    note?: string | null;
    image?: string | null;
    birthday?: ContactDate | null;
    nonGregorianBirthday?: NonGregorianBirthday | null;
    emails?: (Email.Existing | Email.New)[] | null;
    phones?: (Phone.Existing | Phone.New)[] | null;
    dates?: (Date.Existing | Date.New)[] | null;
    extraNames?: (ExtraName.Existing | ExtraName.New)[] | null;
    addresses?: (Address.Existing | Address.New)[] | null;
    relations?: (Relation.Existing | Relation.New)[] | null;
    urlAddresses?: (UrlAddress.Existing | UrlAddress.New)[] | null;
};
export type CreateContactRecord = {
    isFavourite?: boolean;
    givenName?: string;
    middleName?: string;
    familyName?: string;
    maidenName?: string;
    nickname?: string;
    prefix?: string;
    suffix?: string;
    phoneticGivenName?: string;
    phoneticMiddleName?: string;
    phoneticFamilyName?: string;
    company?: string;
    department?: string;
    jobTitle?: string;
    phoneticCompanyName?: string;
    note?: string;
    image?: string;
    birthday?: ContactDate;
    nonGregorianBirthday?: NonGregorianBirthday;
    emails?: Email.New[];
    dates?: Date.New[];
    phones?: Phone.New[];
    addresses?: Address.New[];
    relations?: Relation.New[];
    urlAddresses?: UrlAddress.New[];
    imAddresses?: ImAddress.New[];
    socialProfiles?: SocialProfile.New[];
    extraNames?: ExtraName.New[];
};
export type ContactDetails = {
    isFavourite?: boolean;
    fullName?: string;
    givenName?: string | null;
    middleName?: string;
    familyName?: string;
    maidenName?: string;
    nickname?: string;
    prefix?: string;
    suffix?: string;
    phoneticGivenName?: string;
    phoneticMiddleName?: string;
    phoneticFamilyName?: string;
    company?: string;
    department?: string;
    jobTitle?: string;
    note?: string;
    image?: string;
    birthday?: ContactDate;
    nonGregorianBirthday?: NonGregorianBirthday;
    emails?: Email.Existing[];
    dates?: Date.Existing[];
    phones?: Phone.Existing[];
    extraNames?: ExtraName.Existing[];
    addresses?: Address.Existing[];
    relations?: Relation.Existing[];
    urlAddresses?: UrlAddress.Existing[];
    socialProfiles?: SocialProfile.Existing[];
    imAddresses?: ImAddress.Existing[];
};
//# sourceMappingURL=Contact.types.d.ts.map