import ExpoModulesCore

struct NewPostalAddressRecord: NewRecord {
  @Field var label: String? = nil
  @Field var street: String? = nil
  @Field var city: String? = nil
  @Field var region: String? = nil
  @Field var postcode: String? = nil
  @Field var country: String? = nil
}

struct ExistingPostalAddressRecord: ExistingRecord {
  @Field(FieldOption.required) var id: String
  @Field var label: String? = nil
  @Field var street: String? = nil
  @Field var city: String? = nil
  @Field var region: String? = nil
  @Field var postcode: String? = nil
  @Field var country: String? = nil
  
  init() {}
  
  init(id: String, label: String?, street: String?, city: String?, region: String?, postcode: String?, country: String?) {
    self.id = id
    self.label = label
    self.street = street
    self.city = city
    self.region = region
    self.postcode = postcode
    self.country = country
  }
}

struct PatchPostalAddressRecord: PatchRecord {
  @Field(FieldOption.required) var id: String
  @Field var label: ValueOrUndefined<String?> = .undefined
  @Field var street: ValueOrUndefined<String?> = .undefined
  @Field var city: ValueOrUndefined<String?> = .undefined
  @Field var region: ValueOrUndefined<String?> = .undefined
  @Field var postalCode: ValueOrUndefined<String?> = .undefined
  @Field var country: ValueOrUndefined<String?> = .undefined
  @Field var isoCountryCode: ValueOrUndefined<String?> = .undefined
}
