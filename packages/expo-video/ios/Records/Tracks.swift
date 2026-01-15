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
      id: idLine,
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

  // Decently reliable way to extract peak bitrate from MP4 containers
  // Unlike for average bitrate, we can't get this information from AVKit API
  func getPeakBitrate() async -> Int? {
    guard let videoDescriptions = try? await self.load(.formatDescriptions),
      let videoDescription = (videoDescriptions.first { $0.mediaType == .video }),
      let extensions = videoDescription.getBitrateParentExtension(),
      // If the container publishes the peak bitrate at all, it should be declared in this box
      let btrtData = extensions["btrt"] as? Data, btrtData.count >= 12
    else {
      return nil
    }

    // https://mpeggroup.github.io/FileFormatConformance/?query=%3D%22btrt%22 (see under `Syntax`)
    // Byte 0-3 (00060dd5): Buffer Size
    // Byte 4-7 (0051fb78): Max Bitrate (Peak)
    // Byte 8-11 (001e6270): Average Bitrate

    // Extract bytes 4-7 (The MaxBitrate field)
    let maxBitrateData = btrtData.subdata(in: 4..<8)

    let maxBitrate = maxBitrateData.reduce(0) { result, byte in
      return (result << 8) | UInt32(byte)
    }

    return Int(maxBitrate)
  }
}

private extension CMFormatDescription {
  func getBitrateParentExtension() -> [String: Any]? {
    let extensionKey = kCMFormatDescriptionExtension_SampleDescriptionExtensionAtoms
    return CMFormatDescriptionGetExtension(self, extensionKey: extensionKey) as? [String: Any]
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
