import ExpoModulesCore

struct ContactQueryResult: Record {
  @Field var contacts: [ContactNext]
  @Field var total: Int
}
