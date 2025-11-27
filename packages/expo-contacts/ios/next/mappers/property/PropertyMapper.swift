protocol PropertyMapper {
  associatedtype TDomain
  associatedtype TDto
  func toDomain(value: TDto) throws -> TDomain
  func toDto(value: TDomain) throws -> TDto
}
