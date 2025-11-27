import Contacts

struct UrlAddressMapper: ContactRecordMapper {
  typealias TExistingRecord = ExistingUrlAddressRecord
  typealias TNewRecord = NewUrlAddressRecord
  typealias TPatchRecord = PatchUrlAddressRecord
  typealias TDomainValue = NSString

  func newRecordToCNLabeledValue(_ record: NewUrlAddressRecord) -> CNLabeledValue<NSString> {
    let value = (record.url ?? "") as NSString
    return CNLabeledValue(label: record.label, value: value)
  }
  
  func existingRecordToCNLabeledValue(_ record: ExistingUrlAddressRecord) -> CNLabeledValue<NSString> {
    let value = (record.url ?? "") as NSString
    return CNLabeledValue(label: record.label, value: value)
  }

  func cnLabeledValueToExistingRecord(_ labeledValue: CNLabeledValue<NSString>) -> ExistingUrlAddressRecord {
    return ExistingUrlAddressRecord(
      id: labeledValue.identifier,
      label: labeledValue.label ?? CNLabelOther,
      url: labeledValue.value as String
    )
  }
  
  func apply(patch: PatchUrlAddressRecord, to cnLabeledValue: CNLabeledValue<NSString>) -> CNLabeledValue<NSString> {
    var toModify = cnLabeledValue
    if case .value(let label) = patch.label {
      toModify = toModify.settingLabel(label)
    }
    if case .value(let url) = patch.url {
      toModify = toModify.settingValue((url ?? "") as NSString)
    }
    return toModify
  }
}
