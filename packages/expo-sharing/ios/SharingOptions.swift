import ExpoModulesCore

internal struct SharingOptions: Record {
  @Field var mimeType: String?
  @Field var UTI: String?
  @Field var dialogTitle: String?
}
