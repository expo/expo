internal protocol ImageLoadingDelegate: AnyObject {
  func imageLoadCallback(
    _ request: ImageLoadRequest,
    source: ImageSource,
    image: UIImage?,
    finished: Bool,
    cacheType: ImageCacheType
  ) async -> Void
}
