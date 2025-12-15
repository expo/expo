import Contacts
import ExpoModulesCore

struct ContactDateMapper: PropertyMapper {
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

extension ContactDateNext {
  func toNSDateComponents() throws -> NSDateComponents {
    let dateComponents = NSDateComponents()
    if let year = self.year {
      dateComponents.year = year
    }
    dateComponents.month = month
    dateComponents.day = day
    return dateComponents
  }
  
  func toDateComponent() throws -> DateComponents {
    var dateComponents = DateComponents()
    if let year = self.year {
      dateComponents.year = year
    }
    dateComponents.month = month
    dateComponents.day = day
    return dateComponents
  }
}

