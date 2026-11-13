import ExpoModulesCore

struct HeadingWatchStatus: Record {
  @Field var isSubscribed: Bool = false
  @Field var isHandleAlive: Bool = false
  @Field var isStarted: Bool = false
  @Field var isPaused: Bool = false
}
