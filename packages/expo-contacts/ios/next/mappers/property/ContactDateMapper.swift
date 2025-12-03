struct ContactDateMapper: PropertyMapper {
  typealias TDomain = DateComponents?
  typealias TDto = ContactDateNext?
  
  func toDomain(value: ContactDateNext?) -> DateComponents? {
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
  
  func toDto(value: DateComponents?) -> ContactDateNext? {
    guard let value = value else {
      return nil
    }
    guard let month = value.month, let day = value.day else {
      return nil
    }
    return ContactDateNext(
      year: value.year.map { String($0) },
      month: String(month),
      day: String(day)
    )
  }
}
