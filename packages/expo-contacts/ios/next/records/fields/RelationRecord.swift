import ExpoModulesCore

struct NewRelationRecord: NewRecord {
  @Field var name: String
  @Field var label: String?
}

struct ExistingRelationRecord: ExistingRecord {
  @Field(FieldOption.required) var id: String
  @Field var name:String
  @Field var label: String?
  
  init() {}
  
  init(id: String, name: String, label: String?) {
    self.id = id
    self.name = name
    self.label = label
  }
}

struct PatchRelationRecord: PatchRecord {
  @Field(FieldOption.required) var id: String
  @Field var label: ValueOrUndefined<String?> = .undefined
  @Field var name: ValueOrUndefined<String?> = .undefined
}
