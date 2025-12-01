package expo.modules.contacts.next.records.fields

import expo.modules.kotlin.types.Enumerable

enum class ContactField(val key: String) : Enumerable {
  IS_FAVOURITE("isFavourite"),
  FULL_NAME("fullName"),
  GIVEN_NAME("givenName"),
  MIDDLE_NAME("middleName"),
  FAMILY_NAME("familyName"),
  PREFIX("prefix"),
  SUFFIX("suffix"),
  PHONETIC_GIVEN_NAME("phoneticGivenName"),
  PHONETIC_MIDDLE_NAME("phoneticMiddleName"),
  PHONETIC_FAMILY_NAME("phoneticFamilyName"),
  COMPANY("company"),
  DEPARTMENT("department"),
  JOB_TITLE("jobTitle"),
  PHONETIC_COMPANY_NAME("phoneticCompanyName"),
  NOTE("note"),
  IMAGE("image"),
  THUMBNAIL("thumbnail"),
  EMAILS("emails"),
  PHONES("phones"),
  ADDRESSES("addresses"),
  DATES("dates"),
  RELATIONS("relations"),
  URL_ADDRESSES("urlAddresses"),
  EXTRA_NAMES("extraNames"),
  // iOS only:
  MAIDEN_NAME("maidenName"),
  NICKNAME("nickname"),
  IM_ADDRESS("imAddresses"),
  SOCIAL_PROFILES("socialProfiles")
}
