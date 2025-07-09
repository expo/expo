import ExpoModulesCore

/**
 Record representing thumbnail generation options.
 */
internal struct VideoThumbnailOptions: Record {
  static let `default` = VideoThumbnailOptions()

  @Field var maxWidth: Int = 0
  @Field var maxHeight: Int = 0

  func getMaxSize() -> CGSize {
    return CGSize(width: maxWidth, height: maxHeight)
  }
}
