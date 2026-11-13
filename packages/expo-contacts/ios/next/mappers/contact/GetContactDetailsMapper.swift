import Contacts
import Foundation
import ExpoModulesCore

class GetContactDetailsMapper {
  private let imageService: ImageService

  init(imageService: ImageService) {
    self.imageService = imageService
  }

  func map(contact: CNContact, fields: [ContactField]? = nil) throws -> GetContactDetailsRecord {
    let imageMapper = ImageMapper(service: imageService, filename: "\(contact.identifier)-image.png")
    let thumbnailMapper = ThumbnailMapper(service: imageService, filename: "\(contact.identifier)-thumb.png")
    let isRequested = { (field: ContactField) in fields?.contains(field) != false }

    return GetContactDetailsRecord(
      id: contact.identifier,
      fullName: isRequested(.FULL_NAME) && contact.areKeysAvailable([CNContactFormatter.descriptorForRequiredKeys(for: .fullName)])
        ? FullNameExtractor.extract(from: contact)
        : nil,
      givenName: isRequested(.GIVEN_NAME) && contact.isKeyAvailable(CNContactGivenNameKey)
        ? try StringMapper(descriptor: CNContactGivenNameKey, keyPath: \.givenName).extract(from: contact)
        : nil,
      middleName: isRequested(.MIDDLE_NAME) && contact.isKeyAvailable(CNContactMiddleNameKey)
        ? try StringMapper(descriptor: CNContactMiddleNameKey, keyPath: \.middleName).extract(from: contact)
        : nil,
      familyName: isRequested(.FAMILY_NAME) && contact.isKeyAvailable(CNContactFamilyNameKey)
        ? try StringMapper(descriptor: CNContactFamilyNameKey, keyPath: \.familyName).extract(from: contact)
        : nil,
      maidenName: isRequested(.MAIDEN_NAME) && contact.isKeyAvailable(CNContactPreviousFamilyNameKey)
        ? try StringMapper(descriptor: CNContactPreviousFamilyNameKey, keyPath: \.previousFamilyName).extract(from: contact)
        : nil,
      nickname: isRequested(.NICKNAME) && contact.isKeyAvailable(CNContactNicknameKey)
        ? try StringMapper(descriptor: CNContactNicknameKey, keyPath: \.nickname).extract(from: contact)
        : nil,
      prefix: isRequested(.PREFIX) && contact.isKeyAvailable(CNContactNamePrefixKey)
        ? try StringMapper(descriptor: CNContactNamePrefixKey, keyPath: \.namePrefix).extract(from: contact)
        : nil,
      suffix: isRequested(.SUFFIX) && contact.isKeyAvailable(CNContactNameSuffixKey)
        ? try StringMapper(descriptor: CNContactNameSuffixKey, keyPath: \.nameSuffix).extract(from: contact)
        : nil,
      phoneticGivenName: isRequested(.PHONETIC_GIVEN_NAME) && contact.isKeyAvailable(CNContactPhoneticGivenNameKey)
        ? try StringMapper(descriptor: CNContactPhoneticGivenNameKey, keyPath: \.phoneticGivenName).extract(from: contact)
        : nil,
      phoneticMiddleName: isRequested(.PHONETIC_MIDDLE_NAME) && contact.isKeyAvailable(CNContactPhoneticMiddleNameKey)
        ? try StringMapper(descriptor: CNContactPhoneticMiddleNameKey, keyPath: \.phoneticMiddleName).extract(from: contact)
        : nil,
      phoneticFamilyName: isRequested(.PHONETIC_FAMILY_NAME) && contact.isKeyAvailable(CNContactPhoneticFamilyNameKey)
        ? try StringMapper(descriptor: CNContactPhoneticFamilyNameKey, keyPath: \.phoneticFamilyName).extract(from: contact)
        : nil,
      company: isRequested(.COMPANY) && contact.isKeyAvailable(CNContactOrganizationNameKey)
        ? try StringMapper(descriptor: CNContactOrganizationNameKey, keyPath: \.organizationName).extract(from: contact)
        : nil,
      department: isRequested(.DEPARTMENT) && contact.isKeyAvailable(CNContactDepartmentNameKey)
        ? try StringMapper(descriptor: CNContactDepartmentNameKey, keyPath: \.departmentName).extract(from: contact)
        : nil,
      jobTitle: isRequested(.JOB_TITLE) && contact.isKeyAvailable(CNContactJobTitleKey)
        ? try StringMapper(descriptor: CNContactJobTitleKey, keyPath: \.jobTitle).extract(from: contact)
        : nil,
      phoneticCompanyName: isRequested(.PHONETIC_COMPANY_NAME) && contact.isKeyAvailable(CNContactPhoneticOrganizationNameKey)
        ? try StringMapper(descriptor: CNContactPhoneticOrganizationNameKey, keyPath: \.phoneticOrganizationName).extract(from: contact)
        : nil,
      note: isRequested(.NOTE) && contact.isKeyAvailable(CNContactNoteKey)
        ? try StringMapper(descriptor: CNContactNoteKey, keyPath: \.note).extract(from: contact)
        : nil,
      image: isRequested(.IMAGE) && contact.isKeyAvailable(CNContactImageDataKey)
        ? try imageMapper.extract(from: contact)
        : nil,
      thumbnail: isRequested(.THUMBNAIL) && contact.isKeyAvailable(CNContactThumbnailImageDataKey)
        ? try thumbnailMapper.extract(from: contact)
        : nil,
      birthday: isRequested(.BIRTHDAY) && contact.isKeyAvailable(CNContactBirthdayKey)
        ? try BirthdayMapper().extract(from: contact)
        : nil,
      nonGregorianBirthday: isRequested(.NON_GREGORIAN_BIRTHDAY) && contact.isKeyAvailable(CNContactNonGregorianBirthdayKey)
        ? try NonGregorianBirthdayMapper().extract(from: contact)
        : nil,
      emails: isRequested(.EMAILS) && contact.isKeyAvailable(CNContactEmailAddressesKey)
        ? contact.emailAddresses.map { EmailMapper().cnLabeledValueToExistingRecord($0) }
        : nil,
      dates: isRequested(.DATES) && contact.isKeyAvailable(CNContactDatesKey)
        ? contact.dates.map { DateMapper().cnLabeledValueToExistingRecord($0) }
        : nil,
      phones: isRequested(.PHONES) && contact.isKeyAvailable(CNContactPhoneNumbersKey)
        ? contact.phoneNumbers.map { PhoneMapper().cnLabeledValueToExistingRecord($0) }
        : nil,
      addresses: isRequested(.ADDRESSES) && contact.isKeyAvailable(CNContactPostalAddressesKey)
        ? contact.postalAddresses.map { PostalAddressMapper().cnLabeledValueToExistingRecord($0) }
        : nil,
      relations: isRequested(.RELATIONS) && contact.isKeyAvailable(CNContactRelationsKey)
        ? contact.contactRelations.map { RelationMapper().cnLabeledValueToExistingRecord($0) }
        : nil,
      urlAddresses: isRequested(.URL_ADDRESSES) && contact.isKeyAvailable(CNContactUrlAddressesKey)
        ? contact.urlAddresses.map { UrlAddressMapper().cnLabeledValueToExistingRecord($0) }
        : nil,
      imAddresses: isRequested(.IM_ADDRESSES) && contact.isKeyAvailable(CNContactInstantMessageAddressesKey)
        ? contact.instantMessageAddresses.map { ImAddressMapper().cnLabeledValueToExistingRecord($0) }
        : nil,
      socialProfiles: isRequested(.SOCIAL_PROFILES) && contact.isKeyAvailable(CNContactSocialProfilesKey)
        ? contact.socialProfiles.map { SocialProfileMapper().cnLabeledValueToExistingRecord($0) }
        : nil
    )
  }
}
