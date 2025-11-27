import Contacts

class PropertyManager<TDomain, TDto> {
  private let contactId: String
  private let key: CNKeyDescriptor
  private let keyString: String
  private let contactRepository: ContactRepository
  private let toDto: (TDomain) throws -> TDto
  private let toDomain: (TDto) throws -> TDomain
  private let isReadOnly: Bool

  init<Mapper: PropertyMapper>(
    contactId: String,
    key: String,
    contactRepository: ContactRepository,
    mapper: Mapper,
    isReadOnly: Bool = false
  ) where Mapper.TDomain == TDomain,
        Mapper.TDto == TDto
  {
    self.contactId = contactId
    self.key = key as CNKeyDescriptor
    self.keyString = key
    self.contactRepository = contactRepository
    self.toDomain = mapper.toDomain
    self.toDto = mapper.toDto
    self.isReadOnly = isReadOnly
  }
  
  func get() throws -> TDto {
    let contact = try contactRepository.getMutableById(id: contactId, keysToFetch: [key])
    let value = contact.value(forKey: keyString) as! TDomain
    return try toDto(value)
  }
  
  func set(_ value: TDto) throws {
    guard !isReadOnly else {
      throw FailedToSetReadOnlyProperty()
    }
    let contact = try contactRepository.getMutableById(id: contactId, keysToFetch: [key])
    let domainValue = try toDomain(value)
    contact.setValue(domainValue, forKey: keyString)
    try contactRepository.update(contact: contact)
  }
}
