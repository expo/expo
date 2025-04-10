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

internal struct VideoTrack: Record, Equatable {
  @Field var id: String? = nil
  @Field var size: VideoSize? = nil
  @Field var mimeType: String? = nil
  @Field var bitrate: Int? = nil
  @Field var isSupported: Bool = true
  @Field var frameRate: Float? = nil

  static func == (lhs: VideoTrack, rhs: VideoTrack) -> Bool {
    guard lhs.id != nil, rhs.id != nil else {
      return false
    }
    return lhs.id == rhs.id
  }

  static func from(assetTrack: AVAssetTrack) async -> VideoTrack {
    var bitrate: Int?
    var size: VideoSize?
    let supported = (try? await assetTrack.load(.isPlayable)) ?? true
    let mediaFormat = try? await assetTrack.mediaFormat
    let frameRate = try? await assetTrack.load(.nominalFrameRate)

    if let bitrateFloat = try? await assetTrack.load(.estimatedDataRate) {
      bitrate = Int(bitrateFloat)
    }
    if let cgSize = try? await assetTrack.load(.naturalSize) {
      size = VideoSize.from(cgSize)
    }

    return VideoTrack(id: "\(assetTrack.trackID)", size: size, mimeType: mediaFormat, bitrate: bitrate, isSupported: supported, frameRate: frameRate)
  }

  static func from(hlsHeaderLine: String, idLine: String) -> VideoTrack? {
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

    let size = VideoSize(width: width, height: height)
    let mimeType = codecsToMimeType(codecs: details["CODECS"])
    var bitrate: Int? = nil
    var frameRate: Float? = nil

    // Use the default Andorid behavior for reporting the bitrate
    if let bitrateString = details["BANDWIDTH"] ?? details["AVERAGE-BANDWIDTH"] {
      bitrate = Int(bitrateString)
    }
    if let frameRateString = details["FRAME-RATE"] {
      frameRate = Float(frameRateString)
    }

    return VideoTrack(id: idLine, size: size, mimeType: mimeType, bitrate: bitrate, frameRate: frameRate)
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

// https://developer.apple.com/documentation/avfoundation/avpartialasyncproperty/formatdescriptions
private extension AVAssetTrack {
  var mediaFormat: String {
    get async throws {
      var format = ""
      let descriptions = try await load(.formatDescriptions)
      for (index, formatDesc) in descriptions.enumerated() {
        let subType = CMFormatDescriptionGetMediaSubType(formatDesc).toString()

        // The reported subType is different for iOS and Android, ideally they should be the same
        let correctedSubType: String
        switch subType {
        case "avc1": // H264 videos
          correctedSubType = "avc"
        case "hev1": // H265 videos
          correctedSubType = "hevc"
        default:
          correctedSubType = subType
        }
        format += "video/\(correctedSubType)"
        if index < descriptions.count - 1 {
          format += ","
        }
      }
      return format
    }
  }
}

private extension FourCharCode {
  // Create a string representation of a FourCC.
  func toString() -> String {
    let bytes: [CChar] = [
      CChar((self >> 24) & 0xff),
      CChar((self >> 16) & 0xff),
      CChar((self >> 8) & 0xff),
      CChar(self & 0xff),
      0
    ]
    let result = String(cString: bytes)
    let characterSet = CharacterSet.whitespaces
    return result.trimmingCharacters(in: characterSet)
  }
}
