import AVKit

extension AVAssetTrack {
  var mediaFormat: String {
    get async throws {
      var format = ""
      let descriptions = try await load(.formatDescriptions)
      for (index, formatDesc) in descriptions.enumerated() {
        let subType = CMFormatDescriptionGetMediaSubType(formatDesc).toCorrectedString()

        // The reported subType is different for iOS and Android, ideally they should be the same
        format += "video/\(subType)"
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
      let extensions = getBitrateParentExtension(from: videoDescription),
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

  private func getBitrateParentExtension(from videoDescription: CMFormatDescription) -> [String: Any]? {
    let extensionKey = kCMFormatDescriptionExtension_SampleDescriptionExtensionAtoms
    return CMFormatDescriptionGetExtension(videoDescription, extensionKey: extensionKey) as? [String: Any]
  }
}
