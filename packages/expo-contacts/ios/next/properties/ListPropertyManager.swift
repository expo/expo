import Contacts

class ListPropertyManager<
  TExistingRecord: ExistingRecord,
  TNewRecord,
  TDomainValue: NSCopying & NSSecureCoding
> {
  let contactId: String
  let key: CNKeyDescriptor
  let keyString: String
  let contactRepository: ContactRepository
  
  let newRecordToCNLabeledValue: (TNewRecord) -> CNLabeledValue<TDomainValue>
  let existingRecordToCNLabeledValue: (TExistingRecord) -> CNLabeledValue<TDomainValue>
  let cnLabeledValueToExistingRecord: (CNLabeledValue<TDomainValue>) -> TExistingRecord
  
  init<Mapper: ContactRecordMapper>(
    contactId: String,
    key: String,
    mapper: Mapper,
    contactRepository: ContactRepository
  ) where Mapper.TExistingRecord == TExistingRecord,
        Mapper.TNewRecord == TNewRecord,
        Mapper.TDomainValue == TDomainValue
  {
    self.contactId = contactId
    self.key = key as CNKeyDescriptor
    self.keyString = key
    self.newRecordToCNLabeledValue = mapper.newRecordToCNLabeledValue
    self.existingRecordToCNLabeledValue = mapper.existingRecordToCNLabeledValue
    self.cnLabeledValueToExistingRecord = mapper.cnLabeledValueToExistingRecord
    self.contactRepository = contactRepository
  }
  
  func get() async throws -> [TExistingRecord] {
    guard let contact = contactRepository.getById(id: contactId, keysToFetch: [key]) else {
      throw ContactNotFoundException(contactId)
    }
    guard let labeledValues = contact.value(forKey: keyString) as? [CNLabeledValue<TDomainValue>] else {
      throw FailedToGetContactField(keyString)
    }
    return labeledValues.map(cnLabeledValueToExistingRecord)
  }
  
  func add(_ record: TNewRecord) async throws -> String {
    let newLabeledValue = newRecordToCNLabeledValue(record)
    try await modifyContactField { currentList in
      return (currentList ?? []) + [newLabeledValue]
    }
    return newLabeledValue.identifier
  }
  
  func update(_ existingRecord: TExistingRecord) async throws -> Bool {
    try await modifyContactField { currentList in
      guard let list = currentList else {
        throw FailedToGetContactField(keyString)
      }
      return try createUpdatedList(from: list, with: existingRecord)
    }
    return true
  }
  
  func delete(_ existingRecord: TExistingRecord) async throws -> Bool {
    try await modifyContactField { currentList in
      guard let list = currentList else {
        throw FailedToGetContactField(keyString)
      }
      return try createFilteredList(from: list, byRemoving: existingRecord)
    }
    return true
  }
  
  private func modifyContactField(
    using transform: ([CNLabeledValue<TDomainValue>]?) throws -> [CNLabeledValue<TDomainValue>]
  ) async throws {
    let contact = try contactRepository.getMutableById(id: contactId, keysToFetch: [key])
    let currentList = contact.value(forKey: keyString) as? [CNLabeledValue<TDomainValue>]
    
    let newList = try transform(currentList)
    
    contact.setValue(newList, forKey: keyString)
    try contactRepository.update(contact: contact)
  }
  
  private func createUpdatedList(
    from currentList: [CNLabeledValue<TDomainValue>],
    with existingRecord: TExistingRecord
  ) throws -> [CNLabeledValue<TDomainValue>] {
    guard let index = currentList.firstIndex(where: { $0.identifier == existingRecord.id }) else {
      throw FailedToGetContactProperty(existingRecord.id)
    }
    
    let newLabeledValue = existingRecordToCNLabeledValue(existingRecord)
    let originalValue = currentList[index]
    
    let updatedValue = originalValue
      .settingValue(newLabeledValue.value)
      .settingLabel(newLabeledValue.label)
  
    var mutableList = currentList
    mutableList[index] = updatedValue
    return mutableList
  }
  
  private func createFilteredList(
    from currentList: [CNLabeledValue<TDomainValue>],
    byRemoving existingRecord: TExistingRecord
  ) throws -> [CNLabeledValue<TDomainValue>] {
    let itemExists = currentList.contains(where: { $0.identifier == existingRecord.id })
    guard itemExists else {
      throw FailedToGetContactProperty(existingRecord.id)
    }
    return currentList.filter { $0.identifier != existingRecord.id }
  }
}
