import ExpoModulesCore

func getDetailsFormat(formatter: ExpoModulesCore.Formatter<GetContactDetailsRecord>, fields: [ContactField]?) {
  formatter.property("fullName", keyPath: \.fullName)
    .skip { _, _ in fields?.contains(.FULL_NAME) == false }

  formatter.property("givenName", keyPath: \.givenName)
    .skip { _, _ in fields?.contains(.GIVEN_NAME) == false }

  formatter.property("middleName", keyPath: \.middleName)
    .skip { _, _ in fields?.contains(.MIDDLE_NAME) == false }

  formatter.property("familyName", keyPath: \.familyName)
    .skip { _, _ in fields?.contains(.FAMILY_NAME) == false }

  formatter.property("maidenName", keyPath: \.maidenName)
    .skip { _, _ in fields?.contains(.MAIDEN_NAME) == false }

  formatter.property("nickname", keyPath: \.nickname)
    .skip { _, _ in fields?.contains(.NICKNAME) == false }

  formatter.property("prefix", keyPath: \.prefix)
    .skip { _, _ in fields?.contains(.PREFIX) == false }

  formatter.property("suffix", keyPath: \.suffix)
    .skip { _, _ in fields?.contains(.SUFFIX) == false }

  formatter.property("phoneticGivenName", keyPath: \.phoneticGivenName)
    .skip { _, _ in fields?.contains(.PHONETIC_GIVEN_NAME) == false }

  formatter.property("phoneticMiddleName", keyPath: \.phoneticMiddleName)
    .skip { _, _ in fields?.contains(.PHONETIC_MIDDLE_NAME) == false }

  formatter.property("phoneticFamilyName", keyPath: \.phoneticFamilyName)
    .skip { _, _ in fields?.contains(.PHONETIC_FAMILY_NAME) == false }

  formatter.property("company", keyPath: \.company)
    .skip { _, _ in fields?.contains(.COMPANY) == false }

  formatter.property("department", keyPath: \.department)
    .skip { _, _ in fields?.contains(.DEPARTMENT) == false }

  formatter.property("jobTitle", keyPath: \.jobTitle)
    .skip { _, _ in fields?.contains(.JOB_TITLE) == false }

  formatter.property("phoneticCompanyName", keyPath: \.phoneticCompanyName)
    .skip { _, _ in fields?.contains(.PHONETIC_COMPANY_NAME) == false }

  formatter.property("note", keyPath: \.note)
    .skip { _, _ in fields?.contains(.NOTE) == false }

  formatter.property("image", keyPath: \.image)
    .skip { _, _ in fields?.contains(.IMAGE) == false }

  formatter.property("thumbnail", keyPath: \.thumbnail)
    .skip { _, _ in fields?.contains(.THUMBNAIL) == false }

  formatter.property("birthday", keyPath: \.birthday)
    .skip { _, _ in fields?.contains(.BIRTHDAY) == false }

  formatter.property("nonGregorianBirthday", keyPath: \.nonGregorianBirthday)
    .skip { _, _ in fields?.contains(.NON_GREGORIAN_BIRTHDAY) == false }

  formatter.property("emails", keyPath: \.emails)
    .skip { _, _ in fields?.contains(.EMAILS) == false }

  formatter.property("dates", keyPath: \.dates)
    .skip { _, _ in fields?.contains(.DATES) == false }

  formatter.property("phones", keyPath: \.phones)
    .skip { _, _ in fields?.contains(.PHONES) == false }

  formatter.property("addresses", keyPath: \.addresses)
    .skip { _, _ in fields?.contains(.ADDRESSES) == false }

  formatter.property("relations", keyPath: \.relations)
    .skip { _, _ in fields?.contains(.RELATIONS) == false }

  formatter.property("urlAddresses", keyPath: \.urlAddresses)
    .skip { _, _ in fields?.contains(.URL_ADDRESSES) == false }

  formatter.property("imAddresses", keyPath: \.imAddresses)
    .skip { _, _ in fields?.contains(.IM_ADDRESSES) == false }

  formatter.property("socialProfiles", keyPath: \.socialProfiles)
    .skip { _, _ in fields?.contains(.SOCIAL_PROFILES) == false }
}
