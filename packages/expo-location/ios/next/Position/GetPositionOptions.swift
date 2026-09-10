import ExpoModulesCore

internal struct GetPositionOptions: Record {
  @Field var maxCachedAge: Double = 0
  @Field var profile: Profile = .default
  @Field var timeout: Double = 90
}
