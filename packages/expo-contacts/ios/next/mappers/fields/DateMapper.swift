import Contacts

struct DateMapper: ContactRecordMapper {
  typealias TExistingRecord = ExistingDateRecord
  typealias TNewRecord = NewDateRecord
  typealias TPatchRecord = PatchDateRecord
  typealias TDomainValue = NSDateComponents

  func newRecordToCNLabeledValue(_ record: NewDateRecord) throws -> CNLabeledValue<NSDateComponents> {
    return try CNLabeledValue(label: record.label, value: record.date.toNSDateComponents())
  }
  
  func existingRecordToCNLabeledValue(_ record: ExistingDateRecord) throws -> CNLabeledValue<NSDateComponents> {
    return try CNLabeledValue(label: record.label, value: record.date.toNSDateComponents())
  }
  
  func cnLabeledValueToExistingRecord(_ labeledValue: CNLabeledValue<NSDateComponents>) -> ExistingDateRecord {
    let dateComponents = labeledValue.value as NSDateComponents
    return ExistingDateRecord(
      id: labeledValue.identifier,
      date: ContactDateNext(
        year: dateComponents.year,
        month: dateComponents.month,
        day: dateComponents.day
      ),
      label: labeledValue.label ?? ""
    )
  }
  
  func apply(patch: PatchDateRecord, to cnLabeledValue: CNLabeledValue<NSDateComponents>) throws -> CNLabeledValue<NSDateComponents> {
    var toModify = cnLabeledValue
    if case .value(let label) = patch.label {
      toModify = toModify.settingLabel(label)
    }
    if case .value(let date) = patch.date {
      let newValue = try date?.toNSDateComponents() ?? NSDateComponents()
      toModify = toModify.settingValue(newValue)
    }
    return toModify
  }
}
