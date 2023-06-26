import ABI49_0_0ExpoModulesCore

internal struct VideoThumbnailsOptions: Record {
  @Field var quality: Double = 1.0
  @Field var time: Int64 = 0
  @Field var headers: [String: String] = [String: String]()
}
