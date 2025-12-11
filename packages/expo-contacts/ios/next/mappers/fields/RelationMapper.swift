import Contacts
import ExpoModulesCore

struct RelationMapper: ContactRecordMapper {
  typealias TExistingRecord = ExistingRelationRecord
  typealias TNewRecord = NewRelationRecord
  typealias TPatchRecord = PatchRelationRecord
  typealias TDomainValue = CNContactRelation

  func newRecordToCNLabeledValue(_ record: NewRelationRecord) -> CNLabeledValue<CNContactRelation> {
    let relation = CNContactRelation(name: record.name)
    return CNLabeledValue(label: record.label ?? CNLabelOther, value: relation)
  }
  
  func existingRecordToCNLabeledValue(_ record: ExistingRelationRecord) -> CNLabeledValue<CNContactRelation> {
    let relation = CNContactRelation(name: record.name)
    return CNLabeledValue(label: record.label ?? CNLabelOther, value: relation)
  }
  
  func cnLabeledValueToExistingRecord(_ labeledValue: CNLabeledValue<CNContactRelation>) -> ExistingRelationRecord {
    return ExistingRelationRecord(
      id: labeledValue.identifier,
      name: labeledValue.value.name,
      label: labeledValue.label
    )
  }
  
  func apply(patch: PatchRelationRecord, to cnLabeledValue: CNLabeledValue<CNContactRelation>) -> CNLabeledValue<CNContactRelation> {
    var toModify = cnLabeledValue
    
    if case .value(let label) = patch.label {
      toModify = toModify.settingLabel(label)
    }
    
    var newName = toModify.value.name

    if case .value(let name) = patch.name {
      newName = name ?? ""
    }
    
    toModify = toModify.settingValue(CNContactRelation(name: newName))
    
    return toModify
  }
}
