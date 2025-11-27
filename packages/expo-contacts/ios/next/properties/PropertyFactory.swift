import Contacts
import ExpoModulesCore

final class PropertyFactory {
  private let contactId: String
  private let contactRepository: ContactRepository
  
  init(contactId: String, contactRepository: ContactRepository) {
    self.contactId = contactId
    self.contactRepository = contactRepository
  }
  
  func make<Mapper: PropertyMapper>(
    _ property: ContactProperty<Mapper.TDomain>,
    mapper: Mapper,
    isReadOnly: Bool = false
  ) -> PropertyManager<Mapper.TDomain, Mapper.TDto> {
    return PropertyManager(
      contactId: contactId,
      key: property.key,
      contactRepository: contactRepository,
      mapper: mapper,
      isReadOnly: isReadOnly
    )
  }
    
  func makeList<Mapper: ContactRecordMapper>(
    _ field: ContactProperty<Mapper.TDomainValue>,
    mapper: Mapper
  ) -> ListPropertyManager<Mapper.TExistingRecord, Mapper.TNewRecord, Mapper.TDomainValue> {
    return ListPropertyManager(
      contactId: contactId,
      key: field.key,
      mapper: mapper,
      contactRepository: contactRepository
    )
  }
}
