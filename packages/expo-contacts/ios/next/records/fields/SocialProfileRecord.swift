import ExpoModulesCore

struct NewSocialProfileRecord: NewRecord {
  @Field var label: String
  @Field var username: String?
  @Field var service: String?
  @Field var url: String?
  @Field var userId: String?
}

struct ExistingSocialProfileRecord: ExistingRecord {
  @Field(FieldOption.required) var id: String
  @Field var label: String
  @Field var username: String?
  @Field var service: String?
  @Field var url: String?
  @Field var userId: String?
  
  init() {}
  
  init(id: String, label: String, username: String? = nil, service: String? = nil, url: String? = nil, userId: String? = nil) {
    self.id = id
    self.label = label
    self.username = username
    self.service = service
    self.url = url
    self.userId = userId
  }
}

struct PatchSocialProfileRecord: PatchRecord {
  @Field(FieldOption.required) var id: String
  @Field var label: ValueOrUndefined<String?> = .undefined
  @Field var username: ValueOrUndefined<String?> = .undefined
  @Field var service: ValueOrUndefined<String?> = .undefined
  @Field var url: ValueOrUndefined<String?> = .undefined
  @Field var userId: ValueOrUndefined<String?> = .undefined
}
