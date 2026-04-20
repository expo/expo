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

    super.init(asset: urlAsset, automaticallyLoadedAssetKeys: nil)
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
