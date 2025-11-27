import ExpoModulesCore

struct NewImAddressRecord: NewRecord {
  @Field var label: String
  @Field var username: String?
  @Field var service: String?
}

struct ExistingImAddressRecord: ExistingRecord {
  @Field(FieldOption.required) var id: String
  @Field var label: String
  @Field var username: String?
  @Field var service: String?
  
  init() {}
  
  init(id: String, label: String, username: String, service: String) {
    self.id = id
    self.label = label
    self.username = username
    self.service = service
  }
}

struct PatchImAddressRecord: PatchRecord {
  @Field(FieldOption.required) var id: String
  @Field var label: ValueOrUndefined<String?> = .undefined
  @Field var username: ValueOrUndefined<String?> = .undefined
  @Field var service: ValueOrUndefined<String?> = .undefined
}
