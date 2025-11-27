import Contacts
import Foundation
import ExpoModulesCore

class GetContactDetailsMapper {
  private let imageService: ImageService

  init(imageService: ImageService) {
    self.imageService = imageService
  }

  func map(contact: CNContact) throws -> GetContactDetailsRecord {
    return GetContactDetailsRecord(
      id: contact.identifier,
      fullName: contact.areKeysAvailable([CNContactFormatter.descriptorForRequiredKeys(for: .fullName)])
        ? FullNameExtractor.extract(from: contact)
        : nil,
      
      givenName: contact.isKeyAvailable(CNContactGivenNameKey)
        ? StringMapper().toDto(value: contact.value(forKey: CNContactGivenNameKey) as! String)
        : nil,
        
      middleName: contact.isKeyAvailable(CNContactMiddleNameKey)
        ? StringMapper().toDto(value: contact.value(forKey: CNContactMiddleNameKey) as! String)
        : nil,
        
      familyName: contact.isKeyAvailable(CNContactFamilyNameKey)
        ? StringMapper().toDto(value: contact.value(forKey: CNContactFamilyNameKey) as! String)
        : nil,
        
      maidenName: contact.isKeyAvailable(CNContactPreviousFamilyNameKey)
        ? StringMapper().toDto(value: contact.value(forKey: CNContactPreviousFamilyNameKey) as! String)
        : nil,
        
      nickname: contact.isKeyAvailable(CNContactNicknameKey)
        ? StringMapper().toDto(value: contact.value(forKey: CNContactNicknameKey) as! String)
        : nil,
        
      prefix: contact.isKeyAvailable(CNContactNamePrefixKey)
        ? StringMapper().toDto(value: contact.value(forKey: CNContactNamePrefixKey) as! String)
        : nil,
        
      suffix: contact.isKeyAvailable(CNContactNameSuffixKey)
        ? StringMapper().toDto(value: contact.value(forKey: CNContactNameSuffixKey) as! String)
        : nil,
        
      phoneticGivenName: contact.isKeyAvailable(CNContactPhoneticGivenNameKey)
        ? StringMapper().toDto(value: contact.value(forKey: CNContactPhoneticGivenNameKey) as! String)
        : nil,
        
      phoneticMiddleName: contact.isKeyAvailable(CNContactPhoneticMiddleNameKey)
        ? StringMapper().toDto(value: contact.value(forKey: CNContactPhoneticMiddleNameKey) as! String)
        : nil,
        
      phoneticFamilyName: contact.isKeyAvailable(CNContactPhoneticFamilyNameKey)
        ? StringMapper().toDto(value: contact.value(forKey: CNContactPhoneticFamilyNameKey) as! String)
        : nil,
        
      company: contact.isKeyAvailable(CNContactOrganizationNameKey)
        ? StringMapper().toDto(value: contact.value(forKey: CNContactOrganizationNameKey) as! String)
        : nil,
        
      department: contact.isKeyAvailable(CNContactDepartmentNameKey)
        ? StringMapper().toDto(value: contact.value(forKey: CNContactDepartmentNameKey) as! String)
        : nil,
        
      jobTitle: contact.isKeyAvailable(CNContactJobTitleKey)
        ? StringMapper().toDto(value: contact.value(forKey: CNContactJobTitleKey) as! String)
        : nil,
        
      phoneticCompanyName: contact.isKeyAvailable(CNContactPhoneticOrganizationNameKey)
        ? StringMapper().toDto(value: contact.value(forKey: CNContactPhoneticOrganizationNameKey) as! String)
        : nil,
        
      note: contact.isKeyAvailable(CNContactNoteKey)
        ? StringMapper().toDto(value: contact.value(forKey: CNContactNoteKey) as! String)
        : nil,
        
      image: contact.isKeyAvailable(CNContactImageDataKey)
        ? try ImageMapper(
            service: imageService,
            filename: "\(contact.identifier)-\(CNContactImageDataKey).png"
          ).toDto(value: contact.value(forKey: CNContactImageDataKey) as? Data)
        : nil,
        
      thumbnail: contact.isKeyAvailable(CNContactThumbnailImageDataKey)
        ? try ImageMapper(
            service: imageService,
            filename: "\(contact.identifier)-\(CNContactThumbnailImageDataKey).png"
          ).toDto(value: contact.value(forKey: CNContactThumbnailImageDataKey) as? Data)
        : nil,
        
      birthday: contact.isKeyAvailable(CNContactBirthdayKey)
        ? ContactDateMapper().toDto(value: contact.value(forKey: CNContactBirthdayKey) as? DateComponents)
        : nil,
        
      nonGregorianBirthday: contact.isKeyAvailable(CNContactNonGregorianBirthdayKey)
        ? NonGregorianBirthdayMapper().toDto(value: contact.value(forKey: CNContactNonGregorianBirthdayKey) as? DateComponents)
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
