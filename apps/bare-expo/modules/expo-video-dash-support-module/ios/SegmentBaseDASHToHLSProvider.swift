import ExpoVideo

import Foundation

public final class SegmentBaseDASHToHLSProvider: VideoAssetTransportProvider {
  public let identifier: String
  public let priority: Int

  private let sourceMatcher: (VideoAssetSourceDescriptor) -> Bool

  public init(
    identifier: String = "expo-video.segment-base-dash",
    priority: Int = 100,
    sourceMatcher: @escaping (VideoAssetSourceDescriptor) -> Bool
  ) {
    self.identifier = identifier
    self.priority = priority
    self.sourceMatcher = sourceMatcher
  }

  public func makeLoadPlan(for source: VideoAssetSourceDescriptor) -> VideoAssetLoadPlan? {
    guard sourceMatcher(source) else {
      return nil
    }

    let helper = SegmentBaseDASHToHLSHelper(mpdURL: source.url, headers: source.headers)
    return VideoAssetLoadPlan(
      assetURL: helper.masterPlaylistURL,
      reportedContentTypeHint: .hls,
      prepareAsset: { _ in
        try await helper.preparePlaylists()
      },
      retainedObjects: [helper],
      attachErrorHandler: { errorHandler in
        helper.onError = errorHandler
      }
    )
  }
}
