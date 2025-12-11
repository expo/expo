import Contacts

class PropertyManager<Mapper: PropertyMapper> {
  private let contactId: String
  private let contactRepository: ContactRepository
  private let mapper: Mapper
  private let isReadOnly: Bool

  init(
    contactId: String,
    contactRepository: ContactRepository,
    mapper: Mapper,
    isReadOnly: Bool = false
  ) {
    self.contactId = contactId
    self.contactRepository = contactRepository
    self.mapper = mapper
    self.isReadOnly = isReadOnly
  }
  
  func get() throws -> Mapper.TDto {
    let contact = try contactRepository.getMutableById(id: contactId, keysToFetch: [mapper.descriptor])
    return try mapper.extract(from: contact)
  }
  
  func set(_ value: Mapper.TDto) throws {
    guard !isReadOnly else {
      throw FailedToSetReadOnlyProperty()
    }
    let contact = try contactRepository.getMutableById(id: contactId, keysToFetch: [mapper.descriptor])
    try mapper.apply(value, to: contact)
    try contactRepository.update(contact: contact)
  }
}
