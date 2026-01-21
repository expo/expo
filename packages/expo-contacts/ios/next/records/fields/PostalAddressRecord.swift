import ExpoModulesCore

struct NewPostalAddressRecord: NewRecord {
  @Field var label: String?
  @Field var street: String?
  @Field var city: String?
  @Field var region: String?
  @Field var postcode: String?
  @Field var country: String?
}

struct ExistingPostalAddressRecord: ExistingRecord {
  @Field(FieldOption.required) var id: String
  @Field var label: String?
  @Field var street: String?
  @Field var city: String?
  @Field var region: String?
  @Field var postcode: String?
  @Field var country: String?

  init() {}

  init(
    id: String,
    label: String?,
    street: String?,
    city: String?,
    region: String?,
    postcode: String?,
    country: String?
  ) {
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
  @Field var postcode: ValueOrUndefined<String?> = .undefined
  @Field var country: ValueOrUndefined<String?> = .undefined
}
