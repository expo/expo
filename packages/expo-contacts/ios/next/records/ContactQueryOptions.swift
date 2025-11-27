import ExpoModulesCore


enum SortOrder: String, Enumerable {
  case givenName = "givenName"
  case familyName = "familyName"
  case none = "none"
  case userDefault = "useDefault"
}
  
struct ContactQueryOptions: Record {
  @Field var limit: Int?
  @Field var offset: Int?
  @Field var sortOrder: SortOrder?
  @Field var name: String?
  // iOS only
  @Field var unifyContacts: Bool?
}
