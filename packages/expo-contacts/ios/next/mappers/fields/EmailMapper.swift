import Contacts

struct EmailMapper: ContactRecordMapper {
  typealias TExistingRecord = ExistingEmailRecord
  typealias TNewRecord = NewEmailRecord
  typealias TPatchRecord = PatchEmailRecord
  typealias TDomainValue = NSString
 
  func newRecordToCNLabeledValue(_ record: NewEmailRecord) -> CNLabeledValue<NSString> {
    return CNLabeledValue(label: record.label, value: record.address as NSString)
  }
  
  func existingRecordToCNLabeledValue(_ record: ExistingEmailRecord) -> CNLabeledValue<NSString> {
    return CNLabeledValue(label: record.label, value: record.address as NSString)
  }
  
  func cnLabeledValueToExistingRecord(_ labeledValue: CNLabeledValue<NSString>) -> ExistingEmailRecord {
    return ExistingEmailRecord(
      id: labeledValue.identifier,
      address: labeledValue.value as String,
      label: labeledValue.label ?? CNLabelOther
    )
  }
  
  func apply(patch: PatchEmailRecord, to cnLabeledValue: CNLabeledValue<NSString>) -> CNLabeledValue<NSString> {
    var toModify = cnLabeledValue
    if case .value(let label) = patch.label {
        toModify = toModify.settingLabel(label)
      }
      if case .value(let address) = patch.address {
        toModify = toModify.settingValue((address ?? "") as NSString)
      }
    return toModify
  }
}
