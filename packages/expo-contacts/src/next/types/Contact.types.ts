export namespace Email {
  export type Existing = {
    id: string;
    label?: string;
    address?: string;
  };
  export type New = {
    label?: string;
    address?: string;
  };
}

export namespace Phone {
  export type Existing = {
    id: string;
    label?: string;
    number?: string;
  };
  export type New = {
    label?: string;
    number?: string;
  };
}

export namespace Date {
  export type Existing = {
    id: string;
    label?: string;
    date?: ContactDate;
  };
  export type New = {
    label?: string;
    date?: ContactDate;
  };
}

export namespace ExtraName {
  export type Existing = {
    id: string;
    label?: string;
    name?: string;
  };
  export type New = {
    label?: string;
    name?: string;
  };
}

export namespace Address {
  export type Existing = {
    id: string;
    label?: string;
    street?: string;
    city?: string;
    region?: string;
    postcode?: string;
    country?: string;
  };
  export type New = {
    label?: string;
    street?: string;
    city?: string;
    region?: string;
    postcode?: string;
    country?: string;
  };
}

export namespace Relation {
  export type Existing = {
    id: string;
    label?: string;
    name?: string;
  };
  export type New = {
    label?: string;
    name?: string;
  };
}

export namespace UrlAddress {
  export type Existing = {
    id: string;
    label?: string;
    url?: string;
  };
  export type New = {
    label?: string;
    url?: string;
  };
}

export namespace ImAddress {
  export type Existing = {
    id: string;
    label?: string;
    username?: string;
    service?: string;
  };
  export type New = {
    label?: string;
    username?: string;
    service?: string;
  };
}

export namespace SocialProfile {
  export type Existing = {
    id: string;
    label?: string;
    username?: string;
    service?: string;
    url?: string;
    userId?: string;
  };
  export type New = {
    label?: string;
    username?: string;
    service?: string;
    url?: string;
    userId?: string;
  };
}

export type ContactDate = {
  year?: number;
  month: number;
  day: number;
};

export enum NonGregorianCalendar {
  buddhist = 'buddhist',
  chinese = 'chinese',
  coptic = 'coptic',
  ethiopicAmeteMihret = 'ethiopicAmeteMihret',
  ethiopicAmeteAlem = 'ethiopicAmeteAlem',
  hebrew = 'hebrew',
  indian = 'indian',
  islamic = 'islamic',
  islamicCivil = 'islamicCivil',
  japanese = 'japanese',
  persian = 'persian',
  republicOfChina = 'republicOfChina',
}

export type NonGregorianBirthday = {
  year?: number;
  month: number;
  day: number;
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
  emails?: (Email.Existing | Email.New)[];
  phones?: (Phone.Existing | Phone.New)[];
  dates?: (Date.Existing | Date.New)[];
  extraNames?: (ExtraName.Existing | ExtraName.New)[];
  addresses?: (Address.Existing | Address.New)[];
  relations?: (Relation.Existing | Relation.New)[];
  urlAddresses?: (UrlAddress.Existing | UrlAddress.New)[];
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
  isFavourite?: boolean | null;
  fullName?: string | null;
  givenName?: string | null;
  middleName?: string | null;
  familyName?: string | null;
  maidenName?: string | null;
  nickname?: string | null;
  prefix?: string | null;
  suffix?: string | null;
  phoneticGivenName?: string | null;
  phoneticMiddleName?: string | null;
  phoneticFamilyName?: string | null;
  company?: string | null;
  department?: string | null;
  jobTitle?: string | null;
  note?: string | null;
  image?: string | null;
  birthday?: ContactDate | null;
  nonGregorianBirthday?: NonGregorianBirthday | null;
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
