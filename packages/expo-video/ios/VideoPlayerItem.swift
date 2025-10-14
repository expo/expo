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
    self.isHls = videoSource.uri?.pathExtension == "m3u8" || videoSource.contentType == .hls

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
    self.isHls = videoSource.uri?.pathExtension == "m3u8" || videoSource.contentType == .hls

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
      var tracks: [VideoTrack] = []
      guard let self else {
        return []
      }

      if isHls {
        do {
          tracks = try await self.fetchHlsVideoTracks()
        } catch {
          tracks = []
          log.warn("Failed to fetch HLS video tracks, this is not required for playback, but `expo-video` will have no knowledge of the available tracks: \(error.localizedDescription)")
        }
      } else {
        let avAssetTracks = asset.tracks(withMediaType: .video)
        for avAssetTrack in avAssetTracks {
          tracks.append(await VideoTrack.from(assetTrack: avAssetTrack))
        }
      }
      return tracks
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
    return parseM3U8(content)
  }

  private func parseM3U8(_ content: String) -> [VideoTrack] {
    let lines = content.components(separatedBy: "\n")
    return zip(lines, lines.dropFirst()).compactMap { line, nextLine in
      VideoTrack.from(hlsHeaderLine: line, idLine: nextLine)
    }
  }
}
