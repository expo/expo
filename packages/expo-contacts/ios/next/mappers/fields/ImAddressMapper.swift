import Contacts
import ExpoModulesCore

struct ImAddressMapper: ContactRecordMapper {
  typealias TExistingRecord = ExistingImAddressRecord
  typealias TNewRecord = NewImAddressRecord
  typealias TPatchRecord = PatchImAddressRecord
  typealias TDomainValue = CNInstantMessageAddress
  
  func newRecordToCNLabeledValue(_ record: NewImAddressRecord) -> CNLabeledValue<CNInstantMessageAddress> {
    let imAddress = mapToCNInstantMessageAddress(
      username: record.username,
      service: record.service
    )
    return CNLabeledValue(label: record.label, value: imAddress)
  }

  func existingRecordToCNLabeledValue(_ record: ExistingImAddressRecord) -> CNLabeledValue<CNInstantMessageAddress> {
    let imAddress = mapToCNInstantMessageAddress(
      username: record.username,
      service: record.service
    )
    return CNLabeledValue(label: record.label, value: imAddress)
  }

  func cnLabeledValueToExistingRecord(_ labeledValue: CNLabeledValue<CNInstantMessageAddress>) -> ExistingImAddressRecord {
    let imAddress = labeledValue.value
    
    return ExistingImAddressRecord(
      id: labeledValue.identifier,
      label: labeledValue.label ?? CNLabelOther,
      username: imAddress.username,
      service: imAddress.service
    )
  }

  private func mapToCNInstantMessageAddress(
    username: String?,
    service: String?
  ) -> CNInstantMessageAddress {
    return CNInstantMessageAddress(
      username: username ?? "",
      service: service ?? ""
    )
  }
  
  func apply(patch: PatchImAddressRecord, to cnLabeledValue: CNLabeledValue<CNInstantMessageAddress>) -> CNLabeledValue<CNInstantMessageAddress> {
    var toModify = cnLabeledValue

    if case .value(let label) = patch.label {
      toModify = toModify.settingLabel(label)
    }
    
    var currentUsername = toModify.value.username
    var currentService = toModify.value.service
    
    if case .value(let username) = patch.username {
      currentUsername = username ?? ""
    }
    if case .value(let service) = patch.service {
      currentService = service ?? ""
    }
    
    let newImAddress = CNInstantMessageAddress(
      username: currentUsername,
      service: currentService
    )
    
    toModify = toModify.settingValue(newImAddress)

    return toModify
  }
}
