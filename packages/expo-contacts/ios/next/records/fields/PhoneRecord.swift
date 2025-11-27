import ExpoModulesCore

struct NewPhoneRecord: NewRecord {
  @Field var number: String?
  @Field var label: String?
}

struct ExistingPhoneRecord: Record, ExistingRecord {
  @Field(FieldOption.required) var id: String
  @Field var number: String?
  @Field var label: String?
  
  init() {}
  
  init(id: String, number: String?, label: String?) {
    self.id = id
    self.number = number
    self.label = label
  }
}

struct PatchPhoneRecord: PatchRecord {
  @Field(FieldOption.required) var id: String
  @Field var label: ValueOrUndefined<String?> = .undefined
  @Field var number: ValueOrUndefined<String?> = .undefined
}
