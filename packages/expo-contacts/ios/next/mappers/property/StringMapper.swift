struct StringMapper: PropertyMapper {
  typealias TDto = String?
  typealias TDomain = String
  
  func toDomain(value: String?) -> String {
    return value ?? ""
  }
  
  func toDto(value: String) -> String? {
    guard !value.isEmpty else {
      return nil
    }
    return value
  }
}
