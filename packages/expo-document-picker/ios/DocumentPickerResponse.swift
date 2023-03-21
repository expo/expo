import ExpoModulesCore

internal struct DocumentPickerResponse: Record {
  @Field var assets: [DocumentInfo]? = nil
  @Field var canceled: Bool = false
}

internal struct DocumentInfo: Record {
  @Field var uri: String = ""
  @Field var name: String? = nil
  @Field var size: Int = 0
  @Field var mimeType: String? = nil
}
