import CryptoKit
import Foundation
import UIKit

internal enum WidgetImagePreloader {
  private static let directoryName = "ExpoWidgetsImages"

  static func preloadImages(_ images: [WidgetImagePreloadOptions]) async throws -> [String: Any] {
    guard !images.isEmpty else {
      return [
        "images": [:],
        "failed": []
      ]
    }

    let directoryURL = try imageDirectoryURL()
    var preloadedImages: [String: [String: Any]] = [:]
    var failures: [[String: String]] = []

    for image in images {
      do {
        let preloadedImage = try await preloadImage(image, in: directoryURL)
        preloadedImages[preloadedImage.key] = preloadedImage.dictionary
      } catch {
        failures.append([
          "key": image.key,
          "error": errorMessage(for: error)
        ])
      }
    }

    return [
      "images": preloadedImages,
      "failed": failures
    ]
  }

  static func clearImages(options: WidgetImageClearOptions?) throws {
    let directoryURL = try imageDirectoryURL()
    let fileManager = FileManager.default

    guard let keys = options?.keys else {
      if fileManager.fileExists(atPath: directoryURL.path) {
        try fileManager.removeItem(at: directoryURL)
      }
      try fileManager.createDirectory(at: directoryURL, withIntermediateDirectories: true)
      excludeFromBackup(directoryURL)
      return
    }

    for key in keys {
      let normalizedKey = normalizeKey(key)
      guard !normalizedKey.isEmpty else {
        continue
      }

      let fileURL = directoryURL.appendingPathComponent(fileName(for: normalizedKey), isDirectory: false)
      if fileManager.fileExists(atPath: fileURL.path) {
        try fileManager.removeItem(at: fileURL)
      }
    }
  }

  private static func preloadImage(_ image: WidgetImagePreloadOptions, in directoryURL: URL) async throws -> PreloadedImage {
    let key = normalizeKey(image.key)
    guard !key.isEmpty else {
      throw WidgetImagePreloadError("Image key cannot be empty")
    }

    guard let url = URL(string: image.url.trimmingCharacters(in: .whitespacesAndNewlines)) else {
      throw WidgetImagePreloadError("Image URL is invalid")
    }

    let method = image.method?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
    var request = URLRequest(url: url)
    request.httpMethod = method.isEmpty ? "GET" : method
    image.headers?.forEach { request.setValue($0.value, forHTTPHeaderField: $0.key) }

    let (data, response) = try await URLSession.shared.data(for: request)
    if let httpResponse = response as? HTTPURLResponse,
      !(200..<300).contains(httpResponse.statusCode) {
      throw WidgetImagePreloadError("Request failed with HTTP \(httpResponse.statusCode)")
    }

    guard let uiImage = UIImage(data: data) else {
      throw WidgetImagePreloadError("Downloaded data is not a supported image")
    }

    let output = try encodedImageData(originalData: data, image: uiImage, options: image)
    let fileURL = directoryURL.appendingPathComponent(fileName(for: key), isDirectory: false)
    try output.data.write(to: fileURL, options: .atomic)
    excludeFromBackup(fileURL)

    return PreloadedImage(
      key: key,
      uri: fileURL.standardizedFileURL.absoluteString,
      width: Int(output.size.width.rounded()),
      height: Int(output.size.height.rounded()),
      bytes: output.data.count
    )
  }

  private static func imageDirectoryURL() throws -> URL {
    guard let appGroupIdentifier = WidgetsStorage.appGroupIdentifier else {
      throw WidgetImageException("Missing ExpoWidgetsAppGroupIdentifier in Info.plist")
    }
    guard let containerURL = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroupIdentifier) else {
      throw WidgetImageException("Could not open app group container for \(appGroupIdentifier)")
    }

    let directoryURL = containerURL.appendingPathComponent(directoryName, isDirectory: true)
    try FileManager.default.createDirectory(at: directoryURL, withIntermediateDirectories: true)
    excludeFromBackup(directoryURL)
    return directoryURL
  }

  private static func excludeFromBackup(_ url: URL) {
    var url = url
    var resourceValues = URLResourceValues()
    resourceValues.isExcludedFromBackup = true
    try? url.setResourceValues(resourceValues)
  }

  private static func normalizeKey(_ key: String) -> String {
    return key.trimmingCharacters(in: .whitespacesAndNewlines)
  }

  private static func fileName(for key: String) -> String {
    var fileName = key
    for character in ["/", "\\", "?", "%", "*", "|", "\"", "<", ">", ":"] {
      fileName = fileName.replacingOccurrences(of: character, with: "_")
    }
    let readablePrefix = fileName.trimmingCharacters(in: CharacterSet(charactersIn: "._-"))
    let hash = SHA256.hash(data: Data(key.utf8))
      .map { String(format: "%02x", $0) }
      .joined()

    guard !readablePrefix.isEmpty else {
      return hash
    }
    return "\(readablePrefix.prefix(80))-\(hash)"
  }

  private static func encodedImageData(
    originalData: Data,
    image: UIImage,
    options: WidgetImagePreloadOptions
  ) throws -> (data: Data, size: CGSize) {
    guard let targetSize = targetSize(for: image.size, resize: options.resize) else {
      return (originalData, image.size)
    }

    let rendererFormat = UIGraphicsImageRendererFormat.default()
    rendererFormat.scale = 1
    let renderer = UIGraphicsImageRenderer(size: targetSize, format: rendererFormat)
    let resizedImage = renderer.image { _ in
      image.draw(in: CGRect(origin: .zero, size: targetSize))
    }
    return (try encodedData(for: resizedImage), targetSize)
  }

  private static func targetSize(for size: CGSize, resize: WidgetImageResizeOptions?) -> CGSize? {
    guard let resize else {
      return nil
    }

    guard size.width > 0 && size.height > 0 else {
      return nil
    }

    var scale: CGFloat = 1
    if let maxWidth = resize.maxWidth, maxWidth > 0 {
      scale = min(scale, CGFloat(maxWidth) / size.width)
    }
    if let maxHeight = resize.maxHeight, maxHeight > 0 {
      scale = min(scale, CGFloat(maxHeight) / size.height)
    }

    guard scale < 1 else {
      return nil
    }
    return CGSize(width: size.width * scale, height: size.height * scale)
  }

  private static func encodedData(for image: UIImage) throws -> Data {
    if image.hasAlpha {
      guard let data = image.pngData() else {
        throw WidgetImagePreloadError("Could not encode PNG image")
      }
      return data
    }

    guard let data = image.jpegData(compressionQuality: 0.9) else {
      throw WidgetImagePreloadError("Could not encode JPEG image")
    }
    return data
  }

  private static func errorMessage(for error: Error) -> String {
    if let error = error as? WidgetImageException {
      return error.reason
    }
    return error.localizedDescription
  }
}

private struct WidgetImagePreloadError: LocalizedError {
  let message: String

  init(_ message: String) {
    self.message = message
  }

  var errorDescription: String? {
    message
  }
}

private struct PreloadedImage {
  let key: String
  let uri: String
  let width: Int
  let height: Int
  let bytes: Int

  var dictionary: [String: Any] {
    [
      "key": key,
      "uri": uri,
      "width": width,
      "height": height,
      "bytes": bytes
    ]
  }
}

private extension UIImage {
  var hasAlpha: Bool {
    guard let alphaInfo = cgImage?.alphaInfo else {
      return false
    }

    return alphaInfo == .first ||
      alphaInfo == .last ||
      alphaInfo == .premultipliedFirst ||
      alphaInfo == .premultipliedLast
  }
}
