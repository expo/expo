// Copyright 2024-present 650 Industries. All rights reserved.

import AVFoundation

internal struct VideoUtils {
  static func tryCopyingVideo(at: URL, to: URL) throws {
    do {
      // we copy the file as `moveItem(at:,to:)` throws an error in iOS 13 due to missing permissions
      try FileManager.default.copyItem(at: at, to: to)
    } catch {
      throw FailedToPickVideoException()
        .causedBy(error)
    }
  }

  /**
   @returns duration in milliseconds
   */
  static func readDurationFrom(url: URL) -> Double {
    let asset = AVURLAsset(url: url)
    return Double(asset.duration.value) / Double(asset.duration.timescale) * 1000
  }

  static func readSizeFrom(url: URL) -> CGSize? {
    let asset = AVURLAsset(url: url)
    guard let assetTrack = asset.tracks(withMediaType: .video).first else {
      return nil
    }
    // The video could be rotated and the resulting transform can result in a negative width/height.
    let size = assetTrack.naturalSize.applying(assetTrack.preferredTransform)
    return CGSize(width: abs(size.width), height: abs(size.height))
  }

  static func readVideoUrlFrom(mediaInfo: MediaInfo) -> URL? {
    return mediaInfo[.mediaURL] as? URL ?? mediaInfo[.referenceURL] as? URL
  }

  /**
   Asynchronously transcodes asset provided as `sourceAssetUrl` according to `exportPreset`.
   Result URL is returned to the `completion` closure.
   Transcoded video is saved at `destinationUrl`, unless `exportPreset` is set to `passthrough`.
   In this case, `sourceAssetUrl` is returned.
   */
  static func transcodeVideoAsync(
    sourceAssetUrl: URL,
    destinationUrl: URL,
    outputFileType: AVFileType,
    exportPreset: VideoExportPreset
  ) async throws -> URL {
    if case .passthrough = exportPreset {
      return sourceAssetUrl
    }
    let asset = AVURLAsset(url: sourceAssetUrl)
    let preset = exportPreset.toAVAssetExportPreset()
    let canBeTranscoded = await AVAssetExportSession.compatibility(ofExportPreset: preset, with: asset, outputFileType: outputFileType)

    guard canBeTranscoded else {
      throw UnsupportedVideoExportPresetException(preset.description)
    }
    guard let exportSession = AVAssetExportSession(asset: asset, presetName: preset) else {
      throw FailedToTranscodeVideoException()
    }

    exportSession.outputFileType = outputFileType
    exportSession.outputURL = destinationUrl

    await exportSession.export()

    if case exportSession.status = .failed {
      let error = exportSession.error
      throw FailedToTranscodeVideoException().causedBy(error)
    }
    return destinationUrl
  }

  static func loadVideoRepresentation(provider: NSItemProvider, urlTransformer: @escaping (URL) throws -> URL) async throws -> URL {
    return try await withCheckedThrowingContinuation { continuation in
      provider.loadFileRepresentation(forTypeIdentifier: UTType.movie.identifier) { url, error in
        guard let url else {
          return continuation.resume(throwing: FailedToReadVideoException().causedBy(error))
        }
        do {
          // The provided URL is only temporary – the system deletes that file when the completion handler returns.
          // Since we're using it asynchronously, we need to copy the video to another location.
          let newUrl = try urlTransformer(url)
          try VideoUtils.tryCopyingVideo(at: url, to: newUrl)

          continuation.resume(returning: newUrl)
        } catch {
          continuation.resume(throwing: error)
        }
      }
    }
  }
}
