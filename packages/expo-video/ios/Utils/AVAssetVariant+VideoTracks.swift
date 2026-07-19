import AVKit

extension AVAssetVariant.VideoAttributes {
  var videoSize: VideoSize? {
    guard presentationSize.width.isFinite, presentationSize.height.isFinite else {
      return nil
    }
    return VideoSize(width: Int(presentationSize.width), height: Int(presentationSize.height))
  }

  func getFormattedCodecString() -> String {
    guard let codecType = self.codecTypes.first else {
      return "video/unknown"
    }

    let fourCC = CMVideoCodecType(codecType).toCorrectedString()

    return "video/\(fourCC)"
  }
}
