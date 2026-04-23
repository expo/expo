/**
 A stable public description of the source being evaluated by a
 ``VideoAssetTransportProvider``.

 This type exists to give external transports the information they need to match
 and configure loading without exposing `expo-video`'s internal `VideoSource`
 model directly. This allows us to more easily introduce changes to `VideoSource`
 while keeping compatibility with external modules.
 */
public struct VideoAssetSourceDescriptor {
  /// The source URL currently being evaluated.
  public let url: URL
  /// Optional HTTP headers associated with the source request.
  public let headers: [String: String]?
  /// Indicates whether the source requested built-in caching behavior.
  public let usesCaching: Bool
  /// Indicates whether the source includes DRM configuration.
  public let hasDRM: Bool
  /// A best-effort content type hint derived from the source configuration.
  public let contentTypeHint: ContentType

  internal init(videoSource: VideoSource, url: URL) {
    self.url = url
    self.headers = videoSource.headers
    self.usesCaching = videoSource.useCaching
    self.hasDRM = videoSource.drm != nil
    self.contentTypeHint = videoSource.contentType
  }
}
