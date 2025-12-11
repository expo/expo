import Contacts

// The purpose of this structure is to bind a contact key to its data type to ensure type safety in PropertyFactory.
struct ContactProperty<Value> {
  let key: String
}

extension ContactProperty {
  static var givenName: ContactProperty<String> {
    return ContactProperty<String>(key: CNContactGivenNameKey)
  }

  static var middleName: ContactProperty<String> {
    return ContactProperty<String>(key: CNContactMiddleNameKey)
  }

  static var familyName: ContactProperty<String> {
    return ContactProperty<String>(key: CNContactFamilyNameKey)
  }

  static var nickname: ContactProperty<String> {
    return ContactProperty<String>(key: CNContactNicknameKey)
  }

  static var previousFamilyName: ContactProperty<String> {
    return ContactProperty<String>(key: CNContactPreviousFamilyNameKey)
  }

  static var namePrefix: ContactProperty<String> {
    return ContactProperty<String>(key: CNContactNamePrefixKey)
  }

  static var nameSuffix: ContactProperty<String> {
    return ContactProperty<String>(key: CNContactNameSuffixKey)
  }

  static var organizationName: ContactProperty<String> {
    return ContactProperty<String>(key: CNContactOrganizationNameKey)
  }

  static var departmentName: ContactProperty<String> {
    return ContactProperty<String>(key: CNContactDepartmentNameKey)
  }

  static var jobTitle: ContactProperty<String> {
    return ContactProperty<String>(key: CNContactJobTitleKey)
  }

  static var note: ContactProperty<String> {
    return ContactProperty<String>(key: CNContactNoteKey)
  }

  static var phoneticGivenName: ContactProperty<String> {
    return ContactProperty<String>(key: CNContactPhoneticGivenNameKey)
  }

  static var phoneticMiddleName: ContactProperty<String> {
    return ContactProperty<String>(key: CNContactPhoneticMiddleNameKey)
  }

  static var phoneticFamilyName: ContactProperty<String> {
    return ContactProperty<String>(key: CNContactPhoneticFamilyNameKey)
  }

  static var phoneticOrganizationName: ContactProperty<String> {
    return ContactProperty<String>(key: CNContactPhoneticOrganizationNameKey)
  }

  static var birthday: ContactProperty<DateComponents?> {
    return ContactProperty<DateComponents?>(key: CNContactBirthdayKey)
  }

  static var nonGregorianBirthday: ContactProperty<DateComponents?> {
    return ContactProperty<DateComponents?>(key: CNContactNonGregorianBirthdayKey)
  }

  static var imageData: ContactProperty<Data?> {
    return ContactProperty<Data?>(key: CNContactImageDataKey)
  }

  static var thumbnailImageData: ContactProperty<Data?> {
    return ContactProperty<Data?>(key: CNContactThumbnailImageDataKey)
  }

  static var emailAddresses: ContactProperty<NSString> {
    return ContactProperty<NSString>(key: CNContactEmailAddressesKey)
  }

  static var phoneNumbers: ContactProperty<CNPhoneNumber> {
    return ContactProperty<CNPhoneNumber>(key: CNContactPhoneNumbersKey)
  }

  static var postalAddresses: ContactProperty<CNPostalAddress> {
    return ContactProperty<CNPostalAddress>(key: CNContactPostalAddressesKey)
  }

  static var urlAddresses: ContactProperty<NSString> {
    return ContactProperty<NSString>(key: CNContactUrlAddressesKey)
  }

  static var relations: ContactProperty<CNContactRelation> {
    return ContactProperty<CNContactRelation>(key: CNContactRelationsKey)
  }

  static var dates: ContactProperty<NSDateComponents> {
    return ContactProperty<NSDateComponents>(key: CNContactDatesKey)
  }

  static var instantMessageAddresses: ContactProperty<CNInstantMessageAddress> {
    return ContactProperty<CNInstantMessageAddress>(key: CNContactInstantMessageAddressesKey)
  }

  static var socialProfiles: ContactProperty<CNSocialProfile> {
    return ContactProperty<CNSocialProfile>(key: CNContactSocialProfilesKey)
  }
}
