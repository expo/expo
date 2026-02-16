import ExpoModulesCore

struct LiveActivityInfo: Record {
  @Field var id: String = ""
  @Field var name: String = ""
  @Field var pushToken: String? = nil
}

struct WidgetsJSTimelineEntry: Record {
  @Field var timestamp: Int
  @Field var props: [String: Any] = [:]
}
