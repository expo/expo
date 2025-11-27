import ExpoModulesCore

struct NewEmailRecord: NewRecord {
  @Field var address: String
  @Field var label: String
}

struct ExistingEmailRecord: ExistingRecord {
  @Field(FieldOption.required) var id: String
  @Field var address: String
  @Field var label: String
  
  init() {}
  
  init(id: String, address: String, label: String) {
    self.id = id
    self.address = address
    self.label = label
  }
}

struct PatchEmailRecord: PatchRecord {
  @Field(FieldOption.required) var id: String
  @Field var label: ValueOrUndefined<String?> = .undefined
  @Field var address: ValueOrUndefined<String?> = .undefined
}
