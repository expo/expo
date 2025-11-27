import Contacts
import ExpoModulesCore

class ContactPatcher {
  private let imageMapper: ImageMapper
  
  init (imageMapper: ImageMapper) {
    self.imageMapper = imageMapper
  }
  
  func apply(
    patch: PatchContactRecord,
    to contact: inout CNMutableContact
  ) throws {
    try apply(patch: patch.givenName, to: &contact, at: \.givenName, mapper: StringMapper())
    try apply(patch: patch.middleName, to: &contact, at: \.middleName, mapper: StringMapper())
    try apply(patch: patch.familyName, to: &contact, at: \.familyName, mapper: StringMapper())
    try apply(patch: patch.maidenName, to: &contact, at: \.previousFamilyName, mapper: StringMapper())
    try apply(patch: patch.nickname, to: &contact, at: \.nickname, mapper: StringMapper())
    try apply(patch: patch.prefix, to: &contact, at: \.namePrefix, mapper: StringMapper())
    try apply(patch: patch.suffix, to: &contact, at: \.nameSuffix, mapper: StringMapper())
    try apply(patch: patch.company, to: &contact, at: \.organizationName, mapper: StringMapper())
    try apply(patch: patch.jobTitle, to: &contact, at: \.jobTitle, mapper: StringMapper())
    try apply(patch: patch.department, to: &contact, at: \.departmentName, mapper: StringMapper())
    try apply(patch: patch.phoneticGivenName, to: &contact, at: \.phoneticGivenName, mapper: StringMapper())
    try apply(patch: patch.phoneticMiddleName, to: &contact, at: \.phoneticMiddleName, mapper: StringMapper())
    try apply(patch: patch.phoneticFamilyName, to: &contact, at: \.phoneticFamilyName, mapper: StringMapper())
    try apply(patch: patch.phoneticCompanyName, to: &contact, at: \.phoneticOrganizationName, mapper: StringMapper())
    try apply(patch: patch.note, to: &contact, at: \.note, mapper: StringMapper())
    try apply(patch: patch.birthday, to: &contact, at: \.birthday, mapper: ContactDateMapper())
    try apply(patch: patch.nonGregorianBirthday, to: &contact, at: \.nonGregorianBirthday, mapper: NonGregorianBirthdayMapper())
    try apply(patch: patch.image, to: &contact, at: \.imageData, mapper: imageMapper)
    try apply(patches: patch.emails, keyPath: \.emailAddresses, mapper: EmailMapper(), on: &contact)
    try apply(patches: patch.phones, keyPath: \.phoneNumbers, mapper: PhoneMapper(), on: &contact)
    try apply(patches: patch.dates, keyPath: \.dates, mapper: DateMapper(), on: &contact)
    try apply(patches: patch.addresses, keyPath: \.postalAddresses, mapper: PostalAddressMapper(), on: &contact)
    try apply(patches: patch.relations, keyPath: \.contactRelations, mapper: RelationMapper(), on: &contact)
    try apply(patches: patch.urlAddresses, keyPath: \.urlAddresses, mapper: UrlAddressMapper(), on: &contact)
    try apply(patches: patch.socialProfiles, keyPath: \.socialProfiles, mapper: SocialProfileMapper(), on: &contact)
    try apply(patches: patch.imAddresses, keyPath: \.instantMessageAddresses, mapper: ImAddressMapper(), on: &contact)
  }
  
  private func apply<Mapper: PropertyMapper>(
    patch: ValueOrUndefined<Mapper.TDto>,
    to contact: inout CNMutableContact,
    at keyPath: WritableKeyPath<CNMutableContact, Mapper.TDomain>,
    mapper: Mapper
  ) throws {
    if case .value(let value) = patch {
      contact[keyPath: keyPath] = try mapper.toDomain(value: value)
    }
  }
  
  private func apply<Mapper: ContactRecordMapper>(
    patches: ValueOrUndefined<[Either<Mapper.TPatchRecord, Mapper.TNewRecord>]?>,
    keyPath: WritableKeyPath<CNMutableContact, [CNLabeledValue<Mapper.TDomainValue>]>,
    mapper: Mapper,
    on contact: inout CNMutableContact
  ) throws {
    guard case .value(let list) = patches else {
      return
    }
    
    guard let list = list else {
      contact[keyPath: keyPath] = []
      return
    }
    
    let (patchRecords, newRecords) = try splitPatchAndNewRecords(list)
    let newItems = newRecords.map { mapper.newRecordToCNLabeledValue($0) }
    
    let existingItems = contact[keyPath: keyPath]
    let modifiedItems = applyPatches(to: existingItems, with: patchRecords, mapper: mapper)
    
    contact[keyPath: keyPath] = modifiedItems + newItems
  }
  
  private func splitPatchAndNewRecords<Patch: Record, New: Record>(
    _ records: [Either<Patch, New>]
  ) throws -> (patches: [Patch], new: [New]) {
    return try records.reduce(into: (patches: [Patch](), new: [New]())) { result, entry in
      if entry.`is`(Patch.self) {
        let patch = try entry.`as`(Patch.self)
        result.patches.append(patch)
      } else {
        let newRecord = try entry.`as`(New.self)
        result.new.append(newRecord)
      }
    }
  }
  
  private func applyPatches<Mapper: ContactRecordMapper>(
    to existing: [CNLabeledValue<Mapper.TDomainValue>],
    with patches: [Mapper.TPatchRecord],
    mapper: Mapper
  ) -> [CNLabeledValue<Mapper.TDomainValue>] {
    let patchRecordsById = Dictionary(uniqueKeysWithValues: patches.map { ($0.id, $0) })
    
    return existing.compactMap { item in
      guard let patchForItem = patchRecordsById[item.identifier] else {
        return nil
      }
      return mapper.apply(patch: patchForItem, to: item)
    }
  }
}
