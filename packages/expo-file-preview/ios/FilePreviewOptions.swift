import ExpoModulesCore

internal struct FilePreviewOpenOptions: Record {
  @Field var title: String?
  @Field var mimeType: String?
}

internal struct FilePreviewCanPreviewOptions: Record {
  @Field var mimeType: String?
}
