// Copyright 2024-present 650 Industries. All rights reserved.

import ExpoModulesCore
import AVKit

class VideoPlayerItem: AVPlayerItem {
  let urlAsset: VideoAsset
  let videoSource: VideoSource
  let isHls: Bool
  var videoTracks: [VideoTrack] {
    get async {
      return await tracksLoadingTask?.value ?? []
    }
  }

  private var tracksLoadingTask: Task<[VideoTrack], Never>?

  init?(videoSource: VideoSource) {
    guard let url = videoSource.uri else {
      return nil
    }
    self.videoSource = videoSource
    self.isHls = videoSource.uri?.isHLS == true || videoSource.contentType == .hls

    let asset = VideoAsset(url: url, videoSource: videoSource)
    self.urlAsset = asset
    super.init(asset: urlAsset, automaticallyLoadedAssetKeys: nil)
    self.createTracksLoadingTask()
  }

  init?(videoSource: VideoSource, urlOverride: URL? = nil) async throws {
    guard let url = urlOverride ?? videoSource.uri else {
      return nil
    }
    self.videoSource = videoSource
    self.isHls = videoSource.uri?.isHLS == true || videoSource.contentType == .hls

    let asset = VideoAsset(url: url, videoSource: videoSource)
    self.urlAsset = asset
    // We can ignore any exceptions thrown during the load. The asset will be assigned to the `VideoPlayer` anyways
    // and cause it to go into .error state trigerring the `onStatusChange` event.
    do {
      _ = try await asset.load(.duration, .preferredTransform, .isPlayable)
    } catch {
        // Catch block is intentionally left empty
    }

    // When the source provides external subtitle files and the content is not HLS (which already
    // embeds its own subtitle tracks in the manifest), build an AVMutableComposition that mixes in
    // the sidecar subtitle tracks. This makes the external subtitles appear in the player's
    // `mediaSelectionGroup(forMediaCharacteristic: .legible)` just like embedded ones.
    if let externalSubtitles = videoSource.subtitles, !externalSubtitles.isEmpty, !self.isHls {
      let composition = await Self.buildComposition(videoAsset: asset, subtitleSources: externalSubtitles)
      super.init(asset: composition, automaticallyLoadedAssetKeys: nil)
    } else {
      super.init(asset: urlAsset, automaticallyLoadedAssetKeys: nil)
    }

    self.createTracksLoadingTask()
  }

  deinit {
    tracksLoadingTask?.cancel()
  }

  func createTracksLoadingTask() {
    tracksLoadingTask = Task { [weak self] in
      guard let self, let mainUrl = videoSource.uri else {
        return []
      }

      var tracks: [VideoTrack] = []
      if let assetTracks = try? await urlAsset.loadTracks(withMediaType: .video) {
        for avAssetTrack in assetTracks {
          tracks.append(await VideoTrack.from(assetTrack: avAssetTrack))
        }
      }

      guard isHls else {
        return tracks
      }

      let hlsTracks = await loadHlsTracks(mainUrl: mainUrl)
      return tracks + hlsTracks
    }
  }

  // MARK: - Composition builder

  /// Builds an `AVMutableComposition` containing the video and audio tracks from `videoAsset`
  /// together with text subtitle tracks loaded from each `SubtitleSource`.
  ///
  /// The resulting composition is used as the backing asset for the `AVPlayerItem` so that
  /// external WebVTT subtitle files appear in the player's media-selection group alongside any
  /// subtitles embedded in the stream.
  static func buildComposition(
    videoAsset: AVURLAsset,
    subtitleSources: [SubtitleSource]
  ) async -> AVMutableComposition {
    let composition = AVMutableComposition()

    // Determine duration from the video asset (fall back to .indefinite if unavailable).
    let duration = (try? await videoAsset.load(.duration)) ?? .indefinite
    let timeRange = CMTimeRange(start: .zero, duration: duration)

    // Copy video tracks.
    if let videoTracks = try? await videoAsset.loadTracks(withMediaType: .video) {
      for track in videoTracks {
        if let compositionTrack = composition.addMutableTrack(
          withMediaType: .video,
          preferredTrackID: kCMPersistentTrackID_Invalid
        ) {
          try? compositionTrack.insertTimeRange(timeRange, of: track, at: .zero)
        }
      }
    }

    // Copy audio tracks.
    if let audioTracks = try? await videoAsset.loadTracks(withMediaType: .audio) {
      for track in audioTracks {
        if let compositionTrack = composition.addMutableTrack(
          withMediaType: .audio,
          preferredTrackID: kCMPersistentTrackID_Invalid
        ) {
          try? compositionTrack.insertTimeRange(timeRange, of: track, at: .zero)
        }
      }
    }

    // Add external subtitle tracks.
    for subtitleSource in subtitleSources {
      guard let subtitleURL = subtitleSource.uri else {
        continue
      }

      let subtitleAsset = AVURLAsset(url: subtitleURL)

      // WebVTT files are loaded as .text tracks; closed-caption files as .closedCaption.
      let textTracks = (try? await subtitleAsset.loadTracks(withMediaType: .text)) ?? []
      let ccTracks = (try? await subtitleAsset.loadTracks(withMediaType: .closedCaption)) ?? []
      let allSubtitleTracks = textTracks + ccTracks

      guard !allSubtitleTracks.isEmpty else {
        log.warn("[expo-video] No subtitle tracks found in: \(subtitleURL.absoluteString)")
        continue
      }

      for subtitleTrack in allSubtitleTracks {
        let mediaType = (try? await subtitleTrack.load(.mediaType)) ?? .text
        guard let compositionTrack = composition.addMutableTrack(
          withMediaType: mediaType,
          preferredTrackID: kCMPersistentTrackID_Invalid
        ) else {
          continue
        }

        let subtitleDuration = (try? await subtitleAsset.load(.duration)) ?? duration
        let subtitleRange = CMTimeRange(start: .zero, duration: subtitleDuration)
        try? compositionTrack.insertTimeRange(subtitleRange, of: subtitleTrack, at: .zero)

        // Attach locale metadata so that AVFoundation exposes this track through
        // `mediaSelectionGroup(forMediaCharacteristic: .legible)`.
        compositionTrack.metadata = Self.makeSubtitleMetadata(
          language: subtitleSource.language,
          label: subtitleSource.label
        )

        // Set the BCP-47 language tag so AVFoundation can resolve a Locale for this track.
        if let language = subtitleSource.language {
          compositionTrack.extendedLanguageTag = language
        }
      }
    }

    return composition
  }

