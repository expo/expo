/// Defines a public transport boundary for customizing how `expo-video` loads specific sources.
///
/// This protocol exists so external modules can participate in asset loading without depending on
/// `expo-video`'s internal `VideoSource` model or requiring transport-specific branches inside
/// `expo-video` itself. A conforming type can inspect a stable public
/// ``VideoAssetSourceDescriptor`` and, when it recognizes a source, return a
/// ``VideoAssetLoadPlan`` describing how that source should be loaded.
///
/// Typical uses include:
/// - rewriting a source URL before AVFoundation sees it,
/// - attaching a custom `AVAssetResourceLoaderDelegate`,
/// - preparing local proxy or translated playlists, or
/// - retaining transport-owned helpers for the lifetime of the asset.
public protocol VideoAssetTransportProvider: AnyObject {
  /// A stable identifier used to register, replace, and unregister the provider.
  var identifier: String { get }

  /// Determines provider selection order when multiple providers match the same source.
  /// Higher values take precedence.
  var priority: Int { get }

  /// Returns a load plan for a matching source, or `nil` when this provider does not handle it.
  func makeLoadPlan(for source: VideoAssetSourceDescriptor) -> VideoAssetLoadPlan?
}
