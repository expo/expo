import ExpoModulesCore

struct NewUrlAddressRecord: NewRecord {
  @Field var label: String?
  @Field var url: String?
}

struct ExistingUrlAddressRecord: ExistingRecord {
  @Field(FieldOption.required) var id: String
  @Field var label: String?
  @Field var url: String?

  init() {}

  init(id: String, label: String? = nil, url: String? = nil) {
    self.id = id
    self.label = label
    self.url = url
  }
}

struct PatchUrlAddressRecord: PatchRecord {
  @Field(FieldOption.required) var id: String
  @Field var label: ValueOrUndefined<String?> = .undefined
  @Field var url: ValueOrUndefined<String?> = .undefined
}
