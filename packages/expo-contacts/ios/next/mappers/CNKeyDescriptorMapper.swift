import Contacts
import ExpoModulesCore

class CNKeyDescriptorMapper{
  static func map(from fields: [ContactField]) -> [CNKeyDescriptor] {
    fields.compactMap { field in
      switch(field) {
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
      case .EXTRA_NAMES,
          .IS_FAVOURITE:
        return nil
      }
    }
  }
  
  static func map(from patchRecord: PatchContactRecord) -> [CNKeyDescriptor] {
    var keys: [CNKeyDescriptor] = []
    
    if case .value = patchRecord.givenName { keys.append(CNContactGivenNameKey as CNKeyDescriptor) }
    if case .value = patchRecord.middleName { keys.append(CNContactMiddleNameKey as CNKeyDescriptor) }
    if case .value = patchRecord.familyName { keys.append(CNContactFamilyNameKey as CNKeyDescriptor) }
    if case .value = patchRecord.maidenName { keys.append(CNContactPreviousFamilyNameKey as CNKeyDescriptor) }
    if case .value = patchRecord.nickname { keys.append(CNContactNicknameKey as CNKeyDescriptor) }
    if case .value = patchRecord.prefix { keys.append(CNContactNamePrefixKey as CNKeyDescriptor) }
    if case .value = patchRecord.suffix { keys.append(CNContactNameSuffixKey as CNKeyDescriptor) }
    if case .value = patchRecord.company { keys.append(CNContactOrganizationNameKey as CNKeyDescriptor) }
    if case .value = patchRecord.phoneticGivenName { keys.append(CNContactPhoneticGivenNameKey as CNKeyDescriptor) }
    if case .value = patchRecord.phoneticMiddleName { keys.append(CNContactPhoneticMiddleNameKey as CNKeyDescriptor) }
    if case .value = patchRecord.phoneticFamilyName { keys.append(CNContactPhoneticFamilyNameKey as CNKeyDescriptor) }
    if case .value = patchRecord.department { keys.append(CNContactDepartmentNameKey as CNKeyDescriptor) }
    if case .value = patchRecord.jobTitle { keys.append(CNContactJobTitleKey as CNKeyDescriptor) }
    if case .value = patchRecord.phoneticCompanyName { keys.append(CNContactPhoneticOrganizationNameKey as CNKeyDescriptor) }
    if case .value = patchRecord.note { keys.append(CNContactNoteKey as CNKeyDescriptor) }
    if case .value = patchRecord.image { keys.append(CNContactNoteKey as CNKeyDescriptor) }
    if case .value = patchRecord.emails { keys.append(CNContactEmailAddressesKey as CNKeyDescriptor) }
    if case .value = patchRecord.phones { keys.append(CNContactPhoneNumbersKey as CNKeyDescriptor) }
    if case .value = patchRecord.dates { keys.append(CNContactDatesKey as CNKeyDescriptor) }
    if case .value = patchRecord.addresses { keys.append(CNContactPostalAddressesKey as CNKeyDescriptor) }
    if case .value = patchRecord.relations { keys.append(CNContactRelationsKey as CNKeyDescriptor) }
    if case .value = patchRecord.urlAddresses { keys.append(CNContactUrlAddressesKey as CNKeyDescriptor) }
    if case .value = patchRecord.imAddresses { keys.append(CNContactInstantMessageAddressesKey as CNKeyDescriptor) }
    if case .value = patchRecord.socialProfiles { keys.append(CNContactSocialProfilesKey as CNKeyDescriptor) }

    return keys
  }
}
