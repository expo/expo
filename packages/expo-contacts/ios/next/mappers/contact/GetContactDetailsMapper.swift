import Contacts
import Foundation

class GetContactDetailsMapper {
  private let imageService: ImageService

  init(imageService: ImageService) {
    self.imageService = imageService
  }

  func map(contact: CNContact) throws -> GetContactDetailsRecord {
    return GetContactDetailsRecord(
      id: contact.identifier,
      fullName: resolveFullName(for: contact),
      givenName: mapOptionalString(for: contact, key: CNContactGivenNameKey),
      middleName: mapOptionalString(for: contact, key: CNContactMiddleNameKey),
      familyName: mapOptionalString(for: contact, key: CNContactFamilyNameKey),
      maidenName: mapOptionalString(for: contact, key: CNContactPreviousFamilyNameKey),
      nickname: mapOptionalString(for: contact, key: CNContactNicknameKey),
      prefix: mapOptionalString(for: contact, key: CNContactNamePrefixKey),
      suffix: mapOptionalString(for: contact, key: CNContactNameSuffixKey),
      phoneticGivenName: mapOptionalString(for: contact, key: CNContactPhoneticGivenNameKey),
      phoneticMiddleName: mapOptionalString(for: contact, key: CNContactPhoneticMiddleNameKey),
      phoneticFamilyName: mapOptionalString(for: contact, key: CNContactPhoneticFamilyNameKey),
      company: mapOptionalString(for: contact, key: CNContactOrganizationNameKey),
      department: mapOptionalString(for: contact, key: CNContactDepartmentNameKey),
      jobTitle: mapOptionalString(for: contact, key: CNContactJobTitleKey),
      phoneticCompanyName: mapOptionalString(for: contact, key: CNContactPhoneticOrganizationNameKey),
      note: mapOptionalString(for: contact, key: CNContactNoteKey),
      image: try resolveImageUri(for: contact),
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

  private func resolveImageUri(for contact: CNContact) throws -> String? {
    guard contact.isKeyAvailable(CNContactImageDataKey),
          let imageData = contact.imageData else {
      return nil
    }
    let filename = "\(contact.identifier)-\(CNContactImageDataKey).png"
    return try imageService.url(from: imageData, filename: filename)
  }
  
  private func resolveThumbnailUri(for contact: CNContact) throws -> String? {
    guard contact.isKeyAvailable(CNContactImageDataKey),
          let imageData = contact.imageData else {
      return nil
    }
    let filename = "\(contact.identifier)-\(CNContactImageDataKey).png"
    return try imageService.url(from: imageData, filename: filename)
  }

  private func resolveFullName(for contact: CNContact) -> String? {
    let keyDescriptor = CNContactFormatter.descriptorForRequiredKeys(for: .fullName)
    if !contact.areKeysAvailable([keyDescriptor]) {
      return nil
    }
    let formatter = CNContactFormatter()
    formatter.style = .fullName
    return formatter.string(from: contact)
  }

  private func mapOptionalString(for contact: CNContact, key: String) -> String? {
    if !contact.isKeyAvailable(key) {
      return nil
    }
    guard let value = contact.value(forKey: key) as? String, !value.isEmpty else {
      return nil
    }
    return value
  }
}
