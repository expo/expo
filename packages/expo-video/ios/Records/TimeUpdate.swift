import ExpoModulesCore

// swiftlint:disable redundant_optional_initialization - Initialization with nil is necessary
internal struct TimeUpdate: Record {
  @Field var currentTime: Double = 0
  @Field var currentLiveTimestamp: Double? = nil
  @Field var currentOffsetFromLive: Double? = nil
  @Field var bufferedPosition: Double = -1
}
// swiftlint:enable redundant_optional_initialization
