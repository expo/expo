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
  @Field var year: Int?
  @Field(FieldOption.required) var month: Int
  @Field(FieldOption.required) var day: Int
  
  init() {}
  
  init(year: Int?, month: Int, day: Int) {
    self.year = year
    self.month = month
    self.day = day
  }
}
