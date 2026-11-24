import Contacts

struct PhoneMapper: ContactRecordMapper {
  typealias TExistingRecord = ExistingPhoneRecord
  typealias TNewRecord = NewPhoneRecord
  typealias TPatchRecord = PatchPhoneRecord
  typealias TDomainValue = CNPhoneNumber

  func newRecordToCNLabeledValue(_ record: NewPhoneRecord) -> CNLabeledValue<CNPhoneNumber> {
    let phoneNumber = CNPhoneNumber(stringValue: record.number ?? "")
    return CNLabeledValue(label: ContactLabelMapper.toCNLabel(record.label), value: phoneNumber)
  }

  func existingRecordToCNLabeledValue(_ record: ExistingPhoneRecord) -> CNLabeledValue<CNPhoneNumber> {
    let phoneNumber = CNPhoneNumber(stringValue: record.number ?? "")
    return CNLabeledValue(label: ContactLabelMapper.toCNLabel(record.label), value: phoneNumber)
  }

  func cnLabeledValueToExistingRecord(_ labeledValue: CNLabeledValue<CNPhoneNumber>) -> ExistingPhoneRecord {
    return ExistingPhoneRecord(
      id: labeledValue.identifier,
      number: labeledValue.value.stringValue,
      label: ContactLabelMapper.toRecordLabel(labeledValue.label)
    )
  }

  func apply(patch: PatchPhoneRecord, to cnLabeledValue: CNLabeledValue<CNPhoneNumber>) -> CNLabeledValue<CNPhoneNumber> {
    var toModify = cnLabeledValue
    if case .value(let label) = patch.label {
      toModify = toModify.settingLabel(ContactLabelMapper.toCNLabel(label))
    }
    if case .value(let number) = patch.number {
      let newValue = CNPhoneNumber(stringValue: number ?? "")
      toModify = toModify.settingValue(newValue)
    }
    return toModify
  }
}
