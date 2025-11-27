import Contacts
import ExpoModulesCore

class ContactPatcher {
  static func apply(patches patchRecord: PatchContactRecord, to contact: CNMutableContact) throws -> CNMutableContact {
    
    var mutableContact = contact
    
    applyPropertyPatch(patchRecord.givenName, on: &mutableContact, to: \.givenName)
    applyPropertyPatch(patchRecord.middleName, on: &mutableContact, to: \.middleName)
    applyPropertyPatch(patchRecord.familyName, on: &mutableContact, to: \.familyName)
    applyPropertyPatch(patchRecord.maidenName, on: &mutableContact, to: \.previousFamilyName)
    applyPropertyPatch(patchRecord.nickname, on: &mutableContact, to: \.nickname)
    applyPropertyPatch(patchRecord.prefix, on: &mutableContact, to: \.namePrefix)
    applyPropertyPatch(patchRecord.suffix, on: &mutableContact, to: \.nameSuffix)
    applyPropertyPatch(patchRecord.company, on: &mutableContact, to: \.organizationName)
    
    applyPropertyPatch(patchRecord.phoneticGivenName, on: &mutableContact, to: \.phoneticGivenName)
    applyPropertyPatch(patchRecord.phoneticMiddleName, on: &mutableContact, to: \.phoneticMiddleName)
    applyPropertyPatch(patchRecord.phoneticFamilyName, on: &mutableContact, to: \.phoneticFamilyName)
    applyPropertyPatch(patchRecord.department, on: &mutableContact, to: \.departmentName)
    applyPropertyPatch(patchRecord.jobTitle, on: &mutableContact, to: \.jobTitle)
    applyPropertyPatch(patchRecord.phoneticCompanyName, on: &mutableContact, to: \.phoneticOrganizationName)
    applyPropertyPatch(patchRecord.note, on: &mutableContact, to: \.note)
    
    try patchList(
      patches: patchRecord.emails,
      keyPath: \.emailAddresses,
      mapper: EmailMapper(),
      on: &mutableContact
    )
    
    try patchList(
      patches: patchRecord.phones,
      keyPath: \.phoneNumbers,
      mapper: PhoneMapper(),
      on: &mutableContact
    )
    
    try patchList(
      patches: patchRecord.dates,
      keyPath: \.dates,
      mapper: DateMapper(),
      on: &mutableContact
    )
    
    try patchList(
      patches: patchRecord.addresses,
      keyPath: \.postalAddresses,
      mapper: PostalAddressMapper(),
      on: &mutableContact
    )
    
    try patchList(
      patches: patchRecord.relations,
      keyPath: \.contactRelations,
      mapper: RelationMapper(),
      on: &mutableContact
    )
    
    try patchList(
      patches: patchRecord.urlAddresses,
      keyPath: \.urlAddresses,
      mapper: UrlAddressMapper(),
      on: &mutableContact
    )
    
    return mutableContact
  }
  
  private static func patchList<Mapper: ContactRecordMapper>(
    patches: ValueOrUndefined<[Either<Mapper.TPatchRecord, Mapper.TNewRecord>]?>,
    keyPath: WritableKeyPath<CNMutableContact, [CNLabeledValue<Mapper.TDomainValue>]>,
    mapper: Mapper,
    on contact: inout CNMutableContact
  ) throws {
    guard case .value(let list) = patches else {
      return
    }
    
    if list == nil {
      contact[keyPath: keyPath] = []
      return
    }
    
    if let list = list {
      let (patchRecords, newRecords) = try splitPatchAndNewRecords(list)
      let newItems = newRecords.map { mapper.newRecordToCNLabeledValue($0) }
      
      let existingItems = contact[keyPath: keyPath]
      let modifiedItems = applyPatches(to: existingItems, with: patchRecords, mapper: mapper)
      
      contact[keyPath: keyPath] = modifiedItems + newItems
    }
  }
  
  private static func splitPatchAndNewRecords<Patch: Record, New: Record>(
    _ records: [Either<Patch, New>]
  ) throws -> (patches: [Patch], new: [New]) {
    
    return try records.reduce(into: (patches: [Patch](), new: [New]())) { result, entry in
      if (entry.`is`(Patch.self)) {
        let patch = try entry.`as`(Patch.self)
        result.patches.append(patch)
      } else {
        let newRecord = try entry.`as`(New.self)
        result.new.append(newRecord)
      }
    }
  }
  
  private static func applyPatches<Mapper: ContactRecordMapper>(
    to existing: [CNLabeledValue<Mapper.TDomainValue>],
    with patches: [Mapper.TPatchRecord],
    mapper: Mapper
  ) -> [CNLabeledValue<Mapper.TDomainValue>] {
    
    let patchRecordsById = Dictionary(uniqueKeysWithValues: patches.map { ($0.id, $0) })
    
    let modified = existing.map { (item) in
      var itemToModify = item
      if let patchForItem = patchRecordsById[item.identifier] {
        itemToModify = mapper.apply(patch: patchForItem, to: item)
      }
      return itemToModify
    }
    
    return modified
  }

  private static func applyPropertyPatch(
    _ patchValue: ValueOrUndefined<String?>,
    on contact: inout CNMutableContact,
    to keyPath: WritableKeyPath<CNMutableContact, String>
  ) {
    
    if case .value(let value) = patchValue {
      contact[keyPath: keyPath] = value ?? ""
    }
  }
  
  private static func applyPropertyPatch(
    _ patchValue: ValueOrUndefined<String?>,
    on contact: inout CNMutableContact,
    to keyPath: WritableKeyPath<CNMutableContact, String?>
  ) {
    
    if case .value(let value) = patchValue {
      contact[keyPath: keyPath] = value
    }
  }
}
