import Contacts

protocol ContactRecordMapper {
  associatedtype TExistingRecord: ExistingRecord
  associatedtype TNewRecord: NewRecord
  associatedtype TPatchRecord: PatchRecord
  associatedtype TDomainValue: NSCopying & NSSecureCoding
  
  func newRecordToCNLabeledValue(_ newRecord: TNewRecord) -> CNLabeledValue<TDomainValue>
  func existingRecordToCNLabeledValue(_ existingRecord: TExistingRecord) -> CNLabeledValue<TDomainValue>
  func cnLabeledValueToExistingRecord(_ cnLabeledValue: CNLabeledValue<TDomainValue>) -> TExistingRecord
  func apply(patch: TPatchRecord, to cnLabeledValue: CNLabeledValue<TDomainValue>) -> CNLabeledValue<TDomainValue>
}



