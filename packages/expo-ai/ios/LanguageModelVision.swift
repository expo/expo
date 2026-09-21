import Foundation
import ImageIO
import Vision

internal enum LanguageModelBuiltinTool: String, Sendable {
  case ocr
  case barcode
}

/// An immutable image snapshot: subsequent changes to the source file do not change
/// an image already attached to a successful Foundation Models transcript.
internal final class LanguageModelImageContent: @unchecked Sendable {
  let image: CGImage
  let orientation: CGImagePropertyOrientation

  init(url: URL) throws {
    guard let source = CGImageSourceCreateWithURL(url as CFURL, nil),
      let image = CGImageSourceCreateImageAtIndex(source, 0, [kCGImageSourceShouldCacheImmediately: true] as CFDictionary)
    else { throw CocoaError(.fileReadCorruptFile) }
    self.image = image
    let properties = CGImageSourceCopyPropertiesAtIndex(source, 0, nil) as? [CFString: Any]
    let rawOrientation = (properties?[kCGImagePropertyOrientation] as? UInt32) ?? 1
    orientation = CGImagePropertyOrientation(rawValue: rawOrientation) ?? .up
  }
}

@available(iOS 18.0, macOS 15.0, *)
internal enum LanguageModelVision {
  static func perform(kind: LanguageModelBuiltinTool, content: LanguageModelImageContent) async throws -> String {
    try Task.checkCancellation()
    let result: [String: Any]
    switch kind {
    case .ocr:
      var recognition = RecognizeTextRequest()
      recognition.recognitionLevel = .accurate
      let observations = try await recognition.perform(on: content.image, orientation: content.orientation)
      result = ["text": observations.compactMap { $0.topCandidates(1).first?.string }.joined(separator: "\n")]
    case .barcode:
      let observations = try await DetectBarcodesRequest().perform(on: content.image, orientation: content.orientation)
      result = [
        "barcodes": observations.compactMap { observation -> [String: String]? in
          guard let payload = observation.payloadString else { return nil }
          return ["payload": payload, "symbology": String(describing: observation.symbology)]
        }
      ]
    }
    try Task.checkCancellation()
    // JSONSerialization produces UTF-8.
    // swiftlint:disable:next optional_data_string_conversion
    return String(decoding: try JSONSerialization.data(withJSONObject: result), as: UTF8.self)
  }
}
