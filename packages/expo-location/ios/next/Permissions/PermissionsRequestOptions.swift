import ExpoModulesCore

internal struct PermissionsRequestOptions: Record {
  @Field var accuracy: LocationAccuracyOption = .full
  @Field var fullAccuracyPurposeKey: String?
}
