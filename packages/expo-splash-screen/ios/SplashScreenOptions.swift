import ExpoModulesCore

internal struct SplashScreenOptions: Record {
  @Field var fade: Bool = false
  @Field var duration: Double = 400
  @Field var showOnReload: Bool = false
}
