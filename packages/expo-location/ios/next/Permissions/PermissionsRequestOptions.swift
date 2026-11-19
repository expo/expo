import ExpoModulesCore

struct PermissionsRequestOptions: Record {
  @Field var accuracy: LocationAccuracyOption = .full
}
