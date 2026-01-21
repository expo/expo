import Contacts
import Foundation
import ExpoModulesCore

class GetContactDetailsMapper {
  private let imageService: ImageService

  init(imageService: ImageService) {
    self.imageService = imageService
  }

  func map(contact: CNContact) throws -> GetContactDetailsRecord {
    let imageMapper = ImageMapper(service: imageService, filename: "\(contact.identifier)-image.png")
    let thumbnailMapper = ImageMapper(service: imageService, filename: "\(contact.identifier)-thumb.png")

    return GetContactDetailsRecord(
      id: contact.identifier,
      fullName: contact.areKeysAvailable([CNContactFormatter.descriptorForRequiredKeys(for: .fullName)])
        ? FullNameExtractor.extract(from: contact)
        : nil,
      givenName: contact.isKeyAvailable(CNContactGivenNameKey)
        ? try StringMapper(descriptor: CNContactGivenNameKey, keyPath: \.givenName).extract(from: contact)
        : nil,
      middleName: contact.isKeyAvailable(CNContactMiddleNameKey)
        ? try StringMapper(descriptor: CNContactMiddleNameKey, keyPath: \.middleName).extract(from: contact)
        : nil,
      familyName: contact.isKeyAvailable(CNContactFamilyNameKey)
        ? try StringMapper(descriptor: CNContactFamilyNameKey, keyPath: \.familyName).extract(from: contact)
        : nil,
      maidenName: contact.isKeyAvailable(CNContactPreviousFamilyNameKey)
        ? try StringMapper(descriptor: CNContactPreviousFamilyNameKey, keyPath: \.previousFamilyName).extract(from: contact)
        : nil,
      nickname: contact.isKeyAvailable(CNContactNicknameKey)
        ? try StringMapper(descriptor: CNContactNicknameKey, keyPath: \.nickname).extract(from: contact)
        : nil,
      prefix: contact.isKeyAvailable(CNContactNamePrefixKey)
        ? try StringMapper(descriptor: CNContactNamePrefixKey, keyPath: \.namePrefix).extract(from: contact)
        : nil,
      suffix: contact.isKeyAvailable(CNContactNameSuffixKey)
        ? try StringMapper(descriptor: CNContactNameSuffixKey, keyPath: \.nameSuffix).extract(from: contact)
        : nil,
      phoneticGivenName: contact.isKeyAvailable(CNContactPhoneticGivenNameKey)
        ? try StringMapper(descriptor: CNContactPhoneticGivenNameKey, keyPath: \.phoneticGivenName).extract(from: contact)
        : nil,
      phoneticMiddleName: contact.isKeyAvailable(CNContactPhoneticMiddleNameKey)
        ? try StringMapper(descriptor: CNContactPhoneticMiddleNameKey, keyPath: \.phoneticMiddleName).extract(from: contact)
        : nil,
      phoneticFamilyName: contact.isKeyAvailable(CNContactPhoneticFamilyNameKey)
        ? try StringMapper(descriptor: CNContactPhoneticFamilyNameKey, keyPath: \.phoneticFamilyName).extract(from: contact)
        : nil,
      company: contact.isKeyAvailable(CNContactOrganizationNameKey)
        ? try StringMapper(descriptor: CNContactOrganizationNameKey, keyPath: \.organizationName).extract(from: contact)
        : nil,
      department: contact.isKeyAvailable(CNContactDepartmentNameKey)
        ? try StringMapper(descriptor: CNContactDepartmentNameKey, keyPath: \.departmentName).extract(from: contact)
        : nil,
      jobTitle: contact.isKeyAvailable(CNContactJobTitleKey)
        ? try StringMapper(descriptor: CNContactJobTitleKey, keyPath: \.jobTitle).extract(from: contact)
        : nil,
      phoneticCompanyName: contact.isKeyAvailable(CNContactPhoneticOrganizationNameKey)
        ? try StringMapper(descriptor: CNContactPhoneticOrganizationNameKey, keyPath: \.phoneticOrganizationName).extract(from: contact)
        : nil,
      note: contact.isKeyAvailable(CNContactNoteKey)
        ? try StringMapper(descriptor: CNContactNoteKey, keyPath: \.note).extract(from: contact)
        : nil,
      image: contact.isKeyAvailable(CNContactImageDataKey)
        ? try imageMapper.extract(from: contact)
        : nil,
      thumbnail: contact.isKeyAvailable(CNContactThumbnailImageDataKey)
        ? try thumbnailMapper.extract(from: contact)
        : nil,
      birthday: contact.isKeyAvailable(CNContactBirthdayKey)
        ? try BirthdayMapper().extract(from: contact)
        : nil,
      nonGregorianBirthday: contact.isKeyAvailable(CNContactNonGregorianBirthdayKey)
        ? try NonGregorianBirthdayMapper().extract(from: contact)
        : nil,
      emails: contact.isKeyAvailable(CNContactEmailAddressesKey)
        ? contact.emailAddresses.map { EmailMapper().cnLabeledValueToExistingRecord($0) }
        : nil,
      dates: contact.isKeyAvailable(CNContactDatesKey)
        ? contact.dates.map { DateMapper().cnLabeledValueToExistingRecord($0) }
        : nil,
      phones: contact.isKeyAvailable(CNContactPhoneNumbersKey)
        ? contact.phoneNumbers.map { PhoneMapper().cnLabeledValueToExistingRecord($0) }
        : nil,
      addresses: contact.isKeyAvailable(CNContactPostalAddressesKey)
        ? contact.postalAddresses.map { PostalAddressMapper().cnLabeledValueToExistingRecord($0) }
        : nil,
      relations: contact.isKeyAvailable(CNContactRelationsKey)
        ? contact.contactRelations.map { RelationMapper().cnLabeledValueToExistingRecord($0) }
        : nil,
      urlAddresses: contact.isKeyAvailable(CNContactUrlAddressesKey)
        ? contact.urlAddresses.map { UrlAddressMapper().cnLabeledValueToExistingRecord($0) }
        : nil,
      imAddresses: contact.isKeyAvailable(CNContactInstantMessageAddressesKey)
        ? contact.instantMessageAddresses.map { ImAddressMapper().cnLabeledValueToExistingRecord($0) }
        : nil,
      socialProfiles: contact.isKeyAvailable(CNContactSocialProfilesKey)
        ? contact.socialProfiles.map { SocialProfileMapper().cnLabeledValueToExistingRecord($0) }
        : nil
    )
  }
}
