import Contacts

struct ContactDateMapper: PropertyMapper {
  typealias TDto = ContactDateNext?
    
  var descriptor: CNKeyDescriptor { CNContactBirthdayKey as CNKeyDescriptor }

  func extract(from contact: CNContact) throws -> ContactDateNext? {
    return toDto(value: contact.birthday)
  }

  func apply(_ value: ContactDateNext?, to contact: CNMutableContact) throws {
    contact.birthday = toDomain(value: value)
  }
  
  private func toDomain(value: ContactDateNext?) -> DateComponents? {
    guard let value = value else {
      return nil
    }
    
    var dateComponents = DateComponents()
    if let year = value.year {
      dateComponents.year = Int(year)
    }
    dateComponents.month = Int(value.month)
    dateComponents.day = Int(value.day)
    return dateComponents
  }
  
  private func toDto(value: DateComponents?) -> ContactDateNext? {
    guard let value = value else {
      return nil
    }
    guard let month = value.month, let day = value.day else {
      return nil
    }
    return ContactDateNext(
      year: value.year.map { String($0) },
      month: String(format: "%02d", month),
      day: String(format: "%02d", day)
    )
  }
}
