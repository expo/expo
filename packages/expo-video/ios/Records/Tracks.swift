// Copyright 2024-present 650 Industries. All rights reserved.

import ExpoModulesCore
import AVKit

// swiftlint:disable redundant_optional_initialization - Initialization with nil is necessary
internal struct SubtitleTrack: Record {
  @Field
  var language: String? = nil

  @Field
  var label: String? = nil

  static func from(mediaSelectionOption option: AVMediaSelectionOption) -> SubtitleTrack? {
    guard let identifier = option.locale?.identifier else {
      return nil
    }

    return SubtitleTrack(language: identifier, label: option.displayName)
  }
}

internal struct AudioTrack: Record {
  @Field var language: String? = nil
  @Field var label: String? = nil

  static func from(mediaSelectionOption option: AVMediaSelectionOption) -> AudioTrack? {
    guard let identifier = option.locale?.identifier else {
      return nil
    }

    return AudioTrack(language: identifier, label: option.displayName)
  }
}

internal struct VideoTrack: Record, Equatable {
  @Field var id: String? = nil
  @Field var url: URL? = nil
  @Field var size: VideoSize? = nil
  @Field var mimeType: String? = nil
  @Field var bitrate: Int? = nil // deprecated as of SDK 55
  @Field var peakBitrate: Int? = nil
  @Field var averageBitrate: Int? = nil
  @Field var isSupported: Bool = true
  @Field var frameRate: Float? = nil

  static func == (lhs: VideoTrack, rhs: VideoTrack) -> Bool {
    guard lhs.id != nil, rhs.id != nil else {
      return false
    }
    return lhs.id == rhs.id
  }

  static func from(assetTrack: AVAssetTrack) async -> VideoTrack {
    var averageBitrate: Int?
    var size: VideoSize?
    let supported = (try? await assetTrack.load(.isPlayable)) ?? true
    let mediaFormat = try? await assetTrack.mediaFormat
    let frameRate = try? await assetTrack.load(.nominalFrameRate)

    if let bitrateFloat = try? await assetTrack.load(.estimatedDataRate) {
      averageBitrate = Int(bitrateFloat)
    }

    let peakBitrate = await assetTrack.getPeakBitrate()

    if let cgSize = try? await assetTrack.load(.naturalSize) {
      size = VideoSize.from(cgSize)
    }

    return VideoTrack(
      id: "\(assetTrack.trackID)",
      size: size,
      mimeType: mediaFormat,
      bitrate: peakBitrate ?? averageBitrate,
      peakBitrate: peakBitrate,
      averageBitrate: averageBitrate,
      isSupported: supported,
      frameRate: frameRate
    )
  }

  @available(iOS 26, *)
  static func from(assetVariant: AVAssetVariant, isPlayable: Bool, mainUrl: URL) -> VideoTrack? {
    guard let videoAttributes = assetVariant.videoAttributes else {
      return nil
    }

    let trackUrl = assetVariant.url
    let id = extractHlsTrackId(trackUrl: trackUrl, mainUrl: mainUrl)
    let videoSize = videoAttributes.videoSize
    let mimeType = videoAttributes.getFormattedCodecString()
    let frameRate = videoAttributes.nominalFrameRate.map(Float.init)
    let peakBitrate = assetVariant.peakBitRate.map(Int.init)
    let averageBitrate = assetVariant.averageBitRate.map(Int.init)

    return VideoTrack(
      id: id,
      url: trackUrl,
      size: videoSize,
      mimeType: mimeType,
      bitrate: peakBitrate ?? averageBitrate,
      peakBitrate: peakBitrate,
      averageBitrate: averageBitrate,
      isSupported: isPlayable,
      frameRate: frameRate
    )
  }

  static func from(hlsHeaderLine: String, idLine: String, mainUrl: URL) -> VideoTrack? {
    // The minimum information we require from a video track is it's resolution
    guard hlsHeaderLine.starts(with: "#EXT-X-STREAM-INF"), hlsHeaderLine.contains("RESOLUTION") else {
      return nil
    }
    // The information about the track is separated with ,
    let details = hlsHeaderLine.split(separator: ",")
      .reduce(into: [String: String]()) { dict, detail in
        let pair = detail.split(separator: "=", maxSplits: 1).map {
          String($0).trimmingCharacters(in: .whitespacesAndNewlines)
        }
        if pair.count == 2 {
          let (key, value) = (pair[0], pair[1])
          // Remove possible double quotes
          dict[key] = value.trimmingCharacters(in: CharacterSet(charactersIn: "\""))
        }
      }
    guard let resolution = details["RESOLUTION"] else {
      return nil
    }

    let dimensions = resolution.split(separator: "x").map { Int($0) }
    guard dimensions.count == 2, let width = dimensions[0], let height = dimensions[1] else {
      return nil
    }

    let id = idLine.trimmingCharacters(in: .whitespacesAndNewlines)
    let size = VideoSize(width: width, height: height)
    let mimeType = codecsToMimeType(codecs: details["CODECS"])
    var peakBitrage: Int? = nil
    var averageBitrate: Int? = nil
    var frameRate: Float? = nil

    if let peakBitrateString = details["BANDWIDTH"] {
      peakBitrage = Int(peakBitrateString)
    }
    if let averageBitrateString = details["AVERAGE-BANDWIDTH"] {
      averageBitrate = Int(averageBitrateString)
    }
    if let frameRateString = details["FRAME-RATE"] {
      frameRate = Float(frameRateString)
    }

    // Use the default Andorid behavior for reporting the bitrate
    let bitrate = peakBitrage ?? averageBitrate

    return VideoTrack(
      id: id,
      url: resolveMediaUrl(pathLine: idLine, mainUrl: mainUrl),
      size: size,
      mimeType: mimeType,
      bitrate: bitrate,
      peakBitrate: peakBitrage,
      averageBitrate: averageBitrate,
      frameRate: frameRate
    )
  }

  // I'm not aware of any built in conversion functions. For HLS sources we only need to worry about a few formats though.
  // https://developer.apple.com/documentation/http-live-streaming/hls-authoring-specification-for-apple-devices#:~:text=1.1.%20All%20video%20MUST%20be%20encoded%20using%20H.264/AVC%2C%20HEVC/H.265%2C%20Dolby%20Vision%2C%20or%20AV1.
  private static func codecsToMimeType(codecs: String?) -> String? {
    guard let codecs else {
      return nil
    }
    if codecs.starts(with: "avc1") {
      return "video/avc"
    }
    if codecs.starts(with: "hvc1") {
      return "video/hevc"
    }
    if codecs.starts(with: "dvh1") {
      return "video/dolby-vision"
    }
    if codecs.starts(with: "av11") {
      return "video/av1"
    }
    return nil // Unknown codec
  }
}
// swiftlint:enable redundant_optional_initialization
