import ExpoModulesCore

internal struct LocalAuthenticationOptions: Record {
  @Field var cancelLabel: String?
  @Field var disableDeviceFallback: Bool = false
  @Field var fallbackLabel: String?
  @Field var promptMessage: String?
}
