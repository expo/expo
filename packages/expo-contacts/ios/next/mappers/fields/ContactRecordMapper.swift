import Contacts

protocol ContactRecordMapper {
  associatedtype TExistingRecord: ExistingRecord
  associatedtype TNewRecord: NewRecord
  associatedtype TPatchRecord: PatchRecord
  associatedtype TDomainValue: NSCopying & NSSecureCoding
  
  func newRecordToCNLabeledValue(_ newRecord: TNewRecord) throws -> CNLabeledValue<TDomainValue>
  func existingRecordToCNLabeledValue(_ existingRecord: TExistingRecord) throws -> CNLabeledValue<TDomainValue>
  func cnLabeledValueToExistingRecord(_ cnLabeledValue: CNLabeledValue<TDomainValue>) throws -> TExistingRecord
  func apply(patch: TPatchRecord, to cnLabeledValue: CNLabeledValue<TDomainValue>) throws -> CNLabeledValue<TDomainValue>
}



