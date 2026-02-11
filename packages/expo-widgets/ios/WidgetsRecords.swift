import ExpoModulesCore

struct LiveActivityInfo: Record {
  @Field var id: String = ""
  @Field var name: String = ""
  @Field var pushToken: String? = nil
}
