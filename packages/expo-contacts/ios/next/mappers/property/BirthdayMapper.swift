import Contacts
import ExpoModulesCore

struct BirthdayMapper: PropertyMapper {
  typealias TDto = ContactDateNext?

  var descriptor: CNKeyDescriptor { CNContactBirthdayKey as CNKeyDescriptor }

  func extract(from contact: CNContact) throws -> ContactDateNext? {
    return toDto(value: contact.birthday)
  }

  func apply(_ value: ContactDateNext?, to contact: CNMutableContact) throws {
    contact.birthday = try toDomain(value: value)
  }

  private func toDomain(value: ContactDateNext?) throws -> DateComponents? {
    guard let value = value else {
      return nil
    }
    return try value.toDateComponent()
  }

  private func toDto(value: DateComponents?) -> ContactDateNext? {
    guard let value = value else {
      return nil
    }
    guard let month = value.month, let day = value.day else {
      return nil
    }
    return ContactDateNext(
      year: value.year,
      month: month,
      day: day
    )
  }
}
