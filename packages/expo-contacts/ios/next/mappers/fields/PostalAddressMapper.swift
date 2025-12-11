import Contacts

struct PostalAddressMapper: ContactRecordMapper {
  typealias TExistingRecord = ExistingPostalAddressRecord
  typealias TNewRecord = NewPostalAddressRecord
  typealias TPatchRecord = PatchPostalAddressRecord
  typealias TDomainValue = CNPostalAddress
  
  func newRecordToCNLabeledValue(_ record: NewPostalAddressRecord) -> CNLabeledValue<CNPostalAddress> {
    let postalAddress = mapToCNPostalAddress(
      street: record.street,
      city: record.city,
      region: record.region,
      postalCode: record.postcode,
      country: record.country
    )
    return CNLabeledValue(label: record.label, value: postalAddress)
  }

  func existingRecordToCNLabeledValue(_ record: ExistingPostalAddressRecord) -> CNLabeledValue<CNPostalAddress> {
    let postalAddress = mapToCNPostalAddress(
      street: record.street,
      city: record.city,
      region: record.region,
      postalCode: record.postcode,
      country: record.country
    )
    return CNLabeledValue(label: record.label, value: postalAddress)
  }

  func cnLabeledValueToExistingRecord(_ labeledValue: CNLabeledValue<CNPostalAddress>) -> ExistingPostalAddressRecord {
    let postalAddress = labeledValue.value
    
    return ExistingPostalAddressRecord(
      id: labeledValue.identifier,
      label: labeledValue.label,
      street: postalAddress.street,
      city: postalAddress.city,
      region: postalAddress.state,
      postcode: postalAddress.postalCode,
      country: postalAddress.country
    )
  }

  private func mapToCNPostalAddress(
    street: String?,
    city: String?,
    region: String?,
    postalCode: String?,
    country: String?
  ) -> CNPostalAddress {
    let mutableAddress = CNMutablePostalAddress()
    mutableAddress.street = street ?? ""
    mutableAddress.city = city ?? ""
    mutableAddress.state = region ?? ""
    mutableAddress.postalCode = postalCode ?? ""
    mutableAddress.country = country ?? ""
    return mutableAddress.copy() as! CNPostalAddress
  }
  
  func apply(patch: PatchPostalAddressRecord, to cnLabeledValue: CNLabeledValue<CNPostalAddress>) -> CNLabeledValue<CNPostalAddress> {
    var toModify = cnLabeledValue

    if case .value(let label) = patch.label {
      toModify = toModify.settingLabel(label)
    }
    
    let mutableAddress = toModify.value.mutableCopy() as! CNMutablePostalAddress
    
    if case .value(let street) = patch.street {
      mutableAddress.street = street ?? ""
    }
    if case .value(let city) = patch.city {
      mutableAddress.city = city ?? ""
    }
    if case .value(let region) = patch.region {
      mutableAddress.state = region ?? ""
    }
    if case .value(let postalCode) = patch.postalCode {
      mutableAddress.postalCode = postalCode ?? ""
    }
    if case .value(let country) = patch.country {
      mutableAddress.country = country ?? ""
    }
    if case .value(let iso) = patch.isoCountryCode {
      mutableAddress.isoCountryCode = iso ?? ""
    }
    
    toModify = toModify.settingValue(mutableAddress.copy() as! CNPostalAddress)

    return toModify
  }
}
