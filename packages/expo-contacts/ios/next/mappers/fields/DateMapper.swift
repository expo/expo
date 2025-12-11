import Contacts

struct DateMapper: ContactRecordMapper {
  typealias TExistingRecord = ExistingDateRecord
  typealias TNewRecord = NewDateRecord
  typealias TPatchRecord = PatchDateRecord
  typealias TDomainValue = NSDateComponents

  func newRecordToCNLabeledValue(_ record: NewDateRecord) -> CNLabeledValue<NSDateComponents> {
    return CNLabeledValue(label: record.label, value: record.date.toNSDateComponents())
  }
  
  func existingRecordToCNLabeledValue(_ record: ExistingDateRecord) -> CNLabeledValue<NSDateComponents> {
    return CNLabeledValue(label: record.label, value: record.date.toNSDateComponents())
  }
  
  func cnLabeledValueToExistingRecord(_ labeledValue: CNLabeledValue<NSDateComponents>) -> ExistingDateRecord {
    let dateComponets = labeledValue.value as NSDateComponents
    return ExistingDateRecord(
      id: labeledValue.identifier,
      date: ContactDateNext(from: dateComponets),
      label: labeledValue.label ?? ""
    )
  }
  
  func apply(patch: PatchDateRecord, to cnLabeledValue: CNLabeledValue<NSDateComponents>) -> CNLabeledValue<NSDateComponents> {
    var toModify = cnLabeledValue
    if case .value(let label) = patch.label {
      toModify = toModify.settingLabel(label)
    }
    if case .value(let date) = patch.date {
      let newValue = date?.toNSDateComponents() ?? NSDateComponents()
      toModify = toModify.settingValue(newValue)
    }
    return toModify
  }
}

private extension ContactDateNext {
  init(from nsDateComponents: NSDateComponents) {
    self.year = String(nsDateComponents.year)
    self.month = String(format: "%02d", nsDateComponents.month)
    self.day = String(format: "%02d", nsDateComponents.day)
  }
  
  func toNSDateComponents() -> NSDateComponents {
    let date = NSDateComponents()
    date.year = Int(self.year ?? "") ?? 0
    date.month = Int(self.month) ?? 0
    date.day = Int(self.day) ?? 0
    return date
  }
}

