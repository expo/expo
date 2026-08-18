import Photos
import AVFoundation

class UriExtractor {
  static func extract(from phAsset: PHAsset, version: AssetUriVersion) async throws -> URL {
    switch phAsset.mediaType {
    case .image:
      return try await extract(fromImage: phAsset, version: version)
    case .video:
      return try await extract(fromVideo: phAsset, version: version)
    default:
      throw FailedToExtractUri("Unsupported media type")
    }
  }

  private static func extract(fromImage phAsset: PHAsset, version: AssetUriVersion) async throws -> URL {
    let result = try await phAsset.requestContentEditingInput(options: imageRequestOptions(for: version))
    guard let contentEditingInput = result.input else {
      throw FailedToExtractUri("Missing content editing input for image")
    }
    guard let url = contentEditingInput.fullSizeImageURL else {
      throw FailedToExtractUri("Missing fullSizeImageURL for image")
    }
    return url
  }

  // Photos renders the edits into the image it returns, unless we say we can handle the
  // adjustment data ourselves. Then it returns the image those edits were applied to.
  static func imageRequestOptions(for version: AssetUriVersion) -> PHContentEditingInputRequestOptions {
    let options = PHContentEditingInputRequestOptions()
    options.isNetworkAccessAllowed = true
    if version == .ORIGINAL {
      options.canHandleAdjustmentData = { _ in true }
    }
    return options
  }

  static func videoRequestOptions(for version: AssetUriVersion) -> PHVideoRequestOptions {
    let options = PHVideoRequestOptions()
    options.version = version.toPHVideoRequestOptionsVersion()
    options.isNetworkAccessAllowed = true
    // without this an asset stored in iCloud can come back downscaled
    options.deliveryMode = .highQualityFormat
    return options
  }

  private static func extract(fromVideo phAsset: PHAsset, version: AssetUriVersion) async throws -> URL {
    let result = try await PHImageManager.default()
      .requestAVAsset(forVideo: phAsset, options: videoRequestOptions(for: version))
    guard let avAsset = result.asset else {
      throw FailedToExtractUri("Missing AVAsset for video")
    }

    if let urlAsset = avAsset as? AVURLAsset {
      return urlAsset.url
    }
    if let composition = avAsset as? AVComposition {
      return try await handleSlowmotionVideo(composition: composition)
    }
    throw FailedToExtractUri("Unsupported AVAsset type")
  }

  private static func handleSlowmotionVideo(composition: AVComposition) async throws -> URL {
    let outputURL = try makeOutputURL()
    let exporter = try makeExporter(for: composition, outputURL: outputURL)
    try await exportVideo(exporter: exporter)
    return outputURL
  }

  private static func makeOutputURL() throws -> URL {
    let directory = FileManager.default.temporaryDirectory
      .appendingPathComponent("MediaLibraryUriExtractorDirectory", isDirectory: true)
    try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)

    let filename = "slowMoVideo-\(UUID().uuidString).mov"
    return directory.appendingPathComponent(filename)
  }

  private static func makeExporter(for composition: AVComposition, outputURL: URL) throws -> AVAssetExportSession {
    guard let exporter = AVAssetExportSession(asset: composition, presetName: AVAssetExportPresetHighestQuality) else {
      throw FailedToExtractUri("Failed to create AVAssetExportSession")
    }

    exporter.outputURL = outputURL
    exporter.outputFileType = .mov
    exporter.shouldOptimizeForNetworkUse = true
    return exporter
  }

  private struct ExporterBox: @unchecked Sendable {
    let exporter: AVAssetExportSession
  }

  private static func exportVideo(exporter: AVAssetExportSession) async throws {
    let box = ExporterBox(exporter: exporter)

    try await withCheckedThrowingContinuation { continuation in
      box.exporter.exportAsynchronously {
        switch box.exporter.status {
        case .completed:
          continuation.resume()
        case .failed, .cancelled:
          continuation.resume(throwing: box.exporter.error ?? FailedToExtractUri("Slowmotion Export failed"))
        default:
          continuation.resume(throwing: FailedToExtractUri("Unexpected export status: \(box.exporter.status.rawValue)"))
        }
      }
    }
  }
}
