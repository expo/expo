import ExpoModulesCore

struct NewDateRecord: NewRecord {
  @Field var date: ContactDateNext
  @Field var label: String
}

struct ExistingDateRecord: ExistingRecord {
  @Field(FieldOption.required) var id: String
  @Field var date: ContactDateNext
  @Field var label: String
  
  init() {}
  
  init(id: String, date: ContactDateNext, label: String) {
    self.id = id
    self.date = date
    self.label = label
  }
}

struct PatchDateRecord: PatchRecord {
  @Field(FieldOption.required) var id: String
  @Field var label: ValueOrUndefined<String?> = .undefined
  @Field var date: ValueOrUndefined<ContactDateNext?> = .undefined
}

struct ContactDateNext: Record {
  @Field var year: String?
  @Field var month: String
  @Field var day: String
  
  init() {}
  
  init(year: String?, month: String, day: String) {
    self.year = year
    self.month = month
    self.day = day
  }
}
