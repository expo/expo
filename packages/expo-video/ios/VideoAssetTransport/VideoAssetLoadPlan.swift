import AVKit

/// Describes how a ``VideoAssetTransportProvider`` wants `expo-video` to construct and manage
/// an `AVURLAsset` for a matching source.
///
/// Return a value of this type from `makeLoadPlan(for:)` when a transport needs to:
/// - replace the URL that AVFoundation loads,
/// - override asset options such as request headers,
/// - attach a custom `AVAssetResourceLoaderDelegate`,
/// - perform async setup before the asset is eagerly loaded, or
/// - keep helper objects alive for the lifetime of the asset.
///
/// Any property left `nil` or empty falls back to the default `expo-video` behavior.
public struct VideoAssetLoadPlan {
  public let assetURL: URL
  public let assetOptions: [String: Any]?
  public let reportedContentTypeHint: ContentType?
  public let resourceLoaderDelegate: (any AVAssetResourceLoaderDelegate)?
  public let resourceLoaderQueue: DispatchQueue?
  public let prepareAsset: ((AVURLAsset) async throws -> Void)?
  public let retainedObjects: [AnyObject]
  public let attachErrorHandler: ((@escaping (Error) -> Void) -> Void)?
  public let onAssetDeinit: (() -> Void)?

  /// Creates a load plan for a custom video asset transport.
  ///
  /// - Parameters:
  ///   - assetURL: The URL that should be used to initialize the `AVURLAsset`. This can be the
  ///     original source URL or a transport-specific replacement such as a rewritten scheme,
  ///     local proxy URL, or generated playlist URL.
  ///   - assetOptions: Optional `AVURLAsset` initialization options. Use this to override the
  ///     default options that `expo-video` would normally derive from the source.
  ///   - reportedContentTypeHint: An optional content type that describes the effective playback
  ///     format of `assetURL`. Set this when the transport changes the source type, such as
  ///     translating DASH into HLS.
  ///   - resourceLoaderDelegate: An optional `AVAssetResourceLoaderDelegate` that should be
  ///     attached to the asset's resource loader.
  ///   - resourceLoaderQueue: The dispatch queue on which `resourceLoaderDelegate` should receive
  ///     callbacks.
  ///   - prepareAsset: Optional async work to run before `expo-video` eagerly loads asset
  ///     properties. Use this for transport bootstrap such as fetching manifests or starting a
  ///     local server.
  ///   - retainedObjects: Helper objects that must stay alive for the lifetime of the asset, such
  ///     as local HTTP servers, parsers, or transport state owners.
  ///   - attachErrorHandler: An optional hook that lets the transport forward asynchronous errors
  ///     back into `expo-video` after the load plan has been applied.
  ///   - onAssetDeinit: Optional cleanup to run when the `VideoAsset` is deallocated.
  public init(
    assetURL: URL,
    assetOptions: [String: Any]? = nil,
    reportedContentTypeHint: ContentType? = nil,
    resourceLoaderDelegate: (any AVAssetResourceLoaderDelegate)? = nil,
    resourceLoaderQueue: DispatchQueue? = nil,
    prepareAsset: ((AVURLAsset) async throws -> Void)? = nil,
    retainedObjects: [AnyObject] = [],
    attachErrorHandler: ((@escaping (Error) -> Void) -> Void)? = nil,
    onAssetDeinit: (() -> Void)? = nil
  ) {
    self.assetURL = assetURL
    self.assetOptions = assetOptions
    self.reportedContentTypeHint = reportedContentTypeHint
    self.resourceLoaderDelegate = resourceLoaderDelegate
    self.resourceLoaderQueue = resourceLoaderQueue
    self.prepareAsset = prepareAsset
    self.retainedObjects = retainedObjects
    self.attachErrorHandler = attachErrorHandler
    self.onAssetDeinit = onAssetDeinit
  }
}
