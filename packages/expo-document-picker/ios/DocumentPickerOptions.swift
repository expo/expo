import ExpoModulesCore

internal struct DocumentPickerOptions: Record {
  @Field var copyToCacheDirectory: Bool = true
  @Field var type: [String] = ["*/*"]
}