  /// Builds the AVMetadataItem array that associates a language and optional label with a
  /// composition subtitle track, enabling AVFoundation to surface it via media selection.
  private static func makeSubtitleMetadata(language: String?, label: String?) -> [AVMetadataItem] {
    var items: [AVMetadataItem] = []

    if let language {
      let langItem = AVMutableMetadataItem()
      langItem.keySpace = .common
      langItem.key = AVMetadataKey.commonKeyLanguage as NSString
      langItem.value = language as NSString
      langItem.locale = Locale(identifier: language)
      items.append(langItem)
    }

    if let label {
      let titleItem = AVMutableMetadataItem()
      titleItem.keySpace = .common
      titleItem.key = AVMetadataKey.commonKeyTitle as NSString
      titleItem.value = label as NSString
      items.append(titleItem)
    }

    return items
  }

  // MARK: - HLS Helpers

  private func loadHlsTracks(mainUrl: URL) async -> [VideoTrack] {
    if #available(iOS 26.0, tvOS 26, *) {
      return await loadModernHlsTracks(mainUrl: mainUrl)
    }

    return await loadLegacyHlsTracks()
  }

  @available(iOS 26.0, tvOS 26, *)
  private func loadModernHlsTracks(mainUrl: URL) async -> [VideoTrack] {
    guard let variants = try? await urlAsset.load(.variants) else {
      return []
    }
    let isPlayable = (try? await urlAsset.load(.isPlayable)) ?? false

    return variants.compactMap { variant in
      VideoTrack.from(assetVariant: variant, isPlayable: isPlayable, mainUrl: mainUrl)
    }
  }

  private func loadLegacyHlsTracks() async -> [VideoTrack] {
    do {
      return try await self.fetchHlsVideoTracks()
    } catch {
      log.warn("[expo-video] Failed to fetch HLS video tracks: \(error.localizedDescription)")
      return []
    }
  }

  // AVKit API doesn't provide us with a list of available tracks for a HLS source. We can download the playlist file and parse it ourselves
  // it's usually very small (1-2 kB), so we won't add too much overhead
  private func fetchHlsVideoTracks() async throws -> [VideoTrack] {
    guard let uri = videoSource.uri else {
      throw URLError(.badURL)
    }

    var request = URLRequest(url: uri)
    if let headers = videoSource.headers {
      for (key, value) in headers {
        request.addValue(value, forHTTPHeaderField: key)
      }
    }

    let (data, _) = try await URLSession.shared.data(for: request)
    let content = String(data: data, encoding: .utf8) ?? ""
    return parseM3U8(content, mainUrl: uri)
  }

  private func parseM3U8(_ content: String, mainUrl: URL) -> [VideoTrack] {
    let lines = content.components(separatedBy: "\n")
    return zip(lines, lines.dropFirst()).compactMap { line, nextLine in
      VideoTrack.from(hlsHeaderLine: line, idLine: nextLine, mainUrl: mainUrl)
    }
  }
}

private extension URL {
  var isHLS: Bool {
    // https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8
    // Above is a valid link, even though the path extension is an empty string, we can use a more primitive suffix method as a fallback
    return self.pathExtension.lowercased() == "m3u8" || self.absoluteString.lowercased().hasSuffix("m3u8")
  }
}
