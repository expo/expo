import Contacts
import ExpoModulesCore

class CNKeyDescriptorMapper {
  static func map(from fields: [ContactField]) -> [CNKeyDescriptor] {
    // swiftlint:disable:next closure_body_length
    fields.compactMap { field in
      switch field {
      case .FULL_NAME:
        return CNContactFormatter.descriptorForRequiredKeys(for: .fullName)
      case .GIVEN_NAME:
        return CNContactGivenNameKey as CNKeyDescriptor
      case .MIDDLE_NAME:
        return CNContactMiddleNameKey as CNKeyDescriptor
      case .FAMILY_NAME:
        return CNContactFamilyNameKey as CNKeyDescriptor
      case .PREFIX:
        return CNContactNamePrefixKey as CNKeyDescriptor
      case .SUFFIX:
        return CNContactNameSuffixKey as CNKeyDescriptor
      case .PHONETIC_GIVEN_NAME:
        return CNContactPhoneticGivenNameKey as CNKeyDescriptor
      case .PHONETIC_MIDDLE_NAME:
        return CNContactPhoneticMiddleNameKey as CNKeyDescriptor
      case .PHONETIC_FAMILY_NAME:
        return CNContactPhoneticFamilyNameKey as CNKeyDescriptor
      case .NICKNAME:
        return CNContactNicknameKey as CNKeyDescriptor
      case .MAIDEN_NAME:
        return CNContactPreviousFamilyNameKey as CNKeyDescriptor
      case .COMPANY:
        return CNContactOrganizationNameKey as CNKeyDescriptor
      case .DEPARTMENT:
        return CNContactDepartmentNameKey as CNKeyDescriptor
      case .JOB_TITLE:
        return CNContactJobTitleKey as CNKeyDescriptor
      case .PHONETIC_COMPANY_NAME:
        return CNContactPhoneticOrganizationNameKey as CNKeyDescriptor
      case .IMAGE:
        return CNContactImageDataKey as CNKeyDescriptor
      case .THUMBNAIL:
        return CNContactThumbnailImageDataKey as CNKeyDescriptor
      case .NOTE:
        return CNContactNoteKey as CNKeyDescriptor
      case .EMAILS:
        return CNContactEmailAddressesKey as CNKeyDescriptor
      case .PHONES:
        return CNContactPhoneNumbersKey as CNKeyDescriptor
      case .ADDRESSES:
        return CNContactPostalAddressesKey as CNKeyDescriptor
      case .DATES:
        return CNContactDatesKey as CNKeyDescriptor
      case .RELATIONS:
        return CNContactRelationsKey as CNKeyDescriptor
      case .URL_ADDRESSES:
        return CNContactUrlAddressesKey as CNKeyDescriptor
      case .BIRTHDAY:
        return CNContactBirthdayKey as CNKeyDescriptor
      case .NON_GREGORIAN_BIRTHDAY:
        return CNContactNonGregorianBirthdayKey as CNKeyDescriptor
      case .IM_ADDRESSES:
        return CNContactInstantMessageAddressesKey as CNKeyDescriptor
      case .SOCIAL_PROFILES:
        return CNContactSocialProfilesKey as CNKeyDescriptor
      case .EXTRA_NAMES, .IS_FAVOURITE:
        return nil
      }
    }
  }

  static func map(from patchRecord: PatchContactRecord) -> [CNKeyDescriptor] {
    var keys: [CNKeyDescriptor] = []

    appendKey(ifPresent: patchRecord.givenName, key: CNContactGivenNameKey, to: &keys)
    appendKey(ifPresent: patchRecord.middleName, key: CNContactMiddleNameKey, to: &keys)
    appendKey(ifPresent: patchRecord.familyName, key: CNContactFamilyNameKey, to: &keys)
    appendKey(ifPresent: patchRecord.maidenName, key: CNContactPreviousFamilyNameKey, to: &keys)
    appendKey(ifPresent: patchRecord.nickname, key: CNContactNicknameKey, to: &keys)
    appendKey(ifPresent: patchRecord.prefix, key: CNContactNamePrefixKey, to: &keys)
    appendKey(ifPresent: patchRecord.suffix, key: CNContactNameSuffixKey, to: &keys)
    appendKey(ifPresent: patchRecord.company, key: CNContactOrganizationNameKey, to: &keys)
    appendKey(ifPresent: patchRecord.department, key: CNContactDepartmentNameKey, to: &keys)
    appendKey(ifPresent: patchRecord.jobTitle, key: CNContactJobTitleKey, to: &keys)
    appendKey(ifPresent: patchRecord.phoneticGivenName, key: CNContactPhoneticGivenNameKey, to: &keys)
    appendKey(ifPresent: patchRecord.phoneticMiddleName, key: CNContactPhoneticMiddleNameKey, to: &keys)
    appendKey(ifPresent: patchRecord.phoneticFamilyName, key: CNContactPhoneticFamilyNameKey, to: &keys)
    appendKey(ifPresent: patchRecord.phoneticCompanyName, key: CNContactPhoneticOrganizationNameKey, to: &keys)
    appendKey(ifPresent: patchRecord.note, key: CNContactNoteKey, to: &keys)
    appendKey(ifPresent: patchRecord.image, key: CNContactImageDataKey, to: &keys)
    appendKey(ifPresent: patchRecord.emails, key: CNContactEmailAddressesKey, to: &keys)
    appendKey(ifPresent: patchRecord.phones, key: CNContactPhoneNumbersKey, to: &keys)
    appendKey(ifPresent: patchRecord.dates, key: CNContactDatesKey, to: &keys)
    appendKey(ifPresent: patchRecord.addresses, key: CNContactPostalAddressesKey, to: &keys)
    appendKey(ifPresent: patchRecord.relations, key: CNContactRelationsKey, to: &keys)
    appendKey(ifPresent: patchRecord.urlAddresses, key: CNContactUrlAddressesKey, to: &keys)
    appendKey(ifPresent: patchRecord.imAddresses, key: CNContactInstantMessageAddressesKey, to: &keys)
    appendKey(ifPresent: patchRecord.socialProfiles, key: CNContactSocialProfilesKey, to: &keys)

    return keys
  }

  static func appendKey<T>(ifPresent value: ValueOrUndefined<T>, key: String, to array: inout [CNKeyDescriptor]) {
    if case .value = value {
      array.append(key as CNKeyDescriptor)
    }
  }
}
