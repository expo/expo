import ExpoModulesCore

struct NewUrlAddressRecord: NewRecord {
  @Field var label: String? = nil
  @Field var url: String? = nil
}

struct ExistingUrlAddressRecord: ExistingRecord {
  @Field(FieldOption.required) var id: String
  @Field var label: String? = nil
  @Field var url: String? = nil
  
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
