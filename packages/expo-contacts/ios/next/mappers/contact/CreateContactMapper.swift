import Contacts
import Foundation

class CreateContactMapper {
  private let imageService: ImageService

  init(imageService: ImageService) {
    self.imageService = imageService
  }

  func toCNMutableContact(_ record: CreateContactRecord) throws -> CNMutableContact {
    let contact = CNMutableContact()
    contact.givenName = record.givenName ?? ""
    contact.middleName = record.middleName ?? ""
    contact.familyName = record.familyName ?? ""
    contact.previousFamilyName = record.maidenName ?? ""
    contact.nickname = record.nickname ?? ""
    contact.namePrefix = record.prefix ?? ""
    contact.nameSuffix = record.suffix ?? ""
    contact.phoneticGivenName = record.phoneticGivenName ?? ""
    contact.phoneticMiddleName = record.phoneticMiddleName ?? ""
    contact.phoneticFamilyName = record.phoneticFamilyName ?? ""
    contact.organizationName = record.company ?? ""
    contact.jobTitle = record.jobTitle ?? ""
    contact.departmentName = record.department ?? ""
    contact.phoneticOrganizationName = record.phoneticOrganizationName ?? ""
    contact.note = record.note ?? ""

    if let imageUri = record.image {
      contact.imageData = try imageService.imageData(from: imageUri)
    }

    if let emails = record.emails {
      contact.emailAddresses = emails.map { EmailMapper().newRecordToCNLabeledValue($0) }
    }

    if let dates = record.dates {
      contact.dates = dates.map { DateMapper().newRecordToCNLabeledValue($0) }
    }

    if let phones = record.phones {
      contact.phoneNumbers = phones.map { PhoneMapper().newRecordToCNLabeledValue($0) }
    }

    if let addresses = record.addresses {
      contact.postalAddresses = addresses.map { PostalAddressMapper().newRecordToCNLabeledValue($0) }
    }

    if let relations = record.relations {
      contact.contactRelations = relations.map { RelationMapper().newRecordToCNLabeledValue($0) }
    }

    if let urlAddresses = record.urlAddresses {
      contact.urlAddresses = urlAddresses.map { UrlAddressMapper().newRecordToCNLabeledValue($0) }
    }

    if let imAddresses = record.imAddresses {
      contact.instantMessageAddresses = imAddresses.map { ImAddressMapper().newRecordToCNLabeledValue($0) }
    }

    if let socialProfiles = record.socialProfiles {
      contact.socialProfiles = socialProfiles.map { SocialProfileMapper().newRecordToCNLabeledValue($0) }
    }

    return contact
  }
}
